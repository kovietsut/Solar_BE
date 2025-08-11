# Testing Guide

This directory contains comprehensive tests for the Solar Backend application, following NestJS testing best practices and the project's testing standards.

## Test Structure

The tests are organized into three main categories:

### 1. Unit Tests (`tests/unit/`)

- **Purpose**: Test individual components in isolation
- **Location**: `tests/unit/`
- **Scope**: Controllers, Services, and individual methods
- **Dependencies**: Mocked external dependencies
- **Speed**: Fastest execution

### 2. Integration Tests (`tests/integration/`)

- **Purpose**: Test component interactions and database operations
- **Location**: `tests/integration/`
- **Scope**: Repository operations, service interactions
- **Dependencies**: Real database connections
- **Speed**: Medium execution speed

### 3. End-to-End Tests (`tests/e2e/`)

- **Purpose**: Test complete HTTP request flows
- **Location**: `tests/e2e/`
- **Scope**: Full application stack, HTTP endpoints
- **Dependencies**: Complete application with real database
- **Speed**: Slowest execution

## User Module Tests

The user module has comprehensive test coverage across all three testing levels:

### Unit Tests

- **`tests/unit/user/user.service.spec.ts`**: Tests UserService business logic
- **`tests/unit/user/user.controller.spec.ts`**: Tests UserController HTTP handling

### Integration Tests

- **`tests/integration/user/user.repository.integration.spec.ts`**: Tests UserRepository database operations

### E2E Tests

- **`tests/e2e/user/user.e2e-spec.ts`**: Tests complete user API endpoints

## Running Tests

### Prerequisites

- Node.js and npm installed
- Database configured and accessible
- Environment variables set up

### Available Test Scripts

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- user.service.spec.ts

# Run tests matching pattern
npm test -- --testPathPattern=user
```

### Running User Module Tests Specifically

```bash
# Run all user module tests
npm test -- --testPathPattern=user

# Run only user unit tests
npm run test:unit -- --testPathPattern=user

# Run only user integration tests
npm run test:integration -- --testPathPattern=user

# Run only user E2E tests
npm run test:e2e -- --testPathPattern=user
```

### Using the Test Runner Script

```bash
# Make the script executable
chmod +x tests/scripts/run-user-tests.ts

# Run the script
npx ts-node tests/scripts/run-user-tests.ts
```

## Test Configuration

### Jest Configuration

Tests use Jest as the testing framework with the following configuration:

- **Test Environment**: Node.js
- **Coverage**: Istanbul/nyc
- **Timeout**: 30 seconds for integration/E2E tests
- **Setup**: Automatic test database management

### Database Configuration

- **Test Database**: Separate test database instance
- **Cleanup**: Automatic cleanup between tests
- **Isolation**: Each test runs in isolation

## Writing Tests

### Test Naming Convention

- **Unit Tests**: `*.spec.ts`
- **Integration Tests**: `*.integration.spec.ts`
- **E2E Tests**: `*.e2e-spec.ts`

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange - Set up test data and mocks
      const inputData = {
        /* test data */
      };
      const expectedResult = {
        /* expected result */
      };

      // Act - Execute the method being tested
      const actualResult = await component.methodName(inputData);

      // Assert - Verify the results
      expect(actualResult).toEqual(expectedResult);
    });
  });
});
```

### Mocking Guidelines

- **Unit Tests**: Mock all external dependencies
- **Integration Tests**: Use real database, mock external services
- **E2E Tests**: Use real application stack

## Test Data Management

### Test Fixtures

- Create test data in `beforeEach` hooks
- Clean up test data in `afterEach` hooks
- Use unique identifiers to avoid conflicts

### Database Cleanup

```typescript
afterEach(async () => {
  await prismaService.user.deleteMany({
    where: { email: { contains: 'test@example.com' } },
  });
});
```

## Common Testing Patterns

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  await expect(asyncFunction()).resolves.toEqual(expectedResult);
});
```

### Testing Error Cases

```typescript
it('should throw error for invalid input', async () => {
  await expect(asyncFunction(invalidInput)).rejects.toThrow(Error);
});
```

### Testing HTTP Responses

```typescript
it('should return correct HTTP response', async () => {
  const response = await request(app.getHttpServer()).get('/users').expect(200);

  expect(response.body.data).toBeDefined();
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify database is running
   - Check environment variables
   - Ensure test database exists

2. **Test Timeout Errors**

   - Increase Jest timeout for slow tests
   - Check for hanging database connections
   - Verify cleanup is working properly

3. **Mock Issues**
   - Ensure mocks are properly configured
   - Check import paths
   - Verify mock implementations

### Debug Mode

Run tests with verbose output:

```bash
npm test -- --verbose --detectOpenHandles
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Assertion**: Test one thing per test case
4. **Proper Setup/Teardown**: Clean up resources properly
5. **Realistic Data**: Use realistic test data
6. **Error Testing**: Test both success and failure scenarios
7. **Performance**: Keep tests fast and efficient

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: 70%+ coverage

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the established test patterns
3. Ensure proper cleanup and isolation
4. Add appropriate error case testing
5. Update this documentation if needed
