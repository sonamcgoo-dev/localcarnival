# Workflow SDK (Acts)

> Build and execute automation workflows.

## Overview

The Workflow SDK (called "Acts" in LocalCircus creative language) enables developers to create, execute, and monitor automation workflows programmatically.

## Installation

```bash
npm install @localcircus/workflow-sdk
```

## Quick Start

```typescript
import { 
  Workflow, 
  Step, 
  WorkflowExecutor 
} from '@localcircus/workflow-sdk';

// Define a workflow
const workflow = new Workflow({
  name: 'Daily Report',
  version: '1.0.0'
});

// Add steps
workflow
  .trigger({
    type: 'schedule',
    cron: '0 9 * * *'
  })
  .step({
    id: 'fetch-data',
    type: 'action',
    action: 'http',
    config: {
      method: 'GET',
      url: 'https://api.example.com/metrics'
    }
  })
  .step({
    id: 'process',
    type: 'transform',
    transform: 'filter',
    input: '{{steps.fetch-data.output}}',
    condition: 'item.value > 0'
  })
  .step({
    id: 'notify',
    type: 'action',
    action: 'notification',
    config: {
      message: 'Report generated successfully'
    }
  });

// Execute
const executor = new WorkflowExecutor();
const result = await executor.run(workflow);
```

## Workflow Definition

### Basic Structure

```typescript
interface Workflow {
  id?: string;
  name: string;
  version: string;
  description?: string;
  
  // Workflow definition
  trigger: Trigger;
  steps: Step[];
  
  // Error handling
  errorHandling?: ErrorHandling;
  
  // Settings
  settings: WorkflowSettings;
  
  // Metadata
  metadata?: Record<string, any>;
}
```

### Workflow Settings

```typescript
interface WorkflowSettings {
  // Execution
  timeout?: number;           // Max duration (ms)
  maxRetries?: number;        // Retry on failure
  retryDelay?: number;        // Delay between retries (ms)
  
  // Behavior
  continueOnError?: boolean;   // Continue if step fails
  stopOnFirstError?: boolean; // Stop on first error
  
  // Logging
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logSteps?: boolean;         // Log each step
  
  // Concurrency
  parallelLimit?: number;     // Max parallel steps
}
```

## Triggers

Define when the workflow should execute.

### Schedule Trigger

```typescript
workflow.trigger({
  type: 'schedule',
  config: {
    cron: '0 9 * * 1-5',     // Weekdays at 9 AM
    timezone: 'America/New_York',
    enabled: true
  }
});
```

### Webhook Trigger

```typescript
workflow.trigger({
  type: 'webhook',
  config: {
    path: '/webhooks/daily-report',
    method: 'POST',
    auth: {
      type: 'bearer',
      header: 'Authorization'
    },
    // Only trigger on specific payload
    filter: 'payload.event == "daily"'
  }
});
```

### Event Trigger

```typescript
workflow.trigger({
  type: 'event',
  config: {
    source: 'github',
    event: 'push',
    filter: 'ref == "refs/heads/main"'
  }
});
```

### Manual Trigger

```typescript
workflow.trigger({
  type: 'manual',
  config: {
    buttonLabel: 'Run Report',
    description: 'Manually trigger the daily report'
  }
});
```

## Steps

### Action Step

Execute an action.

```typescript
// HTTP request
workflow.step({
  id: 'fetch-user',
  type: 'action',
  action: 'http',
  config: {
    method: 'GET',
    url: 'https://api.example.com/users/{{inputs.userId}}',
    headers: {
      'Authorization': 'Bearer {{secrets.API_KEY}}'
    }
  }
});

// Script execution
workflow.step({
  id: 'process-data',
  type: 'action',
  action: 'script',
  config: {
    language: 'javascript',
    code: `
      const data = JSON.parse(inputs.data);
      return {
        count: data.items.length,
        total: data.items.reduce((s, i) => s + i.value, 0)
      };
    `
  }
});

// Send notification
workflow.step({
  id: 'notify-success',
  type: 'action',
  action: 'notification',
  config: {
    title: 'Success',
    message: 'Task completed: {{steps.process-data.output.count}} items'
  }
});
```

### Condition Step

Branch based on conditions.

```typescript
workflow.step({
  id: 'check-status',
  type: 'logic',
  logic: 'condition',
  config: {
    expression: '{{steps.fetch.status}} == 200',
    
    // If true
    onTrue: ['process-data'],
    
    // If false
    onFalse: ['notify-error']
  }
});
```

### Loop Step

Iterate over data.

```typescript
workflow.step({
  id: 'process-items',
  type: 'logic',
  logic: 'loop',
  config: {
    iterator: 'array',
    items: '{{steps.fetch.items}}',
    variableName: 'item',
    maxIterations: 100,
    
    // Steps to run for each item
    steps: [
      {
        id: 'process-item',
        type: 'action',
        action: 'transform',
        config: {
          value: '{{item.value}} * 2'
        }
      }
    ]
  }
});
```

### Parallel Step

Run steps in parallel.

```typescript
workflow.step({
  id: 'fetch-all',
  type: 'logic',
  logic: 'parallel',
  config: {
    // Steps to run concurrently
    steps: [
      { id: 'fetch-users', ... },
      { id: 'fetch-orders', ... },
      { id: 'fetch-products', ... }
    ],
    
    // How to combine results
    combine: 'merge'  // or 'array'
  }
});
```

### Transform Step

Manipulate data.

```typescript
// Filter array
workflow.step({
  id: 'filter-active',
  type: 'transform',
  transform: 'filter',
  config: {
    input: '{{steps.fetch.items}}',
    condition: 'item.status == "active"'
  }
});

// Map array
workflow.step({
  id: 'extract-names',
  type: 'transform',
  transform: 'map',
  config: {
    input: '{{steps.fetch.users}}',
    expression: 'user.name'
  }
});

// Merge objects
workflow.step({
  id: 'merge-data',
  type: 'transform',
  transform: 'merge',
  config: {
    objects: [
      '{{steps.fetch.profile}}',
      '{{steps.fetch.settings}}'
    ]
  }
});

// Template string
workflow.step({
  id: 'format-message',
  type: 'transform',
  transform: 'template',
  config: {
    template: 'Hello {{inputs.name}}, your order #{{inputs.orderId}} is ready!',
    data: {
      name: '{{inputs.name}}',
      orderId: '{{inputs.orderId}}'
    }
  }
});
```

## Data Flow

### Input/Output

```typescript
// Define workflow inputs
workflow.input({
  name: 'userId',
  type: 'string',
  required: true,
  description: 'User ID to fetch'
});

// Access in steps
workflow.step({
  id: 'fetch',
  config: {
    url: 'https://api.example.com/users/{{inputs.userId}}'
  }
});

// Define workflow output
workflow.output({
  name: 'user',
  value: '{{steps.fetch.user}}'
});
```

### Variables

```typescript
// Set variable
workflow.step({
  id: 'set-counter',
  type: 'action',
  action: 'set-variable',
  config: {
    name: 'count',
    value: 0
  }
});

// Increment variable
workflow.step({
  id: 'increment',
  type: 'action',
  action: 'set-variable',
  config: {
    name: 'count',
    operation: 'increment',
    by: 1
  }
});

// Use variable
workflow.step({
  id: 'log',
  type: 'action',
  action: 'log',
  config: {
    message: 'Count: {{vars.count}}'
  }
});
```

## Error Handling

### Step Error Handling

```typescript
workflow.step({
  id: 'risky-action',
  type: 'action',
  action: 'http',
  config: { ... },
  
  // Error handling for this step
  onError: {
    action: 'continue',      // continue, retry, fail
    defaultValue: null,       // Value to use on error
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

### Global Error Handling

```typescript
const workflow = new Workflow({
  name: 'Report',
  errorHandling: {
    // Run on any error
    onError: [
      {
        type: 'notification',
        config: {
          message: 'Workflow failed: {{error.message}}'
        }
      }
    ],
    
    // Run on specific errors
    onErrorCode: {
      'TIMEOUT': ['retry-step'],
      'NOT_FOUND': ['notify-not-found']
    }
  }
});
```

## Workflow Executor

### Running Workflows

```typescript
const executor = new WorkflowExecutor({
  // Configuration
  timeout: 300000,        // 5 minutes
  logLevel: 'info',
  
  // Context
  secrets: { API_KEY: '...' },
  context: { userId: '123' }
});

// Run with inputs
const result = await executor.run(workflow, {
  userId: 'user-456'
});

console.log(result.status);  // 'completed' | 'failed' | 'cancelled'
console.log(result.output);   // Workflow output
console.log(result.duration); // Execution time (ms)
```

### Monitoring Execution

```typescript
const executor = new WorkflowExecutor();

// Subscribe to events
executor.on('step:start', (event) => {
  console.log(`Starting step: ${event.stepId}`);
});

executor.on('step:complete', (event) => {
  console.log(`Completed step: ${event.stepId} in ${event.duration}ms`);
});

executor.on('step:error', (event) => {
  console.error(`Step failed: ${event.stepId}`, event.error);
});

executor.on('workflow:complete', (event) => {
  console.log(`Workflow completed: ${event.status}`);
});

// Run
await executor.run(workflow);
```

## Step Results

```typescript
interface StepResult {
  stepId: string;
  
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  
  output?: any;
  error?: StepError;
  
  duration?: number;
  startedAt?: string;
  completedAt?: string;
  
  // For loops
  iterations?: LoopIteration[];
}

interface LoopIteration {
  index: number;
  input: any;
  output?: any;
  error?: StepError;
}
```

## CLI Commands

```bash
# Create workflow
circus workflow create daily-report --trigger schedule

# Run workflow
circus workflow run daily-report --input '{"userId": "123"}'

# List workflows
circus workflow list

# View run history
circus workflow runs daily-report

# Stop running workflow
circus workflow stop run-456

# Validate workflow
circus workflow validate daily-report
```

## Examples

### Data Pipeline

```typescript
new Workflow({
  name: 'ETL Pipeline',
  version: '1.0.0',
  trigger: { type: 'schedule', cron: '0 * * * *' },
  steps: [
    {
      id: 'extract',
      type: 'action',
      action: 'http',
      config: { method: 'GET', url: 'https://api.db.com/data' }
    },
    {
      id: 'transform',
      type: 'transform',
      transform: 'filter',
      input: '{{steps.extract.output}}',
      condition: 'item.valid'
    },
    {
      id: 'load',
      type: 'action',
      action: 'database',
      config: { operation: 'insert', table: 'processed', data: '{{steps.transform.output}}' }
    }
  ]
});
```

### Notification System

```typescript
new Workflow({
  name: 'User Notifications',
  version: '1.0.0',
  trigger: { type: 'webhook', path: '/notify' },
  steps: [
    {
      id: 'validate',
      type: 'logic',
      logic: 'condition',
      config: {
        expression: 'inputs.userId && inputs.message',
        onTrue: ['send-notification'],
        onFalse: ['log-error']
      }
    },
    {
      id: 'send-notification',
      type: 'action',
      action: 'notification',
      config: {
        userId: '{{inputs.userId}}',
        message: '{{inputs.message}}'
      }
    },
    {
      id: 'log-error',
      type: 'action',
      action: 'log',
      config: { message: 'Invalid input: {{inputs}}', level: 'error' }
    }
  ]
});
```

## Workflow YAML Format

```yaml
name: daily-report
version: 1.0.0

trigger:
  type: schedule
  cron: "0 9 * * *"

steps:
  - id: fetch-data
    type: action
    action: http
    config:
      method: GET
      url: https://api.example.com/metrics

  - id: process
    type: transform
    transform: filter
    input: "{{steps.fetch-data.output}}"
    condition: "item.value > 0"

  - id: notify
    type: action
    action: notification
    config:
      message: Report complete
```

## Related Documents

- [Visual Workflow Builder](../../06-BigTop/visual-builder.md)
- [Live Jobs Dashboard](../../06-BigTop/live-jobs.md)
- [LCA-0002: Artifact DNA](../../localcircus-specs/lca/active/lca-0002-artifact-dna.md)
