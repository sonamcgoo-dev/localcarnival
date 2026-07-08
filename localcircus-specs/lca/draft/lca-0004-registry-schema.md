---
lca: LCA-0004
title: Registry Schema Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0004: Registry Schema Specification

## Summary

This specification defines the schema for the LocalCircus Registry — the central knowledge graph for all artifacts.

## Graph Model

### Node Types

| Type | Description |
|------|-------------|
| Artifact | Artifact with DNA |
| Creator | Person or organization |
| Collection | Curated artifact groups |
| Capability | Capability node |

### Edge Types

| Edge | From → To | Properties |
|------|-----------|------------|
| DEPENDS_ON | Artifact → Artifact | versionRange, optional |
| PROVIDES | Artifact → Capability | - |
| REQUIRES | Artifact → Capability | optional |
| AUTHORED_BY | Artifact → Creator | - |
| MEMBER_OF | Artifact → Collection | - |
| FORKED_FROM | Artifact → Artifact | - |

## Artifact Node

```typescript
interface ArtifactNode {
  id: string;                // UUID v7
  name: string;
  type: ArtifactType;
  version: string;
  isVerified: boolean;
  trustScore: number;
  downloadCount: number;
  ratingAverage: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

```
GET    /artifacts              # List with filters
GET    /artifacts/:id          # Get by ID
POST   /artifacts/search       # Full-text + semantic search
GET    /capabilities           # List capabilities
POST   /graph/traverse         # Execute traversal query
```

## Database

**Recommended:** Neo4j (graph database)

**Alternatives:** Amazon Neptune, ArangoDB, Dgraph
