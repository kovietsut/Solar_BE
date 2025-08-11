# Package.json Test Scripts

Add these scripts to your `package.json` file to enable easy test execution:

## Recommended Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "jest --testPathPattern=tests/e2e",
    "test:user": "jest --testPathPattern=user",
    "test:user:unit": "jest --testPathPattern=tests/unit/user",
    "test:user:integration": "jest --testPathPattern=tests/integration/user",
    "test:user:e2e": "jest --testPathPattern=tests/e2e/user"
  }
}
```

## Jest Configuration

Ensure your `jest.config.js` or `jest` section in `package.json` includes:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/../tests/jest.setup.ts'],
  testMatch: [
    '<rootDir>/../tests/**/*.spec.ts',
    '<rootDir>/../tests/**/*.integration.spec.ts',
    '<rootDir>/../tests/**/*.e2e-spec.ts',
  ],
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
    '^tests/(.*)$': '<rootDir>/../tests/$1',
  },
};
```

## Environment Variables

Set up these environment variables for testing:

```bash
# Test Database
TEST_DATABASE_URL=mysql://username:password@localhost:3306/solar_test
DATABASE_TEST_NAME=solar_test

# Test Configuration
NODE_ENV=test
JWT_SECRET=test-secret-key
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Specific Test Types

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e
```

### User Module Specific

```bash
# Run all user module tests
npm run test:user

# Run user unit tests only
npm run test:user:unit

# Run user integration tests only
npm run test:user:integration

# Run user E2E tests only
npm run test:user:e2e
```

### Advanced Usage

```bash
# Run tests matching specific pattern
npm test -- --testPathPattern=create

# Run tests with verbose output
npm test -- --verbose

# Run tests with specific timeout
npm test -- --testTimeout=60000

# Run tests in parallel
npm test -- --maxWorkers=4
```

## Test Execution Order

Tests are executed in the following order by default:

1. **Unit Tests** - Fastest, most isolated
2. **Integration Tests** - Medium speed, database operations
3. **E2E Tests** - Slowest, full application stack

## Performance Tips

- Use `--maxWorkers=1` for integration tests to avoid database conflicts
- Use `--runInBand` for debugging to ensure sequential execution
- Use `--detectOpenHandles` to identify hanging connections
- Use `--forceExit` as a last resort for cleanup issues
