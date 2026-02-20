import { test, expect } from '@playwright/test';

test.describe('Business Flows: Suppliers & Customer Credit', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Login State
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });
    });

    test('Supplier Flow: Add, Bill, Payment and Balance verification', async ({ page }) => {
        // 1. Mock Suppliers List
        await page.route('**/api/suppliers**', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: JSON.stringify([{ id: 10, name: "Global Traders", balance: 0, phone: "9876543210", company: "GT Wholesale" }])
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('/');
        await page.locator('.sidebar-item', { hasText: 'Supplier' }).click();
        await expect(page.getByText('Global Traders')).toBeVisible();

        // 2. Add Transaction: Bill Received (+ Debt)
        await page.getByText('Manage Credit').click();

        // Mock Transaction calls
        await page.route('**/api/suppliers/10/transactions**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });

        await page.getByText('You Received (Bill)').click();
        await page.getByPlaceholder('0.00').fill('500');
        await page.getByPlaceholder('e.g. Bill #123 or Cash Payment').fill('Bill #101');

        // Mock Transaction Save
        await page.route('**/api/suppliers/10/transact', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        // Trigger balance update mock for second load
        await page.route('**/api/suppliers**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 10, name: "Global Traders", balance: 500, phone: "9876543210", company: "GT Wholesale" }])
            });
        });

        await page.getByRole('button', { name: 'Confirm Transaction' }).click();
        await expect(page.getByText('Transaction recorded')).toBeVisible();

        // 3. Verify Balance in Card
        await page.locator('.close-btn').click();
        await expect(page.getByText('To Pay: ₹500')).toBeVisible();

        // 4. Record Payment (- Debt)
        await page.getByText('Manage Credit').click();
        await page.getByText('You Gave (Payment)').click();
        await page.getByPlaceholder('0.00').fill('200');

        // Update mock for final balance
        await page.route('**/api/suppliers**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 10, name: "Global Traders", balance: 300, phone: "9876543210", company: "GT Wholesale" }])
            });
        });

        await page.getByRole('button', { name: 'Confirm Transaction' }).click();
        await expect(page.getByText('Transaction recorded')).toBeVisible();
        await page.locator('.close-btn').click();
        await expect(page.getByText('To Pay: ₹300')).toBeVisible();
    });

    test('Customer Credit: Verify KHATHA billing updates due amount', async ({ page }) => {
        // 1. Mock Customer & Products
        await page.route('**/api/customers**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 101, name: "John Doe", email: "john@test.com", dueAmount: 50, loyaltyPoints: 0 }])
            });
        });
        await page.route('**/api/products**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 1, name: "Item A", price: 100, barcode: "A1", quantity: 10, productType: 'UNIT' }])
            });
        });

        await page.goto('/');
        await page.getByText('Billing Section').first().click();

        // 2. Select Customer
        await page.locator('select').selectOption('101');

        // 3. Add item and select KHATHA mode
        await page.locator('.modern-card').first().locator('.add-btn').click();
        await page.getByText('KHATHA').click();

        // Verify default paid amount is 0 and due is total
        // Price 100 + 5% GST (5) = 105 (Floored 105)
        await expect(page.locator('.save-bill-btn')).toContainText('Place Order');

        // 4. Capture Save Bill Request
        // We expect a POST to /api/bills/101 with type: "GAVE"
        const [request] = await Promise.all([
            page.waitForRequest(req => req.url().includes('/api/bills/101') && req.method() === 'POST'),
            page.locator('.save-bill-btn').click()
        ]);

        const payload = JSON.parse(request.postData());
        expect(payload.type).toBe('GAVE');
        expect(payload.amount).toBe(105);
        expect(payload.paymentMode).toBe('KHATHA');
    });
});
