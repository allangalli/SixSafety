import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/SixSafety/i);

    // Check main heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display neighbourhood selector', async ({ page }) => {
    await page.goto('/');

    // Check for select element or dropdown
    const select = page.locator('select, [role="combobox"]').first();
    await expect(select).toBeVisible();
  });

  test('should show Start Survey button as disabled initially', async ({ page }) => {
    await page.goto('/');

    // Check for Start Survey button
    const button = page.getByRole('button', { name: /start.*survey/i });
    await expect(button).toBeVisible();

    // Should be disabled when no neighbourhood selected
    await expect(button).toBeDisabled();
  });

  test('should enable Start Survey button after neighbourhood selection', async ({ page }) => {
    await page.goto('/');

    // Select a neighbourhood
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 }); // Select first option (not placeholder)

    // Wait a bit for state update
    await page.waitForTimeout(500);

    // Button should be enabled
    const button = page.getByRole('button', { name: /start.*survey/i });
    await expect(button).toBeEnabled();
  });

  test('should show crime statistics after neighbourhood selection', async ({ page }) => {
    await page.goto('/');

    // Select a neighbourhood
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 });

    // Wait for crime stats to appear
    await page.waitForTimeout(500);

    // Should show some crime-related text
    const pageContent = await page.textContent('body');
    const hasCrimeInfo = pageContent?.toLowerCase().includes('crime') ||
                        pageContent?.toLowerCase().includes('theft') ||
                        pageContent?.toLowerCase().includes('assault') ||
                        pageContent?.toLowerCase().includes('safety');

    expect(hasCrimeInfo).toBeTruthy();
  });

  test('should navigate to survey page on button click', async ({ page }) => {
    await page.goto('/');

    // Select a neighbourhood
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 });

    await page.waitForTimeout(500);

    // Click Start Survey button
    const button = page.getByRole('button', { name: /start.*survey/i });
    await button.click();

    // Should navigate to /survey
    await expect(page).toHaveURL(/\/survey/);
  });
});
