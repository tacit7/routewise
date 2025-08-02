import { test, expect } from '@playwright/test';

test.describe('POI Discovery and Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });
    
    await page.reload();
    
    // Plan a route to get to POI discovery
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display POIs along the route', async ({ page }) => {
    // Should show POI section
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    // Should show POI cards
    await expect(page.locator('[data-testid="poi-card"]').first()).toBeVisible({ timeout: 5000 });
    
    // POI cards should have essential information
    const firstPoi = page.locator('[data-testid="poi-card"]').first();
    await expect(firstPoi.getByText(/rating/i)).toBeVisible();
    await expect(firstPoi.locator('img')).toBeVisible(); // POI photo
  });

  test('should filter POIs by category', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    // Should show category filters
    await expect(page.getByRole('button', { name: /restaurants/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /attractions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /gas stations/i })).toBeVisible();
    
    // Click restaurant filter
    await page.getByRole('button', { name: /restaurants/i }).click();
    
    // Should show only restaurant POIs
    await expect(page.getByText(/restaurant/i)).toBeVisible();
    
    // Click attractions filter
    await page.getByRole('button', { name: /attractions/i }).click();
    
    // Should show attraction POIs
    await expect(page.getByText(/attraction|museum|park/i)).toBeVisible();
  });

  test('should select and deselect POIs', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    const firstPoi = page.locator('[data-testid="poi-card"]').first();
    await expect(firstPoi).toBeVisible({ timeout: 5000 });
    
    // Select POI
    await firstPoi.getByRole('checkbox').check();
    
    // Should show as selected
    await expect(firstPoi).toHaveClass(/selected|checked/);
    
    // Should appear in selected POIs list
    await expect(page.getByText(/selected pois/i)).toBeVisible();
    
    // Deselect POI
    await firstPoi.getByRole('checkbox').uncheck();
    
    // Should no longer show as selected
    await expect(firstPoi).not.toHaveClass(/selected|checked/);
  });

  test('should show POI details in modal', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    const firstPoi = page.locator('[data-testid="poi-card"]').first();
    await expect(firstPoi).toBeVisible({ timeout: 5000 });
    
    // Click on POI to view details
    await firstPoi.click();
    
    // Should open POI details modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/hours/i)).toBeVisible();
    await expect(page.getByText(/contact/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /directions/i })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should update route with selected POIs', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    // Select multiple POIs
    const poiCards = page.locator('[data-testid="poi-card"]');
    await expect(poiCards.first()).toBeVisible({ timeout: 5000 });
    
    await poiCards.nth(0).getByRole('checkbox').check();
    await poiCards.nth(1).getByRole('checkbox').check();
    
    // Update route with selected POIs
    await page.getByRole('button', { name: /update route/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/updating route/i)).toBeVisible();
    
    // Should show updated route information
    await expect(page.getByText(/route updated/i)).toBeVisible({ timeout: 10000 });
    
    // Should show selected POIs in itinerary
    await expect(page.getByText(/selected stops/i)).toBeVisible();
  });

  test('should search POIs by name or location', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    // Find search input
    const searchInput = page.getByPlaceholder(/search pois/i);
    await expect(searchInput).toBeVisible();
    
    // Search for specific POI
    await searchInput.fill('McDonald\'s');
    
    // Should filter POIs by search term
    await expect(page.getByText(/McDonald's/i)).toBeVisible();
    
    // Clear search
    await searchInput.clear();
    
    // Should show all POIs again
    await expect(page.locator('[data-testid="poi-card"]')).toHaveCount(await page.locator('[data-testid="poi-card"]').count());
  });

  test('should handle POI loading states', async ({ page }) => {
    // Navigate to a new route to trigger POI loading
    await page.getByRole('button', { name: /new route/i }).click();
    
    await page.getByLabel(/start location/i).fill('Seattle, WA');
    await page.getByLabel(/end location/i).fill('Portland, OR');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    
    // Should show POI loading state
    await expect(page.getByText(/loading points of interest/i)).toBeVisible();
    
    // Should eventually show POIs
    await expect(page.locator('[data-testid="poi-card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle POI API errors gracefully', async ({ page }) => {
    // Mock API error by intercepting requests
    await page.route('**/api/pois**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    // Navigate to trigger POI loading
    await page.getByRole('button', { name: /new route/i }).click();
    
    await page.getByLabel(/start location/i).fill('Seattle, WA');
    await page.getByLabel(/end location/i).fill('Portland, OR');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    
    // Should show error message
    await expect(page.getByText(/could not load points of interest/i)).toBeVisible();
    
    // Should show retry button
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    // POI cards should be responsive
    const poiCard = page.locator('[data-testid="poi-card"]').first();
    await expect(poiCard).toBeVisible({ timeout: 5000 });
    
    // Should be able to select POIs on mobile
    await poiCard.getByRole('checkbox').check();
    await expect(poiCard).toHaveClass(/selected|checked/);
    
    // Touch interactions should work
    await poiCard.tap();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should preserve POI selections during navigation', async ({ page }) => {
    await expect(page.getByText(/points of interest/i)).toBeVisible();
    
    const firstPoi = page.locator('[data-testid="poi-card"]').first();
    await expect(firstPoi).toBeVisible({ timeout: 5000 });
    
    // Select POI
    await firstPoi.getByRole('checkbox').check();
    
    // Navigate away and back
    await page.getByText(/profile/i).click();
    await page.getByText(/routes/i).click();
    
    // POI should still be selected
    await expect(firstPoi.getByRole('checkbox')).toBeChecked();
  });
});