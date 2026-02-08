const { GeminiEvolutionEngine } = require('../src/services/geminiEvolution');

console.log('Testing GeminiEvolutionEngine.safeParseJSON...');

try {
    const engine = new GeminiEvolutionEngine();

    // Test 1: Markdown wrapped JSON
    const markdownJson = "```json\n{\"test\": true, \"message\": \"Success\"}\n```";

    if (typeof engine.safeParseJSON !== 'function') {
        throw new Error('safeParseJSON is not a function');
    }

    const result = engine.safeParseJSON(markdownJson);

    if (result.test === true && result.message === 'Success') {
        console.log('[PASS] Markdown JSON parsed successfully.');
    } else {
        console.error('[FAIL] Parsed object does not match expected.', result);
        process.exit(1);
    }

    // Test 2: Plain JSON
    const plainJson = "{\"test\": true}";
    const result2 = engine.safeParseJSON(plainJson);
    if (result2.test === true) {
        console.log('[PASS] Plain JSON parsed successfully.');
    } else {
        console.error('[FAIL] Plain JSON failed.');
        process.exit(1);
    }

} catch (error) {
    console.error('[FAIL] Test threw error:', error.message);
    process.exit(1);
}
