/**
 * Forge Commands
 * 
 * CodeForge CLI commands for artifact creation.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { createCodeForge } from '@localcircus/codeforge';
import { ArtifactType } from '@localcircus/artifact-sdk';

export function createForgeCommands(program: any) {
  const forge = program.command('forge').description('CodeForge artifact commands');

  // Create artifact
  forge
    .command('create')
    .description('Create a new artifact')
    .option('-t, --type <type>', 'Artifact type')
    .option('-n, --name <name>', 'Artifact name')
    .option('-v, --version <version>', 'Initial version', '1.0.0')
    .option('-d, --description <description>', 'Description')
    .option('-l, --license <license>', 'License', 'MIT')
    .option('-i, --interactive', 'Interactive mode')
    .action(async (options: any) => {
      const codeforge = createCodeForge();

      console.log(chalk.blue(`\n🔨 LocalCircus CodeForge\n`));

      let name = options.name;
      let type = options.type;
      let version = options.version;
      let description = options.description;
      let license = options.license;

      // Interactive mode
      if (options.interactive || (!name || !type)) {
        console.log(chalk.gray('Starting interactive wizard...\n'));

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'What type of artifact?',
            choices: [
              { name: '🤖 AI Agent', value: 'agent' },
              { name: '🔗 Workflow', value: 'workflow' },
              { name: '🔧 Tool', value: 'tool' },
              { name: '🎭 Plugin', value: 'plugin' },
              { name: '🦄 Model', value: 'model' },
              { name: '📦 Extension', value: 'extension' },
              { name: '🖥️ MCP Server', value: 'mcp-server' },
              { name: '🔌 API Connector', value: 'api-connector' },
              { name: '📊 Dataset', value: 'dataset' },
              { name: '💬 Prompt Pack', value: 'prompt-pack' },
            ],
          },
          {
            type: 'input',
            name: 'name',
            message: 'Artifact name:',
            validate: (input: string) => {
              if (!/^[a-z][a-z0-9-]*$/.test(input)) {
                return 'Name must be lowercase with hyphens only';
              }
              return true;
            },
          },
          {
            type: 'input',
            name: 'version',
            message: 'Version:',
            default: '1.0.0',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
          },
          {
            type: 'input',
            name: 'license',
            message: 'License:',
            default: 'MIT',
          },
        ]);

        type = answers.type;
        name = answers.name;
        version = answers.version;
        description = answers.description;
        license = answers.license;
      }

      if (!name || !type) {
        console.log(chalk.red('Error: Name and type are required'));
        console.log(chalk.gray('Use --interactive or specify -n and -t\n'));
        process.exit(1);
      }

      try {
        // Create artifact
        console.log(chalk.gray(`\nCreating ${type} "${name}"...`));

        const dna = await codeforge.create({
          name,
          type: type as ArtifactType,
          version,
          description,
          license,
        });

        // Validate
        const report = codeforge.validate(dna);

        console.log(chalk.green(`\n✅ Created ${type} "${name}"!`));
        console.log(`   UUID: ${chalk.cyan(dna.uuid)}`);
        console.log(`   Version: ${chalk.cyan(dna.version)}`);

        if (!report.valid) {
          console.log(chalk.yellow('\n⚠️ Validation warnings:'));
          for (const error of report.errors) {
            console.log(`   - ${error.message}`);
          }
        }

        console.log(chalk.gray('\nNext steps:'));
        console.log(`   circus forge publish   # Publish to registry`);
        console.log(`   circus artifacts list  # View artifacts\n`);

      } catch (error) {
        console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
      }
    });

  // Validate artifact
  forge
    .command('validate')
    .description('Validate an artifact')
    .argument('<name>', 'Artifact name or UUID')
    .action(async (name: string) => {
      const codeforge = createCodeForge();

      console.log(chalk.blue(`\n🔍 Validating artifact...\n`));

      // In a real implementation, this would load the artifact
      console.log(chalk.gray(`Artifact: ${name}`));
      console.log(chalk.yellow('(Validation requires loading artifact from storage)\n'));
    });

  // Publish artifact
  forge
    .command('publish')
    .description('Publish an artifact to registry')
    .option('-n, --name <name>', 'Artifact name')
    .option('-f, --force', 'Force publish (skip validation)')
    .action(async (options: any) => {
      const codeforge = createCodeForge();

      console.log(chalk.blue(`\n📤 Publishing artifact...\n`));

      if (!options.name) {
        console.log(chalk.red('Error: Artifact name required (-n)\n'));
        process.exit(1);
      }

      console.log(chalk.gray(`Publishing: ${options.name}`));
      console.log(chalk.yellow('(Publishing requires artifact in storage)\n'));
    });

  // List templates
  forge
    .command('templates')
    .description('List available artifact templates')
    .action(() => {
      const codeforge = createCodeForge();
      const templates = codeforge.getTemplates();

      console.log(chalk.blue(`\n📋 Available Templates\n`));

      for (const template of templates) {
        console.log(`  ${chalk.cyan(template.type.padEnd(15))} ${template.description}`);
      }

      console.log('');
    });

  // Info
  forge
    .command('info')
    .description('Show CodeForge information')
    .action(() => {
      console.log(chalk.blue(`
🔨 LocalCircus CodeForge

Artifact creation, validation, and publishing.

Commands:
  create       Create a new artifact
  validate     Validate an artifact
  publish      Publish to registry
  templates    List templates

Examples:
  circus forge create -t agent -n my-agent --interactive
  circus forge templates
`));
    });

  return forge;
}
