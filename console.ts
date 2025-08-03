#!/usr/bin/env tsx

// RouteWise Console - Similar to rails console
// Usage: npx tsx console.ts

import { storage } from './server/storage';
import { interestsService } from './server/interests-service';
import { suggestedTripsService } from './server/suggested-trips-service';
import repl from 'repl';

console.log('🚀 RouteWise Console (TypeScript)');
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
  help() - Show this help
  user(id) - Get user by ID (default: 1)
  interests(userId) - Get user interests (default: user 1)
  .exit - Exit console
  `);
};

replServer.context.user = async (id: number = 1) => {
  return await storage.getUser(id);
};

replServer.context.interests = async (userId: number = 1) => {
  return await storage.getUserInterests(userId);
};

replServer.context.categories = async () => {
  return await storage.getAllInterestCategories();
};

replServer.context.pois = async () => {
  return await storage.getAllPois();
};