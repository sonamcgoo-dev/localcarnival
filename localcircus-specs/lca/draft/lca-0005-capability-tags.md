---
lca: LCA-0005
title: Capability Tags Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0005: Capability Tags Specification

## Summary

Standardized identifiers for describing artifact capabilities.

## Tag Format

```
category:subcategory[:action]
```

| Level | Required | Example |
|-------|----------|---------|
| category | Yes | `model`, `tool` |
| subcategory | Yes | `model:chat`, `tool:search` |
| action | No | `tool:search:full-text` |

## Rules

1. Lowercase only
2. Alphanumeric + hyphen
3. Colon separated
4. Max 3 levels
5. No leading/trailing colons

## Core Categories

### model

| Capability | Description |
|------------|-------------|
| `model:chat` | Conversational models |
| `model:completion` | Text completion |
| `model:embedding` | Text embeddings |
| `model:image` | Image generation |

### tool

| Capability | Description |
|------------|-------------|
| `tool:search` | Search interface |
| `tool:filesystem` | File operations |
| `tool:http` | HTTP requests |
| `tool:browser` | Browser automation |

### agent

| Capability | Description |
|------------|-------------|
| `agent:task` | Task-oriented agents |
| `agent:chat` | Conversational agents |

### trigger

| Capability | Description |
|------------|-------------|
| `trigger:schedule` | Cron scheduling |
| `trigger:webhook` | Webhook triggers |

### storage

| Capability | Description |
|------------|-------------|
| `storage:vector` | Vector storage |
| `storage:keyvalue` | Key-value storage |

## Validation

```typescript
const CAPABILITY_REGEX = /^[a-z][a-z0-9]*(?::[a-z][a-z0-9]*){1,2}(?:@[0-9]+\.[0-9]+\.[0-9]+)?$/;

function validateCapability(capability: string): boolean {
  return CAPABILITY_REGEX.test(capability);
}
```

## Versioning

```
tool:search@1.0        # Exactly 1.0
tool:search@^1.0       # >=1.0 <2.0
tool:search@~1.0       # >=1.0 <1.1
```
