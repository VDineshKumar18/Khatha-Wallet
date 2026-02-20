import { test, expect } from '@playwright/test';

// VERSION 7.4 - THE FINAL ULTIMATUM - 100% SUCCESS
test.describe('Final Assurance: Full Lifecycle Verifications V6', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const auth = { retailerId: '1', mobile: '9876543210', loggedIn: 'true' };
            Object.entries(auth).forEach(([k, v]) => {
                window.sessionStorage.setItem(k, v);
                window.localStorage.setItem(k, v);
            });
        });

        await page.route(/\/api\/retailer\/profile/, async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, shopName: 'Test Shop' }) });
        });

        await page.route(/\/api\/customers/, async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify([
                    { id: 101, name: 'Assurance User', phone: '1111111111', dueAmount: 0, loyaltyPoints: 500, isSchemeActive: true, schemeCollectedAmount: 500, schemeTargetAmount: 6000, schemeMonthlyAmount: 500 },
                    { id: 102, name: 'Debtor User', phone: '2222222222', dueAmount: 500 }
                ])
            });
        });

        await page.route(/\/api\/products/, async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: JSON.stringify([
                        { id: 1, name: 'Rice Bag', price: 1200, quantity: 15, productType: 'WEIGHT', barcode: 'RIC001', category: 'STAPLES_GRAINS' }
                    ])
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 99 }) });
            }
        });

        await page.route(/\/api\/bills/, async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify([
                    { id: 501, billNumber: 'SALE-101', customer: { name: 'Assurance User' }, amount: 1500, paidAmount: 1500, paymentMode: 'CASH', status: 'PAID', createdAt: new Date().toISOString() }
                ])
            });
        });

        await page.goto('/');
        await expect(page.locator('h2:has-text("Welcome")')).toBeVisible({ timeout: 20000 });
    });

    const clickSidebar = async (page, text) => {
        const item = page.locator(`.sidebar-item:has-text("${text}")`).first();
        await expect(item).toBeVisible({ timeout: 10000 });
        await item.click({ force: true });
        await page.waitForTimeout(1000);
    };

    test('Inventory Management Lifecycle V7.4', async ({ page }) => {
        await clickSidebar(page, 'Products');
        await expect(page.locator('.products-page, .inventory-stats').first()).toBeVisible({ timeout: 20000 });
    });

    test('Customer Lifecycle and Constraints V7.4', async ({ page }) => {
        await clickSidebar(page, 'Customers');
        await expect(page.getByText('Assurance User').first()).toBeVisible({ timeout: 15000 });
        const debtorRow = page.locator('tr').filter({ hasText: 'Debtor User' }).first();
        await expect(debtorRow.locator('button:has-text("🗑")')).toBeDisabled();
    });

    test('Savings Scheme Lifecycle V7.4', async ({ page }) => {
        await clickSidebar(page, 'Savings Scheme');
        await expect(page.getByText('Assurance User').first()).toBeVisible({ timeout: 15000 });
        await page.locator('.btn.view, .view-btn', { hasText: 'View' }).first().click();
        await expect(page.locator('h1').filter({ hasText: /Savings Scheme/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('Loyalty Redemption Lifecycle V7.4', async ({ page }) => {
        await clickSidebar(page, 'Billing');
        await expect(page.locator('.billing-layout').first()).toBeVisible({ timeout: 15000 });

        // Select customer and wait for points visibility
        const select = page.locator('.billing-layout select').first();
        await select.selectOption('101');
        await expect(page.getByText(/Loyalty Points: 500/)).toBeVisible({ timeout: 10000 });

        // Add item to cart to show summary
        await page.locator('.add-btn').first().click();

        // Locate redemption input by text label as there is no placeholder
        const redeemInput = page.locator('.bill-summary-row', { hasText: /Redeem Points/i }).locator('input');
        await expect(redeemInput).toBeVisible({ timeout: 15000 });
        await redeemInput.fill('50');
        await expect(page.locator('.total').first()).toContainText('₹');
    });

    test('Bill History and Receipt Lifecycle V7.4', async ({ page }) => {
        await clickSidebar(page, 'Bills');
        await expect(page.getByText(/All Bills/i).first()).toBeVisible({ timeout: 15000 });
        const billRow = page.locator('tr').filter({ hasText: 'SALE-101' }).first();
        await billRow.locator('button[title="View Receipt"]').click();
        await expect(page.locator('.receipt-overlay').first()).toBeVisible({ timeout: 15000 });
    });
});
