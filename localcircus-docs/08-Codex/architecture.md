# Codex Architecture

> Documentation system for LocalCircus.

## Overview

Codex is the central documentation hub for LocalCircus, providing architecture guides, tutorials, API references, and artifact documentation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Codex                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Documentation Layer                      │   │
│  │                                                            │   │
│  │   Architecture │ Tutorials │ API Reference │ Artifacts   │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Search Layer                           │   │
│  │                                                            │   │
│  │   Full-text Search │ Semantic Search │ Filters            │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Storage Layer                          │   │
│  │                                                            │   │
│  │   Content Store │ Versioning │ Search Index               │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Documentation Structure

```
codex/
├── architecture/
│   ├── overview.md
│   ├── ringmaster-core.md
│   ├── registry.md
│   ├── bigtop.md
│   └── security.md
├── tutorials/
│   ├── getting-started.md
│   ├── first-plugin.md
│   ├── custom-agent.md
│   └── workflow-automation.md
├── api-reference/
│   ├── rest.md
│   ├── graphql.md
│   └── websockets.md
├── artifacts/
│   ├── model.md
│   ├── agent.md
│   ├── workflow.md
│   ├── tool.md
│   └── plugin.md
└── standards/
    ├── lca-process.md
    ├── naming-conventions.md
    └── contribution.md
```

## Content Management

### Document Types

```typescript
interface Document {
  id: string;
  slug: string;
  
  // Content
  title: string;
  description: string;
  content: string;  // Markdown/MDX
  
  // Metadata
  category: Category;
  tags: string[];
  
  // Relationships
  relatedDocs: string[];
  examples: Example[];
  
  // Versioning
  version?: string;
  lastUpdated: string;
  changelog?: ChangelogEntry[];
}

type Category = 
  | 'architecture'
  | 'tutorial'
  | 'api-reference'
  | 'artifact-reference'
  | 'standard'
  | 'guide';
```

### Frontmatter

```markdown
---
title: Getting Started with LocalCircus
description: Learn the basics of LocalCircus
category: tutorial
tags: [getting-started, basics]
version: "1.5.0"
lastUpdated: 2026-07-08
relatedDocs: [installation, basic-concepts]
---

# Getting Started
...
```

## Search

### Search Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Search Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query                                                       │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────┐                                                 │
│  │  Parser    │  Extract keywords, intent                         │
│  └─────────────┘                                                 │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────┐                                                 │
│  │  Indexes   │  Full-text + Semantic                           │
│  └─────────────┘                                                 │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────┐                                                 │
│  │  Ranker    │  Relevance scoring                              │
│  └─────────────┘                                                 │
│       │                                                           │
│       ▼                                                           │
│  Results                                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Search Features

```typescript
interface SearchConfig {
  // Full-text search
  fullText: {
    enabled: boolean;
    analyzer: 'standard' | 'code' | 'markdown';
    fields: string[];  // ['title', 'content', 'tags']
  };
  
  // Semantic search
  semantic: {
    enabled: boolean;
    model: string;
    dimensions: number;
  };
  
  // Filters
  filters: {
    category?: Category[];
    tags?: string[];
    version?: string;
  };
  
  // Ranking
  ranking: {
    titleWeight: number;
    contentWeight: number;
    tagWeight: number;
    recencyWeight: number;
  };
}
```

### Search API

```typescript
interface SearchRequest {
  query: string;
  
  // Search modes
  mode?: 'fulltext' | 'semantic' | 'hybrid';
  
  // Filters
  filters?: {
    category?: string[];
    tags?: string[];
    version?: string;
  };
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Options
  highlight?: boolean;
  suggestions?: boolean;
}

interface SearchResult {
  document: Document;
  score: number;
  highlights: Highlight[];
  suggestions?: string[];
}
```

### Search UI

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search Codex...                                   [⌘K] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Results for "workflow trigger"                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📄 Workflow Triggers                              95% ││
│ │ A workflow trigger defines when a workflow should... ││
│ │ ...schedule <em>trigger</em>, webhook <em>trigger</em>...││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📄 Tutorial: Workflow Automation                    87% ││
│ │ Learn how to create automated <em>workflows</em>...    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📄 API: Triggers                                    82% ││
│ │ POST /workflows/{id}/triggers - Create a trigger...  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Did you mean: workflow trigger events?                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Navigation

### Sidebar Structure

```typescript
interface NavigationConfig {
  sections: NavSection[];
}

interface NavSection {
  id: string;
  title: string;
  icon?: string;
  
  items: NavItem[];
}

interface NavItem {
  id: string;
  title: string;
  slug: string;
  badge?: string;        // e.g., "New", "Beta"
  children?: NavItem[];  // For nested items
}
```

### Navigation Example

```typescript
const navigation: NavigationConfig = {
  sections: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { id: 'intro', title: 'Introduction', slug: 'introduction' },
        { id: 'install', title: 'Installation', slug: 'installation' },
        { id: 'quickstart', title: 'Quick Start', slug: 'quick-start' }
      ]
    },
    {
      id: 'architecture',
      title: 'Architecture',
      items: [
        { id: 'overview', title: 'Overview', slug: 'overview' },
        { id: 'core', title: 'Ringmaster Core', slug: 'ringmaster-core' },
        { id: 'registry', title: 'Registry', slug: 'registry' }
      ]
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      items: [
        { id: 'first-plugin', title: 'Your First Plugin', slug: 'tutorials/first-plugin' },
        { id: 'custom-agent', title: 'Build an Agent', slug: 'tutorials/custom-agent' },
        { id: 'automation', title: 'Workflow Automation', slug: 'tutorials/workflow-automation' }
      ]
    }
  ]
};
```

### Sidebar UI

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  Codex                                           [Search]│
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│ Getting    │  # Introduction                                 │
│ Started ▶  │                                                  │
│            │  Welcome to LocalCircus...                     │
│ Architecture│                                                  │
│  Overview  │                                                  │
│  Core      │                                                  │
│  Registry  │                                                  │
│            │                                                  │
│ Tutorials ▶│                                                  │
│            │                                                  │
│ API Ref ▶  │                                                  │
│            │                                                  │
│ Artifacts ▶│                                                  │
│            │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

## Code Examples

### Syntax Highlighting

```typescript
interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  lineNumbers?: boolean;
  highlight?: number[];  // Lines to highlight
  title?: string;
}
```

### Interactive Examples

```typescript
interface InteractiveExample {
  id: string;
  
  // Code to display
  code: string;
  language: 'typescript' | 'javascript' | 'bash';
  
  // Executable
  executable: boolean;
  
  // Test harness
  testCode?: string;
  
  // Expected output
  expectedOutput?: string;
}
```

### Example Display

````markdown
```typescript filename="example.ts"
import { ArtifactManager } from '@localcircus/artifact-sdk';

const manager = new ArtifactManager();
const artifact = await manager.create({
  name: 'my-plugin',
  type: 'plugin'
});
```
````

## Versioning

### Version Management

```typescript
interface VersionedDoc {
  versions: DocVersion[];
  currentVersion: string;
  latestVersion: string;
}

interface DocVersion {
  version: string;
  path: string;
  releasedAt: string;
  isCurrent: boolean;
}
```

### Version Selector

```
┌─────────────────────────────────────────────────────────────┐
│ Version: [1.5.0 ▼]                                         │
│            (latest: 1.6.0)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ This is the documentation for LocalCircus 1.5.0             │
│                                                             │
│ Looking for the latest? View [1.6.0 documentation]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Content API

### REST Endpoints

```typescript
// Get document
GET /docs/:slug

// Search documents
GET /docs/search?q=:query&category=:category

// List by category
GET /docs?category=:category

// Get navigation
GET /navigation

// Get versions
GET /docs/:slug/versions
```

### GraphQL

```graphql
type Query {
  doc(slug: String!): Document
  docs(category: Category, limit: Int, offset: Int): [Document]
  search(query: String!, filters: SearchFilters): SearchResults
  navigation: NavigationConfig
}
```

## Theming

### Custom Styles

```typescript
interface CodexTheme {
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    codeFontFamily: string;
    fontSizeBase: string;
  };
  
  // Layout
  layout: {
    sidebarWidth: string;
    contentMaxWidth: string;
  };
  
  // Code blocks
  code: {
    theme: string;  // 'github-dark', 'github-light', etc.
  };
}
```

## Accessibility

### Features

- Keyboard navigation
- ARIA labels
- Skip links
- Focus indicators
- Screen reader support
- High contrast mode
- Reduced motion

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open search |
| `Cmd+/` | Show shortcuts |
| `[` / `]` | Previous/Next page |
| `Cmd+Shift+P` | Command palette |
| `Escape` | Close modal/menu |

## Performance

### Optimization

```typescript
interface PerformanceConfig {
  // Static generation
  staticGeneration: {
    enabled: boolean;
    revalidateInterval: number;  // seconds
  };
  
  // Caching
  caching: {
    html: number;    // seconds
    search: number;
    assets: number;
  };
  
  // Lazy loading
  lazyLoading: {
    images: boolean;
    codeBlocks: boolean;
    examples: boolean;
  };
  
  // Compression
  compression: {
    html: boolean;
    css: boolean;
    js: boolean;
  };
}
```

## Related Documents

- [API Reference](./api-reference.md)
- [Artifact Reference](./artifact-reference.md)
- [Tutorial: First Plugin](./tutorials/first-plugin.md)
