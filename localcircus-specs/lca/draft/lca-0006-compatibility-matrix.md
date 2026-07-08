---
lca: LCA-0006
title: Compatibility Matrix Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0006: Compatibility Matrix Specification

## Summary

Structured format for declaring and resolving compatibility between artifacts, platforms, and versions.

## Compatibility Dimensions

### 1. Platform

```typescript
type Platform = 'windows' | 'macos' | 'linux' | 'wasm';
```

### 2. Architecture

```typescript
type Architecture = 'x64' | 'arm64' | 'wasm32';
```

### 3. Runtime

```typescript
interface RuntimeRequirement {
  type: 'node' | 'browser' | 'deno' | 'python' | 'go';
  versionRange?: string;  // Semver range
}
```

### 4. LocalCircus Version

```typescript
interface VersionRange {
  min?: string;
  max?: string;
}
```

### 5. GPU Requirements

```typescript
interface GPURequirement {
  required: boolean;
  memory?: string;           // e.g., "8GB"
  computeCapability?: string[];
  types?: ('nvidia' | 'amd' | 'apple')[];
}
```

## Complete Matrix

```typescript
interface CompatibilityMatrix {
  artifactId: string;
  artifactVersion: string;
  
  platforms?: {
    supported: Platform[];
    unsupported?: Platform[];
  };
  
  architectures?: {
    supported: Architecture[];
    unsupported?: Architecture[];
  };
  
  runtimes?: {
    node?: VersionRange;
    python?: { min?: string; max?: string };
  };
  
  localcircus?: VersionRange;
  
  gpu?: GPURequirement;
  
  resources?: {
    memory?: string;
    disk?: string;
    cpu?: string;
  };
}
```

## Example

```json
{
  "artifactId": "0191f2a7-c123-7abc-def0-123456789abc",
  "artifactVersion": "2.1.0",
  
  "platforms": {
    "supported": ["linux", "macos", "windows"]
  },
  
  "architectures": {
    "supported": ["x64", "arm64"]
  },
  
  "runtimes": {
    "node": { "min": "18.0.0", "max": "22.0.0" }
  },
  
  "localcircus": { "min": "1.5.0" },
  
  "gpu": {
    "required": false,
    "types": ["nvidia"]
  }
}
```

## Compatibility Score

| Score | Meaning |
|-------|---------|
| 100 | Perfect match |
| 80-99 | Near perfect |
| 60-79 | Mostly compatible |
| 0-59 | Incompatible |
