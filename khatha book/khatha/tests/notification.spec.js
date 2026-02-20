import { test, expect } from '@playwright/test';

test.describe('Notification API E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Diagnostic logs
        page.on('request', req => console.log('REQ:', req.url()));

        // Mock Login
        await page.route('**/api/auth/send-otp**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Success" }) });
        });
        await page.route('**/api/auth/verify-otp**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, retailerId: 1, retailerName: "Demo Retailer", email: "retailer@test.com" })
            });
        });

        // Mock Customers
        await page.route('**/api/customers**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 101, name: "John Doe", email: "john@test.com", phone: "9999999999", dueAmount: 500 }
                ])
            });
        });

        // 1. Visit Landing Page & Login
        await page.goto('/');
        await page.getByRole('button', { name: 'Login' }).first().click();
        const modal = page.locator('.login-modal-card');
        await modal.getByRole('button', { name: 'Retailer' }).click();
        await modal.getByPlaceholder('name@company.com').fill('retailer@test.com');
        await modal.getByRole('button', { name: 'Send OTP' }).click();
        const otpBoxes = modal.locator('.otp-box');
        for (let i = 0; i < 6; i++) {
            await otpBoxes.nth(i).fill('1');
        }
        await modal.getByRole('button', { name: 'Login' }).click();

        await expect(page.getByText('Welcome 👋')).toBeVisible({ timeout: 15000 });
    });

    test('should trigger notification for customer with due amount', async ({ page }) => {
        // 1. Navigate to Customers
        await page.getByText('Customers').first().click();
        await expect(page.getByText('Customer List')).toBeVisible();

        // 2. Locate John Doe and the Notify button
        const row = page.locator('tr', { hasText: 'John Doe' });
        const notifyBtn = row.getByRole('button', { name: 'Notify' });
        await expect(notifyBtn).toBeVisible();

        // 3. Mock the notification API call
        let apiCalled = false;
        await page.route('**/api/notify/101', async route => {
            apiCalled = true;
            await route.fulfill({ status: 200, contentType: 'text/plain', body: "Notification sent" });
        });

        // 4. Click Notify
        await notifyBtn.click();

        // 5. Verify API was called and success toast appears
        expect(apiCalled).toBe(true);
        await expect(page.getByText('Email sent to john@test.com')).toBeVisible();
    });
});
