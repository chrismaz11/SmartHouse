
const assert = require('assert');

// Mock DOM
class MockElement {
    constructor(tagName, id, classes = []) {
        this.tagName = tagName;
        this.id = id;
        this.classList = {
            contains: (c) => classes.includes(c),
            add: (c) => classes.push(c),
            remove: (c) => {
                const idx = classes.indexOf(c);
                if (idx > -1) classes.splice(idx, 1);
            }
        };
        this.innerHTML = 'Original Text';
        this.dataset = {};
        this.value = '';
        this.disabled = false;
        this.style = {};
    }

    querySelector() { return new MockElement('div'); }
    querySelectorAll() { return []; }
    addEventListener() {}
    getContext() { return { clearRect:()=>{}, drawImage:()=>{}, beginPath:()=>{}, arc:()=>{}, fill:()=>{}, fillText:()=>{} }; }
}

const document = {
    getElementById: (id) => {
        if (id === 'scan-btn') return new MockElement('button', 'scan-btn', ['btn-primary']);
        if (id === 'refresh-devices') return new MockElement('button', 'refresh-devices', ['btn-primary']);
        if (id === 'save-settings') return new MockElement('button', 'save-settings', ['btn-primary']);
        if (id === 'status-text') return new MockElement('span', 'status-text');
        if (id === 'status-dot') return new MockElement('span', 'status-dot');
        if (id === 'wifi-networks') return new MockElement('div', 'wifi-networks');
        if (id === 'ap-positions') return new MockElement('div', 'ap-positions');
        if (id === 'tracked-devices') return new MockElement('div', 'tracked-devices');
        if (id === 'device-tags') return new MockElement('div', 'device-tags');
        if (id === 'automation-rules') return new MockElement('div', 'automation-rules');
        if (id === 'network-status') return new MockElement('div', 'network-status');
        if (id === 'ap-status') return new MockElement('div', 'ap-status');
        if (id === 'automation-status') return new MockElement('div', 'automation-status');
        if (id === 'gemini-api-key') return new MockElement('input', 'gemini-api-key');
        if (id === 'path-loss') return new MockElement('input', 'path-loss');
        if (id === 'ref-power') return new MockElement('input', 'ref-power');
        if (id === 'homebridge-ip') return new MockElement('input', 'homebridge-ip');
        if (id === 'homebridge-port') return new MockElement('input', 'homebridge-port');
        if (id === 'homebridge-username') return new MockElement('input', 'homebridge-username');
        if (id === 'homebridge-password') return new MockElement('input', 'homebridge-password');
        if (id === 'homebridge-pin') return new MockElement('input', 'homebridge-pin');
        if (id === 'floorplan-canvas') return new MockElement('canvas', 'floorplan-canvas');

        return new MockElement('div', id);
    },
    querySelectorAll: () => [],
    createElement: () => new MockElement('div'),
    body: { appendChild: () => {} },
    addEventListener: () => {}
};

global.document = document;
global.window = {
    addEventListener: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 10)
};
global.setInterval = () => {};

// Mock Electron
const ipcRenderer = {
    invoke: async (channel) => {
        if (channel === 'scan-wifi') return [];
        if (channel === 'get-access-points') return [];
        if (channel === 'get-devices') return [];
        if (channel === 'get-device-positions') return [];
        if (channel === 'get-automations') return [];
        if (channel === 'load-settings') return {};
        if (channel === 'save-settings') return {};
        return null;
    },
    on: () => {}
};

global.ipcRenderer = ipcRenderer;

// Load code
const fs = require('fs');
const content = fs.readFileSync('src/renderer/renderer.js', 'utf8');
const modifiedContent = content.replace("const { ipcRenderer } = require('electron');", "");

// The class is defined but not exported in renderer.js.
// It's instantiated with `new WiFiTriangulationApp()` inside DOMContentLoaded.
// We need to capture the class definition.
// We can wrap the code in a function that returns the class, or assign it to global.

// Let's modify the code to assign the class to global
const patchedContent = modifiedContent.replace('class WiFiTriangulationApp', 'global.WiFiTriangulationApp = class WiFiTriangulationApp');

eval(patchedContent);

async function runTests() {
    console.log('Running loading state tests...');

    // Now it should be available
    const app = new global.WiFiTriangulationApp();

    // Test 1: setButtonLoading
    console.log('Test 1: setButtonLoading');
    const btn = new MockElement('button', 'test-btn', ['btn-primary']);
    btn.innerHTML = 'Click Me';

    app.setButtonLoading(btn, true);
    assert.strictEqual(btn.disabled, true);
    assert.ok(btn.innerHTML.includes('spinner'));
    assert.ok(btn.innerHTML.includes('Processing...'));
    assert.strictEqual(btn.dataset.originalText, 'Click Me');

    app.setButtonLoading(btn, false);
    assert.strictEqual(btn.disabled, false);
    assert.strictEqual(btn.innerHTML, 'Click Me');
    console.log('PASS: setButtonLoading logic works');

    // Test 2: scanNetworks with button
    console.log('Test 2: scanNetworks with button');
    const scanBtn = new MockElement('button', 'scan-btn', ['btn-primary']);
    scanBtn.innerHTML = 'Scan';

    const scanPromise = app.scanNetworks(scanBtn);
    // Check loading state immediately
    assert.strictEqual(scanBtn.disabled, true, 'Button should be disabled during scan');

    await scanPromise;
    assert.strictEqual(scanBtn.disabled, false, 'Button should be enabled after scan');
    assert.strictEqual(scanBtn.innerHTML, 'Scan', 'Button text should be restored');
    console.log('PASS: scanNetworks manages button state');

    // Test 3: scanNetworks without button (simulating periodic update)
    console.log('Test 3: scanNetworks without button');
    await app.scanNetworks();
    // Just ensuring no error throws
    console.log('PASS: scanNetworks works without button');

    // Test 4: saveSettings with error (simulating failure)
    console.log('Test 4: saveSettings error handling');
    // Override invoke for this test
    const oldInvoke = ipcRenderer.invoke;
    ipcRenderer.invoke = async (channel) => {
        if (channel === 'save-settings') throw new Error('Failed');
        return {};
    };

    const saveBtn = new MockElement('button', 'save-btn', ['btn-primary']);
    saveBtn.innerHTML = 'Save';

    try {
        await app.saveSettings(saveBtn);
    } catch (e) {
        // App catches error
    }

    assert.strictEqual(saveBtn.disabled, false, 'Button should be enabled after error');
    assert.strictEqual(saveBtn.innerHTML, 'Save', 'Button text should be restored after error');

    // Restore invoke
    ipcRenderer.invoke = oldInvoke;

    console.log('PASS: saveSettings restores state on error');

    console.log('ALL TESTS PASSED');
}

runTests().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
