const assert = require('assert');
const path = require('path');

console.log("Setting up mock environment...");

// Mock DOM
const buttons = {};
global.document = {
    getElementById: (id) => {
        if (!buttons[id]) {
            buttons[id] = {
                id,
                innerHTML: 'Original Text',
                dataset: {},
                disabled: false,
                addEventListener: () => {},
                classList: { add:()=>{}, remove:()=>{} },
                getAttribute: () => null,
                setAttribute: () => {},
                removeAttribute: () => {},
                tagName: 'BUTTON',
                getContext: () => ({
                    clearRect: () => {},
                    drawImage: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {},
                    fillText: () => {}
                })
            };
        }
        return buttons[id];
    },
    querySelectorAll: () => [],
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') global.domLoaded = cb;
    },
    createElement: () => ({ style: {}, remove: () => {} }),
    body: { appendChild: () => {} }
};
global.window = {};
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// Mock Electron
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === 'electron') {
        return {
            ipcRenderer: {
                invoke: async (channel) => {
                    // Simulate delay to allow checking loading state
                    await new Promise(r => setTimeout(r, 50));
                    return [];
                },
                on: () => {}
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

try {
    const { WiFiTriangulationApp } = require('../src/renderer/renderer.js');

    if (!WiFiTriangulationApp) {
        console.log("WiFiTriangulationApp not exported. Skipping test logic.");
        process.exit(0);
    }

    console.log("WiFiTriangulationApp loaded.");

    const app = new WiFiTriangulationApp();
    // Stub methods to avoid side effects
    app.updateStatus = () => {};
    app.updateDashboard = () => {};
    app.updateNetworkDisplay = () => {};
    app.updateAccessPointsDisplay = () => {};
    app.updateDeviceDisplay = () => {}; // refreshDevices calls this
    app.updateDevicePositions = () => {}; // refreshDevices calls this
    app.drawFloorPlan = () => {}; // refreshDevices calls this
    app.startPeriodicUpdates = () => {}; // called in init

    async function testLoadingState() {
        console.log("Testing scanNetworks loading state...");
        const scanBtn = document.getElementById('scan-btn');
        scanBtn.innerHTML = "Scan";

        // We need to call init first or just mock what we need.
        // scanNetworks relies on this.updateStatus.

        const scanPromise = app.scanNetworks(scanBtn);

        // Immediately check if button is loading
        const isLoading = scanBtn.disabled && scanBtn.innerHTML.includes('spinner');
        console.log(`Is loading state active? ${isLoading} (Disabled: ${scanBtn.disabled}, Content: ${scanBtn.innerHTML})`);

        await scanPromise;

        const isReset = !scanBtn.disabled && scanBtn.innerHTML === "Scan";
        console.log(`Is state reset? ${isReset} (Disabled: ${scanBtn.disabled}, Content: ${scanBtn.innerHTML})`);

        if (process.argv.includes('--expect-success')) {
            assert.ok(isLoading, "Button should be in loading state during operation");
            assert.ok(isReset, "Button should be reset after operation");
            console.log("PASS: Loading state correctly implemented.");
        } else {
             console.log("Test finished.");
        }
    }

    testLoadingState().catch(e => {
        console.error("Test failed:", e);
        process.exit(1);
    });

} catch (e) {
    if (e.message.includes("WiFiTriangulationApp is not defined") || e.code === 'MODULE_NOT_FOUND') {
        console.log("Could not load app class. This is expected before modification.");
    } else {
        console.error("Unexpected error:", e);
    }
}
