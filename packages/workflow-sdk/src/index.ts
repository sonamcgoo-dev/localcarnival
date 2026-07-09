/**
 * Workflow SDK
 * 
 * Build and execute automation workflows (Acts).
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus, Scheduler } from '@localcircus/core';

// ============================================================================
// Types
// ============================================================================

export type TriggerType = 'schedule' | 'webhook' | 'event' | 'manual';

export interface ScheduleTrigger {
  type: 'schedule';
  cron?: string;
  interval?: number;
  timezone?: string;
}

export interface WebhookTrigger {
  type: 'webhook';
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface EventTrigger {
  type: 'event';
  source: string;
  event: string;
}

export interface ManualTrigger {
  type: 'manual';
}

export type Trigger = ScheduleTrigger | WebhookTrigger | EventTrigger | ManualTrigger;

export interface StepConfig {
  id: string;
  name?: string;
  type: 'action' | 'logic' | 'transform';
  action?: string;
  config?: Record<string, any>;
  input?: string;
  output?: string;
  onError?: StepErrorConfig;
}

export interface StepErrorConfig {
  action: 'continue' | 'retry' | 'fail';
  maxRetries?: number;
  retryDelay?: number;
  defaultValue?: any;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  version: string;
  description?: string;
  trigger: Trigger;
  steps: StepConfig[];
  settings?: WorkflowSettings;
  inputs?: InputDefinition[];
  outputs?: OutputDefinition[];
}

export interface InputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface OutputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  source: string;
}

export interface WorkflowSettings {
  timeout?: number;
  maxRetries?: number;
  continueOnError?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: RunStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  stepResults: Record<string, StepResult>;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

// ============================================================================
// Built-in Actions
// ============================================================================

export interface ActionHandler {
  (config: Record<string, any>, context: StepContext): Promise<any>;
}

export interface StepContext {
  inputs: Record<string, any>;
  steps: Record<string, StepResult>;
  vars: Record<string, any>;
  setVar: (name: string, value: any) => void;
  skip: () => void;
}

const builtInActions: Record<string, ActionHandler> = {
  log: async (config) => {
    console.log(`[LOG] ${config.message || config}`);
    return config.message;
  },

  http: async (config) => {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (config.responseType === 'json') {
      return response.json();
    }
    return response.text();
  },

  setVariable: async (config, context) => {
    context.setVar(config.name, config.value);
    return config.value;
  },

  delay: async (config) => {
    await new Promise(resolve => setTimeout(resolve, config.ms || 1000));
    return true;
  },

  transform: {
    filter: async (config) => {
      const items = config.input || [];
      return items.filter((item: any) => {
        if (config.condition) {
          return evaluateCondition(config.condition, { item });
        }
        return true;
      });
    },
    map: async (config) => {
      const items = config.input || [];
      return items.map((item: any) => {
        if (config.expression) {
          return evaluateExpression(config.expression, { item });
        }
        return item;
      });
    },
    reduce: async (config) => {
      const items = config.input || [];
      return items.reduce((acc: any, item: any) => {
        if (config.expression) {
          return evaluateExpression(config.expression, { acc, item });
        }
        return acc;
      }, config.initialValue);
    },
  },
};

// ============================================================================
// Workflow Executor
// ============================================================================

export interface WorkflowExecutorConfig {
  eventBus?: EventBus;
  scheduler?: Scheduler;
  actions?: Record<string, ActionHandler>;
  timeout?: number;
}

export class WorkflowExecutor {
  private eventBus: EventBus;
  private scheduler: Scheduler;
  private actions: Record<string, ActionHandler>;
  private timeout: number;
  private activeRuns: Map<string, WorkflowRun> = new Map();

  constructor(config: WorkflowExecutorConfig = {}) {
    this.eventBus = config.eventBus || new EventBus();
    this.scheduler = config.scheduler || new Scheduler(this.eventBus);
    this.actions = { ...builtInActions, ...config.actions };
    this.timeout = config.timeout || 300000;
  }

  /**
   * Execute a workflow
   */
  async execute(workflow: WorkflowDefinition, inputs: Record<string, any> = {}): Promise<WorkflowRun> {
    const runId = uuidv4();
    
    const run: WorkflowRun = {
      id: runId,
      workflowId: workflow.id || workflow.name,
      status: 'running',
      inputs,
      outputs: {},
      stepResults: {},
      startedAt: Date.now(),
    };

    this.activeRuns.set(runId, run);
    this.eventBus.emit('workflow:start', { runId, workflow: workflow.name });

    try {
      const vars: Record<string, any> = {};
      const context: StepContext = {
        inputs,
        steps: {},
        vars,
        setVar: (name, value) => { vars[name] = value; },
        skip: () => { /* handled in executeStep */ },
      };

      for (const step of workflow.steps) {
        const result = await this.executeStep(step, context, workflow.settings);
        run.stepResults[step.id] = result;
        context.steps[step.id] = result;

        if (result.status === 'failed' && !workflow.settings?.continueOnError) {
          throw new Error(`Step ${step.id} failed: ${result.error}`);
        }
      }

      run.status = 'completed';
      run.completedAt = Date.now();

      // Extract outputs
      if (workflow.outputs) {
        for (const output of workflow.outputs) {
          run.outputs[output.name] = evaluateExpression(output.source, {
            inputs,
            steps: run.stepResults,
            vars,
          });
        }
      }

      this.eventBus.emit('workflow:complete', { runId, outputs: run.outputs });
    } catch (error) {
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : String(error);
      run.completedAt = Date.now();
      this.eventBus.emit('workflow:error', { runId, error: run.error });
    }

    this.activeRuns.set(runId, run);
    return run;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: StepConfig,
    context: StepContext,
    settings?: WorkflowSettings
  ): Promise<StepResult> {
    const result: StepResult = {
      stepId: step.id,
      status: 'running',
      startedAt: Date.now(),
    };

    this.eventBus.emit('workflow:step:start', { stepId: step.id });

    try {
      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Step timeout')), this.timeout);
      });

      const actionPromise = this.runStepAction(step, context);

      const output = await Promise.race([actionPromise, timeoutPromise]);

      result.status = 'completed';
      result.output = output;
      result.completedAt = Date.now();
      result.duration = result.completedAt - result.startedAt!;

      this.eventBus.emit('workflow:step:complete', { 
        stepId: step.id, 
        output,
        duration: result.duration 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (step.onError?.action === 'continue') {
        result.status = 'completed';
        result.output = step.onError.defaultValue;
        result.error = errorMessage;
      } else if (step.onError?.action === 'retry' && (step.onError.maxRetries || 0) > 0) {
        // Retry logic
        const retries = step.onError.maxRetries || 1;
        for (let i = 0; i < retries; i++) {
          if (step.onError.retryDelay) {
            await new Promise(r => setTimeout(r, step.onError!.retryDelay));
          }
          try {
            const output = await this.runStepAction(step, context);
            result.status = 'completed';
            result.output = output;
            result.completedAt = Date.now();
            result.duration = result.completedAt - result.startedAt!;
            return result;
          } catch {
            // Continue to next retry
          }
        }
        result.status = 'failed';
        result.error = errorMessage;
      } else {
        result.status = 'failed';
        result.error = errorMessage;
      }

      result.completedAt = Date.now();
      result.duration = result.completedAt - result.startedAt!;

      this.eventBus.emit('workflow:step:error', { 
        stepId: step.id, 
        error: result.error 
      });
    }

    return result;
  }

  /**
   * Run step action
   */
  private async runStepAction(step: StepConfig, context: StepContext): Promise<any> {
    if (!step.action) {
      return step.config;
    }

    const action = this.actions[step.action];
    
    if (!action) {
      throw new Error(`Unknown action: ${step.action}`);
    }

    // Resolve input expressions
    const resolvedConfig: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(step.config || {})) {
      if (typeof value === 'string') {
        resolvedConfig[key] = this.resolveExpression(value, context);
      } else {
        resolvedConfig[key] = value;
      }
    }

    return action(resolvedConfig, context);
  }

  /**
   * Resolve expression
   */
  private resolveExpression(template: string, context: StepContext): any {
    // Simple template resolution
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      return evaluateExpression(path.trim(), context);
    });
  }

  /**
   * Get active run
   */
  getRun(runId: string): WorkflowRun | undefined {
    return this.activeRuns.get(runId);
  }

  /**
   * List active runs
   */
  listRuns(): WorkflowRun[] {
    return Array.from(this.activeRuns.values());
  }

  /**
   * Cancel a run
   */
  cancelRun(runId: string): boolean {
    const run = this.activeRuns.get(runId);
    
    if (!run || run.status !== 'running') {
      return false;
    }

    run.status = 'cancelled';
    run.completedAt = Date.now();
    this.eventBus.emit('workflow:cancelled', { runId });

    return true;
  }

  /**
   * Register custom action
   */
  registerAction(name: string, handler: ActionHandler): void {
    this.actions[name] = handler;
  }
}

// ============================================================================
// Workflow Builder
// ============================================================================

export class WorkflowBuilder {
  private workflow: Partial<WorkflowDefinition> = {
    steps: [],
    settings: {},
    inputs: [],
    outputs: [],
  };

  name(name: string): this {
    this.workflow.name = name;
    return this;
  }

  version(version: string): this {
    this.workflow.version = version;
    return this;
  }

  description(description: string): this {
    this.workflow.description = description;
    return this;
  }

  trigger(trigger: Trigger): this {
    this.workflow.trigger = trigger;
    return this;
  }

  schedule(cron?: string, interval?: number, timezone?: string): this {
    this.workflow.trigger = { type: 'schedule', cron, interval, timezone };
    return this;
  }

  webhook(path: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE'): this {
    this.workflow.trigger = { type: 'webhook', path, method };
    return this;
  }

  manual(): this {
    this.workflow.trigger = { type: 'manual' };
    return this;
  }

  step(config: Omit<StepConfig, 'id'>): this {
    this.workflow.steps!.push({
      ...config,
      id: config.id || `step-${this.workflow.steps!.length + 1}`,
    });
    return this;
  }

  action(id: string, action: string, config?: Record<string, any>): this {
    this.workflow.steps!.push({ id, type: 'action', action, config });
    return this;
  }

  input(name: string, type: InputDefinition['type'], required?: boolean): this {
    this.workflow.inputs!.push({ name, type, required });
    return this;
  }

  output(name: string, source: string): this {
    this.workflow.outputs!.push({ name, type: 'string', source });
    return this;
  }

  timeout(ms: number): this {
    this.workflow.settings!.timeout = ms;
    return this;
  }

  continueOnError(): this {
    this.workflow.settings!.continueOnError = true;
    return this;
  }

  build(): WorkflowDefinition {
    if (!this.workflow.name || !this.workflow.version || !this.workflow.trigger) {
      throw new Error('Name, version, and trigger are required');
    }

    return {
      ...this.workflow,
      id: this.workflow.id || uuidv4(),
    } as WorkflowDefinition;
  }
}

// ============================================================================
// Utilities
// ============================================================================

function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple condition evaluation - in production, use a proper expression parser
    const fn = new Function(...Object.keys(context), `return ${condition}`);
    return fn(...Object.values(context));
  } catch {
    return false;
  }
}

function evaluateExpression(expr: string, context: Record<string, any>): any {
  try {
    // Handle simple paths like "steps.fetch.output"
    const parts = expr.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      
      // Handle array access like "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        value = value[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        value = value[part];
      }
    }
    
    return value;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default WorkflowExecutor;
