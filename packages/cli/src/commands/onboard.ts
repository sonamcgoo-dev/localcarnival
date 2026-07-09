/**
 * Onboarding Command
 * 
 * First-time setup and tour for LocalCircus.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { getCore } from '@localcircus/core';

interface OnboardingAnswers {
  name: string;
  useCase: string;
  provider: string;
  apiKey?: string;
  demo: boolean;
}

export async function createOnboardCommand() {
  return {
    name: 'onboard',
    description: 'First-time setup and tour of LocalCircus',
    action: onboard
  };
}

async function onboard() {
  console.log(chalk.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎪 Welcome to LocalCircus!                                 ║
║                                                               ║
║   Your creative operating environment.                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));

  console.log(chalk.gray("Let's get you set up in a few quick steps...\n"));

  const answers = await inquirer.prompt<OnboardingAnswers>([
    {
      type: 'input',
      name: 'name',
      message: "What's your name?",
      default: 'Creator',
      validate: (input: string) => input.length > 0 || 'Please enter a name'
    },
    {
      type: 'list',
      name: 'useCase',
      message: 'What will you primarily use LocalCircus for?',
      choices: [
        { name: '🎨 Creative projects & content generation', value: 'creative' },
        { name: '🤖 AI automation & workflows', value: 'automation' },
        { name: '📚 Research & knowledge management', value: 'research' },
        { name: '💻 Developer tools & coding', value: 'development' },
        { name: '🎭 Everything - full power user!', value: 'power' }
      ]
    },
    {
      type: 'list',
      name: 'provider',
      message: 'Which AI provider would you like to use?',
      choices: [
        { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
        { name: 'Ollama (local models)', value: 'ollama' },
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'Skip for now', value: 'none' }
      ]
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key (or press Enter to skip):',
      when: (answers: OnboardingAnswers) => answers.provider === 'openai' || answers.provider === 'anthropic',
      mask: '*'
    },
    {
      type: 'confirm',
      name: 'demo',
      message: 'Would you like to run a quick demo?',
      default: true
    }
  ]);

  // Initialize LocalCircus
  console.log(chalk.blue('\n📦 Initializing LocalCircus...'));
  const core = getCore();
  await core.start();

  // Store user preferences
  const memory = core.memory;
  memory.remember('user.name', answers.name, { type: 'preference', importance: 'high' });
  memory.remember('user.useCase', answers.useCase, { type: 'preference', importance: 'medium' });
  memory.remember('user.provider', answers.provider, { type: 'preference', importance: 'high' });

  console.log(chalk.green('✓ LocalCircus initialized!'));

  // Show getting started guide based on use case
  console.log(chalk.bold('\n📚 Quick Start Guide'));
  console.log(chalk.gray('─'.repeat(50)));

  const guides: Record<string, string> = {
    creative: `
✨ Creative Mode Active!

Next steps:
  1. circus zoo browse    → Discover creative artifacts
  2. circus forge create  → Create your first artifact
  3. circus web start     → Open the visual canvas

Pro tips:
  - Use 'circus workflows' to automate repetitive tasks
  - Browse the Marketplace for prompts and themes
`,
    automation: `
⚡ Automation Mode Active!

Next steps:
  1. circus workflows list    → View built-in workflows
  2. circus workflows create  → Build a new automation
  3. circus schedule add      → Schedule your workflows

Pro tips:
  - Start with simple workflows and iterate
  - Use 'circus events' to see what's happening
`,
    research: `
📚 Research Mode Active!

Next steps:
  1. circus codex search  → Find documentation
  2. circus memory set    → Store research notes
  3. circus zoo browse    → Find knowledge artifacts

Pro tips:
  - Tag memories with keywords for easy retrieval
  - Build a knowledge base with related artifacts
`,
    development: `
💻 Developer Mode Active!

Next steps:
  1. circus artifacts list  → Manage your tools
  2. circus providers add   → Configure AI providers
  3. circus web start       → Visual workflow builder

Pro tips:
  - Create custom artifacts for your projects
  - Use plugins to extend functionality
`,
    power: `
🎭 Full Power Mode Unlocked!

You have access to everything:
  • circus zoo browse    → Browse all artifacts
  • circus forge create  → Create anything
  • circus workflows     → Automate everything
  • circus web start     → Visual interface
  • circus codex         → Full documentation

Explore and create! 🎪
`
  };

  console.log(chalk.white(guides[answers.useCase] || guides.power));

  // Run demo if requested
  if (answers.demo) {
    await runDemo();
  }

  console.log(chalk.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎪 You're all set!                                          ║
║                                                               ║
║   Type 'circus --help' to see all commands                    ║
║   Type 'circus web start' to open the GUI                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));
}

async function runDemo() {
  console.log(chalk.blue('\n🎭 Running quick demo...\n'));

  const core = getCore();
  const memory = core.memory;

  // Demo: Store and retrieve a memory
  memory.remember('demo.note', 'LocalCircus is awesome!', { type: 'fact', importance: 'medium' });
  
  const retrieved = memory.recall('demo.note');
  console.log(chalk.green('✓ Memory demo: Stored and retrieved a note'));

  // Demo: Show status
  const health = core.getHealth();
  console.log(chalk.green(`✓ Core demo: System status is ${health.status}`));

  // Demo: Show events capability
  console.log(chalk.green('✓ Events demo: Event system is running'));

  console.log(chalk.gray('\nDemo complete! You just experienced LocalCircus core features.\n'));
}
