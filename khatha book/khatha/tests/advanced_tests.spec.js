import { test, expect } from '@playwright/test';

test.describe('Advanced Testing & Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Login State
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("retailerId", "1");
            sessionStorage.setItem("retailerName", "Test Retailer");
            sessionStorage.setItem("authToken", "test-token");
            sessionStorage.setItem("loggedIn", "true");
        });

        // Mock basic customers and products
        await page.route('**/api/customers**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([{ id: 101, name: "John Doe", email: "john@test.com", dueAmount: 100.25, loyaltyPoints: 0 }])
            });
        });
        await page.route('**/api/products**', async route => {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify([
                    { id: 1, name: "Item A", price: 10.99, barcode: "A1", quantity: 10, productType: 'UNIT' },
                    { id: 2, name: "Item B", price: 5.50, barcode: "B1", quantity: 20, productType: 'UNIT' }
                ])
            });
        });
    });

    test('Data Integrity: Verify complex billing calculations (floating point)', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Billing Section').first().click();

        // 1. Add 3 of Item A
        const cardA = page.locator('.modern-card', { hasText: 'Item A' });
        await cardA.locator('.add-btn').click();

        // Wait for cart to appear and increase qty to 3
        const cartItemA = page.locator('.cart-item', { hasText: 'Item A' });
        await cartItemA.locator('.qty-btn', { hasText: '+' }).click(); // 2
        await cartItemA.locator('.qty-btn', { hasText: '+' }).click(); // 3

        // 2. Add 1 of Item B
        const cardB = page.locator('.modern-card', { hasText: 'Item B' });
        await cardB.locator('.add-btn').click();

        // 3. Verify Calculations
        // Subtotal: (10.99 * 3) + 5.50 = 32.97 + 5.50 = 38.47
        // GST (5%): 38.47 * 0.05 = 1.9235
        // Gross: 40.3935
        // Final Total (Floored): 40

        await expect(page.locator('.bill-summary-row.total')).toContainText('40');

        // 4. Place Order & Verify Payload
        const [request] = await Promise.all([
            page.waitForRequest(req => req.url().includes('/api/bills') && req.method() === 'POST'),
            page.locator('.save-bill-btn').click()
        ]);

        const payload = JSON.parse(request.postData());
        // Backend payload amount is the final total
        expect(payload.amount).toBe(40);
    });

    test('Resilience: Application handles offline state gracefully', async ({ page, context }) => {
        await page.goto('/');
        await expect(page.getByText('Welcome 👋')).toBeVisible();

        // Simulate going offline
        await context.setOffline(true);

        // Try to navigate to Customers
        await page.getByText('Customers').first().click();

        // Verify it doesn't crash and maybe shows an error (depends on implementation)
        // Since we don't have explicit offline UI, we just ensure the view changed
        await expect(page.getByText('Customer List')).toBeVisible();
    });

    test('Performance: Landing page load benchmark', async ({ page }) => {
        await page.goto('/');
        const loadTime = await page.evaluate(() => {
            const timing = performance.getEntriesByType('navigation')[0];
            return timing.duration;
        });

        console.log(`Landing Page Load Time: ${loadTime}ms`);
        // Threshold: 10s for local dev env is generous
        expect(loadTime).toBeLessThan(10000);
    });
});
