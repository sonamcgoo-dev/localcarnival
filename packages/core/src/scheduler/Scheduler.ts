/**
 * Scheduler
 * 
 * Task scheduling for LocalCircus.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../events/EventBus';

export interface ScheduledTask {
  id: string;
  name: string;
  cron?: string;
  interval?: number;
  timeout?: number;
  handler: () => void | Promise<void>;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  errorCount: number;
}

export interface ScheduleOptions {
  name?: string;
  cron?: string;
  interval?: number;
  timeout?: number;
  enabled?: boolean;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    this.startTick();
  }

  /**
   * Schedule a task
   */
  schedule(handler: () => void | Promise<void>, options: ScheduleOptions = {}): string {
    const id = uuidv4();
    
    const task: ScheduledTask = {
      id,
      name: options.name || `task-${id.slice(0, 8)}`,
      cron: options.cron,
      interval: options.interval,
      timeout: options.timeout,
      handler,
      enabled: options.enabled ?? true,
      runCount: 0,
      errorCount: 0,
    };

    this.tasks.set(id, task);

    if (task.enabled) {
      this.startTask(task);
    }

    this.eventBus.emit('scheduler:task:scheduled', { taskId: id, task: task.name });

    return id;
  }

  /**
   * Cancel a scheduled task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }

    this.stopTask(task);
    this.tasks.delete(taskId);
    
    this.eventBus.emit('scheduler:task:cancelled', { taskId });

    return true;
  }

  /**
   * Enable a task
   */
  enable(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }

    if (!task.enabled) {
      task.enabled = true;
      this.startTask(task);
      this.eventBus.emit('scheduler:task:enabled', { taskId });
    }

    return true;
  }

  /**
   * Disable a task
   */
  disable(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }

    if (task.enabled) {
      task.enabled = false;
      this.stopTask(task);
      this.eventBus.emit('scheduler:task:disabled', { taskId });
    }

    return true;
  }

  /**
   * Get a task
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks
   */
  listTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Run a task immediately
   */
  async runNow(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.executeTask(task);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    for (const [id, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  private startTask(task: ScheduledTask): void {
    if (task.interval) {
      // Interval-based scheduling
      const interval = setInterval(() => {
        this.executeTask(task);
      }, task.interval);
      
      this.intervals.set(task.id, interval);
      task.nextRun = Date.now() + task.interval;
    }
    // Cron scheduling would require a cron parser library
  }

  private stopTask(task: ScheduledTask): void {
    const interval = this.intervals.get(task.id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(task.id);
    }
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    if (!task.enabled) return;

    const startTime = Date.now();
    
    this.eventBus.emit('scheduler:task:start', { taskId: task.id, taskName: task.name });

    try {
      // Apply timeout if specified
      const result = task.timeout
        ? this.withTimeout(task.handler(), task.timeout)
        : task.handler();

      await result;
      
      task.lastRun = startTime;
      task.runCount++;
      
      this.eventBus.emit('scheduler:task:complete', {
        taskId: task.id,
        taskName: task.name,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      task.errorCount++;
      
      this.eventBus.emit('scheduler:task:error', {
        taskId: task.id,
        taskName: task.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task timed out after ${ms}ms`));
      }, ms);

      promise
        .then(value => {
          clearTimeout(timeout);
          resolve(value);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private startTick(): void {
    // Check for cron tasks every minute
    setInterval(() => {
      const now = Date.now();
      
      for (const task of this.tasks.values()) {
        if (!task.enabled || !task.cron) continue;
        
        if (task.nextRun && now >= task.nextRun) {
          this.executeTask(task);
          // Next run would be calculated by cron parser
        }
      }
    }, 60000);
  }
}

// Singleton
let globalScheduler: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!globalScheduler) {
    globalScheduler = new Scheduler();
  }
  return globalScheduler;
}
