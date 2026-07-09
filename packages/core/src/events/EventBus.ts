/**
 * EventBus
 * 
 * Pub/sub event system for LocalCircus.
 */

import EventEmitter from 'eventemitter3';

export interface Event {
  type: string;
  payload?: any;
  timestamp: number;
  source?: string;
}

export type EventHandler = (event: Event) => void | Promise<void>;

export interface Unsubscribe {
  (): void;
}

export class EventBus {
  private emitter: EventEmitter;
  private eventHistory: Event[] = [];
  private maxHistory: number;

  constructor(options?: { maxHistory?: number }) {
    this.emitter = new EventEmitter();
    this.maxHistory = options?.maxHistory ?? 1000;
  }

  /**
   * Subscribe to events
   */
  on(event: string | string[], handler: EventHandler): Unsubscribe {
    const events = Array.isArray(event) ? event : [event];
    
    for (const e of events) {
      this.emitter.on(e, async (payload: any) => {
        const event: Event = {
          type: e,
          payload,
          timestamp: Date.now(),
        };
        
        try {
          await handler(event);
        } catch (error) {
          console.error(`Event handler error for ${e}:`, error);
        }
      });
    }

    return () => {
      for (const e of events) {
        this.emitter.off(e, handler);
      }
    };
  }

  /**
   * Subscribe to events once
   */
  once(eventName: string, handler: EventHandler): Unsubscribe {
    const wrappedHandler = async (payload: any) => {
      const evt: Event = {
        type: eventName,
        payload,
        timestamp: Date.now(),
      };
      
      await handler(evt);
    };

    this.emitter.once(eventName, wrappedHandler);

    return () => {
      this.emitter.off(eventName, wrappedHandler);
    };
  }

  /**
   * Unsubscribe from events
   */
  off(event: string | string[], handler: EventHandler): void {
    const events = Array.isArray(event) ? event : [event];
    for (const e of events) {
      this.emitter.off(e, handler);
    }
  }

  /**
   * Publish an event
   */
  emit(event: string, payload?: any, source?: string): void {
    const evt: Event = {
      type: event,
      payload,
      timestamp: Date.now(),
      source,
    };

    // Store in history
    this.eventHistory.push(evt);
    
    // Trim history
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistory);
    }

    // Emit to listeners
    this.emitter.emit(event, payload);
  }

  /**
   * Get event history
   */
  getHistory(eventType?: string): Event[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }

  /**
   * Get listener count
   */
  listenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }
}

// Singleton instance
let globalEventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export function createEventBus(options?: { maxHistory?: number }): EventBus {
  return new EventBus(options);
}
