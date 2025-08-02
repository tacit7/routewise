#!/usr/bin/env node

/**
 * Performance Test Runner for RouteWise
 * 
 * This script coordinates running various performance tests including:
 * - Lighthouse audits for Core Web Vitals
 * - Load testing with K6
 * - Memory usage monitoring
 * - Bundle size analysis
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const RESULTS_DIR = 'test-results/performance';

async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create results directory:', error);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function runLighthouseTests() {
  console.log('\n🔍 Running Lighthouse Performance Tests...');
  
  try {
    await runCommand('npx', ['playwright', 'test', 'test/performance/lighthouse.spec.ts', '--reporter=json'], {
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: `${RESULTS_DIR}/lighthouse-results.json` }
    });
    console.log('✅ Lighthouse tests completed');
  } catch (error) {
    console.error('❌ Lighthouse tests failed:', error.message);
    throw error;
  }
}

async function runLoadTests() {
  console.log('\n📊 Running Load Tests...');
  
  const testScenarios = [
    {
      name: 'baseline',
      description: 'Baseline load test with gradual ramp-up',
      script: 'test/performance/load-testing.js',
    },
    {
      name: 'spike',
      description: 'Spike test with sudden load increase',
      script: 'test/performance/load-testing.js',
      options: '--env SCENARIO=spike',
    },
  ];
  
  for (const scenario of testScenarios) {
    console.log(`\n  Running ${scenario.name} test: ${scenario.description}`);
    
    try {
      const args = [
        'run',
        scenario.script,
        '--out', `json=${RESULTS_DIR}/k6-${scenario.name}-results.json`,
        '--out', `influxdb=http://localhost:8086/k6` // Optional: InfluxDB output
      ];
      
      if (scenario.options) {
        args.push(...scenario.options.split(' '));
      }
      
      await runCommand('k6', args);
      console.log(`✅ ${scenario.name} test completed`);
    } catch (error) {
      console.error(`❌ ${scenario.name} test failed:`, error.message);
      // Continue with other tests
    }
  }
}

async function analyzeBundleSize() {
  console.log('\n📦 Analyzing Bundle Size...');
  
  try {
    // Build the project
    await runCommand('npm', ['run', 'build']);
    
    // Analyze bundle
    const distPath = 'dist';
    const files = await fs.readdir(distPath);
    const bundleAnalysis = {
      timestamp: new Date().toISOString(),
      files: [],
      totalSize: 0,
    };
    
    for (const file of files) {
      const filePath = path.join(distPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        bundleAnalysis.files.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
        });
        bundleAnalysis.totalSize += stats.size;
      }
    }
    
    bundleAnalysis.totalSizeKB = Math.round(bundleAnalysis.totalSize / 1024);
    bundleAnalysis.totalSizeMB = Math.round(bundleAnalysis.totalSize / 1024 / 1024 * 100) / 100;
    
    // Save bundle analysis
    await fs.writeFile(
      `${RESULTS_DIR}/bundle-analysis.json`,
      JSON.stringify(bundleAnalysis, null, 2)
    );
    
    console.log(`✅ Bundle analysis completed. Total size: ${bundleAnalysis.totalSizeKB}KB`);
    
    // Check bundle size thresholds
    const jsFiles = bundleAnalysis.files.filter(f => f.name.endsWith('.js'));
    const cssFiles = bundleAnalysis.files.filter(f => f.name.endsWith('.css'));
    
    const totalJSSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
    const totalCSSSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
    
    console.log(`  JS Bundle Size: ${Math.round(totalJSSize / 1024)}KB`);
    console.log(`  CSS Bundle Size: ${Math.round(totalCSSSize / 1024)}KB`);
    
    // Warnings for large bundles
    if (totalJSSize > 500 * 1024) {
      console.warn(`⚠️  JS bundle size (${Math.round(totalJSSize / 1024)}KB) exceeds 500KB threshold`);
    }
    
    if (totalCSSSize > 100 * 1024) {
      console.warn(`⚠️  CSS bundle size (${Math.round(totalCSSSize / 1024)}KB) exceeds 100KB threshold`);
    }
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    throw error;
  }
}

async function generatePerformanceReport() {
  console.log('\n📋 Generating Performance Report...');
  
  try {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        lighthouse: 'Check lighthouse-results.json for detailed metrics',
        loadTesting: 'Check k6-*-results.json for load test results',
        bundleSize: 'Check bundle-analysis.json for bundle size analysis',
      },
      thresholds: {
        performance: {
          'Core Web Vitals': {
            'First Contentful Paint': '< 1.5s',
            'Largest Contentful Paint': '< 2.5s',
            'Cumulative Layout Shift': '< 0.1',
            'First Input Delay': '< 100ms',
          },
          'Bundle Size': {
            'JavaScript': '< 500KB',
            'CSS': '< 100KB',
          },
          'Load Testing': {
            'Response Time (95th percentile)': '< 2s',
            'Error Rate': '< 10%',
          },
        },
      },
    };
    
    // Try to read and summarize results
    try {
      const bundleAnalysis = JSON.parse(
        await fs.readFile(`${RESULTS_DIR}/bundle-analysis.json`, 'utf8')
      );
      reportData.summary.bundleSize = `Total: ${bundleAnalysis.totalSizeKB}KB`;
    } catch (e) {
      // Bundle analysis file may not exist
    }
    
    await fs.writeFile(
      `${RESULTS_DIR}/performance-report.json`,
      JSON.stringify(reportData, null, 2)
    );
    
    console.log(`✅ Performance report generated at ${RESULTS_DIR}/performance-report.json`);
    
  } catch (error) {
    console.error('❌ Failed to generate performance report:', error.message);
  }
}

async function checkServerHealth() {
  console.log('\n🏥 Checking Server Health...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error(`Server health check failed: ${response.status}`);
    }
    
    const health = await response.json();
    console.log('✅ Server is healthy:', health);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  
  console.log('🚀 Starting RouteWise Performance Test Suite');
  console.log('=' .repeat(50));
  
  try {
    // Ensure results directory exists
    await ensureResultsDir();
    
    // Check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      process.exit(1);
    }
    
    // Run performance tests based on command line arguments
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    
    switch (testType) {
      case 'lighthouse':
        await runLighthouseTests();
        break;
        
      case 'load':
        await runLoadTests();
        break;
        
      case 'bundle':
        await analyzeBundleSize();
        break;
        
      case 'all':
      default:
        await runLighthouseTests();
        await analyzeBundleSize();
        await runLoadTests();
        break;
    }
    
    // Generate final report
    await generatePerformanceReport();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 Performance test suite completed successfully!');
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📁 Results saved to: ${RESULTS_DIR}/`);
    
  } catch (error) {
    console.error('\n💥 Performance test suite failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Performance tests interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Performance tests terminated');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export default main;