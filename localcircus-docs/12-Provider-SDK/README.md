# Provider SDK

> Connect AI providers to LocalCircus.

## Overview

The Provider SDK enables developers to create adapters that connect AI providers (OpenAI, Anthropic, Google, etc.) to LocalCircus's Ringmaster Core.

## Installation

```bash
npm install @localcircus/provider-sdk
```

## Quick Start

```typescript
import { ProviderAdapter } from '@localcircus/provider-sdk';

class MyProvider implements ProviderAdapter {
  id = 'my-provider';
  name = 'My AI Provider';
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Implement provider-specific logic
    const response = await this.callAPI(request);
    return this.formatResponse(response);
  }
}
```

## ProviderAdapter Interface

```typescript
interface ProviderAdapter {
  // Identity
  id: string;
  name: string;
  
  // Capabilities
  capabilities: ProviderCapability[];
  
  // Authentication
  auth: AuthConfig;
  
  // API methods
  chat(request: ChatRequest): Promise<ChatResponse>;
  embeddings?(request: EmbeddingsRequest): Promise<EmbeddingsResponse>;
  models?(): Promise<Model[]>;
  
  // Health check
  health?(): Promise<HealthStatus>;
}
```

## Authentication

### API Key

```typescript
const provider = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY
});
```

### Bearer Token

```typescript
const provider = new CustomAdapter({
  auth: {
    type: 'bearer',
    token: process.env.ACCESS_TOKEN
  }
});
```

### OAuth 2.0

```typescript
const provider = new GoogleAIAdapter({
  auth: {
    type: 'oauth2',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: ['https://www.googleapis.com/auth/generative-language.retriever']
  }
});
```

### Basic Auth

```typescript
const provider = new LocalAdapter({
  auth: {
    type: 'basic',
    username: 'admin',
    password: process.env.PASSWORD
  }
});
```

## Chat Completion

### Request

```typescript
interface ChatRequest {
  model: string;
  
  messages: ChatMessage[];
  
  // Generation parameters
  temperature?: number;      // 0.0 - 2.0 (default: 0.7)
  topP?: number;            // 0.0 - 1.0
  maxTokens?: number;       // Max tokens to generate
  stop?: string | string[]; // Stop sequences
  
  // Streaming
  stream?: boolean;          // Enable streaming (default: false)
  
  // Functions
  functions?: ChatFunction[];
  functionCall?: 'auto' | 'none';
  
  // Metadata
  user?: string;
  metadata?: Record<string, string>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  
  // For function responses
  name?: string;
  
  // For multi-modal
  attachments?: Attachment[];
}

interface Attachment {
  type: 'image' | 'file';
  url: string;
  mimeType?: string;
}

interface ChatFunction {
  name: string;
  description?: string;
  parameters: JSONSchema;
}
```

### Response

```typescript
interface ChatResponse {
  id: string;
  object: 'chat.completion';
  
  choices: ChatChoice[];
  
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  model: string;
  created: number;  // Unix timestamp
}

interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  
  // For streaming
  delta?: Partial<ChatMessage>;
}
```

### Example Usage

```typescript
const response = await provider.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  maxTokens: 100
});

console.log(response.choices[0].message.content);
```

## Streaming

### Request Streaming

```typescript
const stream = await provider.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Write a story' }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0].delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

### Stream Response

```typescript
interface ChatStreamResponse {
  id: string;
  object: 'chat.completion.chunk';
  
  choices: [{
    index: number;
    delta: Partial<ChatMessage>;
    finishReason?: string;
  }];
  
  model: string;
  created: number;
}
```

## Embeddings

### Request

```typescript
interface EmbeddingsRequest {
  model: string;
  
  input: string | string[];
  
  // Encoding options
  encodingFormat?: 'float' | 'base64';
  
  dimensions?: number;  // For dimensional models
}
```

### Response

```typescript
interface EmbeddingsResponse {
  object: 'list';
  
  data: [{
    object: 'embedding';
    embedding: number[];  // or base64 string
    index: number;
  }];
  
  model: string;
  
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}
```

### Example

```typescript
const response = await provider.embeddings({
  model: 'text-embedding-3-small',
  input: ['Hello world', 'How are you?']
});

const embedding1 = response.data[0].embedding;
const embedding2 = response.data[1].embedding;
```

## Rate Limiting

The SDK includes built-in rate limiting.

```typescript
const provider = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
    tokensPerMinute: 90000
  }
});
```

### Custom Rate Limiter

```typescript
import { RateLimiter } from '@localcircus/provider-sdk';

const limiter = new RateLimiter({
  requestsPerMinute: 30,
  tokensPerMinute: 50000,
  
  // Storage backend
  storage: new RedisRateLimitStorage()
});

const provider = new CustomAdapter({
  rateLimiter: limiter
});
```

## Error Handling

```typescript
import { 
  ProviderError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NetworkError 
} from '@localcircus/provider-sdk';

try {
  const response = await provider.chat(request);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    await sleep(error.retryAfter);
    return retry(request);
  } else if (error instanceof AuthenticationError) {
    // Invalid API key
    console.error('Check your API key');
  } else if (error instanceof ValidationError) {
    // Invalid request parameters
    console.error('Validation failed:', error.details);
  } else if (error instanceof NetworkError) {
    // Connection issues
    console.error('Network error, retrying...');
  }
}
```

### Error Codes

```typescript
interface ProviderError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;  // Seconds
  details?: any;
}
```

## Model Management

### List Models

```typescript
const models = await provider.models();

for (const model of models) {
  console.log(`${model.id} - ${model.description}`);
}
```

### Model Structure

```typescript
interface Model {
  id: string;
  object: 'model';
  
  // Capabilities
  type: 'chat' | 'completion' | 'embedding';
  
  // Context
  contextWindow: number;
  
  // Capabilities
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  
  // Pricing
  pricing?: {
    input: number;   // Per 1M tokens
    output: number;
    currency: string;
  };
  
  // Metadata
  created?: number;
  deprecated?: boolean;
}
```

## Retry Logic

```typescript
const provider = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  
  retry: {
    maxRetries: 3,
    initialDelay: 1000,  // ms
    maxDelay: 30000,     // ms
    backoff: 'exponential',  // or 'linear'
    
    // Only retry on these errors
    retryableErrors: ['rate_limit', 'timeout', 'server_error']
  }
});
```

### Custom Retry

```typescript
import { retry } from '@localcircus/provider-sdk';

const response = await retry(
  () => provider.chat(request),
  {
    maxAttempts: 3,
    delay: 1000,
    shouldRetry: (error) => error.retryable
  }
);
```

## Creating a Provider Adapter

### Complete Example

```typescript
import { 
  ProviderAdapter, 
  ChatRequest, 
  ChatResponse,
  RateLimiter,
  ProviderError 
} from '@localcircus/provider-sdk';

export class MyProviderAdapter implements ProviderAdapter {
  id = 'my-provider';
  name = 'My AI Provider';
  
  private baseURL = 'https://api.myprovider.com';
  private apiKey: string;
  private rateLimiter: RateLimiter;
  
  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.rateLimiter = new RateLimiter({ requestsPerMinute: 60 });
  }
  
  get capabilities() {
    return [
      { type: 'model:chat', modelId: 'my-model' },
      { type: 'model:embedding', modelId: 'my-embedder' }
    ];
  }
  
  get auth() {
    return {
      type: 'bearer' as const,
      token: this.apiKey
    };
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    await this.rateLimiter.acquire();
    
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.formatRequest(request))
      });
      
      if (!response.ok) {
        throw new ProviderError(
          `API error: ${response.status}`,
          response.status,
          this.isRetryable(response.status)
        );
      }
      
      const data = await response.json();
      return this.formatResponse(data);
      
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      throw new ProviderError(
        `Request failed: ${error.message}`,
        500,
        true
      );
    }
  }
  
  private formatRequest(request: ChatRequest) {
    return {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream
    };
  }
  
  private formatResponse(data: any): ChatResponse {
    return {
      id: data.id,
      object: 'chat.completion',
      choices: [{
        index: 0,
        message: {
          role: data.choices[0].message.role,
          content: data.choices[0].message.content
        },
        finishReason: data.choices[0].finish_reason
      }],
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      model: data.model,
      created: data.created
    };
  }
  
  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }
}
```

## CLI Commands

```bash
# Register provider
circus provider add my-provider --type openai

# Configure provider
circus provider config my-provider --api-key $OPENAI_API_KEY

# List providers
circus provider list

# Test provider
circus provider test my-provider

# Set default
circus provider set-default my-provider

# Remove provider
circus provider remove my-provider
```

## Official Providers

### OpenAI

```typescript
import { OpenAIProvider } from '@localcircus/provider-sdk/providers/openai';

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
});
```

### Anthropic

```typescript
import { AnthropicProvider } from '@localcircus/provider-sdk/providers/anthropic';

const anthropic = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

### Google AI

```typescript
import { GoogleAIProvider } from '@localcircus/provider-sdk/providers/google';

const google = new GoogleAIProvider({
  apiKey: process.env.GOOGLE_API_KEY
});
```

### Ollama (Local)

```typescript
import { OllamaProvider } from '@localcircus/provider-sdk/providers/ollama';

const ollama = new OllamaProvider({
  baseURL: 'http://localhost:11434'
});
```

## Related Documents

- [LCA-0007: Provider Interface](../../localcircus-specs/lca/draft/lca-0007-provider-interface.md)
- [Ringmaster Core Architecture](../../02-Ringmaster-Core/architecture.md)
