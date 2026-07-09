/**
 * Desktop/UI Commands
 * 
 * Desktop app commands for LocalCircus.
 */

import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

export function createWebCommands(program: any) {
  const desktop = program.command('desktop').description('Desktop app commands');

  // Start desktop app
  desktop
    .command('start')
    .description('Launch LocalCircus desktop app')
    .action(async () => {
      console.log(chalk.blue(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎪 Starting LocalCircus Desktop...                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `));

      // Check if electron is available
      const electronPath = path.join(__dirname, '../../desktop');
      const desktopPkg = path.join(electronPath, 'package.json');
      
      if (!fs.existsSync(desktopPkg)) {
        console.log(chalk.yellow('Desktop package not found. Installing...'));
        console.log(chalk.gray('Run: npm install && npm run build'));
        return;
      }

      // Launch with electron
      try {
        const { exec } = require('child_process');
        exec('npx electron .', { 
          cwd: electronPath,
          stdio: 'inherit' 
        });
      } catch (error) {
        console.log(chalk.red('Could not start desktop app.'));
        console.log(chalk.gray('Make sure Electron is installed: npm install electron'));
        console.log(chalk.gray('Then run: npx electron .'));
      }
    });

  // Show info
  desktop
    .command('info')
    .description('Show desktop app information')
    .action(() => {
      console.log(chalk.bold('\n🎪 LocalCircus Desktop\n'));
      console.log(`  Version: 0.1.0`);
      console.log(`  Type:    Desktop Application`);
      console.log(`  Platform: ${process.platform}`);
      console.log('');
      console.log(chalk.gray('Features:'));
      console.log('  • Big Top Canvas - Visual workflow builder');
      console.log('  • System Tray - Runs in background');
      console.log('  • Local Memory - All data stored locally');
      console.log('  • Artifact Zoo - Browse and manage artifacts');
      console.log('  • Artifact Forge - Create new artifacts');
      console.log('  • Live Chat - AI assistant integration');
      console.log('');
    });

  return desktop;
}
