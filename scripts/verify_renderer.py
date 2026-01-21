
import os
from playwright.sync_api import sync_playwright, expect

def verify_renderer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock Electron API
        page.add_init_script("""
            window.require = function(module) {
                if (module === 'electron') {
                    return {
                        ipcRenderer: {
                            invoke: async (channel, ...args) => {
                                console.log('Mock Invoke:', channel);
                                if (channel === 'scan-wifi') {
                                    return [
                                        {
                                            ssid: 'Test <b>Bold</b> Network',
                                            bssid: '00:11:22:33:44:55',
                                            signal_level: -50,
                                            frequency: 2400
                                        },
                                        {
                                            ssid: 'Normal Network',
                                            bssid: 'AA:BB:CC:DD:EE:FF',
                                            signal_level: -70,
                                            frequency: 5000
                                        }
                                    ];
                                }
                                if (channel === 'get-access-points') return [];
                                if (channel === 'get-devices') return [];
                                if (channel === 'get-device-positions') return [];
                                if (channel === 'get-automations') return [];
                                if (channel === 'load-settings') return {};
                                return null;
                            },
                            on: (channel, listener) => {
                                console.log('Mock On:', channel);
                            }
                        }
                    };
                }
                throw new Error('Unknown module: ' + module);
            };
        """)

        try:
            page.goto("http://localhost:8000/index.html")

            # Click scan button to trigger scan manually if not triggered auto (it is triggered by init)
            # But we can force it.
            # page.click("#scan-btn")

            # Wait for networks to appear
            expect(page.locator("#wifi-networks")).to_contain_text("Test <b>Bold</b> Network")

            # Verify that the text is literally "Test <b>Bold</b> Network", meaning the tags were escaped and not rendered as HTML.
            # In Playwright, `to_contain_text` checks the visible text.
            # If HTML was NOT escaped, the visible text would be "Test Bold Network".
            # If HTML WAS escaped, the browser sees &lt;b&gt;... which renders as <b>...
            # So visible text should contain "<b>".

            print("Verifying text content...")
            # We can also check innerHTML to be sure
            # innerHTML should be "Test &lt;b&gt;Bold&lt;/b&gt; Network" (surrounded by divs)

            # Let's take a screenshot
            os.makedirs("/home/jules/verification", exist_ok=True)
            page.screenshot(path="/home/jules/verification/renderer_verification.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_renderer()
