import { testContainersManager } from './testcontainers.config';

/**
 * Global teardown for all Jest test suites
 * Ensures proper cleanup of test containers and resources
 */
export default async function globalTeardown(): Promise<void> {
  console.log('Global test teardown: Cleaning up test resources...');

  try {
    // Ensure all test containers are stopped
    if (testContainersManager.isContainerRunning()) {
      console.log('Stopping test containers...');
      await testContainersManager.stopContainer();
      console.log('Test containers stopped successfully');
    }
  } catch (error) {
    console.error('Error during global teardown:', error);
  }

  console.log('Global test teardown completed');
}
