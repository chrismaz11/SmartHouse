
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
const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
};
const escapeHtmlRegex = /[&<>"']/g;

function escapeHtmlOptimized(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(escapeHtmlRegex, match => htmlEscapes[match]);
}

// Test data
const testStrings = [
    'Normal string',
    'String with < and >',
    'String with "quotes" and \'single quotes\'',
    'Complex <div class="test">Content & more</div>',
    '',
    null,
    undefined,
    '<script>alert("xss")</script>'
];

// Verification
console.log('Verifying correctness...');
for (const str of testStrings) {
    const original = escapeHtmlOriginal(str);
    const optimized = escapeHtmlOptimized(str);
    if (original !== optimized) {
        console.error('Mismatch found!');
        console.error('Input:', str);
        console.error('Original:', original);
        console.error('Optimized:', optimized);
        process.exit(1);
    }
}
console.log('Correctness verified.');

// Benchmark
const ITERATIONS = 1000000;
const mixedStrings = [];
// Generate a larger dataset
for (let i = 0; i < 1000; i++) {
    mixedStrings.push(...testStrings);
}

console.log(`Starting benchmark (${ITERATIONS} iterations)...`);

// Measure Original
const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    escapeHtmlOriginal(testStrings[i % testStrings.length]);
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Measure Optimized
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    escapeHtmlOptimized(testStrings[i % testStrings.length]);
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original time: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized time: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);

if (timeOptimized > timeOriginal) {
    console.warn('Warning: Optimization is slower!');
} else {
    console.log('Success: Optimization is faster.');
}
