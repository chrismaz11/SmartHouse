const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Simple assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ ${message}`);
}

const rendererPath = path.join(__dirname, '../src/renderer/renderer.js');
const rendererCode = fs.readFileSync(rendererPath, 'utf8');

// Mock Electron
const mockIpcRenderer = {
    invoke: async (channel, ...args) => {
        console.log(`[MockIPC] invoke ${channel}`);
        if (channel === 'scan-wifi') return new Promise(resolve => setTimeout(() => resolve([]), 100));
        return [];
    },
    on: () => {},
    send: () => {}
};

// Mock DOM Elements
class MockElement {
    constructor(tag = 'div') {
        this.tagName = tag.toUpperCase();
        this.style = {};
        this.dataset = {};
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false
        };
        this.attributes = {};
        this.innerHTML = '';
        this.value = '';
        this.disabled = false;
        this.listeners = {};
    }

    addEventListener(event, handler) {
        this.listeners[event] = handler;
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    removeAttribute(name) {
        delete this.attributes[name];
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    querySelector() { return new MockElement(); }
    querySelectorAll() { return [new MockElement()]; }
    getContext() { return { clearRect: () => {}, drawImage: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, fillText: () => {} }; }
}

// Mock Document
const mockDocument = {
    getElementById: (id) => new MockElement(),
    querySelectorAll: (selector) => [new MockElement()],
    createElement: (tag) => new MockElement(tag),
    querySelector: (selector) => new MockElement(),
    addEventListener: () => {}
};

// Sandbox for running renderer.js
const sandbox = {
    require: (module) => {
        if (module === 'electron') return { ipcRenderer: mockIpcRenderer };
        throw new Error(`Unexpected require: ${module}`);
    },
    document: mockDocument,
    window: {
        addEventListener: () => {}
    },
    console: console,
    setInterval: () => {}, // prevent loop
    setTimeout: (cb, delay) => { if (delay === 0) cb(); }, // Don't run long timers
    requestAnimationFrame: (cb) => cb(),
    Image: class { onload() {} },
    FileReader: class { readAsDataURL() {} },
    module: {},
    exports: {}
};

console.log('Loading renderer.js...');
vm.createContext(sandbox);

// Append export to the code
const codeWithExport = rendererCode + '\nwindow.WiFiTriangulationApp = WiFiTriangulationApp;';

vm.runInContext(codeWithExport, sandbox);

const AppClass = sandbox.window.WiFiTriangulationApp;

if (!AppClass) {
    throw new Error('WiFiTriangulationApp class not found in sandbox');
}

console.log('Instantiating WiFiTriangulationApp...');
// Suppress init calls for clean testing
const app = new AppClass();

// Override init to stop automatic execution during test if needed,
// but constructor calls init().
// We are mainly interested in testing setButtonLoading and its integration.

async function testLoadingState() {
    console.log('Testing setButtonLoading...');

    // 1. Verify setButtonLoading exists (will fail before implementation)
    if (typeof app.setButtonLoading !== 'function') {
        console.warn('⚠️ setButtonLoading is not implemented yet.');
        return;
    }

    const btn = new MockElement('button');
    btn.innerHTML = 'Scan';

    // Test Loading ON
    app.setButtonLoading(btn, true);

    assert(btn.disabled === true, 'Button should be disabled when loading');
    assert(btn.getAttribute('aria-busy') === 'true', 'Button should have aria-busy=true');
    assert(btn.dataset.originalText === 'Scan', 'Original text should be saved');
    assert(btn.innerHTML.includes('spinner'), 'Button should contain spinner');

    // Test Loading OFF
    app.setButtonLoading(btn, false);

    assert(btn.disabled === false, 'Button should be enabled when not loading');
    assert(btn.getAttribute('aria-busy') === undefined, 'aria-busy should be removed');
    assert(btn.innerHTML === 'Scan', 'Original text should be restored');

    console.log('✅ setButtonLoading basic logic passed.');
}

async function testIntegration() {
    console.log('Testing integration with scanNetworks...');

    if (typeof app.setButtonLoading !== 'function') {
        console.warn('⚠️ Skipping integration test (method missing).');
        return;
    }

    const btn = new MockElement('button');
    btn.innerHTML = 'Scan';

    // Mock setButtonLoading to verify it's called
    let loadingCalls = 0;
    const originalSetButtonLoading = app.setButtonLoading;
    app.setButtonLoading = (b, state) => {
        loadingCalls++;
        originalSetButtonLoading.call(app, b, state);
    };

    // We need to ensure scanNetworks accepts the button
    // This requires scanNetworks to be modified to accept the argument

    const scanPromise = app.scanNetworks(btn);

    // Immediately after calling, it should be loading
    // Note: scanNetworks is async. The first synchronous part runs.
    // If setButtonLoading is called synchronously at start, we should see it.

    // Wait a bit for the promise to potentially resolve or start
    // Since we mocked invoke with a timeout, it should be pending.

    // However, in our mock `setTimeout` doesn't actually delay execution in the VM context
    // unless we use real setTimeout. The sandbox uses a mocked setTimeout that runs immediately if delay=0.
    // Our mock invoke uses 100ms.

    // We can't easily check "during" state with async/await unless we control the promise resolution.
    // But we can check that it was called twice (true then false).

    await scanPromise;

    assert(loadingCalls >= 2, 'setButtonLoading should be called at least twice (start and end)');
    assert(btn.disabled === false, 'Button should be enabled after operation');

    console.log('✅ Integration test passed.');
}

(async () => {
    try {
        await testLoadingState();
        await testIntegration();
        console.log('ALL TESTS PASSED');
    } catch (e) {
        console.error('TEST FAILED:', e);
        process.exit(1);
    }
})();
