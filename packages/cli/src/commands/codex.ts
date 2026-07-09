/**
 * Codex Commands
 * 
 * CLI commands for documentation and knowledge management.
 */

import chalk from 'chalk';
import { createCodex } from '@localcircus/codex';

export function createCodexCommands(program: any) {
  const codex = program.command('codex').description('Codex documentation commands');

  // Search
  codex
    .command('search')
    .description('Search documentation and knowledge')
    .argument('<query>', 'Search query')
    .option('-t, --type <type>', 'Type: document, knowledge, note, all', 'all')
    .option('-l, --limit <limit>', 'Number of results', '10')
    .action(async (query: string, options: any) => {
      const cx = createCodex();

      console.log(chalk.blue(`\n🔍 Searching: "${query}"\n`));

      const results = cx.search({
        query,
        type: options.type as any,
        limit: parseInt(options.limit),
      });

      if (results.length === 0) {
        console.log(chalk.gray('No results found.\n'));
        return;
      }

      console.log(chalk.gray(`Found ${results.length} results:\n`));

      for (const result of results) {
        const icon = result.type === 'document' ? '📄' : 
                     result.type === 'knowledge' ? '💡' : '📝';
        console.log(`${icon} ${chalk.cyan(result.title)}`);
        console.log(`   ${chalk.gray(`[${result.type}]`)} ${result.snippet}`);
        console.log('');
      }
    });

  // List docs
  codex
    .command('docs')
    .description('List documentation')
    .option('-c, --category <category>', 'Filter by category')
    .option('-l, --limit <limit>', 'Number of results', '20')
    .action(async (options: any) => {
      const cx = createCodex();

      console.log(chalk.blue(`\n📚 Documentation\n`));

      const docs = cx.documents.list({
        category: options.category as any,
        draft: false,
        limit: parseInt(options.limit),
      });

      if (docs.length === 0) {
        console.log(chalk.gray('No documentation found.\n'));
        return;
      }

      for (const doc of docs) {
        const categoryColor = getCategoryColor(doc.category);
        console.log(`${chalk.cyan(doc.title)}`);
        console.log(`   ${chalk.gray(categoryColor)} | ${chalk.gray(doc.slug)}`);
        console.log(`   ${doc.metadata.description || ''}`);
        console.log('');
      }
    });

  // Get doc
  codex
    .command('doc')
    .description('Get documentation content')
    .argument('<slug>', 'Document slug')
    .action(async (slug: string) => {
      const cx = createCodex();

      const doc = cx.documents.getBySlug(slug);

      if (!doc) {
        console.log(chalk.red(`Document not found: ${slug}\n`));
        return;
      }

      console.log(chalk.blue(`\n📄 ${doc.title}\n`));
      console.log(chalk.gray(`Slug: ${doc.slug}`));
      console.log(chalk.gray(`Category: ${doc.category}`));
      console.log(chalk.gray(`Tags: ${doc.tags.join(', ')}`));
      console.log('');
      console.log(doc.content);
      console.log('');
    });

  // Knowledge commands
  codex
    .command('knowledge')
    .description('Manage knowledge entries')
    .action(() => {
      console.log(chalk.blue(`
📖 Knowledge Management

Commands:
  circus codex knowledge list    - List all knowledge entries
  circus codex knowledge add    - Add a knowledge entry
  circus codex knowledge search  - Search knowledge

Types:
  - concept: General concepts
  - fact: Factual information
  - procedure: Step-by-step guides
  - best-practice: Best practices
  - troubleshooting: Problem solutions
`));
    });

  codex
    .command('knowledge list')
    .description('List knowledge entries')
    .option('-t, --type <type>', 'Filter by type')
    .action(async (options: any) => {
      const cx = createCodex();

      console.log(chalk.blue(`\n💡 Knowledge Entries\n`));

      if (options.type) {
        const entries = cx.knowledge.getByType(options.type as any);
        for (const entry of entries) {
          console.log(`${chalk.cyan(entry.title)} ${chalk.gray(`[${entry.type}]`)}`);
          console.log(`   ${entry.content.slice(0, 100)}...`);
          console.log('');
        }
      } else {
        const stats = cx.knowledge.getStats();
        console.log(`Total Entries: ${chalk.cyan(stats.totalEntries.toString())}`);
        console.log(`Total Notes: ${chalk.cyan(stats.totalNotes.toString())}`);
        console.log(`Average Confidence: ${chalk.cyan(stats.averageConfidence.toFixed(2))}`);
        console.log('');
        console.log(chalk.gray('By Type:'));
        for (const [type, count] of Object.entries(stats.byType)) {
          console.log(`  ${type}: ${count}`);
        }
        console.log('');
      }
    });

  codex
    .command('knowledge search')
    .description('Search knowledge entries')
    .argument('<query>', 'Search query')
    .action(async (query: string) => {
      const cx = createCodex();

      console.log(chalk.blue(`\n💡 Searching knowledge: "${query}"\n`));

      const entries = cx.knowledge.search(query);

      if (entries.length === 0) {
        console.log(chalk.gray('No results found.\n'));
        return;
      }

      for (const entry of entries) {
        console.log(`${chalk.cyan(entry.title)} ${chalk.gray(`[${entry.type}]`)}`);
        console.log(`   ${entry.content.slice(0, 100)}...`);
        console.log('');
      }
    });

  // Categories
  codex
    .command('categories')
    .description('List documentation categories')
    .action(() => {
      const cx = createCodex();
      const categories = cx.getCategories();

      console.log(chalk.blue(`\n📂 Documentation Categories\n`));

      for (const cat of categories) {
        console.log(`${chalk.cyan(cat.name)}`);
        console.log(`   ${cat.description}`);
        console.log('');
      }
    });

  // Info
  codex
    .command('info')
    .description('Show Codex information')
    .action(() => {
      console.log(chalk.blue(`
📖 LocalCircus Codex

Documentation and knowledge management system.

Features:
  - Documentation with Markdown support
  - Knowledge entries and notes
  - Full-text search
  - Category organization
  - Tag-based navigation

Commands:
  circus codex search <query>    - Search all content
  circus codex docs              - List documentation
  circus codex doc <slug>        - Get document content
  circus codex knowledge         - Manage knowledge
  circus codex categories        - List categories

Examples:
  circus codex search "workflow"
  circus codex docs --category tutorials
  circus codex doc getting-started
`));
    });

  return codex;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'getting-started': 'Getting Started',
    'tutorials': 'Tutorials',
    'guides': 'Guides',
    'api-reference': 'API Reference',
    'specifications': 'Specifications',
    'architecture': 'Architecture',
    'patterns': 'Patterns',
    'troubleshooting': 'Troubleshooting',
    'contributing': 'Contributing',
  };
  return colors[category] || category;
}
