## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# run all tests - It will auto generate the database for testing
$ npm run test

# run unit test
$ npm run test:unit

# run the setup script to create and initialize the test database:
$ npm run setup:test-db

# run integration test
$ npm run test:integration

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Command line

```bash
# migration database ( Code First )
$ npx prisma migrate dev --name init --schema=src/domain/migrations/schema.prisma

# seed data
$ npx prisma db seed --schema=src/domain/migrations/schema.prisma
```
