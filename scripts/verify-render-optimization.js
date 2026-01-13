// scripts/verify-render-optimization.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser environment
const window = {
    addEventListener: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    location: { href: '' },
    document: null
};

class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false
        };
        this._innerHTML = '';
        this.innerHTMLSetCount = 0;
        this.listeners = {};
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(val) {
        // Only count if it's different or just count every set?
        // The issue is blindly setting innerHTML even if content is same.
        // So we count every set.
        this._innerHTML = val;
        this.innerHTMLSetCount++;
    }

    addEventListener(event, handler) {
        this.listeners[event] = handler;
    }

    querySelectorAll() { return []; }
    querySelector() { return new MockElement('div'); }
    getContext() { return { clearRect: () => {}, drawImage: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, fillText: () => {} }; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
    removeAttribute() {}
    setAttribute() {}
}

const document = {
    getElementById: (id) => {
        if (!document.elements[id]) {
            document.elements[id] = new MockElement('div');
        }
        return document.elements[id];
    },
    querySelectorAll: () => [],
    querySelector: () => new MockElement('div'),
    createElement: (tag) => new MockElement(tag),
    addEventListener: () => {},
    body: { appendChild: () => {} },
    elements: {}
};
window.document = document;

// Mock Electron
const mockIpcRenderer = {
    invoke: async (channel) => {
        if (channel === 'scan-wifi') return [{ ssid: 'TestNet', signal_level: -50 }];
        if (channel === 'get-access-points') return [];
        if (channel === 'get-devices') return [];
        if (channel === 'get-device-positions') return [];
        if (channel === 'get-automations') return [];
        if (channel === 'load-settings') return {};
        return null;
    },
    on: () => {}
};

// Mock require
const mockRequire = (id) => {
    if (id === 'electron') return { ipcRenderer: mockIpcRenderer };
    throw new Error(`Unexpected require: ${id}`);
};

// Load renderer.js
const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.js'), 'utf8');

// Wrap in a context
const context = vm.createContext({
    require: mockRequire,
    document: document,
    window: window,
    console: console,
    setInterval: () => {},
    setTimeout: setTimeout,
    requestAnimationFrame: (cb) => cb(),
    Image: class {},
    FileReader: class {},
    Date: Date,
    WiFiTriangulationApp: null // Placeholder
});

// Execute the code
// This defines WiFiTriangulationApp in the context
vm.runInContext(rendererCode, context);

async function runTest() {
    try {
        console.log('Instantiating App...');

        const testScript = `
            async function test() {
                // Ensure class is available
                if (typeof WiFiTriangulationApp === 'undefined') {
                    throw new Error('WiFiTriangulationApp not defined');
                }

                // Instantiate (init will run scanNetworks which updates display)
                // But we want to test manual calls to control data.

                // We mock init to avoid side effects if possible, but constructor calls it.
                // Constructor: this.init();
                // Init calls startPeriodicUpdates.

                // We'll let it run.
                const app = new WiFiTriangulationApp();

                // Wait for init promises if any (init is async but not awaited in constructor)
                // We can manually call updateNetworkDisplay

                const container = document.getElementById('wifi-networks');
                container.innerHTMLSetCount = 0; // Reset

                // 1. First Update
                app.networks = [{ ssid: 'TestNet', signal_level: -50, bssid: '00:00:00:00:00:00', frequency: 2400 }];
                console.log('Calling updateNetworkDisplay (1st time)...');
                app.updateNetworkDisplay();

                // 2. Second Update (Same Data)
                console.log('Calling updateNetworkDisplay (2nd time)...');
                app.updateNetworkDisplay();

                return container.innerHTMLSetCount;
            }
            test();
        `;

        const count = await vm.runInContext(testScript, context);
        console.log(`innerHTML set count: ${count}`);

        if (count > 1) {
            console.log('FAIL: innerHTML updated multiple times for same data.');
            // We want this to fail initially
            // Exit with 0 to indicate script ran successfully, but print status.
            // Or exit 1 to show failure. I will exit 1 to be strict.
            process.exit(1);
        } else {
            console.log('PASS: innerHTML updated only once.');
            process.exit(0);
        }

    } catch (e) {
        console.error('Test script error:', e);
        process.exit(1);
    }
}

runTest();
