import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any common accessibility testing configuration
    await page.addInitScript(() => {
      // Disable animations for more predictable testing
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('should not have any automatically detectable accessibility issues on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on authentication forms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test login form accessibility
    const loginFormVisible = await page.isVisible('text=Sign In');
    if (loginFormVisible) {
      const loginScanResults = await new AxeBuilder({ page })
        .include('[data-testid*="login"], form:has([type="password"])')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(loginScanResults.violations).toEqual([]);
    }

    // Test register form accessibility
    const registerLinkVisible = await page.isVisible('text=Create Account');
    if (registerLinkVisible) {
      await page.click('text=Create Account');
      await page.waitForTimeout(500); // Wait for form transition

      const registerScanResults = await new AxeBuilder({ page })
        .include('[data-testid*="register"], form:has([type="password"])')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(registerScanResults.violations).toEqual([]);
    }
  });

  test('should not have accessibility issues on route planning interface', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for route planning form
    const routeFormVisible = await page.isVisible('text=From') || await page.isVisible('text=Plan Route');
    
    if (routeFormVisible) {
      const routePlanningResults = await new AxeBuilder({ page })
        .include('form, [role="form"], [data-testid*="route"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(routePlanningResults.violations).toEqual([]);
    }
  });

  test('should not have accessibility issues on route results page', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });

    await page.goto('/route?start=San%20Francisco&end=Los%20Angeles');
    await page.waitForLoadState('networkidle');

    // Wait for route data to potentially load
    await page.waitForTimeout(2000);

    const routeResultsResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(routeResultsResults.violations).toEqual([]);
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test tab navigation through interactive elements
    const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    expect(focusableElements.length).toBeGreaterThan(0);

    // Test that first element can receive focus
    if (focusableElements.length > 0) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    }

    // Test that focus is visible
    await page.addStyleTag({
      content: `
        *:focus {
          outline: 2px solid red !important;
          outline-offset: 2px !important;
        }
      `
    });

    await page.keyboard.press('Tab');
    const focusedElementWithOutline = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return null;
      
      const styles = window.getComputedStyle(focused);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
      };
    });

    if (focusedElementWithOutline) {
      expect(focusedElementWithOutline.outlineWidth).not.toBe('0px');
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for proper ARIA labels on form controls
    const formControls = await page.$$('input, select, textarea');
    
    for (const control of formControls) {
      const ariaLabel = await control.getAttribute('aria-label');
      const ariaLabelledBy = await control.getAttribute('aria-labelledby');
      const id = await control.getAttribute('id');
      
      // Each form control should have either aria-label, aria-labelledby, or associated label
      const hasLabel = ariaLabel || ariaLabelledBy || (id && await page.$(`label[for="${id}"]`));
      
      expect(hasLabel).toBeTruthy();
    }

    // Check for proper heading hierarchy
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    const headingLevels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      headingLevels.push(level);
    }

    // Check that heading levels don't skip (e.g., h1 -> h3 without h2)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that content is still visible and accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check color contrast specifically
    const contrastResults = await new AxeBuilder({ page })
      .include('*')
      .withRules(['color-contrast'])
      .analyze();

    expect(contrastResults.violations).toEqual([]);
  });

  test('should be usable with screen reader', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for proper landmarks
    const landmarks = await page.$$('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
    expect(landmarks.length).toBeGreaterThan(0);

    // Check for skip links
    const skipLinks = await page.$$('a[href^="#"], [data-testid="skip-link"]');
    
    // If skip links exist, test they work
    if (skipLinks.length > 0) {
      const firstSkipLink = skipLinks[0];
      await firstSkipLink.click();
      
      const href = await firstSkipLink.getAttribute('href');
      if (href?.startsWith('#')) {
        const targetId = href.substring(1);
        const targetElement = await page.$(`#${targetId}`);
        expect(targetElement).toBeTruthy();
      }
    }

    // Check for descriptive text on interactive elements
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      const hasDescription = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
      expect(hasDescription).toBeTruthy();
    }
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that animations respect reduced motion
    const animatedElements = await page.$$('[class*="animate"], [style*="animation"], [style*="transition"]');
    
    for (const element of animatedElements) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          animationDuration: computed.animationDuration,
          transitionDuration: computed.transitionDuration,
        };
      });

      // Animations should be disabled or very short with reduced motion
      if (styles.animationDuration !== 'none') {
        const duration = parseFloat(styles.animationDuration);
        expect(duration).toBeLessThanOrEqual(0.1); // 100ms or less
      }
      
      if (styles.transitionDuration !== 'none') {
        const duration = parseFloat(styles.transitionDuration);
        expect(duration).toBeLessThanOrEqual(0.1); // 100ms or less
      }
    }
  });

  test('should be accessible on mobile devices', async ({ page, browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('/');
    await mobilePage.waitForLoadState('networkidle');

    // Run accessibility scan on mobile
    const mobileAccessibilityResults = await new AxeBuilder({ page: mobilePage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(mobileAccessibilityResults.violations).toEqual([]);

    // Check touch target sizes
    const touchTargets = await mobilePage.$$('button, a, input[type="button"], input[type="submit"]');
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      if (boundingBox) {
        // Touch targets should be at least 44x44 pixels (iOS) or 48x48 pixels (Android)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    await mobileContext.close();
  });

  test('should handle form validation accessibly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for forms with validation
    const forms = await page.$$('form');
    
    for (const form of forms) {
      const requiredInputs = await form.$$('input[required], select[required], textarea[required]');
      
      if (requiredInputs.length > 0) {
        // Try to submit form without filling required fields
        const submitButton = await form.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          // Check for accessible error messages
          const errorMessages = await page.$$('[role="alert"], .error, [aria-live="polite"], [aria-live="assertive"]');
          
          // Should have some form of error indication
          expect(errorMessages.length).toBeGreaterThan(0);
          
          // Check that required fields have proper aria-invalid
          for (const input of requiredInputs) {
            const ariaInvalid = await input.getAttribute('aria-invalid');
            const ariaDescribedBy = await input.getAttribute('aria-describedby');
            
            // Should either be marked invalid or have description
            expect(ariaInvalid === 'true' || ariaDescribedBy).toBeTruthy();
          }
        }
      }
    }
  });

  test('should have accessible loading states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });

    // Look for loading indicators
    const loadingIndicators = await page.$$('[role="progressbar"], [aria-live="polite"], .loading, [data-testid*="loading"]');
    
    // If loading states exist, they should be accessible
    for (const indicator of loadingIndicators) {
      const ariaLabel = await indicator.getAttribute('aria-label');
      const ariaLive = await indicator.getAttribute('aria-live');
      const role = await indicator.getAttribute('role');
      
      // Loading indicators should have proper ARIA attributes
      expect(ariaLabel || ariaLive || role).toBeTruthy();
    }
  });
});

// Import devices for mobile testing
const { devices } = require('@playwright/test');