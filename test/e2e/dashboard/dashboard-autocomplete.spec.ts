import { test, expect } from '@playwright/test';

test.describe('Dashboard Autocomplete', () => {
  test('PlaceAutocomplete component functions correctly on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3002/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find the "Explore Places" input field
    const exploreInput = page.locator('input[placeholder*="Explore"], input[placeholder*="Search"], input[type="text"]').first();
    
    // Wait for input to be visible
    await expect(exploreInput).toBeVisible({ timeout: 10000 });
    
    // Clear any existing content and type "Puerto Rico"
    await exploreInput.clear();
    await exploreInput.fill('Puerto Rico');
    
    // Wait a moment for autocomplete suggestions to appear
    await page.waitForTimeout(2000);
    
    // Look for autocomplete suggestions container
    const suggestions = page.locator('[role="listbox"], .autocomplete-suggestions, [data-testid="autocomplete"], ul li, .suggestion-item');
    
    // Take screenshot before checking suggestions
    await page.screenshot({ 
      path: 'test-results/dashboard-autocomplete-before.png',
      fullPage: true 
    });
    
    // Check if suggestions appeared
    const suggestionsVisible = await suggestions.count() > 0;
    
    if (suggestionsVisible) {
      console.log(`Found ${await suggestions.count()} autocomplete suggestions`);
      
      // Take screenshot with suggestions visible
      await page.screenshot({ 
        path: 'test-results/dashboard-autocomplete-with-suggestions.png',
        fullPage: true 
      });
      
      // Verify suggestions contain relevant content
      const firstSuggestion = suggestions.first();
      await expect(firstSuggestion).toBeVisible();
      
      // Check if suggestion text is relevant to "Puerto Rico"
      const suggestionText = await firstSuggestion.textContent();
      expect(suggestionText?.toLowerCase()).toContain('puerto');
      
    } else {
      console.log('No autocomplete suggestions found');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/dashboard-autocomplete-no-suggestions.png',
        fullPage: true 
      });
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/dashboard-autocomplete-final.png',
      fullPage: true 
    });
    
    // Assert that autocomplete functionality is working
    expect(suggestionsVisible).toBe(true);
  });
});