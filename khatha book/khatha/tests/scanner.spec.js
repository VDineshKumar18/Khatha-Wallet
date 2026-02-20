import { test, expect } from '@playwright/test';

test.describe('Mobile Scanner E2E Tests', () => {
    test.beforeEach(async ({ page, context }) => {
        // Grant camera permissions
        await context.grantPermissions(['camera']);

        // Mock Auth
        await page.route('**/api/*/send-otp**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Success" }) });
        });
        await page.route('**/api/*/verify-otp**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, retailerId: 1, retailerName: "Demo Retailer", email: "retailer@test.com" })
            });
        });

        // Mock Products
        await page.route('**/api/products**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 1, name: "Tomato", price: 40, quantity: 100, barcode: "123456", category: "FRUITS_VEGETABLES" }
                ])
            });
        });

        // Mock Dashboard Stats
        await page.route('**/api/orders/retailer/1', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await page.route('**/api/customers**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });

        // 1. Visit Landing Page
        await page.goto('/');

        // 2. Perform Login
        await page.getByRole('button', { name: 'Login' }).first().click();
        const modal = page.locator('.login-modal-card');
        await expect(modal).toBeVisible();

        await modal.getByRole('button', { name: 'Retailer' }).click();
        await modal.getByPlaceholder('name@company.com').fill('retailer@test.com');
        await modal.getByRole('button', { name: 'Send OTP' }).click();

        await expect(modal.locator('.otp-box').first()).toBeVisible({ timeout: 15000 });
        const otpBoxes = modal.locator('.otp-box');
        for (let i = 0; i < 6; i++) {
            await otpBoxes.nth(i).fill('1');
        }
        await modal.getByRole('button', { name: 'Login' }).click();

        // 3. Verify we entered RetailerApp
        await expect(page.getByText('Welcome 👋')).toBeVisible({ timeout: 15000 });
    });

    test('should open scanner in Billing view', async ({ page }) => {
        // 1. Navigate to Billing
        // Use the section card as it's common in Desktop and reachable
        const billingNav = page.locator('.section-card').filter({ hasText: 'Billing Section' });
        await expect(billingNav).toBeVisible({ timeout: 15000 });
        await billingNav.click();

        // 2. Click Scan button
        const scanBtn = page.locator('.scan-btn');
        await expect(scanBtn).toBeVisible({ timeout: 15000 });
        await scanBtn.click();

        // 3. Verify Scanner Modal
        await expect(page.getByText('Scan Barcode')).toBeVisible();

        const reader = page.locator('#reader');
        await expect(reader).toBeVisible();

        // 4. Close Scanner
        await page.locator('.close-btn').click();
        await expect(page.getByText('Scan Barcode')).not.toBeVisible();
    });
});
