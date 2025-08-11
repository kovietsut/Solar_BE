import { Prisma } from '@prisma/client';

const config: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'mysql://root:password@localhost:3306/solar_db',
    },
  },
};

export default config;
