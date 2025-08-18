import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'mysql://root:password@localhost:3306/solar_db',
    },
  },
});

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const roleNames = ['Admin', 'NhieuXe', 'NhaXe', 'Driver', 'User'];
  const roleMap: Record<string, string> = {};
  let adminRoleId = '';

  console.log('📋 Seeding roles...');

  // First create the Admin role to get its ID
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Admin',
      createdAt: new Date(),
      createdBy: adminRoleId,
      isDeleted: false,
    },
  });
  adminRoleId = adminRole.id;
  roleMap['Admin'] = adminRoleId;
  console.log(`✅ Created/found Admin role: ${adminRoleId}`);

  // Create remaining roles
  for (const name of roleNames.filter((n) => n !== 'Admin')) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        id: randomUUID(),
        name,
        createdAt: new Date(),
        createdBy: adminRoleId,
        isDeleted: false,
      },
    });
    roleMap[name] = role.id;
    console.log(`✅ Created/found ${name} role: ${role.id}`);
  }

  // Update Admin role to use its own ID
  await prisma.role.update({
    where: { id: adminRoleId },
    data: {
      createdBy: adminRoleId,
    },
  });

  console.log('👤 Seeding admin user...');
  // Seed one Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'nguyentienphat9x@gmail.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'nguyentienphat9x@gmail.com',
      name: 'Super Admin',
      phoneNumber: '0369427565',
      passwordHash:
        '$2b$10$0JGdqXKzNsfWwTtzWT1MKuQniBND1RtVuBFy2wVf7l3sWz28XNnly',
      securityStamp: '94s2mktyex4',
      address: '123 Nguyen Van Linh, Q9, TP.HCM',
      roleId: adminRoleId,
      createdBy: adminRoleId,
      createdAt: new Date(),
      isDeleted: false,
    },
  });
  console.log(`✅ Created/found admin user: ${adminUser.email}`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((error: Error) => {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
  });
