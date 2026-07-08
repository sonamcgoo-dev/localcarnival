/**
 * LocalCircus Artifact SDK
 * 
 * Create and manage artifacts in the LocalCircus ecosystem.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type ArtifactType = 
  | 'model' | 'agent' | 'workflow' | 'tool' | 'plugin' | 'extension'
  | 'mcp-server' | 'acp-tool' | 'api-connector' | 'dataset'
  | 'knowledge-pack' | 'prompt-pack' | 'memory-pack' | 'theme'
  | 'workspace' | 'project-template' | 'benchmark' | 'evaluation'
  | 'documentation';

export interface Capability {
  id: string;
  version?: string;
  description?: string;
}

export interface Dependency {
  reference: { name: string; type?: ArtifactType };
  versionRange: string;
  optional: boolean;
  peer?: boolean;
}

export interface Compatibility {
  platforms?: Platform[];
  architectures?: Architecture[];
  localcircus?: VersionRange;
}

export type Platform = 'windows' | 'macos' | 'linux' | 'wasm';
export type Architecture = 'x64' | 'arm64' | 'wasm32';

export interface VersionRange {
  min?: string;
  max?: string;
}

export interface Provenance {
  source?: {
    url: string;
    git?: { commit: string; branch?: string; tag?: string };
  };
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
}

export interface ArtifactDNA {
  uuid: string;
  name: string;
  type: ArtifactType;
  version: string;
  displayName?: string;
  capabilities: Capability[];
  dependencies: Dependency[];
  compatibility: Compatibility;
  provenance: Provenance;
  signatures: { creator?: Signature; registry?: Signature };
  metadata: ArtifactMetadata;
}

// ============================================================================
// Artifact Manager
// ============================================================================

export interface ArtifactManagerConfig {
  registry: string;
  storage?: StorageAdapter;
}

export interface StorageAdapter {
  get(id: string): Promise<ArtifactDNA | null>;
  put(id: string, artifact: ArtifactDNA): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<string[]>;
}

export class ArtifactManager {
  private registry: string;
  private storage: StorageAdapter;

  constructor(config: ArtifactManagerConfig) {
    this.registry = config.registry;
    this.storage = config.storage || new LocalStorageAdapter();
  }

  async create(manifest: CreateManifest): Promise<ArtifactDNA> {
    const artifact: ArtifactDNA = {
      uuid: this.generateUUID(),
      name: manifest.name,
      type: manifest.type,
      version: manifest.version,
      displayName: manifest.displayName,
      capabilities: manifest.capabilities || [],
      dependencies: manifest.dependencies || [],
      compatibility: manifest.compatibility || {},
      provenance: {},
      signatures: {},
      metadata: {
        description: manifest.metadata?.description || '',
        keywords: manifest.metadata?.keywords || [],
        license: manifest.metadata?.license || 'MIT',
        homepage: manifest.metadata?.homepage,
        documentation: manifest.metadata?.documentation,
        repository: manifest.metadata?.repository,
      },
    };

    const validation = this.validate(artifact);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    await this.storage.put(artifact.uuid, artifact);
    return artifact;
  }

  async get(id: string): Promise<ArtifactDNA | null> {
    return this.storage.get(id);
  }

  async update(id: string, changes: Partial<ArtifactDNA>): Promise<ArtifactDNA> {
    const existing = await this.storage.get(id);
    if (!existing) throw new NotFoundError(id);
    const updated = { ...existing, ...changes, uuid: id };
    await this.storage.put(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async list(): Promise<ArtifactDNA[]> {
    const ids = await this.storage.list();
    const artifacts: ArtifactDNA[] = [];
    for (const id of ids) {
      const artifact = await this.storage.get(id);
      if (artifact) artifacts.push(artifact);
    }
    return artifacts;
  }

  validate(artifact: ArtifactDNA): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!artifact.uuid) errors.push({ code: 'MISSING_UUID', message: 'UUID is required' });
    if (!artifact.name) errors.push({ code: 'MISSING_NAME', message: 'Name is required' });
    if (!artifact.type) errors.push({ code: 'MISSING_TYPE', message: 'Type is required' });
    if (!artifact.version) errors.push({ code: 'MISSING_VERSION', message: 'Version is required' });

    if (artifact.name && !/^[a-z][a-z0-9-]*$/.test(artifact.name)) {
      errors.push({ code: 'INVALID_NAME', message: 'Name must be lowercase with hyphens', field: 'name' });
    }

    if (!artifact.capabilities?.length) {
      warnings.push({ code: 'NO_CAPABILITIES', message: 'No capabilities defined' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private generateUUID(): string {
    return uuidv4();
  }
}

export interface CreateManifest {
  name: string;
  type: ArtifactType;
  version: string;
  displayName?: string;
  capabilities?: Capability[];
  dependencies?: Dependency[];
  compatibility?: Compatibility;
  metadata?: Partial<ArtifactMetadata>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

// ============================================================================
// Errors
// ============================================================================

export class ArtifactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArtifactError';
  }
}

export class ValidationError extends ArtifactError {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends ArtifactError {
  id: string;
  constructor(id: string) {
    super(`Artifact not found: ${id}`);
    this.name = 'NotFoundError';
    this.id = id;
  }
}

// ============================================================================
// Local Storage Adapter
// ============================================================================

export class LocalStorageAdapter implements StorageAdapter {
  private store: Map<string, ArtifactDNA> = new Map();

  async get(id: string): Promise<ArtifactDNA | null> {
    return this.store.get(id) || null;
  }

  async put(id: string, artifact: ArtifactDNA): Promise<void> {
    this.store.set(id, artifact);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async list(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

// ============================================================================
// Builder
// ============================================================================

export class ArtifactBuilder {
  private artifact: Partial<ArtifactDNA> = {
    capabilities: [],
    dependencies: [],
    metadata: { description: '', keywords: [], license: 'MIT' },
  };

  name(name: string): this { this.artifact.name = name; return this; }
  type(type: ArtifactType): this { this.artifact.type = type; return this; }
  version(version: string): this { this.artifact.version = version; return this; }
  displayName(name: string): this { this.artifact.displayName = name; return this; }
  capability(cap: Capability): this { this.artifact.capabilities!.push(cap); return this; }
  dependency(dep: Dependency): this { this.artifact.dependencies!.push(dep); return this; }
  platform(platform: Platform): this {
    if (!this.artifact.compatibility) this.artifact.compatibility = {};
    if (!this.artifact.compatibility.platforms) this.artifact.compatibility.platforms = [];
    this.artifact.compatibility.platforms.push(platform);
    return this;
  }
  description(desc: string): this { this.artifact.metadata!.description = desc; return this; }
  keyword(keyword: string): this { this.artifact.metadata!.keywords!.push(keyword); return this; }
  license(license: string): this { this.artifact.metadata!.license = license; return this; }

  build(): ArtifactDNA {
    if (!this.artifact.name || !this.artifact.type || !this.artifact.version) {
      throw new ArtifactError('Name, type, and version are required');
    }
    return {
      uuid: uuidv4(),
      name: this.artifact.name,
      type: this.artifact.type,
      version: this.artifact.version,
      displayName: this.artifact.displayName,
      capabilities: this.artifact.capabilities || [],
      dependencies: this.artifact.dependencies || [],
      compatibility: this.artifact.compatibility || {},
      provenance: {},
      signatures: {},
      metadata: {
        description: this.artifact.metadata?.description || '',
        keywords: this.artifact.metadata?.keywords || [],
        license: this.artifact.metadata?.license || 'MIT',
      },
    };
  }
}

export default ArtifactManager;
