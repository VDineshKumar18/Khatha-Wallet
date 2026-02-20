import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Diagnostic logs
        page.on('request', req => console.log('REQ:', req.url()));

        // Mock Necessary APIs
        await page.route('**/api/auth/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, retailerId: 1 }) });
        });
        await page.route('**/api/products**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 1, name: "Product 1", price: 10, barcode: "123", quantity: 10 }])
            });
        });
        await page.route('**/api/customers**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([])
            });
        });
        await page.route('**/api/orders/retailer/**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([])
            });
        });
    });

    test('Desktop View: Sidebar should be visible', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        // Mock Login shortcut (set storage)
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });
        await page.goto('/'); // Reload to trigger Dashboard render

        // Wait for Dashboard to stabilize
        await expect(page.getByText('Welcome 👋')).toBeVisible({ timeout: 15000 });

        // Sidebar should be visible on desktop
        const sidebar = page.locator('.sidebar');
        await expect(sidebar).toBeVisible();

        // Bottom Nav should NOT be visible on desktop
        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).not.toBeVisible();
    });

    test('Mobile View: Bottom Nav should be visible, Sidebar hidden', async ({ page }) => {
        await page.setViewportSize(devices['Pixel 5'].viewport);
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });
        await page.goto('/');

        await expect(page.getByText('Welcome 👋')).toBeVisible({ timeout: 15000 });

        // Bottom Nav should be visible on mobile
        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).toBeVisible();

        // Sidebar should be initially hidden on mobile (sidebarOpen is false for <= 768)
        const sidebar = page.locator('.sidebar');
        await expect(sidebar).not.toBeVisible();
    });
});
