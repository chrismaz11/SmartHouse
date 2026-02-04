
import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

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

    # Open the page
    page.goto("http://localhost:8000/index.html")

    # Navigate to Network view
    page.click('button[data-view="network"]')

    # Open Manual Entry modal
    page.click('#manual-network-btn')

    # Click "Add Another Network" - this calls addNetworkEntry
    page.click('#add-network-entry')

    # Check if a new entry was added
    # The default HTML has one entry. After clicking, there should be 2.
    entries = page.locator('.manual-network-entry')
    count = entries.count()
    print(f"Number of entries: {count}")

    if count < 2:
        print("Error: addNetworkEntry failed to add a new entry.")
        # Take screenshot for debug
        page.screenshot(path="verification_failed.png")
    else:
        print("Success: addNetworkEntry added a new entry.")

    # Test the remove button on the new entry
    # The new entry is the last one.
    last_entry = entries.nth(count - 1)
    remove_btn = last_entry.locator('button')
    remove_btn.click()

    # Verify count decreased
    time.sleep(0.5) # Wait for DOM update
    new_count = entries.count()
    print(f"Number of entries after removal: {new_count}")

    if new_count == count - 1:
        print("Success: Remove button worked.")
    else:
        print("Error: Remove button failed.")

    # Take screenshot of the modal
    page.screenshot(path="verification_csp.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
