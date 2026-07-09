/**
 * Provider CLI Commands
 */

import chalk from 'chalk';
import { 
  ProviderManager, 
  createProvider,
  OpenAIProvider,
  OllamaProvider
} from '@localcircus/provider-sdk';

export function createProviderCommands(program: any) {
  const providers = program.command('providers').description('AI Provider management');

  // List providers
  providers
    .command('list')
    .description('List configured providers')
    .action(async () => {
      const manager = new ProviderManager();

      // Register built-in providers
      const openai = createProvider('openai', { apiKey: process.env.OPENAI_API_KEY });
      const ollama = createProvider('ollama');
      
      manager.register(openai);
      manager.register(ollama);

      const list = manager.list();

      console.log(chalk.bold('\n🔌 AI Providers\n'));

      for (const provider of list) {
        const health = await provider.health?.();
        const statusColor = health?.status === 'ok' ? chalk.green : chalk.red;
        
        console.log(`  ${chalk.cyan(provider.name)} (${provider.id})`);
        console.log(`    Status: ${statusColor(health?.status || 'unknown')}`);
        if (health?.latency) {
          console.log(`    Latency: ${health.latency}ms`);
        }
        
        // List models
        try {
          const models = await provider.models?.();
          if (models && models.length > 0) {
            console.log(`    Models: ${models.slice(0, 3).map((m: any) => m.id).join(', ')}${models.length > 3 ? '...' : ''}`);
          }
        } catch {
          // Ignore model listing errors
        }
        console.log('');
      }
    });

  // Add provider
  providers
    .command('add <type>')
    .description('Add a provider')
    .option('-n, --name <name>', 'Provider name')
    .option('-k, --api-key <key>', 'API key')
    .option('-u, --url <url>', 'Base URL')
    .action(async (type: string, options: any) => {
      const manager = new ProviderManager();

      try {
        const provider = createProvider(type, {
          apiKey: options.apiKey || process.env.OPENAI_API_KEY,
          baseURL: options.url,
        });

        manager.register(provider);
        
        console.log(chalk.green(`\n✓ Added provider: ${provider.name}`));
        console.log(`  Type: ${type}`);
        console.log('');
      } catch (error) {
        console.log(chalk.red(`\n✗ Failed to add provider`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
      }
    });

  // Remove provider
  providers
    .command('remove <id>')
    .description('Remove a provider')
    .action(async (id: string) => {
      const manager = new ProviderManager();
      
      const removed = manager.unregister(id);
      
      if (removed) {
        console.log(chalk.green(`\n✓ Removed provider: ${id}`));
      } else {
        console.log(chalk.yellow(`\nProvider not found: ${id}`));
      }
      console.log('');
    });

  // Test provider
  providers
    .command('test <type>')
    .description('Test a provider connection')
    .option('-k, --api-key <key>', 'API key')
    .action(async (type: string, options: any) => {
      console.log(chalk.blue(`\n🔍 Testing ${type} provider...\n`));

      try {
        const provider = createProvider(type, {
          apiKey: options.apiKey || process.env.OPENAI_API_KEY,
        });

        const health = await provider.health?.();
        
        if (health?.status === 'ok') {
          console.log(chalk.green('✓ Provider is healthy'));
          if (health.latency) {
            console.log(`  Latency: ${health.latency}ms`);
          }
        } else {
          console.log(chalk.red('✗ Provider is not responding'));
        }

        // List models
        console.log(chalk.blue('\n📋 Available models:'));
        const models = await provider.models?.();
        if (models && models.length > 0) {
          for (const model of models.slice(0, 10)) {
            console.log(`  - ${model.id}`);
          }
          if (models.length > 10) {
            console.log(`  ... and ${models.length - 10} more`);
          }
        } else {
          console.log(chalk.gray('  No models listed'));
        }
        console.log('');

      } catch (error) {
        console.log(chalk.red(`\n✗ Provider test failed`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
        console.log('');
      }
    });

  // Set default provider
  providers
    .command('set-default <id>')
    .description('Set the default provider')
    .action(async (id: string) => {
      const manager = new ProviderManager();
      
      // Register providers
      manager.register(createProvider('openai', { apiKey: process.env.OPENAI_API_KEY }));
      manager.register(createProvider('ollama'));

      try {
        manager.setDefault(id);
        console.log(chalk.green(`\n✓ Default provider set to: ${id}`));
      } catch (error) {
        console.log(chalk.red(`\n✗ Failed to set default provider`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
      }
      console.log('');
    });

  return providers;
}
