/**
 * Workflow CLI Commands
 */

import chalk from 'chalk';
import { WorkflowBuilder, WorkflowExecutor } from '@localcircus/workflow-sdk';

export function createWorkflowCommands(program: any) {
  const workflows = program.command('workflows').description('Workflow (Act) management');

  // Run workflow
  workflows
    .command('run <workflow>')
    .description('Run a workflow')
    .option('-i, --input <json>', 'Input as JSON')
    .action(async (workflowName: string, options: any) => {
      // Build example workflow
      const workflow = new WorkflowBuilder()
        .name(workflowName)
        .version('1.0.0')
        .manual()
        .action('log', 'log', { message: `Starting workflow: ${workflowName}` })
        .action('delay', 'delay', { ms: 100 })
        .action('log', 'log', { message: `Workflow ${workflowName} completed` })
        .build();

      const executor = new WorkflowExecutor();

      console.log(chalk.blue(`\n🎭 Running workflow: ${workflowName}\n`));

      try {
        const inputs = options.input ? JSON.parse(options.input) : {};
        const run = await executor.execute(workflow, inputs);

        if (run.status === 'completed') {
          console.log(chalk.green('✓ Workflow completed'));
          console.log(`  Duration: ${run.completedAt! - run.startedAt}ms`);
          
          if (Object.keys(run.outputs).length > 0) {
            console.log('\n  Outputs:');
            for (const [key, value] of Object.entries(run.outputs)) {
              console.log(`    ${key}: ${JSON.stringify(value)}`);
            }
          }
        } else {
          console.log(chalk.red(`✗ Workflow failed: ${run.error}`));
        }
        console.log('');
      } catch (error) {
        console.log(chalk.red(`✗ Error running workflow`));
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
      }
    });

  // List runs
  workflows
    .command('runs')
    .description('List workflow runs')
    .action(async () => {
      const executor = new WorkflowExecutor();
      const runs = executor.listRuns();

      if (runs.length === 0) {
        console.log(chalk.yellow('No workflow runs'));
        return;
      }

      console.log(chalk.bold(`\n🎭 Workflow Runs (${runs.length})\n`));

      for (const run of runs) {
        const statusColor = run.status === 'completed' ? chalk.green : 
                           run.status === 'failed' ? chalk.red : chalk.yellow;
        const duration = run.completedAt ? `${run.completedAt - run.startedAt}ms` : 'running';

        console.log(`  ${statusColor(run.status.padEnd(12))} ${chalk.cyan(run.workflowId)}`);
        console.log(`    ID: ${run.id.slice(0, 8)}...`);
        console.log(`    Duration: ${duration}`);
        if (run.error) {
          console.log(`    Error: ${run.error.slice(0, 50)}`);
        }
        console.log('');
      }
    });

  // Create workflow
  workflows
    .command('create <name>')
    .description('Create a workflow definition')
    .option('-d, --description <desc>', 'Description')
    .option('-t, --trigger <type>', 'Trigger type (manual, schedule, webhook)', 'manual')
    .action(async (name: string, options: any) => {
      const builder = new WorkflowBuilder()
        .name(name)
        .version('1.0.0')
        .description(options.description || '');

      // Set trigger type
      switch (options.trigger) {
        case 'schedule':
          builder.schedule(undefined, 60000); // Every minute
          break;
        case 'webhook':
          builder.webhook(`/webhook/${name}`);
          break;
        default:
          builder.manual();
      }

      // Add example step
      builder.action('log', 'log', { message: `Hello from ${name}!` });

      const workflow = builder.build();

      console.log(chalk.green(`\n✓ Created workflow definition: ${name}`));
      console.log(chalk.gray('\nWorkflow YAML:'));
      console.log(workflowToYaml(workflow));
      console.log('');
    });

  // Test workflow
  workflows
    .command('test <workflow>')
    .description('Test a workflow with sample data')
    .action(async (workflowName: string) => {
      const workflow = new WorkflowBuilder()
        .name(workflowName)
        .version('1.0.0')
        .manual()
        .action('log', 'log', { message: 'Test started' })
        .action('delay', 'delay', { ms: 500 })
        .action('log', 'log', { message: 'Test completed' })
        .build();

      const executor = new WorkflowExecutor();

      console.log(chalk.blue(`\n🧪 Testing workflow: ${workflowName}\n`));

      const run = await executor.execute(workflow, {});

      console.log(chalk.green(`✓ Test completed in ${run.completedAt! - run.startedAt}ms`));
      console.log('');
    });

  return workflows;
}

function workflowToYaml(workflow: any): string {
  let yaml = `name: ${workflow.name}\n`;
  yaml += `version: ${workflow.version}\n`;
  
  if (workflow.description) {
    yaml += `description: ${workflow.description}\n`;
  }
  
  yaml += `\ntrigger:\n`;
  yaml += `  type: ${workflow.trigger.type}\n`;
  
  if (workflow.trigger.type === 'schedule') {
    if ((workflow.trigger as any).cron) yaml += `  cron: "${(workflow.trigger as any).cron}"\n`;
    if ((workflow.trigger as any).interval) yaml += `  interval: ${(workflow.trigger as any).interval}\n`;
  }
  
  if (workflow.trigger.type === 'webhook') {
    yaml += `  path: ${(workflow.trigger as any).path}\n`;
  }
  
  yaml += `\nsteps:\n`;
  for (const step of workflow.steps) {
    yaml += `  - id: ${step.id}\n`;
    yaml += `    type: ${step.type}\n`;
    if (step.action) yaml += `    action: ${step.action}\n`;
  }
  
  return yaml;
}
