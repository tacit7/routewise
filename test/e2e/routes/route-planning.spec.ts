import { test, expect } from '@playwright/test';

test.describe('Route Planning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication to access route planning
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });
    
    await page.reload();
  });

  test('should display route planning form', async ({ page }) => {
    // Check for route planning form elements
    await expect(page.getByLabel(/start location/i)).toBeVisible();
    await expect(page.getByLabel(/end location/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /plan route/i })).toBeVisible();
  });

  test('should provide city autocomplete suggestions', async ({ page }) => {
    const startInput = page.getByLabel(/start location/i);
    
    // Type partial city name
    await startInput.fill('San Fr');
    
    // Should show autocomplete suggestions
    await expect(page.getByText(/San Francisco/i)).toBeVisible();
    
    // Click on suggestion
    await page.getByText(/San Francisco/i).first().click();
    
    // Input should be filled
    await expect(startInput).toHaveValue(/San Francisco/);
  });

  test('should validate required route inputs', async ({ page }) => {
    const planRouteButton = page.getByRole('button', { name: /plan route/i });
    
    // Try to plan route without inputs
    await planRouteButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/start location.*required/i)).toBeVisible();
    await expect(page.getByText(/end location.*required/i)).toBeVisible();
  });

  test('should handle route calculation successfully', async ({ page }) => {
    // Fill in valid route inputs
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    
    // Plan the route
    await page.getByRole('button', { name: /plan route/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/calculating route/i)).toBeVisible();
    
    // Should eventually show route results
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/distance/i)).toBeVisible();
    await expect(page.getByText(/duration/i)).toBeVisible();
  });

  test('should display Google Maps embed with route', async ({ page }) => {
    // Plan a route
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    // Wait for route calculation
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    
    // Should show Google Maps iframe
    const mapFrame = page.frameLocator('iframe[src*="google.com/maps"]');
    await expect(mapFrame.locator('body')).toBeVisible();
  });

  test('should handle route calculation errors', async ({ page }) => {
    // Fill in invalid locations
    await page.getByLabel(/start location/i).fill('Invalid Location XYZ');
    await page.getByLabel(/end location/i).fill('Another Invalid Location ABC');
    
    // Try to plan route
    await page.getByRole('button', { name: /plan route/i }).click();
    
    // Should show error message
    await expect(page.getByText(/could not calculate route/i)).toBeVisible();
  });

  test('should allow adding checkpoints to route', async ({ page }) => {
    // Plan initial route
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    
    // Add checkpoint
    await page.getByRole('button', { name: /add checkpoint/i }).click();
    
    // Fill checkpoint location
    await page.getByLabel(/checkpoint/i).fill('Bakersfield, CA');
    
    // Update route
    await page.getByRole('button', { name: /update route/i }).click();
    
    // Should recalculate route with checkpoint
    await expect(page.getByText(/checkpoint.*bakersfield/i)).toBeVisible();
  });

  test('should save and load routes', async ({ page }) => {
    // Plan a route
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/route overview/i)).toBeVisible({ timeout: 10000 });
    
    // Save route
    await page.getByRole('button', { name: /save route/i }).click();
    await page.getByLabel(/route name/i).fill('SF to LA Trip');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/route saved/i)).toBeVisible();
    
    // Navigate to saved routes
    await page.getByText(/saved routes/i).click();
    
    // Should see saved route
    await expect(page.getByText(/SF to LA Trip/i)).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.getByLabel(/start location/i)).toBeVisible();
    await expect(page.getByLabel(/end location/i)).toBeVisible();
    
    // Form should be usable on mobile
    await page.getByLabel(/start location/i).fill('San Francisco, CA');
    await page.getByLabel(/end location/i).fill('Los Angeles, CA');
    
    // Button should be tappable
    await page.getByRole('button', { name: /plan route/i }).click();
    
    await expect(page.getByText(/calculating route/i)).toBeVisible();
  });
});