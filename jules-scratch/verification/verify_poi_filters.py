from playwright.sync_api import sync_playwright, Page, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for and print browser console messages
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))

    try:
        # Navigate to the site
        page.goto("http://localhost:5000", timeout=60000)
        print("Navigated to localhost:5000")

        # Increased wait time and wait for a stable element first
        page.wait_for_selector(".leaflet-container", timeout=30000)
        print("✅ Map container is present.")

        # Correctly target the button with the default site name "Zuhause"
        site_selector = page.get_by_role("button", name="Zuhause")
        expect(site_selector).to_be_visible(timeout=30000)
        print("✅ Site selector button is visible.")
        site_selector.click()

        # Select 'Sittard' from the dropdown
        sittard_option = page.get_by_role("menuitem", name="Sittard")
        expect(sittard_option).to_be_visible()
        print("✅ Sittard option is visible.")
        sittard_option.click()

        # Wait for the page to reload and for the new buttons to appear
        page.wait_for_load_state('networkidle', timeout=30000)
        print("✅ Page is idle after switching to Sittard.")

        gastronomie_button = page.get_by_label("Gastronomie")
        expect(gastronomie_button).to_be_visible(timeout=10000)
        print("✅ Gastronomie button is visible.")

        # Click the "Gastronomie" filter button
        gastronomie_button.click()

        # Wait for a POI marker to appear on the map
        poi_marker = page.locator(".poi-marker-container")
        expect(poi_marker.first).to_be_visible(timeout=10000)
        print("✅ POI marker is visible.")

        # Take a screenshot to verify the new buttons and the filtered POI
        page.screenshot(path="jules-scratch/verification/sittard_poi_filters.png")
        print("✅ Screenshot captured successfully.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)