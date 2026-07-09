/**
 * Artifact CLI Commands
 */

import chalk from 'chalk';
import { ArtifactManager, ArtifactBuilder, ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';

export function createArtifactCommands(program: any) {
  const artifacts = program.command('artifacts').description('Artifact management');

  // List artifacts
  artifacts
    .command('list')
    .description('List all artifacts')
    .option('-t, --type <type>', 'Filter by type')
    .action(async (options: any) => {
      const manager = new ArtifactManager();
      await manager.init();

      const list = options.type 
        ? await manager.list({ type: options.type as ArtifactType })
        : await manager.list();

      if (list.length === 0) {
        console.log(chalk.yellow('No artifacts found'));
        return;
      }

      console.log(chalk.bold(`\n📦 Artifacts (${list.length})\n`));
      
      for (const artifact of list) {
        console.log(`  ${chalk.cyan(artifact.name)} ${chalk.gray(`v${artifact.version}`)}`);
        console.log(`    Type: ${artifact.type}`);
        console.log(`    UUID: ${artifact.uuid}`);
        if (artifact.metadata.description) {
          console.log(`    ${artifact.metadata.description.slice(0, 60)}${artifact.metadata.description.length > 60 ? '...' : ''}`);
        }
        console.log('');
      }
    });

  // Get artifact
  artifacts
    .command('get <name-or-uuid>')
    .description('Get artifact details')
    .action(async (id: string) => {
      const manager = new ArtifactManager();
      await manager.init();

      // Try by UUID first, then by name
      let artifact = await manager.get(id);
      if (!artifact) {
        artifact = await manager.getByName(id);
      }

      if (!artifact) {
        console.log(chalk.red(`Artifact not found: ${id}`));
        return;
      }

      console.log(chalk.bold(`\n📦 ${artifact.displayName || artifact.name}\n`));
      console.log(`  UUID: ${chalk.cyan(artifact.uuid)}`);
      console.log(`  Name: ${artifact.name}`);
      console.log(`  Version: ${artifact.version}`);
      console.log(`  Type: ${artifact.type}`);
      
      if (artifact.metadata.description) {
        console.log(`  Description: ${artifact.metadata.description}`);
      }
      
      console.log(`  License: ${artifact.metadata.license}`);
      
      if (artifact.capabilities.length > 0) {
        console.log(`  Capabilities:`);
        for (const cap of artifact.capabilities) {
          console.log(`    - ${cap.id}${cap.version ? ` (${cap.version})` : ''}`);
        }
      }
      
      if (artifact.dependencies.length > 0) {
        console.log(`  Dependencies:`);
        for (const dep of artifact.dependencies) {
          console.log(`    - ${dep.reference.name} ${dep.versionRange}`);
        }
      }
      
      if (artifact.compatibility.platforms?.length) {
        console.log(`  Platforms: ${artifact.compatibility.platforms.join(', ')}`);
      }

      console.log('');
    });

  // Create artifact
  artifacts
    .command('create')
    .description('Create a new artifact')
    .requiredOption('-n, --name <name>', 'Artifact name')
    .requiredOption('-t, --type <type>', 'Artifact type')
    .requiredOption('-v, --version <version>', 'Artifact version')
    .option('-d, --description <description>', 'Description')
    .option('-l, --license <license>', 'License', 'MIT')
    .option('-p, --platform <platform>', 'Platform (can be repeated)', (v: string, prev: string[]) => [...(prev || []), v], [])
    .action(async (options: any) => {
      const builder = new ArtifactBuilder()
        .name(options.name)
        .type(options.type)
        .version(options.version)
        .license(options.license || 'MIT');

      if (options.description) {
        builder.description(options.description);
      }

      for (const platform of options.platform || []) {
        builder.platform(platform);
      }

      const manager = new ArtifactManager();
      await manager.init();

      try {
        const artifact = await manager.create(builder.artifact as any);
        console.log(chalk.green(`\n✓ Created artifact: ${artifact.name}`));
        console.log(`  UUID: ${chalk.cyan(artifact.uuid)}`);
        console.log(`  Version: ${artifact.version}`);
        console.log('');
      } catch (error) {
        console.log(chalk.red(`\n✗ Failed to create artifact`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
      }
    });

  // Delete artifact
  artifacts
    .command('delete <name-or-uuid>')
    .description('Delete an artifact')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (id: string, options: any) => {
      if (!options.yes) {
        console.log(chalk.yellow(`Delete artifact "${id}"? (y/N)`));
        // In a real CLI, we'd wait for input here
        return;
      }

      const manager = new ArtifactManager();
      await manager.init();

      try {
        await manager.delete(id);
        console.log(chalk.green(`✓ Deleted artifact: ${id}`));
      } catch (error) {
        console.log(chalk.red(`✗ Failed to delete artifact`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
      }
    });

  // Search artifacts
  artifacts
    .command('search <query>')
    .description('Search artifacts')
    .action(async (query: string) => {
      const manager = new ArtifactManager();
      await manager.init();

      const results = await manager.search(query);

      if (results.length === 0) {
        console.log(chalk.yellow(`No results for "${query}"`));
        return;
      }

      console.log(chalk.bold(`\n🔍 Results for "${query}" (${results.length})\n`));
      
      for (const artifact of results) {
        console.log(`  ${chalk.cyan(artifact.name)} ${chalk.gray(`v${artifact.version}`)}`);
        console.log(`    ${artifact.metadata.description?.slice(0, 60) || 'No description'}`);
        console.log('');
      }
    });

  // Stats
  artifacts
    .command('stats')
    .description('Show artifact statistics')
    .action(async () => {
      const manager = new ArtifactManager();
      await manager.init();

      const stats = await manager.stats();

      console.log(chalk.bold('\n📊 Artifact Statistics\n'));
      console.log(`  Total: ${stats.total}`);
      console.log(`  Total Size: ${formatBytes(stats.totalSize)}`);
      
      console.log('\n  By Type:');
      for (const [type, count] of Object.entries(stats.byType)) {
        console.log(`    ${type}: ${count}`);
      }
      console.log('');
    });

  return artifacts;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
