/**
 * MemoryManager
 * 
 * Multi-tier memory system for LocalCircus.
 */

import { v4 as uuidv4 } from 'uuid';

export type MemoryType = 'fact' | 'preference' | 'context' | 'history';
export type MemoryImportance = 'critical' | 'high' | 'medium' | 'low';

export interface MemoryEntry {
  id: string;
  key: string;
  value: any;
  type: MemoryType;
  importance: MemoryImportance;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  tags?: string[];
}

export interface MemoryOptions {
  type?: MemoryType;
  importance?: MemoryImportance;
  ttl?: number;  // Time to live in ms
  tags?: string[];
}

export class MemoryManager {
  private working: Map<string, MemoryEntry> = new Map();
  private semantic: Map<string, MemoryEntry> = new Map();
  private episodic: Map<string, MemoryEntry> = new Map();
  private maxWorking: number;
  private gcInterval: NodeJS.Timeout | null = null;

  constructor(options?: { maxWorking?: number }) {
    this.maxWorking = options?.maxWorking ?? 100;
    this.startGC();
  }

  /**
   * Store a memory entry
   */
  remember(key: string, value: any, options: MemoryOptions = {}): MemoryEntry {
    const now = Date.now();
    
    const entry: MemoryEntry = {
      id: uuidv4(),
      key,
      value,
      type: options.type ?? 'context',
      importance: options.importance ?? 'medium',
      createdAt: now,
      updatedAt: now,
      expiresAt: options.ttl ? now + options.ttl : undefined,
      tags: options.tags,
    };

    // Store in appropriate layer
    if (entry.importance === 'critical' || entry.importance === 'high') {
      this.working.set(key, entry);
    } else {
      this.semantic.set(key, entry);
    }

    // Enforce max working memory
    this.enforceWorkingLimit();

    return entry;
  }

  /**
   * Retrieve a memory entry
   */
  recall(key: string): MemoryEntry | undefined {
    return this.working.get(key) || this.semantic.get(key) || this.episodic.get(key);
  }

  /**
   * Get all memories
   */
  recallAll(type?: MemoryType): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    
    for (const entry of this.working.values()) {
      if (!type || entry.type === type) {
        entries.push(entry);
      }
    }
    
    for (const entry of this.semantic.values()) {
      if (!type || entry.type === type) {
        entries.push(entry);
      }
    }
    
    for (const entry of this.episodic.values()) {
      if (!type || entry.type === type) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => b.importanceRank() - a.importanceRank());
  }

  /**
   * Search memories by key
   */
  search(query: string): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    const results: MemoryEntry[] = [];

    for (const entry of this.recallAll()) {
      if (entry.key.toLowerCase().includes(lowerQuery)) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Delete a memory
   */
  forget(key: string): boolean {
    return this.working.delete(key) || 
           this.semantic.delete(key) || 
           this.episodic.delete(key);
  }

  /**
   * Clear all memories
   */
  clear(type?: MemoryType): void {
    if (type) {
      if (type === 'context' || type === 'preference') {
        this.working.clear();
      } else if (type === 'fact') {
        this.semantic.clear();
      } else if (type === 'history') {
        this.episodic.clear();
      }
    } else {
      this.working.clear();
      this.semantic.clear();
      this.episodic.clear();
    }
  }

  /**
   * Archive to episodic memory
   */
  archive(key: string): boolean {
    const entry = this.recall(key);
    
    if (!entry) return false;

    // Remove from current layer
    this.working.delete(key);
    this.semantic.delete(key);

    // Add to episodic
    this.episodic.set(key, entry);

    return true;
  }

  /**
   * Get working memory context
   */
  getContext(maxEntries?: number): MemoryEntry[] {
    const entries = Array.from(this.working.values())
      .sort((a, b) => b.importanceRank() - a.importanceRank());
    
    return maxEntries ? entries.slice(0, maxEntries) : entries;
  }

  /**
   * Get statistics
   */
  getStats(): {
    working: number;
    semantic: number;
    episodic: number;
    total: number;
  } {
    return {
      working: this.working.size,
      semantic: this.semantic.size,
      episodic: this.episodic.size,
      total: this.working.size + this.semantic.size + this.episodic.size,
    };
  }

  /**
   * Export all memories as JSON
   */
  export(): string {
    return JSON.stringify({
      working: Array.from(this.working.values()),
      semantic: Array.from(this.semantic.values()),
      episodic: Array.from(this.episodic.values()),
    }, null, 2);
  }

  /**
   * Import memories from JSON
   */
  import(json: string): void {
    const data = JSON.parse(json);
    
    if (data.working) {
      for (const entry of data.working) {
        this.working.set(entry.key, entry);
      }
    }
    
    if (data.semantic) {
      for (const entry of data.semantic) {
        this.semantic.set(entry.key, entry);
      }
    }
    
    if (data.episodic) {
      for (const entry of data.episodic) {
        this.episodic.set(entry.key, entry);
      }
    }
  }

  /**
   * Stop garbage collection
   */
  stop(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  private enforceWorkingLimit(): void {
    if (this.working.size <= this.maxWorking) return;

    // Remove lowest importance entries
    const entries = Array.from(this.working.values())
      .sort((a, b) => a.importanceRank() - b.importanceRank());

    const toRemove = entries.slice(0, this.working.size - this.maxWorking);
    
    for (const entry of toRemove) {
      this.working.delete(entry.key);
    }
  }

  private startGC(): void {
    // Run garbage collection every minute
    this.gcInterval = setInterval(() => {
      const now = Date.now();

      // Remove expired entries
      for (const [key, entry] of this.working) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.working.delete(key);
        }
      }

      for (const [key, entry] of this.semantic) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.semantic.delete(key);
        }
      }
    }, 60000);
  }
}

// Add importance ranking method
(MemoryEntry.prototype as any).importanceRank = function(): number {
  const ranks = { critical: 4, high: 3, medium: 2, low: 1 };
  return ranks[this.importance];
};

// Singleton
let globalMemory: MemoryManager | null = null;

export function getMemory(): MemoryManager {
  if (!globalMemory) {
    globalMemory = new MemoryManager();
  }
  return globalMemory;
}
