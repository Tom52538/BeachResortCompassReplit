const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigated to localhost:5000');
        await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });

        console.log('✅ Map container is present.');
        await page.waitForSelector('.map-container');

        console.log('✅ Site selector button is visible.');
        const siteSelector = await page.waitForSelector('[aria-haspopup="menu"]');

        console.log('✅ Sittard option is visible.');
        await siteSelector.click();
        const sittardOption = await page.waitForSelector('text=Sittard');
        await sittardOption.click();

        console.log('✅ Page is idle after switching to Sittard.');
        await page.waitForLoadState('networkidle');

        console.log('✅ Gastronomie button is visible.');
        const gastronomieButton = await page.waitForSelector('[aria-label="Gastronomie"]');
        await gastronomieButton.click();

        console.log('✅ POI marker is visible.');
        await page.waitForSelector('.poi-marker-container');

        console.log('✅ Screenshot captured successfully.');
        await page.screenshot({ path: 'sittard_gastronomie.png' });

    } catch (error) {
        console.error('❌ Frontend verification failed:', error);
        await page.screenshot({ path: 'error.png' });
    } finally {
        await browser.close();
    }
})();