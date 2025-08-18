import { Prisma } from '@prisma/client';

/**
 * Prisma client configuration for the Solar API
 */
const config: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  errorFormat: 'pretty',
};

export default config;
