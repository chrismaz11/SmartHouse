const fs = require('fs');
const path = require('path');

const rendererPath = path.join(__dirname, '../src/renderer/renderer.js');
console.log(`Reading ${rendererPath}...`);
const rendererContent = fs.readFileSync(rendererPath, 'utf8');

// Extract the setButtonLoading method
// We look for the method signature and the closing brace of the method
// This is a simple extraction and might be fragile if code structure changes significantly
const startMarker = 'setButtonLoading(btn, isLoading) {';
const startIndex = rendererContent.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find setButtonLoading method signature');
    process.exit(1);
}

// Find the end of the method (counting braces)
let openBraces = 0;
let endIndex = -1;
let foundStart = false;

for (let i = startIndex; i < rendererContent.length; i++) {
    if (rendererContent[i] === '{') {
        openBraces++;
        foundStart = true;
    } else if (rendererContent[i] === '}') {
        openBraces--;
    }

    if (foundStart && openBraces === 0) {
        endIndex = i + 1;
        break;
    }
}

if (endIndex === -1) {
    console.error('Could not find end of setButtonLoading method');
    process.exit(1);
}

const methodCode = rendererContent.substring(startIndex, endIndex);
console.log('Extracted method code successfully.');

// Wrap in a function to execute
// We strip the method name/signature to get just the body
const bodyStart = methodCode.indexOf('{') + 1;
const bodyEnd = methodCode.lastIndexOf('}');
const methodBody = methodCode.substring(bodyStart, bodyEnd);

const setButtonLoading = new Function('btn', 'isLoading', methodBody);

// Mock Button
class MockButton {
    constructor(className = '', innerHTML = 'Original Text') {
        this.disabled = false;
        this.dataset = {};
        this._innerHTML = innerHTML;
        this.attributes = {};
        this.className = className;
        this.classList = {
            contains: (cls) => this.className.split(' ').includes(cls)
        };
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(val) {
        this._innerHTML = val;
    }

    setAttribute(key, value) {
        this.attributes[key] = value;
    }

    removeAttribute(key) {
        delete this.attributes[key];
    }
}

// Test Case 1: Loading State (Secondary Button)
console.log('\nTest 1: Loading State (Secondary Button)');
const btn1 = new MockButton('btn-secondary');
try {
    setButtonLoading(btn1, true);

    if (btn1.disabled !== true) throw new Error('Button should be disabled');
    if (btn1.attributes['aria-busy'] !== 'true') throw new Error('Aria-busy should be true');
    if (btn1.dataset.originalText !== 'Original Text') throw new Error('Original text not saved');
    if (!btn1.innerHTML.includes('spinner')) throw new Error('Spinner not added');
    // Secondary button should use dark border (#334155)
    if (!btn1.innerHTML.includes('#334155')) throw new Error(`Wrong border color for secondary button: ${btn1.innerHTML}`);
    console.log('✅ Passed');
} catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
}

// Test Case 2: Restore State
console.log('\nTest 2: Restore State');
try {
    setButtonLoading(btn1, false);

    if (btn1.disabled !== false) throw new Error('Button should be enabled');
    if (btn1.attributes['aria-busy']) throw new Error('Aria-busy should be removed');
    if (btn1.innerHTML !== 'Original Text') throw new Error(`Text not restored correctly: ${btn1.innerHTML}`);
    console.log('✅ Passed');
} catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
}

// Test Case 3: Primary Button Contrast
console.log('\nTest 3: Primary Button Contrast');
const btn2 = new MockButton('btn-primary');
try {
    setButtonLoading(btn2, true);

    // Primary button should use white border (#ffffff)
    if (!btn2.innerHTML.includes('#ffffff')) throw new Error(`Wrong border color for primary button: ${btn2.innerHTML}`);
    console.log('✅ Passed');
} catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
}

// Test Case 4: Null Button
console.log('\nTest 4: Null Button');
try {
    setButtonLoading(null, true);
    console.log('✅ Passed');
} catch (e) {
    console.error('❌ Failed: Should handle null button gracefully', e);
    process.exit(1);
}

// Test Case 5: Button with HTML Content (Icons)
console.log('\nTest 5: Button with HTML Content (Icons)');
const htmlContent = '<i class="icon"></i> <span>Click Me</span>';
const btn3 = new MockButton('btn-secondary', htmlContent);
try {
    setButtonLoading(btn3, true);
    if (btn3.dataset.originalText !== htmlContent) throw new Error('HTML content not saved');

    setButtonLoading(btn3, false);
    if (btn3.innerHTML !== htmlContent) throw new Error(`HTML content not restored. Expected '${htmlContent}', got '${btn3.innerHTML}'`);
    console.log('✅ Passed');
} catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
}

console.log('\nAll tests passed!');
