/**
 * Provider SDK
 * 
 * Connect AI providers to LocalCircus.
 */

import { EventBus } from '@localcircus/core';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface ChatFunction {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string | string[];
  stream?: boolean;
  functions?: ChatFunction[];
  functionCall?: 'auto' | 'none';
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  choices: ChatChoice[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  created: number;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

export interface EmbeddingsRequest {
  model: string;
  input: string | string[];
  encodingFormat?: 'float' | 'base64';
}

export interface EmbeddingsResponse {
  object: 'list';
  data: {
    object: 'embedding';
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  type: 'chat' | 'completion' | 'embedding';
  contextWindow: number;
  supportsStreaming: boolean;
  supportsFunctionCalling?: boolean;
  supportsVision?: boolean;
}

export interface ProviderError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// Provider Interface
// ============================================================================

export interface ProviderAdapter {
  id: string;
  name: string;
  
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  embeddings?(request: EmbeddingsRequest): Promise<EmbeddingsResponse>;
  
  models?(): Promise<Model[]>;
  
  health?(): Promise<{ status: 'ok' | 'error'; latency?: number }>;
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

// ============================================================================
// Base Provider
// ============================================================================

export abstract class BaseProvider implements ProviderAdapter {
  abstract id: string;
  abstract name: string;
  
  protected apiKey?: string;
  protected baseURL: string;
  protected timeout: number;
  protected maxRetries: number;
  protected eventBus?: EventBus;

  constructor(config: ProviderConfig = {}, eventBus?: EventBus) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 3;
    this.eventBus = eventBus;
  }

  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  async embeddings?(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    throw new Error('Embeddings not supported');
  }

  async models?(): Promise<Model[]> {
    return [];
  }

  async health?(): Promise<{ status: 'ok' | 'error'; latency?: number }> {
    return { status: 'ok' };
  }

  protected async fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const start = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.timeout),
      });

      const latency = Date.now() - start;

      if (!response.ok) {
        const error: ProviderError = {
          code: `HTTP_${response.status}`,
          message: await response.text(),
          statusCode: response.status,
          retryable: response.status >= 500 || response.status === 429,
        };

        this.eventBus?.emit('provider:error', { provider: this.id, error });

        if (error.retryable && options.method !== 'GET') {
          throw error;
        }

        throw new ProviderException(error);
      }

      this.eventBus?.emit('provider:request', {
        provider: this.id,
        url,
        latency,
      });

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ProviderException) {
        throw error;
      }
      
      const providerError: ProviderError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };

      throw new ProviderException(providerError);
    }
  }
}

// ============================================================================
// OpenAI Provider
// ============================================================================

export class OpenAIProvider extends BaseProvider {
  id = 'openai';
  name = 'OpenAI';

  constructor(config: ProviderConfig = {}, eventBus?: EventBus) {
    super(
      {
        baseURL: config.baseURL || 'https://api.openai.com/v1',
        ...config,
      },
      eventBus
    );
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.fetch<any>(
      `${this.baseURL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          top_p: request.topP,
          max_tokens: request.maxTokens,
          stop: request.stop,
          stream: request.stream,
          functions: request.functions,
          function_call: request.functionCall,
        }),
      }
    );

    return {
      id: response.id,
      object: 'chat.completion',
      choices: response.choices.map((c: any, i: number) => ({
        index: i,
        message: c.message,
        finishReason: c.finish_reason,
      })),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      created: response.created,
    };
  }

  async embeddings(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    const response = await this.fetch<any>(
      `${this.baseURL}/embeddings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          input: request.input,
          encoding_format: request.encodingFormat || 'float',
        }),
      }
    );

    return {
      object: 'list',
      data: response.data.map((d: any, i: number) => ({
        object: 'embedding',
        embedding: d.embedding,
        index: i,
      })),
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async models(): Promise<Model[]> {
    const response = await this.fetch<any>(
      `${this.baseURL}/models`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data
      .filter((m: any) => m.id.startsWith('gpt-'))
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        type: 'chat',
        contextWindow: 16385,
        supportsStreaming: true,
        supportsFunctionCalling: true,
      }));
  }
}

// ============================================================================
// Ollama Provider (Local)
// ============================================================================

export class OllamaProvider extends BaseProvider {
  id = 'ollama';
  name = 'Ollama (Local)';

  constructor(config: ProviderConfig = {}, eventBus?: EventBus) {
    super(
      {
        baseURL: config.baseURL || 'http://localhost:11434',
        ...config,
      },
      eventBus
    );
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.fetch<any>(
      `${this.baseURL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: request.stream,
        }),
      }
    );

    return {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.message?.content || '',
          },
          finishReason: response.done ? 'stop' : 'length',
        },
      ],
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      model: request.model,
      created: Math.floor(Date.now() / 1000),
    };
  }

  async models(): Promise<Model[]> {
    const response = await this.fetch<any>(`${this.baseURL}/api/tags`);

    return (response.models || []).map((m: any) => ({
      id: m.name,
      name: m.name,
      type: 'chat',
      contextWindow: 4096,
      supportsStreaming: true,
    }));
  }

  async health(): Promise<{ status: 'ok' | 'error'; latency?: number }> {
    const start = Date.now();
    
    try {
      await this.fetch<any>(`${this.baseURL}/api/tags`);
      return { status: 'ok', latency: Date.now() - start };
    } catch {
      return { status: 'error' };
    }
  }
}

// ============================================================================
// Provider Manager
// ============================================================================

export class ProviderManager {
  private providers: Map<string, ProviderAdapter> = new Map();
  private defaultProvider?: string;
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  register(provider: ProviderAdapter): void {
    this.providers.set(provider.id, provider);
    this.eventBus.emit('provider:registered', { providerId: provider.id });
  }

  unregister(id: string): boolean {
    const deleted = this.providers.delete(id);
    if (deleted) {
      this.eventBus.emit('provider:unregistered', { providerId: id });
    }
    return deleted;
  }

  get(id: string): ProviderAdapter | undefined {
    return this.providers.get(id);
  }

  getDefault(): ProviderAdapter | undefined {
    return this.defaultProvider ? this.providers.get(this.defaultProvider) : undefined;
  }

  setDefault(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider not found: ${id}`);
    }
    this.defaultProvider = id;
    this.eventBus.emit('provider:default', { providerId: id });
  }

  list(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  async chat(request: ChatRequest, providerId?: string): Promise<ChatResponse> {
    const provider = providerId 
      ? this.providers.get(providerId) 
      : this.getDefault();

    if (!provider) {
      throw new Error('No provider available');
    }

    return provider.chat(request);
  }
}

// ============================================================================
// Errors
// ============================================================================

export class ProviderException extends Error {
  error: ProviderError;

  constructor(error: ProviderError) {
    super(error.message);
    this.name = 'ProviderException';
    this.error = error;
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createProvider(type: string, config?: ProviderConfig, eventBus?: EventBus): ProviderAdapter {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config, eventBus);
    case 'ollama':
      return new OllamaProvider(config, eventBus);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
