import { test, expect } from '@playwright/test';
import { playAudit } from 'lighthouse/lighthouse-core/audits/audit';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

// Performance thresholds based on RouteWise requirements
const PERFORMANCE_THRESHOLDS = {
  performance: 90,  // Performance score >= 90
  accessibility: 90, // Accessibility score >= 90
  'best-practices': 85, // Best practices score >= 85
  seo: 80, // SEO score >= 80
  'first-contentful-paint': 1500, // FCP <= 1.5s
  'largest-contentful-paint': 2500, // LCP <= 2.5s
  'cumulative-layout-shift': 0.1, // CLS <= 0.1
  'speed-index': 3000, // Speed Index <= 3s
  'total-blocking-time': 300, // TBT <= 300ms
} as const;

test.describe('Performance Testing with Lighthouse', () => {
  test('should meet performance thresholds on home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Run Lighthouse audit
    const results = await runLighthouseAudit(page.url());
    
    // Check performance score
    expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(
      PERFORMANCE_THRESHOLDS.performance
    );
    
    // Check Core Web Vitals
    expect(results.audits['first-contentful-paint'].numericValue).toBeLessThanOrEqual(
      PERFORMANCE_THRESHOLDS['first-contentful-paint']
    );
    
    expect(results.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(
      PERFORMANCE_THRESHOLDS['largest-contentful-paint']
    );
    
    expect(results.audits['cumulative-layout-shift'].numericValue).toBeLessThanOrEqual(
      PERFORMANCE_THRESHOLDS['cumulative-layout-shift']
    );
    
    expect(results.audits['speed-index'].numericValue).toBeLessThanOrEqual(
      PERFORMANCE_THRESHOLDS['speed-index']
    );
    
    expect(results.audits['total-blocking-time'].numericValue).toBeLessThanOrEqual(
      PERFORMANCE_THRESHOLDS['total-blocking-time']
    );
  });

  test('should meet performance thresholds on route results page', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });
    
    // Navigate to route results page with mock data
    await page.goto('/route?start=San%20Francisco&end=Los%20Angeles');
    
    // Wait for route data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="route-overview"]', { timeout: 10000 });
    
    // Run Lighthouse audit
    const results = await runLighthouseAudit(page.url());
    
    // Check performance score (slightly lower threshold for data-heavy page)
    expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(80);
    
    // Check Core Web Vitals
    expect(results.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(3000);
    expect(results.audits['cumulative-layout-shift'].numericValue).toBeLessThanOrEqual(0.15);
  });

  test('should have good accessibility scores', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await runLighthouseAudit(page.url());
    
    // Check accessibility score
    expect(results.categories.accessibility.score * 100).toBeGreaterThanOrEqual(
      PERFORMANCE_THRESHOLDS.accessibility
    );
    
    // Check specific accessibility audits
    expect(results.audits['color-contrast'].score).toBe(1); // Perfect color contrast
    expect(results.audits['image-alt'].score).toBe(1); // All images have alt text
    expect(results.audits['heading-order'].score).toBe(1); // Proper heading hierarchy
    expect(results.audits['label'].score).toBe(1); // Form elements have labels
  });

  test('should follow best practices', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await runLighthouseAudit(page.url());
    
    // Check best practices score
    expect(results.categories['best-practices'].score * 100).toBeGreaterThanOrEqual(
      PERFORMANCE_THRESHOLDS['best-practices']
    );
    
    // Check specific best practice audits
    expect(results.audits['uses-https'].score).toBe(1); // Uses HTTPS
    expect(results.audits['no-vulnerable-libraries'].score).toBe(1); // No vulnerable libraries
    expect(results.audits['errors-in-console'].score).toBe(1); // No console errors
  });

  test('should have good SEO scores', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await runLighthouseAudit(page.url());
    
    // Check SEO score
    expect(results.categories.seo.score * 100).toBeGreaterThanOrEqual(
      PERFORMANCE_THRESHOLDS.seo
    );
    
    // Check specific SEO audits
    expect(results.audits['document-title'].score).toBe(1); // Has title
    expect(results.audits['meta-description'].score).toBe(1); // Has meta description
    expect(results.audits['is-crawlable'].score).toBe(1); // Is crawlable
  });

  test('should measure bundle size and resource loading', async ({ page }) => {
    // Monitor network requests
    const resourceSizes = new Map<string, number>();
    
    page.on('response', (response) => {
      const url = response.url();
      const contentLength = parseInt(response.headers()['content-length'] || '0');
      if (contentLength > 0) {
        resourceSizes.set(url, contentLength);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    for (const [url, size] of resourceSizes.entries()) {
      if (url.includes('.js')) {
        totalJSSize += size;
      } else if (url.includes('.css')) {
        totalCSSSize += size;
      }
    }
    
    // Check bundle size thresholds
    expect(totalJSSize).toBeLessThanOrEqual(500 * 1024); // JS bundle < 500KB
    expect(totalCSSSize).toBeLessThanOrEqual(100 * 1024); // CSS bundle < 100KB
    
    // Run Lighthouse audit for additional metrics
    const results = await runLighthouseAudit(page.url());
    
    // Check resource loading metrics
    expect(results.audits['unused-javascript'].score).toBeGreaterThanOrEqual(0.8);
    expect(results.audits['unused-css-rules'].score).toBeGreaterThanOrEqual(0.8);
    expect(results.audits['render-blocking-resources'].score).toBeGreaterThanOrEqual(0.8);
  });

  test('should perform well on mobile devices', async ({ page, browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
      // Simulate slower network
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps in bytes/s
      uploadThroughput: 750 * 1024 / 8, // 750 kbps in bytes/s
      latency: 40, // 40ms latency
    });
    
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('/');
    await mobilePage.waitForLoadState('networkidle');
    
    // Run Lighthouse audit with mobile configuration
    const results = await runLighthouseAudit(mobilePage.url(), {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675,
      },
    });
    
    // Mobile performance thresholds (slightly more lenient)
    expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(85);
    expect(results.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(4000);
    expect(results.audits['first-contentful-paint'].numericValue).toBeLessThanOrEqual(2000);
    
    await mobileContext.close();
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null;
    });
    
    if (initialMemory) {
      // Check that memory usage is reasonable
      expect(initialMemory.usedJSHeapSize).toBeLessThanOrEqual(50 * 1024 * 1024); // < 50MB
      
      // Check heap usage ratio
      const heapUsageRatio = initialMemory.usedJSHeapSize / initialMemory.totalJSHeapSize;
      expect(heapUsageRatio).toBeLessThanOrEqual(0.8); // < 80% heap usage
    }
    
    // Simulate navigation to check for memory leaks
    await page.goto('/route?start=Test&end=Test');
    await page.waitForTimeout(1000);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      // Memory should not have increased significantly
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryIncrease).toBeLessThanOrEqual(10 * 1024 * 1024); // < 10MB increase
    }
  });
});

// Helper function to run Lighthouse audit
async function runLighthouseAudit(url: string, options: any = {}) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const lighthouseOptions = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    ...options,
  };
  
  const config = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: options.formFactor || 'desktop',
      throttling: options.throttling || {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: options.formFactor === 'mobile',
        width: options.formFactor === 'mobile' ? 375 : 1350,
        height: options.formFactor === 'mobile' ? 667 : 940,
        deviceScaleFactor: options.formFactor === 'mobile' ? 2 : 1,
        disabled: false,
      },
    },
  };
  
  try {
    const results = await lighthouse(url, lighthouseOptions, config);
    await chrome.kill();
    
    if (!results) {
      throw new Error('Lighthouse audit failed');
    }
    
    return results.report ? JSON.parse(results.report) : results.lhr;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

// Import devices for mobile testing
const { devices } = require('@playwright/test');