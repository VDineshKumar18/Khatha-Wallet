import { test, expect } from '@playwright/test';

test.describe('Khatha Book E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Visit the local dev server
        await page.goto('/');
        // Wait for the app to settle (it has a loader)
        await expect(page.getByAltText('Khatha Wallet').first()).toBeVisible({ timeout: 60000 });
    });

    test('successfully loads the landing page', async ({ page }) => {
        await expect(page.getByText('Digital Supermarket for Towns & Villages')).toBeVisible();
    });

    test('opens the login modal when Start Free is clicked', async ({ page }) => {
        // Find and click the button
        await page.getByRole('button', { name: 'Start Free' }).click();

        // Use the correct class from LoginModal.jsx
        await expect(page.locator('.login-modal-card')).toBeVisible();
    });

    test('shows login form in modal via Login button', async ({ page }) => {
        // Using the Login button in the header
        await page.getByRole('button', { name: 'Login' }).first().click();

        const modal = page.locator('.login-modal-card');
        await expect(modal).toBeVisible();

        // Check for inputs inside the modal
        // Note: The placeholder in LoginModal.jsx is "name@company.com" but wait...
        // Line 225: placeholder="name@company.com"
        await expect(modal.getByPlaceholder('name@company.com')).toBeVisible();
        await expect(modal.getByText('Send OTP')).toBeVisible();
    });
});
