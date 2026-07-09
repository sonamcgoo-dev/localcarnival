/**
 * Codex
 * 
 * Documentation, knowledge management, and search for LocalCircus.
 */

export * from './types';
export { DocumentManager } from './docs/DocumentManager';
export { KnowledgeManager } from './knowledge/KnowledgeManager';

import { EventBus } from '@localcircus/core';
import { DocumentManager } from './docs/DocumentManager';
import { KnowledgeManager } from './knowledge/KnowledgeManager';
import { SearchOptions, SearchResult, DocumentCategory } from './types';

/**
 * Codex - Main class for documentation and knowledge
 */
export class Codex {
  readonly documents: DocumentManager;
  readonly knowledge: KnowledgeManager;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = new EventBus();
    this.documents = new DocumentManager(this.eventBus);
    this.knowledge = new KnowledgeManager(this.eventBus);
  }

  /**
   * Search across documents and knowledge
   */
  search(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    const limit = options.limit || 20;

    // Search documents
    if (!options.type || options.type === 'document' || options.type === 'all') {
      const docs = this.documents.list({
        category: options.category as DocumentCategory,
        tags: options.tags,
        draft: false,
      });

      for (const doc of docs) {
        const score = this.calculateScore(doc.title, doc.content, options.query);
        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.title,
            snippet: this.extractSnippet(doc.content, options.query),
            score,
            highlights: this.getHighlights(doc.content, options.query),
          });
        }
      }
    }

    // Search knowledge
    if (!options.type || options.type === 'knowledge' || options.type === 'all') {
      const entries = this.knowledge.search(options.query, limit);

      for (const entry of entries) {
        const score = this.calculateScore(entry.title, entry.content, options.query);
        results.push({
          id: entry.id,
          type: 'knowledge',
          title: entry.title,
          snippet: this.extractSnippet(entry.content, options.query),
          score,
          highlights: this.getHighlights(entry.content, options.query),
        });
      }
    }

    // Search notes
    if (!options.type || options.type === 'note' || options.type === 'all') {
      const notes = this.knowledge.getAllNotes();

      for (const note of notes) {
        const score = this.calculateScore(note.title, note.content, options.query);
        if (score > 0) {
          results.push({
            id: note.id,
            type: 'note',
            title: note.title,
            snippet: this.extractSnippet(note.content, options.query),
            score,
            highlights: this.getHighlights(note.content, options.query),
          });
        }
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(options.offset || 0, limit);
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(title: string, content: string, query: string): number {
    const terms = query.toLowerCase().split(/\s+/);
    let score = 0;

    for (const term of terms) {
      if (title.toLowerCase().includes(term)) score += 10;
      if (content.toLowerCase().includes(term)) score += 5;
    }

    return score;
  }

  /**
   * Extract snippet around match
   */
  private extractSnippet(content: string, query: string, length = 150): string {
    const terms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();

    // Find first match
    let matchIndex = content.length;
    for (const term of terms) {
      const idx = contentLower.indexOf(term);
      if (idx !== -1 && idx < matchIndex) {
        matchIndex = idx;
      }
    }

    if (matchIndex === content.length) {
      return content.slice(0, length) + '...';
    }

    // Extract around match
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, start + length);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get highlighted text
   */
  private getHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const terms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();

    for (const term of terms) {
      let index = 0;
      while ((index = contentLower.indexOf(term, index)) !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + term.length + 30);
        highlights.push(content.slice(start, end));
        index += term.length;
        if (highlights.length >= 3) break;
      }
      if (highlights.length >= 3) break;
    }

    return highlights;
  }

  /**
   * Get documentation categories
   */
  getCategories(): { id: DocumentCategory; name: string; description: string }[] {
    return [
      { id: 'getting-started', name: 'Getting Started', description: 'Quick start guides and tutorials' },
      { id: 'tutorials', name: 'Tutorials', description: 'Step-by-step learning guides' },
      { id: 'guides', name: 'Guides', description: 'In-depth how-to guides' },
      { id: 'api-reference', name: 'API Reference', description: 'Technical API documentation' },
      { id: 'specifications', name: 'Specifications', description: 'LCA specifications and standards' },
      { id: 'architecture', name: 'Architecture', description: 'System architecture docs' },
      { id: 'patterns', name: 'Patterns', description: 'Design patterns and best practices' },
      { id: 'troubleshooting', name: 'Troubleshooting', description: 'Problem solving guides' },
      { id: 'contributing', name: 'Contributing', description: 'How to contribute to LocalCircus' },
    ];
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

// Factory
export function createCodex(): Codex {
  return new Codex();
}

export default Codex;
