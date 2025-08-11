# Testing with Testcontainers

This project uses Testcontainers to provide isolated, disposable test databases for integration and E2E tests.

## Benefits

- **Isolation**: Each test run gets its own database container
- **No Conflicts**: Multiple developers can run tests simultaneously without conflicts
- **Automatic Cleanup**: Containers are automatically removed when tests complete
- **No Manual Setup**: No need to create/cleanup test databases manually
- **Consistent Environment**: Tests run against the same database version and configuration

## How It Works

1. **Container Management**: The `TestContainersManager` singleton manages MySQL containers
2. **Automatic Startup**: Containers start automatically when tests begin
3. **Migration Execution**: Prisma migrations run automatically on the test database
4. **Automatic Cleanup**: Containers stop and remove themselves after tests complete

## Test Types

### Unit Tests (`tests/unit/`)

- No database access
- Use mocked dependencies
- Fast execution

### Integration Tests (`tests/integration/`)

- Use Testcontainers database
- Test repository and service logic
- Medium execution time

### E2E Tests (`tests/e2e/`)

- Use Testcontainers database
- Test full HTTP request/response cycle
- Slower execution time

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run user-related tests (unit + integration + e2e)
npm run test:user

# Test Testcontainers setup
npm run test:testcontainers
```

### Testcontainers Configuration

- **File**: `tests/config/testcontainers.config.ts`
- **Database**: MySQL 8.0
- **Credentials**: testuser/testpassword
- **Database**: testdb
- **Port**: Dynamically assigned

### Jest Configuration

- **Unit Tests**: 60 second timeout
- **Integration Tests**: 60 second timeout
- **E2E Tests**: 60 second timeout

## Environment Variables

The following environment variables are used if `TEST_DATABASE_URL` is not set:

- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_TEST_NAME`

### Container Startup Issues

- Ensure Docker is running
- Check available disk space
- Verify Docker permissions

### Migration Issues

- Ensure Prisma schema is up to date
- Check migration files in `src/domain/migrations/`

### Timeout Issues

- Increase Jest timeout in package.json
- Check container logs for startup delays

## Migration

- ✅ `tests/config/testcontainers.config.ts` (new)
- ✅ `npm run test:testcontainers` (new)

## Architecture

```
TestContainersManager (Singleton)
├── startContainer() → TestContainerConfig
├── stopContainer() → void
├── getPrismaClient() → PrismaClient
└── getDatabaseUrl() → string

TestContainerConfig
├── container: StartedTestContainer
├── databaseUrl: string
└── prismaClient: PrismaClient
```
