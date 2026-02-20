import { test, expect } from '@playwright/test';

test.describe('Dark Mode Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Necessary APIs
        await page.route('**/api/customers**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await page.route('**/api/products**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await page.route('**/api/orders/retailer/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });

        // Set Login State
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });
        await page.goto('/');
        await expect(page.getByText('Welcome 👋')).toBeVisible({ timeout: 15000 });
    });

    test('should toggle dark mode and persist across reloads', async ({ page }) => {
        // 1. Initial state: light mode
        await expect(page.locator('body')).not.toHaveClass(/dark/);

        // 2. Find and click toggle (in Sidebar on Desktop)
        const toggle = page.locator('.dark-toggle');
        await expect(toggle).toBeVisible();
        await expect(toggle).toContainText('Dark Mode');

        await toggle.click();

        // 3. Verify dark mode applied
        await expect(page.locator('body')).toHaveClass(/dark/);
        await expect(toggle).toContainText('Light Mode');

        // 4. Reload page
        await page.reload();
        await expect(page.getByText('Welcome 👋')).toBeVisible();

        // 5. Verify persistence
        await expect(page.locator('body')).toHaveClass(/dark/);

        // 6. Toggle back to light
        await page.locator('.dark-toggle').click();
        await expect(page.locator('body')).not.toHaveClass(/dark/);
    });
});
