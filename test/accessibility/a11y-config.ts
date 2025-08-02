/**
 * Accessibility Testing Configuration for RouteWise
 * 
 * This file contains configuration and utilities for comprehensive
 * accessibility testing following WCAG 2.1 AA guidelines.
 */

import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.1 AA compliance configuration
export const WCAG_CONFIG = {
  // Tags to include in accessibility scans
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  
  // Rules to always include
  rules: [
    'color-contrast',
    'keyboard',
    'focus-order-semantics',
    'heading-order',
    'landmark-one-main',
    'page-has-heading-one',
    'region',
    'skip-link',
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr-value',
    'aria-valid-attr',
    'button-name',
    'form-field-multiple-labels',
    'input-button-name',
    'input-image-alt',
    'label',
    'link-name',
  ],
  
  // Custom rules for RouteWise
  customRules: [
    {
      id: 'route-form-labels',
      description: 'Route planning form fields must have accessible labels',
      selector: 'form input[name*="City"], form input[name*="location"]',
      evaluate: (node: HTMLElement) => {
        const label = node.getAttribute('aria-label') || 
                     node.getAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${node.id}"]`);
        return !!label;
      },
    },
    {
      id: 'poi-cards-accessible',
      description: 'POI cards must be keyboard accessible and have proper labels',
      selector: '[data-testid*="poi-card"]',
      evaluate: (node: HTMLElement) => {
        const isKeyboardAccessible = node.tabIndex >= 0 || 
                                   node.querySelector('button, a, [tabindex]');
        const hasLabel = node.getAttribute('aria-label') ||
                        node.querySelector('h1, h2, h3, h4, h5, h6');
        return !!(isKeyboardAccessible && hasLabel);
      },
    },
  ],
};

// Accessibility testing utilities
export class AccessibilityTestUtils {
  static async runFullAccessibilityScan(page: Page, options: {
    include?: string[];
    exclude?: string[];
    tags?: string[];
    rules?: string[];
  } = {}) {
    const builder = new AxeBuilder({ page });
    
    if (options.include) {
      builder.include(options.include);
    }
    
    if (options.exclude) {
      builder.exclude(options.exclude);
    }
    
    const tags = options.tags || WCAG_CONFIG.tags;
    const rules = options.rules || WCAG_CONFIG.rules;
    
    return await builder
      .withTags(tags)
      .withRules(rules)
      .analyze();
  }

  static async checkKeyboardNavigation(page: Page) {
    const results = {
      canNavigateWithTab: false,
      focusableElementCount: 0,
      focusTraps: [],
      skipLinks: [],
    };

    // Get all focusable elements
    const focusableElements = await page.$$eval(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      (elements) => elements.length
    );
    
    results.focusableElementCount = focusableElements;

    // Test tab navigation
    if (focusableElements > 0) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      results.canNavigateWithTab = !!focusedElement;
    }

    // Check for skip links
    const skipLinks = await page.$$eval(
      'a[href^="#"], [data-testid*="skip"]',
      (elements) => elements.map(el => ({
        text: el.textContent?.trim(),
        href: (el as HTMLAnchorElement).href,
      }))
    );
    
    results.skipLinks = skipLinks;

    return results;
  }

  static async checkColorContrast(page: Page) {
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    return {
      violations: contrastResults.violations,
      passes: contrastResults.passes,
      hasContrastIssues: contrastResults.violations.length > 0,
    };
  }

  static async checkFormAccessibility(page: Page) {
    const formResults = {
      formsWithoutLabels: [],
      formsWithoutFieldsets: [],
      formsWithoutSubmitButtons: [],
      requiredFieldsWithoutIndicators: [],
    };

    // Check forms for labels
    const formsWithoutLabels = await page.$$eval(
      'form',
      (forms) => {
        return forms.filter(form => {
          const inputs = form.querySelectorAll('input, select, textarea');
          return Array.from(inputs).some(input => {
            const hasLabel = input.getAttribute('aria-label') ||
                           input.getAttribute('aria-labelledby') ||
                           form.querySelector(`label[for="${input.id}"]`);
            return !hasLabel;
          });
        }).length;
      }
    );

    formResults.formsWithoutLabels = Array(formsWithoutLabels).fill(null);

    // Check for required field indicators
    const requiredWithoutIndicators = await page.$$eval(
      'input[required], select[required], textarea[required]',
      (elements) => {
        return elements.filter(el => {
          const hasIndicator = el.getAttribute('aria-required') === 'true' ||
                              el.getAttribute('aria-label')?.includes('required') ||
                              el.closest('label')?.textContent?.includes('*') ||
                              el.closest('label')?.textContent?.includes('required');
          return !hasIndicator;
        }).length;
      }
    );

    formResults.requiredFieldsWithoutIndicators = Array(requiredWithoutIndicators).fill(null);

    return formResults;
  }

  static async checkLandmarks(page: Page) {
    const landmarks = await page.$$eval(
      '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer',
      (elements) => elements.map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
      }))
    );

    return {
      landmarks,
      hasMain: landmarks.some(l => l.role === 'main' || l.tagName === 'MAIN'),
      hasNavigation: landmarks.some(l => l.role === 'navigation' || l.tagName === 'NAV'),
      hasBanner: landmarks.some(l => l.role === 'banner' || l.tagName === 'HEADER'),
      hasContentInfo: landmarks.some(l => l.role === 'contentinfo' || l.tagName === 'FOOTER'),
    };
  }

  static async checkHeadingStructure(page: Page) {
    const headings = await page.$$eval(
      'h1, h2, h3, h4, h5, h6',
      (elements) => elements.map(el => ({
        level: parseInt(el.tagName.charAt(1)),
        text: el.textContent?.trim(),
        id: el.id,
      }))
    );

    const issues = [];
    
    // Check for h1
    if (!headings.some(h => h.level === 1)) {
      issues.push('No h1 heading found on page');
    }

    // Check for skipped heading levels
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      const previousLevel = headings[i - 1].level;
      
      if (currentLevel > previousLevel && currentLevel - previousLevel > 1) {
        issues.push(`Heading level skipped: h${previousLevel} to h${currentLevel}`);
      }
    }

    return {
      headings,
      issues,
      hasProperStructure: issues.length === 0,
    };
  }

  static async checkAltText(page: Page) {
    const images = await page.$$eval(
      'img',
      (imgs) => imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        ariaLabel: img.getAttribute('aria-label'),
        ariaHidden: img.getAttribute('aria-hidden'),
        role: img.getAttribute('role'),
      }))
    );

    const imagesWithoutAlt = images.filter(img => 
      !img.alt && 
      !img.ariaLabel && 
      img.ariaHidden !== 'true' && 
      img.role !== 'presentation'
    );

    return {
      totalImages: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      hasAltTextIssues: imagesWithoutAlt.length > 0,
      imagesWithoutAltText: imagesWithoutAlt,
    };
  }

  static async checkAriaAttributes(page: Page) {
    const elementsWithAria = await page.$$eval(
      '[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-hidden], [aria-live], [role]',
      (elements) => elements.map(el => {
        const attrs: Record<string, string | null> = {};
        ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded', 'aria-hidden', 'aria-live', 'role'].forEach(attr => {
          attrs[attr] = el.getAttribute(attr);
        });
        return {
          tagName: el.tagName,
          attributes: attrs,
        };
      })
    );

    // Check for common ARIA issues
    const issues = [];
    
    elementsWithAria.forEach(el => {
      // Check for empty aria-label
      if (el.attributes['aria-label'] === '') {
        issues.push(`Empty aria-label on ${el.tagName}`);
      }
      
      // Check for invalid aria-labelledby references
      if (el.attributes['aria-labelledby']) {
        // This would need to be checked in the browser context
      }
    });

    return {
      elementsWithAria: elementsWithAria.length,
      issues,
      hasAriaIssues: issues.length > 0,
    };
  }

  static async generateAccessibilityReport(page: Page, pageUrl: string) {
    const fullScan = await this.runFullAccessibilityScan(page);
    const keyboardNav = await this.checkKeyboardNavigation(page);
    const colorContrast = await this.checkColorContrast(page);
    const forms = await this.checkFormAccessibility(page);
    const landmarks = await this.checkLandmarks(page);
    const headings = await this.checkHeadingStructure(page);
    const altText = await this.checkAltText(page);
    const aria = await this.checkAriaAttributes(page);

    const report = {
      url: pageUrl,
      timestamp: new Date().toISOString(),
      summary: {
        totalViolations: fullScan.violations.length,
        criticalIssues: fullScan.violations.filter(v => v.impact === 'critical').length,
        seriousIssues: fullScan.violations.filter(v => v.impact === 'serious').length,
        moderateIssues: fullScan.violations.filter(v => v.impact === 'moderate').length,
        minorIssues: fullScan.violations.filter(v => v.impact === 'minor').length,
      },
      scores: {
        overall: fullScan.violations.length === 0 ? 100 : Math.max(0, 100 - (fullScan.violations.length * 10)),
        keyboardNavigation: keyboardNav.canNavigateWithTab ? 100 : 0,
        colorContrast: colorContrast.hasContrastIssues ? 60 : 100,
        forms: forms.formsWithoutLabels.length === 0 ? 100 : 80,
        landmarks: landmarks.hasMain && landmarks.hasNavigation ? 100 : 80,
        headings: headings.hasProperStructure ? 100 : 70,
        altText: altText.hasAltTextIssues ? 60 : 100,
        aria: aria.hasAriaIssues ? 70 : 100,
      },
      details: {
        fullScan,
        keyboardNav,
        colorContrast,
        forms,
        landmarks,
        headings,
        altText,
        aria,
      },
    };

    return report;
  }
}

// Accessibility testing presets for different scenarios
export const A11Y_TEST_PRESETS = {
  // Minimal test for CI/CD pipelines
  minimal: {
    tags: ['wcag2a'],
    rules: ['color-contrast', 'button-name', 'link-name', 'label'],
  },
  
  // Standard WCAG 2.1 AA test
  standard: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: WCAG_CONFIG.rules,
  },
  
  // Comprehensive test including experimental rules
  comprehensive: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'experimental'],
    rules: [...WCAG_CONFIG.rules, 'focus-order-semantics', 'landmark-unique'],
  },
  
  // Form-specific accessibility test
  forms: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: ['label', 'form-field-multiple-labels', 'input-button-name', 'button-name'],
    include: ['form', 'input', 'select', 'textarea', 'button'],
  },
  
  // Mobile-specific accessibility test
  mobile: {
    tags: ['wcag2a', 'wcag2aa'],
    rules: ['color-contrast', 'touch-target', 'target-size'],
  },
};