/**
 * DocumentManager
 * 
 * Manages documentation for LocalCircus.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@localcircus/core';
import { 
  Document, 
  DocumentCategory, 
  DocumentFormat, 
  DocumentMetadata,
  Tutorial,
  TutorialStep,
  APIEndpoint,
  Pattern
} from '../types';

// Built-in documents
const BUILT_IN_DOCS: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    content: `# Getting Started with LocalCircus

LocalCircus is a creative operating environment that amplifies human capability through intelligent tools, automation, and collaboration.

## Quick Start

1. **Install LocalCircus**
   \`\`\`bash
   npm install -g @localcircus/cli
   \`\`\`

2. **Initialize your workspace**
   \`\`\`bash
   circus init
   \`\`\`

3. **Start creating**
   \`\`\`bash
   circus web start
   \`\`\`

## Core Concepts

- **Artifacts**: Every piece of functionality is an artifact
- **Big Top**: The infinite canvas for visual workflow building
- **Local Zoo**: Browse and install artifacts
- **CodeForge**: Create your own artifacts
`,
    format: 'markdown',
    category: 'getting-started',
    tags: ['getting-started', 'quickstart', 'tutorial'],
    draft: false,
    metadata: {
      description: 'Get started with LocalCircus in minutes',
      difficulty: 'beginner',
      estimatedTime: '5 minutes',
    }
  },
  {
    title: 'Artifact System',
    slug: 'artifacts',
    content: `# Artifact System

Every piece of functionality in LocalCircus is an artifact.

## Artifact Types

| Type | Description |
|------|-------------|
| \`agent\` | Autonomous AI agents |
| \`model\` | AI language models |
| \`workflow\` | Automation workflows |
| \`tool\` | Utility tools |
| \`plugin\` | UI extensions |

## Artifact DNA

Every artifact has DNA - structured metadata that defines its identity, capabilities, and relationships.

\`\`\`typescript
interface ArtifactDNA {
  uuid: string;
  name: string;
  type: ArtifactType;
  version: string;
  capabilities: Capability[];
  dependencies: Dependency[];
  compatibility: Compatibility;
}
\`\`\`
`,
    format: 'markdown',
    category: 'guides',
    tags: ['artifacts', 'dna', 'capabilities'],
    draft: false,
    metadata: {
      description: 'Learn about the artifact system',
      difficulty: 'intermediate',
    }
  },
  {
    title: 'Big Top Canvas',
    slug: 'bigtop',
    content: `# Big Top Canvas

The infinite canvas for building visual workflows.

## Node Types

- **Trigger**: Starting points for workflows
- **Action**: Perform operations
- **Transform**: Modify data
- **Condition**: Branch logic
- **Loop**: Repeat operations

## Creating Workflows

1. Add nodes from the toolbar
2. Connect nodes by clicking ports
3. Configure node properties
4. Run and test

\`\`\`typescript
import { createBigTop } from '@localcircus/bigtop';

const bigtop = createBigTop('my-workflow');
bigtop.addNodeByType('trigger', { x: 100, y: 100 });
bigtop.addNodeByType('action', { x: 300, y: 100 });
\`\`\`
`,
    format: 'markdown',
    category: 'tutorials',
    tags: ['bigtop', 'canvas', 'workflows', 'nodes'],
    draft: false,
    metadata: {
      description: 'Build workflows visually with Big Top',
      difficulty: 'beginner',
      estimatedTime: '10 minutes',
    }
  }
];

export class DocumentManager {
  private documents: Map<string, Document> = new Map();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    this.loadBuiltInDocs();
  }

  private loadBuiltInDocs(): void {
    for (const doc of BUILT_IN_DOCS) {
      const id = uuidv4();
      const now = Date.now();
      this.documents.set(id, {
        ...doc,
        id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /**
   * Create a new document
   */
  create(doc: Partial<Document> & { title: string; content: string }): Document {
    const id = uuidv4();
    const now = Date.now();
    
    const document: Document = {
      id,
      title: doc.title,
      slug: doc.slug || this.generateSlug(doc.title),
      content: doc.content,
      format: doc.format || 'markdown',
      category: doc.category || 'guides',
      tags: doc.tags || [],
      author: doc.author,
      createdAt: now,
      updatedAt: now,
      publishedAt: doc.draft ? undefined : now,
      draft: doc.draft ?? true,
      metadata: doc.metadata || {},
    };

    this.documents.set(id, document);
    this.eventBus.emit('doc:created', { id, title: document.title });
    
    return document;
  }

  /**
   * Get a document by ID
   */
  get(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Get a document by slug
   */
  getBySlug(slug: string): Document | undefined {
    for (const doc of this.documents.values()) {
      if (doc.slug === slug) return doc;
    }
    return undefined;
  }

  /**
   * Update a document
   */
  update(id: string, updates: Partial<Document>): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    const updated: Document = {
      ...doc,
      ...updates,
      id: doc.id,
      createdAt: doc.createdAt,
      updatedAt: Date.now(),
    };

    this.documents.set(id, updated);
    this.eventBus.emit('doc:updated', { id, title: updated.title });
    
    return updated;
  }

  /**
   * Delete a document
   */
  delete(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;

    this.documents.delete(id);
    this.eventBus.emit('doc:deleted', { id, title: doc.title });
    
    return true;
  }

  /**
   * List all documents
   */
  list(options?: {
    category?: DocumentCategory;
    tags?: string[];
    draft?: boolean;
    limit?: number;
  }): Document[] {
    let docs = Array.from(this.documents.values());

    if (options?.category) {
      docs = docs.filter(d => d.category === options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      docs = docs.filter(d => 
        options.tags!.some(t => d.tags.includes(t))
      );
    }

    if (options?.draft !== undefined) {
      docs = docs.filter(d => d.draft === options.draft);
    }

    // Sort by updated date
    docs.sort((a, b) => b.updatedAt - a.updatedAt);

    if (options?.limit) {
      docs = docs.slice(0, options.limit);
    }

    return docs;
  }

  /**
   * Publish a document
   */
  publish(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    return this.update(id, { 
      draft: false, 
      publishedAt: Date.now() 
    });
  }

  /**
   * Unpublish a document
   */
  unpublish(id: string): Document | undefined {
    return this.update(id, { 
      draft: true, 
      publishedAt: undefined 
    });
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get documents by category
   */
  getByCategory(category: DocumentCategory): Document[] {
    return this.list({ category });
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default DocumentManager;
