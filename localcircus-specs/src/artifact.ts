/**
 * LocalCircus TypeScript Types
 * Generated from LCA specifications
 */

// =============================================================================
// Artifact Types (LCA-0002)
// =============================================================================

export type ArtifactType = 
  | 'model' | 'agent' | 'workflow' | 'tool' | 'plugin' | 'extension'
  | 'mcp-server' | 'acp-tool' | 'api-connector' | 'dataset'
  | 'knowledge-pack' | 'prompt-pack' | 'memory-pack' | 'theme'
  | 'workspace' | 'project-template' | 'benchmark' | 'evaluation'
  | 'documentation';

export type UUID = string;
export type SemVer = string;

export interface ArtifactIdentity {
  uuid: UUID;
  name: string;
  type: ArtifactType;
  version: SemVer;
  displayName?: string;
}

export interface Capability {
  id: string;
  version?: SemVer;
  description?: string;
  parameters?: CapabilityParam[];
}

export interface CapabilityParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
}

export interface Dependency {
  reference: ArtifactReference;
  versionRange: string;
  optional: boolean;
  peer?: boolean;
}

export interface ArtifactReference {
  name: string;
  type?: ArtifactType;
}

export interface Compatibility {
  platforms?: Platform[];
  architectures?: Architecture[];
  localcircus?: VersionRange;
  runtime?: RuntimeRequirement[];
}

export type Platform = 'windows' | 'macos' | 'linux' | 'wasm';
export type Architecture = 'x64' | 'arm64' | 'wasm32';

export interface VersionRange {
  min?: string;
  max?: string;
  exclusive?: boolean;
}

export interface RuntimeRequirement {
  type: 'node' | 'browser' | 'deno' | 'python' | 'go';
  versionRange?: string;
}

export interface Provenance {
  source?: { url: string; git?: { commit: string; branch?: string; tag?: string } };
  published?: { publishedAt: string; publisher: CreatorInfo; registry: string };
  lineage?: { forkedFrom?: ArtifactReference; parent?: ArtifactReference };
  history?: HistoryEntry[];
}

export interface CreatorInfo {
  name: string;
  email?: string;
  url?: string;
}

export interface HistoryEntry {
  timestamp: string;
  author: CreatorInfo;
  message: string;
  type: 'created' | 'updated' | 'forked' | 'published';
}

export interface Signatures {
  creator?: Signature;
  registry?: Signature;
}

export interface Signature {
  algorithm: 'ed25519' | 'rsa' | 'ecdsa';
  keyId: string;
  value: string;
  created: string;
}

export interface ArtifactMetadata {
  description: string;
  keywords: string[];
  license: string;
  homepage?: string;
  documentation?: string;
  repository?: string;
  size?: number;
}

export interface ArtifactDNA {
  uuid: UUID;
  name: string;
  type: ArtifactType;
  version: SemVer;
  displayName?: string;
  capabilities: Capability[];
  dependencies: Dependency[];
  optionalDependencies?: Dependency[];
  peerDependencies?: Dependency[];
  compatibility: Compatibility;
  provenance: Provenance;
  signatures: Signatures;
  metadata: ArtifactMetadata;
}

// =============================================================================
// Registry Types (LCA-0004)
// =============================================================================

export interface RegistryNode {
  id: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | 'LIKE' | 'IN';
  value: unknown;
}

// =============================================================================
// Compatibility Types (LCA-0006)
// =============================================================================

export interface CompatibilityMatrix {
  artifactId: string;
  artifactVersion: SemVer;
  platforms?: { supported: Platform[]; unsupported?: Platform[] };
  architectures?: { supported: Architecture[]; unsupported?: Architecture[] };
  runtimes?: { node?: VersionRange; python?: { min?: string; max?: string } };
  localcircus?: VersionRange;
  gpu?: GPURequirement;
}

export interface GPURequirement {
  required: boolean;
  memory?: string;
  computeCapability?: string[];
  types?: ('nvidia' | 'amd' | 'apple')[];
}

// =============================================================================
// Provider Types (LCA-0007)
// =============================================================================

export type ProviderStatus = 
  | { state: 'ready' }
  | { state: 'error'; message: string }
  | { state: 'rate-limited' };

export interface Provider {
  id: string;
  name: string;
  auth: AuthConfig;
  endpoint: string;
  capabilities: Capability[];
  status: ProviderStatus;
}

export interface AuthConfig {
  type: 'api-key' | 'bearer' | 'oauth2' | 'basic' | 'none';
  headerName?: string;
  headerPrefix?: string;
  envVar?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// =============================================================================
// Plugin Types (LCA-0008)
// =============================================================================

export interface Plugin {
  id: string;
  name: string;
  version: SemVer;
  onLoad(context: PluginContext): Promise<void>;
  onUnload(): Promise<void>;
  commands?: Command[];
  tools?: Tool[];
}

export interface PluginContext {
  plugin: { id: string; name: string; version: string };
  api: unknown;
  logger: Logger;
  storage: StorageAPI;
  secrets: SecretsAPI;
}

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface StorageAPI {
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

export interface SecretsAPI {
  get(key: string): Promise<string>;
  set(key: string, value: string): Promise<void>;
}

export interface Command {
  id: string;
  name: string;
  handler: (context: CommandContext) => Promise<void>;
}

export interface CommandContext {
  args?: unknown;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: { code: string; message: string };
}
