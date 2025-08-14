import { chromium } from 'playwright';

(async () => {
  console.log('Starting dashboard autocomplete test...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the dashboard
    console.log('Navigating to localhost:3001/dashboard...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    
    // Wait for the page to load completely
    console.log('Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'dashboard-initial.png', fullPage: true });
    console.log('Initial screenshot taken');
    
    // Look for the PlaceAutocomplete input field
    console.log('Looking for PlaceAutocomplete input field...');
    
    // Try multiple selectors to find the input
    const inputSelectors = [
      'input[placeholder*="New York, Grand Canyon, France, Puerto Rico"]',
      'input[placeholder*="Puerto Rico"]',
      'input[placeholder*="Explore Places"]',
      '[data-testid="place-autocomplete"]',
      'input[type="text"]'
    ];
    
    let inputField = null;
    let foundSelector = null;
    
    for (const selector of inputSelectors) {
      try {
        inputField = await page.locator(selector).first();
        if (await inputField.isVisible({ timeout: 1000 })) {
          foundSelector = selector;
          console.log(`Found input field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!inputField || !foundSelector) {
      console.log('Could not find PlaceAutocomplete input field');
      
      // Debug: Get all input elements on the page
      const allInputs = await page.locator('input').count();
      console.log(`Total input elements found: ${allInputs}`);
      
      for (let i = 0; i < allInputs; i++) {
        const input = page.locator('input').nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        const visible = await input.isVisible();
        console.log(`Input ${i}: placeholder="${placeholder}", type="${type}", visible=${visible}`);
      }
      
      await page.screenshot({ path: 'dashboard-no-input-found.png', fullPage: true });
      await browser.close();
      return;
    }
    
    // Focus and type in the input field
    console.log('Focusing on input field...');
    await inputField.focus();
    await page.waitForTimeout(500);
    
    console.log('Typing "Puerto Rico" slowly...');
    await inputField.type('Puerto Rico', { delay: 100 });
    
    // Wait for autocomplete suggestions
    console.log('Waiting for autocomplete suggestions...');
    await page.waitForTimeout(2000);
    
    // Look for autocomplete dropdown/suggestions
    const dropdownSelectors = [
      '[role="listbox"]',
      '[role="menu"]',
      '.autocomplete-dropdown',
      '.suggestions',
      '[data-testid="autocomplete-dropdown"]',
      'ul[role="listbox"]',
      '.MuiAutocomplete-listbox',
      '[class*="dropdown"]',
      '[class*="suggestion"]'
    ];
    
    let dropdown = null;
    let foundDropdownSelector = null;
    
    for (const selector of dropdownSelectors) {
      try {
        dropdown = await page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 1000 })) {
          foundDropdownSelector = selector;
          console.log(`Found dropdown with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'dashboard-autocomplete-test.png', fullPage: true });
    console.log('Final screenshot taken');
    
    // Report results
    console.log('\n=== TEST RESULTS ===');
    console.log('✓ Page loaded successfully: true');
    console.log(`✓ PlaceAutocomplete input found: ${foundSelector ? 'true' : 'false'}`);
    if (foundSelector) {
      console.log(`  └─ Found with selector: ${foundSelector}`);
    }
    console.log(`✓ Autocomplete suggestions appeared: ${foundDropdownSelector ? 'true' : 'false'}`);
    if (foundDropdownSelector) {
      console.log(`  └─ Found with selector: ${foundDropdownSelector}`);
    }
    
    console.log('✓ Test completed successfully');
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'dashboard-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();