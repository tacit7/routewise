#!/usr/bin/env node

// Quick Redis verification script
console.log('🔍 Testing Redis Integration...\n');

const testRedis = async () => {
  try {
    // Test server cache stats
    console.log('1. Checking cache stats...');
    const statsResponse = await fetch('http://localhost:3001/api/cache-stats');
    const stats = await statsResponse.json();
    console.log('Cache stats:', JSON.stringify(stats, null, 2));
    
    // Test geocoding (should create cache entry)
    console.log('\n2. Testing geocoding cache...');
    const city = 'Dallas';
    
    console.log(`First request for ${city}:`);
    const start1 = Date.now();
    const response1 = await fetch(`http://localhost:3001/api/test-geocoding/${city}`);
    const result1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`Response time: ${time1}ms`);
    console.log('Result:', result1);
    
    console.log(`\nSecond request for ${city} (should be cached):`);
    const start2 = Date.now();
    const response2 = await fetch(`http://localhost:3001/api/test-geocoding/${city}`);
    const result2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`Response time: ${time2}ms`);
    console.log('Result:', result2);
    
    if (time2 < time1 * 0.5) {
      console.log('\n✅ Cache appears to be working! Second request was faster.');
    } else {
      console.log('\n⚠️ Cache may not be working - times are similar.');
    }
    
    // Check Redis directly
    console.log('\n3. Checking Redis keys...');
    const { spawn } = require('child_process');
    const redis = spawn('redis-cli', ['keys', 'routewise:*']);
    
    redis.stdout.on('data', (data) => {
      const keys = data.toString().trim();
      if (keys) {
        console.log('Redis keys found:', keys);
        console.log('✅ Redis is storing cache entries!');
      } else {
        console.log('❌ No Redis keys found - may still be using memory cache');
      }
    });
    
    redis.on('close', (code) => {
      console.log('\n🎉 Redis test complete!');
      console.log('\nTo enable Redis:');
      console.log('1. Make sure Redis is running: brew services start redis');
      console.log('2. Restart your server to pick up the Redis environment variables');
      console.log('3. Run this test again to verify Redis integration');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testRedis();