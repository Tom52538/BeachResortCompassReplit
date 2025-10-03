from playwright.sync_api import sync_playwright, Page, expect
import re

def verify_network_overlay(page: Page):
    """
    This test verifies that the network overlay can be enabled for all three locations:
    Kamperland, Zuhause, and Sittard.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:5000")

    # Wait for the map container to be visible before proceeding
    expect(page.locator(".leaflet-container")).to_be_visible()
    page.wait_for_timeout(2000) # Additional wait for map tiles to load

    # --- Set initial state to Kamperland ---
    location_switcher = page.get_by_role("button", name=re.compile("Kamperland|Zuhause|Sittard", re.IGNORECASE))
    expect(location_switcher).to_be_visible()
    location_switcher.click()
    page.get_by_role("menuitem", name="Kamperland").click()
    page.wait_for_timeout(2000) # Wait for site to load

    # --- Verify Kamperland ---
    # 2. Act: Enable the network overlay.
    overlay_toggle = page.get_by_title("Netzwerk-Overlay anzeigen")
    expect(overlay_toggle).to_be_visible()
    overlay_toggle.click()

    # 3. Assert: Take a screenshot to verify the overlay is visible.
    page.wait_for_timeout(1000) # Wait for overlay to render
    page.screenshot(path="jules-scratch/verification/kamperland_overlay.png")
    print("Kamperland overlay screenshot captured.")

    # --- Verify Zuhause ---
    # 4. Act: Switch to the "Zuhause" location.
    location_switcher = page.get_by_role("button", name=re.compile("Kamperland|Zuhause|Sittard", re.IGNORECASE))
    expect(location_switcher).to_be_visible()
    location_switcher.click()
    page.get_by_role("menuitem", name="Zuhause").click()

    # 5. Assert: Take a screenshot to verify the overlay is visible.
    page.wait_for_timeout(2000) # Wait for site change and overlay to load
    page.screenshot(path="jules-scratch/verification/zuhause_overlay.png")
    print("Zuhause overlay screenshot captured.")

    # --- Verify Sittard ---
    # 6. Act: Switch to the "Sittard" location.
    location_switcher = page.get_by_role("button", name=re.compile("Kamperland|Zuhause|Sittard", re.IGNORECASE))
    expect(location_switcher).to_be_visible()
    location_switcher.click()
    page.get_by_role("menuitem", name="Sittard").click()

    # 7. Assert: Take a screenshot to verify the overlay is visible.
    page.wait_for_timeout(2000) # Wait for site change and overlay to load
    page.screenshot(path="jules-scratch/verification/sittard_overlay.png")
    print("Sittard overlay screenshot captured.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_network_overlay(page)
        browser.close()

if __name__ == "__main__":
    main()