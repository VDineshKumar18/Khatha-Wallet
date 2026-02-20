import { test, expect } from '@playwright/test';

test.describe('Error Handling Verification', () => {

    test('should show error on invalid OTP login', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Login' }).first().click();
        const modal = page.locator('.login-modal-card');
        await modal.getByRole('button', { name: 'Retailer' }).click();
        await modal.getByPlaceholder('name@company.com').fill('retailer@test.com');

        // Mock Send OTP success
        await page.route('**/api/auth/send-otp**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Success" }) });
        });
        await modal.getByRole('button', { name: 'Send OTP' }).click();

        // Mock Verify OTP Failure
        await page.route('**/api/auth/verify-otp**', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: "Invalid or expired OTP" })
            });
        });

        const otpBoxes = modal.locator('.otp-box');
        for (let i = 0; i < 6; i++) {
            await otpBoxes.nth(i).fill('1');
        }
        await modal.getByRole('button', { name: 'Login' }).click();

        // Verify error toast
        await expect(page.getByText('Invalid or expired OTP')).toBeVisible();
    });

    test('should show error when backend returns stock error', async ({ page }) => {
        // Mock Login State
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });

        // Mock Products
        await page.route('**/api/products**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 1, name: "Limited Product", price: 10, barcode: "123", quantity: 1 }])
            });
        });

        await page.goto('/');
        await page.getByText('Billing Section').first().click();

        // Add product to bill
        await page.getByRole('button', { name: 'ADD' }).click();
        await page.getByRole('button', { name: 'Place Order' }).click();

        // Mock Bill Save Failure (Stock)
        await page.route('**/api/bills**', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify("Insufficient stock for Limited Product")
            });
        });

        await page.locator('.save-bill-btn').click();

        // Verify error toast (Billing.jsx handles it as `Failed: ${err.response.data}`)
        await expect(page.getByText('Failed: Insufficient stock for Limited Product')).toBeVisible();
    });
});
