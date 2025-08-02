import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },  // Stay at 10 users for 1m
    { duration: '30s', target: 25 }, // Ramp up to 25 users over 30s
    { duration: '2m', target: 25 },  // Stay at 25 users for 2m
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30s
    { duration: '2m', target: 50 },  // Stay at 50 users for 2m
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],              // Custom error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:3001';

// Test data
const testCities = [
  'San Francisco',
  'Los Angeles',
  'New York',
  'Chicago',
  'Miami',
  'Seattle',
  'Austin',
  'Boston',
];

export default function () {
  // Test home page load
  testHomePage();
  
  // Test health check endpoint
  testHealthCheck();
  
  // Test places autocomplete
  testPlacesAutocomplete();
  
  // Test route planning workflow
  testRouteWorkflow();
  
  // Sleep between iterations
  sleep(1);
}

function testHomePage() {
  const response = http.get(`${BASE_URL}/`);
  
  const success = check(response, {
    'home page status is 200': (r) => r.status === 200,
    'home page loads in <2s': (r) => r.timings.duration < 2000,
    'home page contains expected content': (r) => r.body.includes('RouteWise'),
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/api/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check has correct structure': (r) => {
      const body = JSON.parse(r.body);
      return body.status === 'ok' && body.services;
    },
    'health check responds quickly': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testPlacesAutocomplete() {
  const randomCity = testCities[Math.floor(Math.random() * testCities.length)];
  const searchTerm = randomCity.substring(0, 3); // First 3 characters
  
  const response = http.get(`${BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(searchTerm)}`);
  
  const success = check(response, {
    'autocomplete status is 200': (r) => r.status === 200,
    'autocomplete returns predictions': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body.predictions);
    },
    'autocomplete responds quickly': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testRouteWorkflow() {
  // Step 1: Get API key
  let response = http.get(`${BASE_URL}/api/maps-key`);
  
  let success = check(response, {
    'maps key status is 200': (r) => r.status === 200,
    'maps key has correct structure': (r) => {
      const body = JSON.parse(r.body);
      return 'apiKey' in body;
    },
  });
  
  if (!success) {
    errorRate.add(true);
    return;
  }
  
  // Step 2: Test route calculation (if endpoint exists)
  const startCity = testCities[Math.floor(Math.random() * testCities.length)];
  const endCity = testCities[Math.floor(Math.random() * testCities.length)];
  
  if (startCity !== endCity) {
    response = http.get(`${BASE_URL}/route?start=${encodeURIComponent(startCity)}&end=${encodeURIComponent(endCity)}`);
    
    success = check(response, {
      'route page loads': (r) => r.status === 200,
      'route page loads quickly': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  }
}

// Spike testing scenario
export function spike() {
  return {
    stages: [
      { duration: '10s', target: 100 }, // Immediate spike to 100 users
      { duration: '1m', target: 100 },  // Stay at 100 users for 1m
      { duration: '10s', target: 0 },   // Immediate drop to 0 users
    ],
    thresholds: {
      http_req_duration: ['p(95)<5000'], // More lenient during spike
      http_req_failed: ['rate<0.2'],     // Higher error tolerance during spike
    },
  };
}

// Stress testing scenario
export function stress() {
  return {
    stages: [
      { duration: '1m', target: 50 },   // Ramp up to 50 users
      { duration: '2m', target: 100 },  // Ramp up to 100 users
      { duration: '2m', target: 150 },  // Ramp up to 150 users
      { duration: '2m', target: 200 },  // Ramp up to 200 users
      { duration: '5m', target: 200 },  // Stay at 200 users
      { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<10000'], // Very lenient for stress test
      http_req_failed: ['rate<0.3'],      // Higher error tolerance
    },
  };
}

// Volume testing scenario  
export function volume() {
  return {
    stages: [
      { duration: '5m', target: 300 },  // Ramp up to 300 users
      { duration: '10m', target: 300 }, // Stay at 300 users for 10m
      { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<15000'], // Very lenient for volume test
      http_req_failed: ['rate<0.4'],      // High error tolerance
    },
  };
}

// Authentication load testing
export function authLoad() {
  const users = Array.from({ length: 100 }, (_, i) => ({
    username: `testuser${i}`,
    password: 'password123',
  }));
  
  return function() {
    const user = users[Math.floor(Math.random() * users.length)];
    
    // Test login
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const loginSuccess = check(loginResponse, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login responds quickly': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!loginSuccess);
    
    if (loginResponse.status === 200) {
      // Test authenticated endpoint
      const cookies = loginResponse.cookies;
      const meResponse = http.get(`${BASE_URL}/api/auth/me`, {
        cookies: cookies,
      });
      
      const meSuccess = check(meResponse, {
        'me endpoint status is 200': (r) => r.status === 200,
        'me endpoint responds quickly': (r) => r.timings.duration < 1000,
      });
      
      errorRate.add(!meSuccess);
    }
    
    sleep(1);
  };
}

// Teardown function
export function teardown(data) {
  console.log(`
Load Test Summary:
- Total requests: ${data.http_reqs}
- Failed requests: ${data.http_req_failed}
- Average response time: ${data.http_req_duration.avg}ms
- 95th percentile response time: ${data.http_req_duration['p(95)']}ms
- Error rate: ${(data.errors || 0) * 100}%
  `);
}

// Setup function
export function setup() {
  console.log('Starting load test against:', BASE_URL);
  
  // Verify server is running
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Server not available at ${BASE_URL}`);
  }
  
  return {
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
  };
}