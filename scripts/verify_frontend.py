from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Mock electron
        page.add_init_script("""
            window.require = function(module) {
                if (module === 'electron') {
                    return {
                        ipcRenderer: {
                            invoke: async (channel) => {
                                console.log(`Invoked ${channel}`);
                                // Delay to simulate network request so we can see loading state
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                return [];
                            },
                            on: (channel, listener) => {
                                console.log(`Listening on ${channel}`);
                            }
                        }
                    };
                }
                throw new Error(`Module ${module} not found`);
            };
            window.module = { exports: {} };
        """)

        # Navigate
        page.goto("http://localhost:8000/index.html")

        # Wait for app to init
        time.sleep(1)

        # Click Network Nav Button
        network_nav_btn = page.locator("button.nav-btn[data-view='network']")
        network_nav_btn.click()
        time.sleep(0.5)

        # Click Scan Button
        scan_btn = page.locator("#scan-btn")
        scan_btn.click()

        # Wait a bit for loading state to appear
        time.sleep(0.5)

        # Screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        screenshot_path = "/home/jules/verification/loading_state.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
