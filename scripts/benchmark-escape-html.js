
const assert = require('assert');
const { performance } = require('perf_hooks');

// Original implementation
function escapeHtmlOriginal(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Optimized implementation
const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
};
const escapeRegex = /[&<>"']/g;

function escapeHtmlOptimized(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(escapeRegex, m => escapeMap[m]);
}

// Correctness verification
function verifyCorrectness() {
    console.log('Verifying correctness...');
    const testCases = [
        { input: null, expected: '' },
        { input: undefined, expected: '' },
        { input: '', expected: '' },
        { input: 'Hello World', expected: 'Hello World' },
        { input: 'Hello & World', expected: 'Hello &amp; World' },
        { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
        { input: "It's a test", expected: "It&#039;s a test" },
        { input: '&<>"\'', expected: '&amp;&lt;&gt;&quot;&#039;' },
        { input: 123, expected: '123' }, // Handles numbers
    ];

    let passed = true;
    for (const test of testCases) {
        const originalResult = escapeHtmlOriginal(test.input);
        const optimizedResult = escapeHtmlOptimized(test.input);

        try {
            assert.strictEqual(originalResult, test.expected, `Original failed for input: ${test.input}`);
            assert.strictEqual(optimizedResult, test.expected, `Optimized failed for input: ${test.input}`);
            assert.strictEqual(originalResult, optimizedResult, `Mismatch for input: ${test.input}`);
        } catch (e) {
            console.error(e.message);
            passed = false;
        }
    }

    if (passed) {
        console.log('✅ Correctness verification passed.');
    } else {
        console.error('❌ Correctness verification failed.');
        process.exit(1);
    }
}

// Benchmark
function runBenchmark() {
    console.log('\nRunning benchmark...');
    const iterations = 1000000;
    const testStrings = [
        'Simple string',
        'String with & and < and >',
        '<div class="test">Hello \'World\'</div>',
        'No special characters here at all',
        '&'.repeat(10) + '<'.repeat(10)
    ];

    // Warmup
    for (let i = 0; i < 1000; i++) {
        escapeHtmlOriginal(testStrings[i % testStrings.length]);
        escapeHtmlOptimized(testStrings[i % testStrings.length]);
    }

    // Benchmark Original
    const startOriginal = performance.now();
    for (let i = 0; i < iterations; i++) {
        escapeHtmlOriginal(testStrings[i % testStrings.length]);
    }
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark Optimized
    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
        escapeHtmlOptimized(testStrings[i % testStrings.length]);
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
    console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);

    const improvement = ((timeOriginal - timeOptimized) / timeOriginal) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}%`);

    if (timeOptimized < timeOriginal) {
        console.log('✅ Optimized version is faster.');
    } else {
        console.log('⚠️ Optimized version is NOT faster.');
    }
}

verifyCorrectness();
runBenchmark();
