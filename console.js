#!/usr/bin/env node

// RouteWise Console - Similar to rails console
// Usage: node console.js

import { storage } from './server/storage.js';
import { interestsService } from './server/interests-service.js';
import { suggestedTripsService } from './server/suggested-trips-service.js';
import repl from 'repl';

console.log('🚀 RouteWise Console');
console.log('Available objects:');
console.log('  - storage: Database storage layer');
console.log('  - interestsService: Interest management service');
console.log('  - suggestedTripsService: Trip suggestions service');
console.log('');
console.log('Example commands:');
console.log('  await storage.getAllPois()');
console.log('  await storage.getUserInterests(1)');
console.log('  await interestsService.getInterestCategories()');
console.log('');

// Start REPL with context
const replServer = repl.start({
  prompt: 'routewise> ',
  useColors: true,
  useGlobal: true,
});

// Add context to REPL
replServer.context.storage = storage;
replServer.context.interestsService = interestsService;
replServer.context.suggestedTripsService = suggestedTripsService;

// Helper functions
replServer.context.help = () => {
  console.log(`
Available commands:
  
Database:
  await storage.getAllPois()
  await storage.getUserInterests(userId)
  await storage.getAllInterestCategories()
  await storage.getUser(userId)
  
Services:
  await interestsService.getInterestCategories()
  await interestsService.getUserInterests(userId)
  await suggestedTripsService.getSuggestedTripsWithRateLimit(userId, limit)
  
Utilities:
  .help - Show this help
  .exit - Exit console
  `);
};

replServer.context.user = async (id = 1) => {
  return await storage.getUser(id);
};

replServer.context.interests = async (userId = 1) => {
  return await storage.getUserInterests(userId);
};

// Enable top-level await
replServer.setupHistory('.routewise_history', () => {});