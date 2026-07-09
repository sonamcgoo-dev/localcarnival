/**
 * Init Command
 * 
 * Initialize a new LocalCircus workspace.
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export function createInitCommand(program: any) {
  program
    .command('init')
    .description('Initialize a new LocalCircus workspace')
    .option('-n, --name <name>', 'Workspace name')
    .option('-p, --path <path>', 'Workspace path', '.')
    .option('-y, --yes', 'Skip prompts', false)
    .action(async (options: any) => {
      const name = options.name || path.basename(process.cwd());
      const workspacePath = path.resolve(options.path);

      console.log(chalk.blue(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🎪  Welcome to LocalCircus!                           ║
║                                                           ║
║     Your creative operating environment.                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

      // Check if directory exists
      if (fs.existsSync(workspacePath) && fs.readdirSync(workspacePath).length > 0) {
        console.log(chalk.yellow(`\n⚠️  Directory "${workspacePath}" is not empty.\n`));
        
        if (!options.yes) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: 'Continue anyway?',
              default: false,
            },
          ]);
          
          if (!proceed) {
            console.log(chalk.gray('\nCancelled.\n'));
            process.exit(0);
          }
        }
      }

      console.log(chalk.gray(`\nInitializing workspace: ${name}\n`));

      // Create workspace structure
      const dirs = [
        '.localcircus',
        '.localcircus/artifacts',
        '.localcircus/plugins',
        '.localcircus/data',
        '.localcircus/config',
        '.localcircus/logs',
        'workspace',
        'workspace/projects',
        'workspace/templates',
      ];

      for (const dir of dirs) {
        const fullPath = path.join(workspacePath, dir);
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(chalk.green(`  ✓ Created ${dir}/`));
      }

      // Create configuration
      const config = {
        version: '0.1.0',
        name: name,
        workspace: {
          path: 'workspace',
          projectsPath: 'workspace/projects',
        },
        zoo: {
          storagePath: '.localcircus/artifacts',
        },
        registry: {
          local: true,
          remote: [],
        },
        providers: {
          default: null,
          configured: [],
        },
      };

      const configPath = path.join(workspacePath, '.localcircus', 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green(`  ✓ Created .localcircus/config.json`));

      // Create .gitignore
      const gitignore = `# LocalCircus
.localcircus/
node_modules/
*.log
.DS_Store
`;
      const gitignorePath = path.join(workspacePath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, gitignore);
        console.log(chalk.green(`  ✓ Created .gitignore`));
      }

      // Create README
      const readme = `# ${name}

LocalCircus workspace.

## Getting Started

\`\`\`bash
# Start the web UI
circus web start

# Browse artifacts
circus zoo browse

# Create an artifact
circus forge create
\`\`\`
`;
      const readmePath = path.join(workspacePath, 'README.md');
      if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, readme);
        console.log(chalk.green(`  ✓ Created README.md`));
      }

      console.log(chalk.green(`
✅ Workspace initialized successfully!

Next steps:
  ${chalk.cyan('circus web start')}    Start the web UI
  ${chalk.cyan('circus zoo browse')}  Browse artifacts
  ${chalk.cyan('circus help')}        Show all commands

Documentation: https://localcircus.dev/docs
`));
    });

  return program;
}
