#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DatabaseCommand {
  name: string;
  description: string;
  command: string;
}

const commands: DatabaseCommand[] = [
  {
    name: 'generate',
    description: 'Generate Prisma client',
    command: 'npm run db:generate',
  },
  {
    name: 'push',
    description: 'Push schema changes to database',
    command: 'npm run db:push',
  },
  {
    name: 'migrate',
    description: 'Deploy migrations to production',
    command: 'npm run db:migrate',
  },
  {
    name: 'migrate:dev',
    description: 'Create and apply migration in development',
    command: 'npm run db:migrate:dev',
  },
  {
    name: 'seed',
    description: 'Seed the database with initial data',
    command: 'npm run db:seed',
  },
  {
    name: 'seed:prod',
    description: 'Seed the database for production',
    command: 'npm run db:seed:prod',
  },
  {
    name: 'reset',
    description: 'Reset database and reseed',
    command: 'npm run db:reset',
  },
  {
    name: 'setup',
    description: 'Complete database setup (generate + migrate + seed)',
    command: 'npm run db:setup',
  },
  {
    name: 'studio',
    description: 'Open Prisma Studio',
    command: 'npm run db:studio',
  },
];

async function executeCommand(command: string): Promise<void> {
  console.log(`🚀 Executing: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Command completed successfully\n');
  } catch (error) {
    console.error(`❌ Command failed: ${error}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log('📊 Solar API Database Management Tool\n');
  console.log('Available commands:');
  commands.forEach((cmd) => {
    console.log(`  ${cmd.name.padEnd(15)} - ${cmd.description}`);
  });
  console.log('\nUsage: ts-node scripts/database.ts <command>');
  console.log('Example: ts-node scripts/database.ts setup\n');
}

async function main(): Promise<void> {
  const commandName = process.argv[2];

  if (!commandName || commandName === 'help' || commandName === '--help') {
    showHelp();
    return;
  }

  const selectedCommand = commands.find((cmd) => cmd.name === commandName);

  if (!selectedCommand) {
    console.error(`❌ Unknown command: ${commandName}`);
    showHelp();
    process.exit(1);
  }

  await executeCommand(selectedCommand.command);
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
