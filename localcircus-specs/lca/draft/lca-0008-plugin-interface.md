---
lca: LCA-0008
title: Plugin Interface Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0008: Plugin Interface Specification

## Summary

Standardized API for creating extensions to LocalCircus.

## Plugin Structure

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  
  onLoad(context: PluginContext): Promise<void>;
  onUnload(): Promise<void>;
  
  commands?: Command[];
  tools?: Tool[];
  panels?: Panel[];
}

interface PluginContext {
  plugin: { id: string; name: string; version: string };
  api: LocalCircusAPI;
  logger: Logger;
  storage: StorageAPI;
  secrets: SecretsAPI;
}
```

## Commands

```typescript
interface Command {
  id: string;           // e.g., "my-plugin:say-hello"
  name: string;         // e.g., "Say Hello"
  category?: string;
  keybinding?: {
    primary: string;    // e.g., "cmd+shift+h"
  };
  handler: (context: CommandContext) => Promise<void>;
}
```

## Tools

```typescript
interface Tool {
  id: string;
  name: string;
  description: string;  // Used by LLMs
  parameters: JSONSchema;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  output?: string;
  error?: { code: string; message: string };
}
```

## UI Panels

```typescript
interface Panel {
  id: string;
  name: string;
  location: 'left' | 'right' | 'bottom' | 'top' | 'modal';
  component: React.ComponentType;
  size?: { width?: number; height?: number };
  resizable?: boolean;
  collapsible?: boolean;
}
```

## Storage

```typescript
interface StorageAPI {
  global: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
  };
  workspace: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
  };
}
```

## Permissions

```typescript
type Permission = 
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:request'
  | 'network:request:${domain}'
  | 'secrets:read'
  | 'secrets:write'
  | 'ui:panel'
  | 'ui:notification';
```

## Plugin Manifest

```yaml
plugin:
  id: my-plugin
  name: My Plugin
  version: 1.0.0
  main: dist/index.js
  
  capabilities:
    - tool:my-tool
    - ui:panel
  
  permissions:
    - filesystem:read
    - network:request
```

## Lifecycle

```typescript
async function onLoad(context: PluginContext): Promise<void> {
  // 1. Validate permissions
  // 2. Initialize
  // 3. Register extensions
  context.api.commands.register(myCommand);
  context.api.tools.register(myTool);
  // 4. Subscribe to events
}

async function onUnload(): Promise<void> {
  // Cleanup
}
```
