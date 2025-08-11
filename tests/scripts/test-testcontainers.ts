import { testContainersManager } from '../config/testcontainers.config';

async function testTestContainers() {
  try {
    console.log('Testing Testcontainers setup...');

    // Start the container
    const config = await testContainersManager.startContainer();
    console.log('Container started successfully!');
    console.log('Database URL:', config.databaseUrl);

    // Test database connection
    const prismaClient = config.prismaClient;
    const result = await prismaClient.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', result);

    // Stop the container
    await testContainersManager.stopContainer();
    console.log('Container stopped successfully!');

    console.log('✅ Testcontainers test passed!');
  } catch (error) {
    console.error('❌ Testcontainers test failed:', error);
    process.exit(1);
  }
}

testTestContainers();
