/**
 * RingmasterCore
 * 
 * Main runtime engine for LocalCircus.
 */

import { EventBus, getEventBus } from '../events/EventBus';
import { Scheduler, getScheduler } from '../scheduler/Scheduler';
import { MemoryManager, getMemory } from '../memory/MemoryManager';
import { v4 as uuidv4 } from 'uuid';

export interface RingmasterConfig {
  eventBus?: EventBus;
  scheduler?: Scheduler;
  memory?: MemoryManager;
  name?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    working: number;
    semantic: number;
    episodic: number;
  };
  scheduler: {
    totalTasks: number;
    activeTasks: number;
  };
  events: {
    listeners: number;
    historySize: number;
  };
}

export class RingmasterCore {
  readonly id: string;
  readonly name: string;
  readonly startedAt: number;

  private eventBus: EventBus;
  private scheduler: Scheduler;
  private memory: MemoryManager;
  private running: boolean = false;
  private plugins: Map<string, any> = new Map();

  constructor(config: RingmasterConfig = {}) {
    this.id = uuidv4();
    this.name = config.name || 'localcircus';
    this.startedAt = Date.now();
    
    this.eventBus = config.eventBus || getEventBus();
    this.scheduler = config.scheduler || getScheduler();
    this.memory = config.memory || getMemory();

    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.schedule = this.schedule.bind(this);
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('RingmasterCore is already running');
      return;
    }

    this.running = true;
    
    this.eventBus.emit('core:start', { 
      id: this.id, 
      name: this.name,
      timestamp: this.startedAt 
    });

    console.log(`Ringmaster Core "${this.name}" started (${this.id})`);
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    
    // Stop all scheduled tasks
    this.scheduler.stop();
    
    // Stop memory garbage collection
    this.memory.stop();

    this.eventBus.emit('core:stop', { id: this.id, timestamp: Date.now() });

    console.log(`Ringmaster Core "${this.name}" stopped`);
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get health status
   */
  getHealth(): HealthStatus {
    const memoryStats = this.memory.getStats();
    const tasks = this.scheduler.listTasks();

    let status: HealthStatus['status'] = 'healthy';
    
    // Check for issues
    if (memoryStats.total > 1000 || tasks.some(t => t.errorCount > 5)) {
      status = 'degraded';
    }

    return {
      status,
      uptime: Date.now() - this.startedAt,
      memory: {
        working: memoryStats.working,
        semantic: memoryStats.semantic,
        episodic: memoryStats.episodic,
      },
      scheduler: {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.enabled).length,
      },
      events: {
        listeners: 0,  // Would need access to emitter
        historySize: this.eventBus.getHistory().length,
      },
    };
  }

  // Convenience methods delegating to components

  /**
   * Subscribe to events
   */
  on(event: string | string[], handler: (event: any) => void | Promise<void>): () => void {
    return this.eventBus.on(event, handler);
  }

  /**
   * Publish an event
   */
  emit(type: string, payload?: any): void {
    this.eventBus.emit(type, payload, this.id);
  }

  /**
   * Schedule a task
   */
  schedule(handler: () => void | Promise<void>, options?: any): string {
    return this.scheduler.schedule(handler, options);
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: string): boolean {
    return this.scheduler.cancel(taskId);
  }

  /**
   * Store in memory
   */
  remember(key: string, value: any, options?: any): any {
    return this.memory.remember(key, value, options);
  }

  /**
   * Retrieve from memory
   */
  recall(key: string): any {
    const entry = this.memory.recall(key);
    return entry?.value;
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get scheduler
   */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * Get memory manager
   */
  getMemory(): MemoryManager {
    return this.memory;
  }

  /**
   * Register a plugin
   */
  registerPlugin(id: string, plugin: any): void {
    this.plugins.set(id, plugin);
    this.eventBus.emit('plugin:registered', { pluginId: id });
  }

  /**
   * Get a plugin
   */
  getPlugin(id: string): any {
    return this.plugins.get(id);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (plugin) {
      this.plugins.delete(id);
      this.eventBus.emit('plugin:unregistered', { pluginId: id });
      return true;
    }
    return false;
  }
}

// Factory function
let globalCore: RingmasterCore | null = null;

export function createCore(config?: RingmasterConfig): RingmasterCore {
  return new RingmasterCore(config);
}

export function getCore(): RingmasterCore {
  if (!globalCore) {
    globalCore = new RingmasterCore();
  }
  return globalCore;
}
