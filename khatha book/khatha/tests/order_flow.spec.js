import { test, expect } from '@playwright/test';

test.describe('Order Lifecycle E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // --- MOCK API CALLS ---

        // Mock Send OTP
        await page.route('**/api/customer-auth/send-otp**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "OTP sent" }) });
        });

        // Mock Verify OTP (Returns accounts)
        await page.route('**/api/customer-auth/verify-otp', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { customerId: 1, customerName: "Demo Customer", retailerId: 1, retailerName: "Demo Shop", email: "demo.customer@gmail.com" }
                ])
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

        // Mock Order Creation
        await page.route('**/api/orders/create', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 1001, status: "PENDING" })
            });
        });

        // Mock Customer Orders List
        await page.route('**/api/orders/customer/1', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 1001,
                        status: "PENDING",
                        totalAmount: 40,
                        items: JSON.stringify([{ name: "Tomato", qty: 1, price: 40, total: 40 }]),
                        retailerName: "Demo Shop",
                        createdAt: new Date().toISOString()
                    }
                ])
            });
        });

        // Mock Order Status Update (Cancellation)
        await page.route('**/api/orders/1001/status**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        // 1. Visit Landing Page
        await page.goto('/');
        await expect(page.getByAltText('Khatha Wallet').first()).toBeVisible({ timeout: 60000 });

        // 2. Perform Customer Login
        await page.getByRole('button', { name: 'Login' }).first().click();
        const modal = page.locator('.login-modal-card');
        await expect(modal).toBeVisible();

        // Switch to Customer mode in Login Modal
        await modal.getByRole('button', { name: 'Customer' }).click();

        // Enter email and trigger simulated login
        await modal.getByPlaceholder('name@company.com').fill('demo.customer@gmail.com');
        await modal.getByRole('button', { name: 'Send OTP' }).click();

        // Wait for OTP boxes
        await expect(modal.locator('.otp-box').first()).toBeVisible();

        // Fill fake OTP
        const otpBoxes = modal.locator('.otp-box');
        for (let i = 0; i < 6; i++) {
            await otpBoxes.nth(i).fill('1');
        }

        // Click login button INSIDE the modal
        await modal.getByRole('button', { name: 'Login' }).click();

        // 3. Verify we entered CustomerApp
        await expect(page.getByText('Welcome Back 👋')).toBeVisible({ timeout: 15000 });
    });

    test('should place and then cancel an order', async ({ page }) => {
        // 1. Add product to cart
        const addBtn = page.locator('.product-card .add-btn').first();
        await expect(addBtn).toBeVisible({ timeout: 15000 });
        await addBtn.click();

        // 2. Go to Cart view (Using broad selector for Desktop/Mobile)
        // Desktop uses .sidebar-item, Mobile uses .nav-item
        const cartNav = page.locator('.sidebar-item, .nav-item').filter({ hasText: 'Cart' });
        await cartNav.first().click();

        // 3. Place the Order
        await expect(page.getByText('Your Cart')).toBeVisible();
        const placeOrderBtn = page.getByRole('button', { name: /Place Order/ });
        await placeOrderBtn.click();

        // 4. Verify redirected to Orders
        await expect(page.getByText('My Orders')).toBeVisible();

        // 5. Cancel the latest order
        const cancelBtn = page.locator('.cancel-btn').first();
        await expect(cancelBtn).toBeVisible();

        // Handle window.confirm
        page.once('dialog', dialog => {
            dialog.accept();
        });

        // Setup mock for re-arrival after cancellation
        await page.route('**/api/orders/customer/1', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 1001,
                        status: "CANCELLED", // UPDATED STATUS
                        totalAmount: 40,
                        items: JSON.stringify([{ name: "Tomato", qty: 1, price: 40, total: 40 }]),
                        retailerName: "Demo Shop",
                        createdAt: new Date().toISOString()
                    }
                ])
            });
        });

        await cancelBtn.click();

        // 6. Verify status changed to CANCELLED
        await expect(page.locator('.status-badge').filter({ hasText: 'CANCELLED' }).first()).toBeVisible();
    });
});
