---
lca: LCA-0007
title: Provider Interface Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0007: Provider Interface Specification

## Summary

Standardized API for connecting AI providers to LocalCircus.

## Provider Structure

```typescript
interface Provider {
  id: string;
  name: string;
  endpoint: string;
  auth: AuthConfig;
  capabilities: Capability[];
  status: ProviderStatus;
}

interface AuthConfig {
  type: 'api-key' | 'bearer' | 'oauth2' | 'basic' | 'none';
  headerName?: string;
  headerPrefix?: string;
  envVar?: string;
}

type ProviderStatus = 
  | { state: 'ready' }
  | { state: 'error'; message: string }
  | { state: 'rate-limited' };
```

## Capabilities

### Chat Model

```typescript
interface ModelCapability {
  type: 'model:chat';
  modelId: string;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsFunctionCalling?: boolean;
  supportsVision?: boolean;
  pricing?: {
    input: number;    // Per 1M tokens
    output: number;
    currency: string;
  };
}
```

### Embedding

```typescript
interface EmbeddingCapability {
  type: 'model:embedding';
  modelId: string;
  dimensions: number;
  normalized?: boolean;
  pricing?: { per1kTokens: number; currency: string };
}
```

## Chat API

```typescript
interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

## Routing Strategies

| Strategy | Description |
|----------|-------------|
| `cost` | Route to cheapest |
| `latency` | Route to fastest |
| `capability` | Route by capability match |
| `round-robin` | Distribute evenly |

## Official Providers

| Provider | Capabilities |
|----------|--------------|
| OpenAI | chat, embeddings, images |
| Anthropic | chat (Claude) |
| Google AI | chat (Gemini), embeddings |
| Ollama | chat, embeddings (local) |
