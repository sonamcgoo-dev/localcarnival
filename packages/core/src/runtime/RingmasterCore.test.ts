/**
 * RingmasterCore Tests
 */

import { RingmasterCore } from './RingmasterCore';
import { EventBus } from '../events/EventBus';
import { Scheduler } from '../scheduler/Scheduler';
import { MemoryManager } from '../memory/MemoryManager';

describe('RingmasterCore', () => {
  let core: RingmasterCore;
  let eventBus: EventBus;
  let scheduler: Scheduler;
  let memory: MemoryManager;

  beforeEach(() => {
    eventBus = new EventBus();
    scheduler = new Scheduler(eventBus);
    memory = new MemoryManager();
    
    core = new RingmasterCore({
      eventBus,
      scheduler,
      memory,
      name: 'test-core',
    });
  });

  afterEach(async () => {
    await core.stop();
    scheduler.stop();
    memory.stop();
  });

  describe('lifecycle', () => {
    it('should start and stop', async () => {
      expect(core.isRunning()).toBe(false);
      
      await core.start();
      expect(core.isRunning()).toBe(true);
      
      await core.stop();
      expect(core.isRunning()).toBe(false);
    });

    it('should emit start event', async () => {
      const events: any[] = [];
      eventBus.on('core:start', (e) => events.push(e));
      
      await core.start();
      
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('core:start');
    });
  });

  describe('events', () => {
    it('should emit and receive events', async () => {
      const received: any[] = [];
      core.on('test:event', (e) => received.push(e));
      
      core.emit('test:event', { data: 'hello' });
      
      expect(received.length).toBe(1);
      expect(received[0].payload.data).toBe('hello');
    });
  });

  describe('memory', () => {
    it('should remember and recall', async () => {
      core.remember('key1', { value: 'test' });
      
      const result = core.recall('key1');
      expect(result).toEqual({ value: 'test' });
    });

    it('should return undefined for unknown keys', () => {
      const result = core.recall('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('scheduling', () => {
    it('should schedule tasks', async () => {
      let executed = false;
      
      core.schedule(() => { executed = true; }, {
        name: 'test-task',
        interval: 1000,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(executed).toBe(true);
    });

    it('should cancel tasks', async () => {
      let executed = false;
      
      const taskId = core.schedule(() => { executed = true; }, {
        name: 'test-task',
        interval: 100,
      });
      
      core.cancelTask(taskId);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(executed).toBe(false);
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      await core.start();
      
      const health = core.getHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.memory).toBeDefined();
      expect(health.scheduler).toBeDefined();
    });
  });

  describe('plugins', () => {
    it('should register and get plugins', async () => {
      const plugin = { id: 'test-plugin', name: 'Test' };
      
      core.registerPlugin('test-plugin', plugin);
      
      const retrieved = core.getPlugin('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('should unregister plugins', async () => {
      const plugin = { id: 'test-plugin', name: 'Test' };
      
      core.registerPlugin('test-plugin', plugin);
      const removed = core.unregisterPlugin('test-plugin');
      
      expect(removed).toBe(true);
      expect(core.getPlugin('test-plugin')).toBeUndefined();
    });
  });
});
