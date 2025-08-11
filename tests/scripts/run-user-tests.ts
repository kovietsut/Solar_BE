#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { join } from 'path';

const testDir = __dirname;

console.log('🧪 Running User Module Tests...\n');

// Run unit tests
console.log('📋 Running Unit Tests...');
try {
  execSync('npm run test:unit -- --testPathPattern=user', {
    cwd: join(testDir, '../..'),
    stdio: 'inherit',
  });
  console.log('✅ Unit tests completed successfully\n');
} catch (error) {
  console.error('❌ Unit tests failed\n');
  process.exit(1);
}

// Run integration tests
console.log('🔗 Running Integration Tests...');
try {
  execSync('npm run test:integration -- --testPathPattern=user', {
    cwd: join(testDir, '../..'),
    stdio: 'inherit',
  });
  console.log('✅ Integration tests completed successfully\n');
} catch (error) {
  console.error('❌ Integration tests failed\n');
  process.exit(1);
}

// Run E2E tests
console.log('🌐 Running E2E Tests...');
try {
  execSync('npm run test:e2e -- --testPathPattern=user', {
    cwd: join(testDir, '../..'),
    stdio: 'inherit',
  });
  console.log('✅ E2E tests completed successfully\n');
} catch (error) {
  console.error('❌ E2E tests failed\n');
  process.exit(1);
}

console.log('🎉 All User Module Tests Completed Successfully!');
