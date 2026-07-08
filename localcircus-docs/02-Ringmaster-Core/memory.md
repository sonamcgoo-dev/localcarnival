# Memory Service Specification

> Persistent context and conversation memory for LocalCircus.

## Overview

Memory Service manages conversation context, user preferences, and workspace state.

## Memory Types

### 1. Working Memory (Short-term)

Fast access to recent conversation context.

```typescript
interface WorkingMemory {
  messages: Message[];
  maxTokens: number;
  summary?: string;
  keyFacts: Fact[];
}
```

### 2. Semantic Memory (Medium-term)

Embeddings-based storage.

```typescript
interface SemanticMemory {
  facts: Fact[];
  embeddings: Vector[];
}

interface Fact {
  id: string;
  content: string;
  category: 'preference' | 'knowledge' | 'plan' | 'constraint';
  confidence: number;
  createdAt: Date;
}
```

### 3. Episodic Memory (Long-term)

Event history and experiences.

```typescript
interface EpisodicMemory {
  episodes: Episode[];
  patterns: Pattern[];
}

interface Episode {
  id: string;
  title: string;
  outcome: 'success' | 'failure' | 'partial';
  duration?: number;
}
```

### 4. Shared Memory (Multi-agent)

Cross-agent shared context.

```typescript
interface SharedMemory {
  workspace: WorkspaceState;
  teamContext: TeamContext;
}
```

## API

```typescript
interface MemoryManager {
  // Working memory
  getContext(conversationId: string): Promise<ConversationContext>;
  
  // Semantic operations
  remember(fact: Fact): Promise<void>;
  recall(query: string): Promise<Fact[]>;
  
  // Episodic
  recordEpisode(episode: Episode): Promise<void>;
  recallEpisodes(query: string): Promise<Episode[]>;
  
  // Management
  prune(options?: PruneOptions): Promise<PruneResult>;
}
```

## Storage

| Type | Storage | TTL |
|------|---------|-----|
| Working | Redis | 1 hour |
| Semantic | Qdrant | Persistent |
| Episodic | PostgreSQL | 90 days |

## Configuration

```yaml
memory:
  working:
    adapter: redis
    defaultTTL: 3600
    
  semantic:
    adapter: qdrant
    vectorSize: 1536
    
  episodic:
    adapter: postgres
    retention:
      defaultDays: 90
```
