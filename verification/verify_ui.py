import os
import sys
from playwright.sync_api import sync_playwright

def test_loading_state(page):
    # Mock Electron
    page.add_init_script("""
        window.require = (module) => {
            if (module === 'electron') {
                return {
                    ipcRenderer: {
                        invoke: (channel, ...args) => {
                            console.log('IPC invoke:', channel);
                            return new Promise(resolve => {
                                if (!window.pendingInvokes) window.pendingInvokes = {};
                                // Store the resolve function
                                window.pendingInvokes[channel] = resolve;
                            });
                        },
                        on: () => {}
                    }
                };
            }
        };
        window.pendingInvokes = {};
    """)

    # Load page
    cwd = os.getcwd()
    url = f"file://{cwd}/src/renderer/index.html"
    print(f"Loading {url}")
    page.goto(url)

    # Initial load triggers calls. We need to wait a bit for them to register in pendingInvokes
    page.wait_for_timeout(1000)

    # Resolve initial calls so the app initializes
    print("Resolving initial calls...")
    page.evaluate("""
        const resolve = (channel, data) => {
            if (window.pendingInvokes && window.pendingInvokes[channel]) {
                window.pendingInvokes[channel](data);
                delete window.pendingInvokes[channel];
            }
        };
        resolve('scan-wifi', []);
        resolve('get-access-points', []);
        resolve('get-devices', []);
        resolve('get-device-positions', []);
        resolve('get-automations', []);
        resolve('load-settings', {});
    """)

    # Navigate to Network view
    print("Navigating to Network view...")
    page.click('button[data-view="network"]')

    # Click Scan
    print("Clicking Scan Networks...")
    scan_btn = page.locator('#scan-btn')
    scan_btn.click()

    # Capture loading state
    page.wait_for_timeout(200) # Wait for DOM update
    print("Capturing loading state...")
    page.screenshot(path="verification/loading_state.png")

    # Verify state logic
    is_disabled = scan_btn.is_disabled()
    is_busy = scan_btn.get_attribute("aria-busy") == "true"
    print(f"Disabled: {is_disabled}, Busy: {is_busy}")

    if not is_disabled or not is_busy:
        print("FAIL: Button not in loading state")
    else:
        print("PASS: Button is in loading state")

    # Resolve the scan to finish it
    print("Resolving scan...")
    page.evaluate("""
        const resolve = (channel, data) => {
            if (window.pendingInvokes && window.pendingInvokes[channel]) {
                window.pendingInvokes[channel](data);
                delete window.pendingInvokes[channel];
            }
        };
        resolve('scan-wifi', [{ssid: 'TestNet', bssid: 'AA:BB:CC:DD:EE:FF', signal_level: -50, frequency: 2400}]);
        resolve('get-access-points', []);
    """)

    page.wait_for_timeout(200)
    page.screenshot(path="verification/finished_state.png")
    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_loading_state(page)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
        finally:
            browser.close()
