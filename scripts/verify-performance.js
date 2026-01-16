
async function simulateIPC(name, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`${name} result`);
        }, delay);
    });
}

async function runSequential() {
    const start = performance.now();
    await simulateIPC('get-devices', 50); // Simulate 50ms latency
    await simulateIPC('get-device-positions', 50); // Simulate 50ms latency
    return performance.now() - start;
}

async function runParallel() {
    const start = performance.now();
    await Promise.all([
        simulateIPC('get-devices', 50),
        simulateIPC('get-device-positions', 50)
    ]);
    return performance.now() - start;
}

async function main() {
    console.log('Running performance simulation for refreshDevices...');

    // Warmup
    await runSequential();
    await runParallel();

    const seqTime = await runSequential();
    console.log(`Sequential execution time: ${seqTime.toFixed(2)}ms`);

    const parTime = await runParallel();
    console.log(`Parallel execution time: ${parTime.toFixed(2)}ms`);

    const improvement = ((seqTime - parTime) / seqTime) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}%`);
}

main();
