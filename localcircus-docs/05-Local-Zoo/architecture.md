# Local Zoo — Artifact Discovery

> Browse, install, and manage artifacts from the ecosystem.

## Overview

Local Zoo is the artifact discovery and management system.

## Animal Categories

| Category | Icon | Types | Description |
|----------|------|-------|-------------|
| 🦁 Models | animal | `model` | AI language models |
| 🎭 Agents | performer | `agent` | Autonomous performers |
| 🎪 Acts | circus | `workflow` | Automation workflows |
| 🔧 Tools | wrench | `tool` | Executable utilities |
| 🎨 Performers | palette | `plugin`, `extension` | Extensions |
| 📦 MCP | box | `mcp-server` | MCP servers |
| 🔌 Providers | plug | `provider` | AI providers |
| 📚 Knowledge | books | `dataset`, `knowledge-pack` | Data resources |

## Browser Components

### Category Navigation
```typescript
interface CategoryNav {
  categories: Category[];
  selectCategory(category: Category): void;
}
```

### Search & Filters
```typescript
interface FilterState {
  platforms: Platform[];
  capabilities: string[];
  isVerified?: boolean;
  minRating?: number;
  sortBy: 'relevance' | 'downloads' | 'rating';
}
```

## Artifact Card

Based on LCA-0003 Artifact Card specification.

```
┌─────────────────────────────────┐
│ [Icon] Name                     │
│        v1.2.3 · type           │
├─────────────────────────────────┤
│ Description...                  │
├─────────────────────────────────┤
│ ⚡ tool:search  🔧 tool:api   │
├─────────────────────────────────┤
│ ⭐⭐⭐⭐☆  │  ✓ Verified      │
└─────────────────────────────────┘
```

## Install Manager

### Installation Flow

```typescript
interface InstallProgress {
  status: 'queued' | 'downloading' | 'installing' | 'verifying' | 'complete';
  progress: number;  // 0-100
}
```

### Steps
1. Validate compatibility
2. Download artifact
3. Verify signature
4. Install files
5. Register dependencies

## Collections

| Type | Description |
|------|-------------|
| My Collection | Installed artifacts |
| Favorites | User favorites |
| Curated | Featured by LocalCircus |
| Community | Community-created |

## Comparison Tool

Compare artifacts side-by-side:
- Overview (name, version, creator, rating)
- Capabilities
- Compatibility
- Benchmarks
- Dependencies
- Size

## Related Documents

- [LCA-0003: Artifact Card](../localcircus-specs/lca/draft/lca-0003-artifact-card.md)
- [Registry Service](../04-Registry/service.md)
