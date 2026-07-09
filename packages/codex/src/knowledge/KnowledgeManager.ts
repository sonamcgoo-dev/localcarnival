/**
 * KnowledgeManager
 * 
 * Manages knowledge entries, notes, and RAG capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@localcircus/core';
import { KnowledgeEntry, KnowledgeType, Note } from '../types';

export class KnowledgeManager {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private notes: Map<string, Note> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Create a knowledge entry
   */
  createEntry(entry: Partial<KnowledgeEntry> & { title: string; content: string }): KnowledgeEntry {
    const id = uuidv4();
    const now = Date.now();

    const knowledgeEntry: KnowledgeEntry = {
      id,
      title: entry.title,
      content: entry.content,
      type: entry.type || 'fact',
      tags: entry.tags || [],
      linkedArtifacts: entry.linkedArtifacts || [],
      linkedDocuments: entry.linkedDocuments || [],
      linkedEntries: entry.linkedEntries || [],
      confidence: entry.confidence ?? 1.0,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.set(id, knowledgeEntry);
    this.eventBus.emit('knowledge:entry:created', { id, title: knowledgeEntry.title });

    return knowledgeEntry;
  }

  /**
   * Get a knowledge entry
   */
  getEntry(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Update a knowledge entry
   */
  updateEntry(id: string, updates: Partial<KnowledgeEntry>): KnowledgeEntry | undefined {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    const updated: KnowledgeEntry = {
      ...entry,
      ...updates,
      id: entry.id,
      createdAt: entry.createdAt,
      updatedAt: Date.now(),
    };

    this.entries.set(id, updated);
    this.eventBus.emit('knowledge:entry:updated', { id, title: updated.title });

    return updated;
  }

  /**
   * Delete a knowledge entry
   */
  deleteEntry(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.entries.delete(id);
    this.embeddings.delete(id);
    this.eventBus.emit('knowledge:entry:deleted', { id, title: entry.title });

    return true;
  }

  /**
   * Create a note
   */
  createNote(note: Partial<Note> & { title: string; content: string }): Note {
    const id = uuidv4();
    const now = Date.now();

    const newNote: Note = {
      id,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      linkedArtifacts: note.linkedArtifacts || [],
      linkedDocuments: note.linkedDocuments || [],
      createdAt: now,
      updatedAt: now,
    };

    this.notes.set(id, newNote);
    this.eventBus.emit('knowledge:note:created', { id, title: newNote.title });

    return newNote;
  }

  /**
   * Get a note
   */
  getNote(id: string): Note | undefined {
    return this.notes.get(id);
  }

  /**
   * Update a note
   */
  updateNote(id: string, updates: Partial<Note>): Note | undefined {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const updated: Note = {
      ...note,
      ...updates,
      id: note.id,
      createdAt: note.createdAt,
      updatedAt: Date.now(),
    };

    this.notes.set(id, updated);
    this.eventBus.emit('knowledge:note:updated', { id, title: updated.title });

    return updated;
  }

  /**
   * Delete a note
   */
  deleteNote(id: string): boolean {
    const note = this.notes.get(id);
    if (!note) return false;

    this.notes.delete(id);
    this.eventBus.emit('knowledge:note:deleted', { id, title: note.title });

    return true;
  }

  /**
   * Link entries together
   */
  linkEntries(fromId: string, toId: string): boolean {
    const from = this.entries.get(fromId);
    const to = this.entries.get(toId);

    if (!from || !to) return false;

    if (!from.linkedEntries.includes(toId)) {
      from.linkedEntries.push(toId);
    }
    if (!to.linkedEntries.includes(fromId)) {
      to.linkedEntries.push(fromId);
    }

    this.eventBus.emit('knowledge:entries:linked', { fromId, toId });

    return true;
  }

  /**
   * Link entry to artifact
   */
  linkToArtifact(entryId: string, artifactId: string): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    if (!entry.linkedArtifacts.includes(artifactId)) {
      entry.linkedArtifacts.push(artifactId);
      this.eventBus.emit('knowledge:entry:artifact:linked', { entryId, artifactId });
    }

    return true;
  }

  /**
   * Get entries by type
   */
  getByType(type: KnowledgeType): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.type === type);
  }

  /**
   * Get entries by tag
   */
  getByTag(tag: string): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.tags.includes(tag));
  }

  /**
   * Search knowledge entries
   */
  search(query: string, limit = 10): KnowledgeEntry[] {
    const terms = query.toLowerCase().split(/\s+/);
    const results: Array<{ entry: KnowledgeEntry; score: number }> = [];

    for (const entry of this.entries.values()) {
      let score = 0;
      const contentLower = entry.content.toLowerCase();
      const titleLower = entry.title.toLowerCase();

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (contentLower.includes(term)) score += 5;
        if (entry.tags.some(t => t.toLowerCase().includes(term))) score += 3;
      }

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.entry);
  }

  /**
   * Get related entries
   */
  getRelated(entryId: string, limit = 5): KnowledgeEntry[] {
    const entry = this.entries.get(entryId);
    if (!entry) return [];

    const related: Array<{ entry: KnowledgeEntry; score: number }> = [];

    for (const other of this.entries.values()) {
      if (other.id === entryId) continue;

      let score = 0;

      // Linked entries
      if (entry.linkedEntries.includes(other.id)) score += 10;

      // Common tags
      const commonTags = entry.tags.filter(t => other.tags.includes(t));
      score += commonTags.length * 3;

      // Common linked artifacts
      const commonArtifacts = entry.linkedArtifacts.filter(a => other.linkedArtifacts.includes(a));
      score += commonArtifacts.length * 5;

      if (score > 0) {
        related.push({ entry: other, score });
      }
    }

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.entry);
  }

  /**
   * Get all notes
   */
  getAllNotes(): Note[] {
    return Array.from(this.notes.values());
  }

  /**
   * Get knowledge statistics
   */
  getStats(): {
    totalEntries: number;
    totalNotes: number;
    byType: Record<KnowledgeType, number>;
    averageConfidence: number;
  } {
    const entries = Array.from(this.entries.values());
    
    const byType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      totalConfidence += entry.confidence;
    }

    return {
      totalEntries: entries.length,
      totalNotes: this.notes.size,
      byType: byType as Record<KnowledgeType, number>,
      averageConfidence: entries.length > 0 ? totalConfidence / entries.length : 0,
    };
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default KnowledgeManager;
