---
lca: LCA-0002
title: Artifact DNA Specification
author: LocalCircus
status: Active
created: 2026-07-08
version: 0.1
---

# LCA-0002: Artifact DNA Specification

## Summary

This specification defines the standard structure for Artifact DNA — the immutable, versioned identity record that travels with every artifact in the LocalCircus ecosystem.

## Motivation

For artifacts to be discoverable, installable, and composable, they need a standardized identity format. The Artifact DNA provides:

- **Identity** — Unique identification and versioning
- **Capabilities** — What the artifact can do
- **Dependencies** — What the artifact needs
- **Compatibility** — Where and how the artifact works
- **Provenance** — Origin and history
- **Security** — Cryptographic signatures

## Specification

### 1. Identity

```typescript
interface ArtifactIdentity {
  uuid: string;        // UUID v7
  name: string;         // Unique name (lowercase, hyphenated)
  type: ArtifactType;   // From enum
  version: string;      // SemVer 2.0.0
  displayName?: string; // Human-readable name
}
```

### 2. Capabilities

```typescript
interface Capability {
  id: string;          // e.g., "tool:search"
  version?: string;    // Optional semver
  description?: string;
  parameters?: CapabilityParam[];
}
```

### 3. Dependencies

```typescript
interface Dependency {
  reference: ArtifactReference;
  versionRange: string; // Semver range
  optional: boolean;
  peer?: boolean;
}
```

### 4. Compatibility

```typescript
interface Compatibility {
  platforms?: Platform[];
  architectures?: Architecture[];
  localcircus?: VersionRange;
  runtime?: RuntimeRequirement[];
}
```

### 5. Provenance

```typescript
interface Provenance {
  source?: SourceInfo;
  published?: PublishInfo;
  lineage?: LineageInfo;
  history?: HistoryEntry[];
}
```

### 6. Signatures

```typescript
interface Signatures {
  creator?: Signature;
  registry?: Signature;
  endorsements?: Signature[];
}
```

### 7. Metadata

```typescript
interface ArtifactMetadata {
  description: string;
  keywords: string[];
  license: string;
  homepage?: string;
  documentation?: string;
  repository?: string;
  size?: number;
  checksum?: string;
}
```

## Complete Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-123456789abc",
  "name": "codex-search-plugin",
  "type": "plugin",
  "version": "2.1.0",
  "displayName": "Codex Search Plugin",
  "capabilities": [
    { "id": "tool:search", "description": "Full-text search" },
    { "id": "tool:index" }
  ],
  "dependencies": [
    {
      "reference": { "name": "plugin-sdk" },
      "versionRange": "^2.0.0",
      "optional": false
    }
  ],
  "compatibility": {
    "platforms": ["linux", "macos", "windows"],
    "architectures": ["x64", "arm64"],
    "localcircus": { "min": "1.5.0" }
  },
  "provenance": {
    "source": {
      "url": "https://github.com/localcircus/codex-search-plugin",
      "git": { "commit": "abc123" }
    },
    "published": {
      "publishedAt": "2026-06-15T10:00:00Z",
      "publisher": { "name": "LocalCircus Team" }
    }
  },
  "signatures": {
    "creator": {
      "algorithm": "ed25519",
      "keyId": "localcircus-team",
      "value": "..."
    }
  },
  "metadata": {
    "description": "Full-text search plugin for Codex",
    "keywords": ["search", "codex", "indexing"],
    "license": "MIT",
    "homepage": "https://localcircus.dev/plugins/codex-search"
  }
}
```

## Schema

See `lca-0002-artifact-dna.schema.json` for the complete JSON Schema.

## Versioning

This specification follows SemVer. Changes are backwards-compatible additions only.

## References

- LCA-0005: Capability Tags
- LCA-0006: Compatibility Matrix

## Copyright

This document is in the public domain under CC0-1.0.
