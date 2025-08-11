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

## Command line

```bash
# migration database ( Code First )
$ npx prisma migrate dev --name init --schema=src/domain/migrations/schema.prisma

# seed data
$ npx prisma db seed --schema=src/domain/migrations/schema.prisma
```
