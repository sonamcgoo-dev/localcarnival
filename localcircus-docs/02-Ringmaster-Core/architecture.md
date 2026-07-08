# Ringmaster Core Architecture

> The engine that powers the LocalCircus ecosystem.

## Overview

Ringmaster Core is the runtime orchestration layer handling execution, scheduling, events, and resource allocation.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Ringmaster Core                       │
├─────────────────────────────────────────────────────────┤
│  Runtime Engine │ Scheduler │ Event Bus                 │
│  Provider Router │ Memory    │ Secrets Vault            │
│  Health Monitor │ Metrics   │ Logging                   │
├─────────────────────────────────────────────────────────┤
│                   Plugin Runtimes                       │
│         MCP Runtime │ ACP Runtime │ API Runtime         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### Runtime Engine

```typescript
interface RuntimeEngine {
  execute(workflow: Workflow, context: ExecutionContext): Promise<ExecutionResult>;
  cancel(executionId: string): Promise<void>;
  getStatus(executionId: string): ExecutionStatus;
}
```

### Scheduler

```typescript
interface Scheduler {
  schedule(task: ScheduledTask): string;
  cancel(taskId: string): void;
  listTasks(): ScheduledTask[];
}

interface ScheduledTask {
  id: string;
  name: string;
  cron?: string;
  interval?: number;
  handler: () => Promise<void>;
}
```

### Event Bus

```typescript
interface EventBus {
  publish(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: EventHandler): Subscription;
}

type TopicPattern = 'artifact:*' | 'user.??' | 'system.#';
```

### Provider Router

```typescript
interface ProviderRouter {
  route(request: ProviderRequest): Promise<ProviderResponse>;
  addProvider(config: ProviderConfig): void;
}

type RoutingStrategy = 'cost' | 'latency' | 'capability' | 'round-robin';
```

### Memory Engine

```typescript
interface MemoryEngine {
  remember(key: string, value: any): Promise<void>;
  recall(key: string): Promise<Memory[]>;
  search(query: string): Promise<Memory[]>;
}

interface Memory {
  key: string;
  value: any;
  type: 'fact' | 'preference' | 'context' | 'history';
  importance: 'critical' | 'high' | 'medium' | 'low';
}
```

### Secrets Vault

```typescript
interface SecretsVault {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
```

## Configuration

```yaml
ringmaster:
  runtime:
    maxConcurrency: 100
    defaultTimeout: 300000
    sandboxEnabled: true
    
  scheduler:
    enabled: true
    timezone: UTC
    recoveryEnabled: true
    
  eventBus:
    adapter: memory  # or redis, kafka
    
  providers:
    defaultStrategy: capability
    healthCheckInterval: 30000
    
  memory:
    windowSize: 100
    maxTokens: 64000
```

## Related Documents

- [LCA-0007: Provider Interface](../localcircus-specs/lca/draft/lca-0007-provider-interface.md)
- [LCA-0008: Plugin Interface](../localcircus-specs/lca/draft/lca-0008-plugin-interface.md)
