from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock electron
        page.add_init_script("""
            window.require = function(module) {
                if (module === 'electron') {
                    return {
                        ipcRenderer: {
                            invoke: (channel, ...args) => {
                                console.log('Invoke called:', channel);
                                return new Promise((resolve) => {
                                    setTimeout(() => {
                                        if (channel === 'scan-wifi') resolve([{ssid: 'TestNet', signal_level: -50, bssid: '00:00:00:00:00:00', frequency: 2400}]);
                                        else if (channel === 'get-access-points') resolve([]);
                                        else if (channel === 'get-devices') resolve([]);
                                        else if (channel === 'get-device-positions') resolve([]);
                                        else if (channel === 'get-automations') resolve([]);
                                        else if (channel === 'load-settings') resolve({});
                                        else resolve(null);
                                    }, 2000); // 2 second delay
                                });
                            },
                            on: (channel, func) => {}
                        }
                    };
                }
                throw new Error('Module not found: ' + module);
            };

            // Mock module for Node environment check in renderer.js if it exists
            window.module = { exports: {} };
        """)

        # Navigate to the served page
        page.goto("http://localhost:8080/index.html")

        # Navigate to Network view to see the button
        page.evaluate("document.querySelector('[data-view=\"network\"]').click()")

        # Wait for view transition
        time.sleep(0.5)

        # Click Scan Networks button
        print("Clicking Scan Networks...")
        # The button has id "scan-btn"
        scan_btn = page.locator("#scan-btn")
        scan_btn.click()

        # Wait a bit for the loading state to be applied
        time.sleep(0.5)

        # Take screenshot of loading state
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/loading_state.png")
        print("Screenshot taken: verification/loading_state.png")

        # Verify aria-busy
        is_busy = scan_btn.get_attribute("aria-busy")
        print(f"Aria-busy: {is_busy}")

        # Verify disabled
        is_disabled = scan_btn.is_disabled()
        print(f"Disabled: {is_disabled}")

        # Wait for completion
        time.sleep(2.5)

        # Take screenshot of completed state
        page.screenshot(path="verification/completed_state.png")
        print("Screenshot taken: verification/completed_state.png")

        browser.close()

if __name__ == "__main__":
    run()
