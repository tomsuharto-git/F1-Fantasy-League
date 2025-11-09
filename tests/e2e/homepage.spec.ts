import { test, expect } from '@playwright/test';

/**
 * Grid Kings - Homepage E2E Tests
 * Tests the landing page and basic navigation
 */

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page title contains "Grid Kings"
    await expect(page).toHaveTitle(/Grid Kings/);

    // Verify main heading is visible
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display create league button', async ({ page }) => {
    await page.goto('/');

    // Look for the create league button
    const createButton = page.getByRole('button', { name: /create/i });
    await expect(createButton).toBeVisible();
  });

  test('should display join league option', async ({ page }) => {
    await page.goto('/');

    // Look for join league functionality
    const joinSection = page.getByText(/join/i).first();
    await expect(joinSection).toBeVisible();
  });

  test('should navigate to create league page', async ({ page }) => {
    await page.goto('/');

    // Click the create league button
    const createButton = page.getByRole('button', { name: /create/i });
    await createButton.click();

    // Verify navigation to create page
    await expect(page).toHaveURL(/\/create/);
  });
});
