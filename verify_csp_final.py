
import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture console messages
    console_logs = []
    page.on("console", lambda msg: console_logs.append(msg.text))

    # Mock window.require for Electron
    page.add_init_script("""
        window.require = function(module) {
            if (module === 'electron') {
                return {
                    ipcRenderer: {
                        invoke: async () => [],
                        on: () => {},
                        send: () => {}
                    }
                };
            }
            return {};
        };
    """)

    try:
        # Open the page
        page.goto("http://localhost:8000/index.html")

        # Check CSP meta tag
        meta = page.locator('meta[http-equiv="Content-Security-Policy"]')
        count = meta.count()
        if count > 0:
            content = meta.get_attribute('content')
            print(f"CSP Meta tag found: {content}")
        else:
            print("Error: CSP Meta tag NOT found.")

        # Navigate to Network view
        page.click('button[data-view="network"]')

        # Open Manual Entry modal
        page.click('#manual-network-btn')

        # Click "Add Another Network" - this calls addNetworkEntry
        page.click('#add-network-entry')

        # Check entries count
        entries = page.locator('.manual-network-entry')
        count = entries.count()
        print(f"Number of entries: {count}")

        if count < 2:
            print("Error: addNetworkEntry failed.")
        else:
            print("Success: addNetworkEntry added a new entry.")

        # Test the remove button on the new entry (last one)
        last_entry = entries.nth(count - 1)
        remove_btn = last_entry.locator('button')
        remove_btn.click()

        # Verify count decreased
        time.sleep(0.5)
        new_count = entries.count()
        print(f"Number of entries after removal: {new_count}")

        if new_count == count - 1:
            print("Success: Remove button worked.")
        else:
            print("Error: Remove button failed.")

        # Check for CSP violations in console logs
        csp_violation = False
        for log in console_logs:
            if "Refused to execute inline script" in log or "Content Security Policy" in log:
                print(f"CSP Violation detected: {log}")
                csp_violation = True

        if not csp_violation:
            print("No CSP violations reported in console.")

        # Take screenshot of the modal
        page.screenshot(path="verification_csp_final.png")

    except Exception as e:
        print(f"Test failed with error: {e}")
        page.screenshot(path="verification_error.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run(p)
