#!/usr/bin/env node

/**
 * LocalCircus CLI
 * 
 * Command-line interface for LocalCircus.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCore, getCore } from '@localcircus/core';
import { createArtifactCommands } from './commands/artifacts';
import { createWorkflowCommands } from './commands/workflows';
import { createProviderCommands } from './commands/providers';
import { createWebCommands } from './commands/web';

// Version
const VERSION = '0.1.0';

// Create CLI
const program = new Command();

// Configure
program
  .name('circus')
  .description('LocalCircus - Local-first creative operating environment')
  .version(VERSION);

// Global options
program
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet output');

// Core commands
program
  .command('start')
  .description('Start LocalCircus')
  .action(async () => {
    console.log(chalk.blue('🎪 Starting LocalCircus...'));
    
    const core = getCore();
    await core.start();
    
    const health = core.getHealth();
    console.log(chalk.green('✓ LocalCircus started'));
    console.log(chalk.gray(`  ID: ${core.id}`));
    console.log(chalk.gray(`  Status: ${health.status}`));
  });

// Status command
program
  .command('status')
  .description('Show LocalCircus status')
  .action(() => {
    const core = getCore();
    const health = core.getHealth();
    
    console.log(chalk.bold('\n🎪 LocalCircus Status\n'));
    console.log(`  Status: ${health.status === 'healthy' ? chalk.green('●') : chalk.yellow('●')} ${health.status}`);
    console.log(`  Uptime: ${formatUptime(health.uptime)}`);
    console.log(`  Memory: ${health.memory.working} working, ${health.memory.semantic} semantic`);
    console.log(`  Tasks: ${health.scheduler.activeTasks}/${health.scheduler.totalTasks} active`);
    console.log('');
  });

// Memory commands
const memoryCmd = program.command('memory').description('Memory management');

memoryCmd
  .command('set <key> <value>')
  .description('Store a value in memory')
  .action((key, value) => {
    const core = getCore();
    const parsed = tryParseJSON(value) ?? value;
    core.remember(key, parsed, { type: 'context' });
    console.log(chalk.green(`✓ Stored "${key}"`));
  });

memoryCmd
  .command('get <key>')
  .description('Retrieve a value from memory')
  .action((key) => {
    const core = getCore();
    const value = core.recall(key);
    
    if (value === undefined) {
      console.log(chalk.yellow(`"${key}" not found`));
    } else {
      console.log(JSON.stringify(value, null, 2));
    }
  });

memoryCmd
  .command('list')
  .description('List all memory entries')
  .action(() => {
    const core = getCore();
    const memory = core.getMemory();
    const entries = memory.recallAll();
    
    console.log(chalk.bold('\n📝 Memory Entries\n'));
    
    if (entries.length === 0) {
      console.log(chalk.gray('  No entries'));
    } else {
      for (const entry of entries) {
        console.log(`  ${chalk.cyan(entry.key)}: ${JSON.stringify(entry.value).slice(0, 50)}`);
      }
    }
    console.log('');
  });

memoryCmd
  .command('clear')
  .description('Clear all memory')
  .action(() => {
    const core = getCore();
    core.getMemory().clear();
    console.log(chalk.green('✓ Memory cleared'));
  });

// Scheduler commands
const schedulerCmd = program.command('schedule').description('Task scheduling');

schedulerCmd
  .command('add <name> <interval>')
  .description('Add a scheduled task (interval in ms)')
  .action((name, interval) => {
    const core = getCore();
    const taskId = core.schedule(
      () => console.log(`Task "${name}" executed`),
      { name, interval: parseInt(interval) }
    );
    console.log(chalk.green(`✓ Task "${name}" scheduled (ID: ${taskId})`));
  });

schedulerCmd
  .command('list')
  .description('List scheduled tasks')
  .action(() => {
    const core = getCore();
    const tasks = core.getScheduler().listTasks();
    
    console.log(chalk.bold('\n📅 Scheduled Tasks\n'));
    
    if (tasks.length === 0) {
      console.log(chalk.gray('  No tasks'));
    } else {
      for (const task of tasks) {
        const status = task.enabled ? chalk.green('●') : chalk.gray('○');
        console.log(`  ${status} ${chalk.cyan(task.name)} (${task.id.slice(0, 8)})`);
        console.log(chalk.gray(`     Runs: ${task.runCount} | Errors: ${task.errorCount}`));
      }
    }
    console.log('');
  });

// Event commands
const eventsCmd = program.command('events').description('Event management');

eventsCmd
  .command('list')
  .description('List recent events')
  .action(() => {
    const core = getCore();
    const history = core.getEventBus().getHistory().slice(-20);
    
    console.log(chalk.bold('\n📡 Recent Events\n'));
    
    if (history.length === 0) {
      console.log(chalk.gray('  No events'));
    } else {
      for (const event of history) {
        console.log(`  ${chalk.gray(formatTime(event.timestamp))} ${chalk.magenta(event.type)}`);
      }
    }
    console.log('');
  });

// Version command
program
  .command('version')
  .description('Show version')
  .action(() => {
    console.log(`LocalCircus CLI v${VERSION}`);
  });

// Help
program.on('--help', () => {
  console.log(chalk.bold('\n📚 Examples\n'));
  console.log(`  ${chalk.cyan('circus start')}              Start LocalCircus`);
  console.log(`  ${chalk.cyan('circus status')}             Show status`);
  console.log(`  ${chalk.cyan('circus memory set k v')}     Store value`);
  console.log(`  ${chalk.cyan('circus memory get k')}       Get value`);
  console.log(`  ${chalk.cyan('circus schedule add t 1000')} Add task`);
  console.log('');
});

// Helper functions
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

function tryParseJSON(str: string): any | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Add SDK commands
createArtifactCommands(program);
createWorkflowCommands(program);
createProviderCommands(program);
createWebCommands(program);

// Parse and execute
program.parse(process.argv);
