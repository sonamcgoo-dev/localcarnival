/**
 * Registry Commands
 * 
 * CLI commands for the artifact registry.
 */

import chalk from 'chalk';
import { createRegistry } from '@localcircus/registry';

export function createRegistryCommands(program: any) {
  const registry = program.command('registry').description('Registry commands');

  // Search
  registry
    .command('search')
    .description('Search the registry')
    .argument('<query>', 'Search query')
    .option('-t, --type <type>', 'Filter by type')
    .option('-c, --category <category>', 'Filter by category')
    .option('-l, --limit <limit>', 'Number of results', '20')
    .action(async (query: string, options: any) => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n🔍 Searching: "${query}"\n`));

      const results = reg.search({
        text: query,
        type: options.type as any,
        category: options.category,
      }, parseInt(options.limit));

      if (results.length === 0) {
        console.log(chalk.gray('No results found.\n'));
        return;
      }

      console.log(chalk.gray(`Found ${results.length} results:\n`));

      for (const result of results) {
        const entry = result.entry;
        console.log(`${entry.icon} ${chalk.cyan(entry.name)} ${chalk.gray(`v${entry.version}`)}`);
        console.log(`   ${entry.shortDescription}`);
        console.log(`   ${chalk.gray(`Category: ${entry.category}`)} | ${chalk.gray(`Rating: ${entry.rating.toFixed(1)}`)}`);
        console.log('');
      }
    });

  // List
  registry
    .command('list')
    .description('List artifacts in registry')
    .option('-t, --type <type>', 'Filter by type')
    .option('-c, --category <category>', 'Filter by category')
    .option('-l, --limit <limit>', 'Number of results', '20')
    .action(async (options: any) => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n📦 Registry Artifacts\n`));

      let entries;
      if (options.type) {
        entries = reg.getByType(options.type as any);
      } else if (options.category) {
        entries = reg.getByCategory(options.category);
      } else {
        entries = reg.getAll();
      }

      const limit = parseInt(options.limit);
      const shown = entries.slice(0, limit);

      if (shown.length === 0) {
        console.log(chalk.gray('No artifacts in registry.\n'));
        return;
      }

      console.log(chalk.gray(`Showing ${shown.length} of ${entries.length} artifacts:\n`));

      for (const entry of shown) {
        console.log(`${entry.icon} ${chalk.cyan(entry.name)} ${chalk.gray(`v${entry.version}`)}`);
        console.log(`   ${entry.shortDescription}`);
        console.log(`   ${chalk.gray(`Downloads: ${entry.downloads}`)} | ${chalk.gray(`Rating: ${entry.rating.toFixed(1)}`)}`);
        console.log('');
      }
    });

  // Trending
  registry
    .command('trending')
    .description('Get trending artifacts')
    .option('-l, --limit <limit>', 'Number of results', '10')
    .action(async (options: any) => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n🔥 Trending Artifacts\n`));

      const trending = reg.getTrending(parseInt(options.limit));

      if (trending.length === 0) {
        console.log(chalk.gray('No trending artifacts.\n'));
        return;
      }

      for (let i = 0; i < trending.length; i++) {
        const entry = trending[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        console.log(`${medal} ${entry.icon} ${chalk.cyan(entry.name)}`);
        console.log(`   ${entry.shortDescription}`);
        console.log(`   ${chalk.gray(`Downloads: ${entry.downloads}`)}`);
        console.log('');
      }
    });

  // Recent
  registry
    .command('recent')
    .description('Get recently added artifacts')
    .option('-l, --limit <limit>', 'Number of results', '10')
    .action(async (options: any) => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n🆕 Recently Added\n`));

      const recent = reg.getRecent(parseInt(options.limit));

      if (recent.length === 0) {
        console.log(chalk.gray('No recent artifacts.\n'));
        return;
      }

      for (const entry of recent) {
        const date = new Date(entry.publishedAt).toLocaleDateString();
        console.log(`${entry.icon} ${chalk.cyan(entry.name)} ${chalk.gray(`(${date})`)}`);
        console.log(`   ${entry.shortDescription}`);
        console.log('');
      }
    });

  // Info
  registry
    .command('info')
    .description('Get artifact info')
    .argument('<name>', 'Artifact name or UUID')
    .action(async (name: string) => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n📋 Artifact Info\n`));

      const entry = reg.getByName(name) || reg.get(name);

      if (!entry) {
        console.log(chalk.red(`Artifact not found: ${name}\n`));
        return;
      }

      console.log(`${entry.icon} ${chalk.bold(entry.displayName)}`);
      console.log(`${chalk.gray(`by ${entry.publisher.name || 'Unknown'}`)}`);
      console.log('');
      console.log(`${chalk.gray('Description:')} ${entry.shortDescription}`);
      console.log(`${chalk.gray('Type:')} ${entry.type}`);
      console.log(`${chalk.gray('Version:')} ${entry.version}`);
      console.log(`${chalk.gray('Category:')} ${entry.category}`);
      console.log(`${chalk.gray('Tags:')} ${entry.tags.join(', ')}`);
      console.log(`${chalk.gray('Rating:')} ${entry.rating.toFixed(1)} (${entry.ratingCount} ratings)`);
      console.log(`${chalk.gray('Downloads:')} ${entry.downloads}`);
      console.log(`${chalk.gray('Published:')} ${new Date(entry.publishedAt).toLocaleDateString()}`);
      console.log(`${chalk.gray('Trust Level:')} ${entry.trustLevel}`);
      if (entry.deprecated) {
        console.log(chalk.yellow(`${chalk.gray('Deprecated:')} ${entry.deprecationMessage}`));
      }
      console.log('');
    });

  // Stats
  registry
    .command('stats')
    .description('Get registry statistics')
    .action(async () => {
      const reg = createRegistry();
      
      console.log(chalk.blue(`\n📊 Registry Statistics\n`));

      const entries = reg.getAll();
      
      console.log(`Total Artifacts: ${chalk.cyan(entries.length.toString())}`);
      
      // By type
      const byType: Record<string, number> = {};
      for (const entry of entries) {
        byType[entry.type] = (byType[entry.type] || 0) + 1;
      }

      console.log(chalk.gray('\nBy Type:'));
      for (const [type, count] of Object.entries(byType)) {
        console.log(`  ${type}: ${count}`);
      }

      // Total downloads
      const totalDownloads = entries.reduce((sum, e) => sum + e.downloads, 0);
      console.log(chalk.gray(`\nTotal Downloads: ${totalDownloads}`));

      // Average rating
      const avgRating = entries.length > 0
        ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length
        : 0;
      console.log(chalk.gray(`Average Rating: ${avgRating.toFixed(2)}`));
      
      console.log('');
    });

  return registry;
}
