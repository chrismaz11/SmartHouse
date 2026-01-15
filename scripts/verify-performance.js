
const { performance } = require('perf_hooks');

// Mock IPC Renderer
const ipcRenderer = {
    invoke: (channel) => {
        return new Promise(resolve => {
            // Simulate IPC delay
            setTimeout(() => {
                if (channel === 'get-devices') resolve([{ mac: '00:11:22:33:44:55' }]);
                if (channel === 'get-device-positions') resolve([{ mac: '00:11:22:33:44:55', position: { x: 10, y: 10 } }]);
            }, 100); // 100ms delay per call
        });
    }
};

class MockApp {
    constructor() {
        this.devices = [];
    }

    // Original sequential implementation
    async refreshDevicesSequential() {
        try {
            this.devices = await ipcRenderer.invoke('get-devices');
            const devicePositions = await ipcRenderer.invoke('get-device-positions');
            return { devices: this.devices, positions: devicePositions };
        } catch (error) {
            console.error('Device refresh failed:', error);
        }
    }

    // Optimized parallel implementation
    async refreshDevicesParallel() {
        try {
            const [devices, devicePositions] = await Promise.all([
                ipcRenderer.invoke('get-devices'),
                ipcRenderer.invoke('get-device-positions')
            ]);
            this.devices = devices;
            return { devices, positions: devicePositions };
        } catch (error) {
            console.error('Device refresh failed:', error);
        }
    }
}

async function runBenchmark() {
    const app = new MockApp();

    console.log('Running benchmark...');

    // Warmup
    await app.refreshDevicesSequential();

    // Measure Sequential
    const startSeq = performance.now();
    await app.refreshDevicesSequential();
    const endSeq = performance.now();
    const timeSeq = endSeq - startSeq;
    console.log(`Sequential time: ${timeSeq.toFixed(2)}ms`);

    // Measure Parallel
    const startPar = performance.now();
    await app.refreshDevicesParallel();
    const endPar = performance.now();
    const timePar = endPar - startPar;
    console.log(`Parallel time: ${timePar.toFixed(2)}ms`);

    const improvement = ((timeSeq - timePar) / timeSeq) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}%`);

    if (timePar < timeSeq) {
        console.log('✅ Optimization verified!');
    } else {
        console.log('❌ Optimization failed.');
    }
}

runBenchmark();
