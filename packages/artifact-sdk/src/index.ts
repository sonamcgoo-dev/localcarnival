/**
 * Artifact SDK
 * 
 * Create and manage LocalCircus artifacts.
 */

import { v4 as uuidv4 } from 'uuid';
import { LocalStorage, getDefaultStoragePath } from '@localcircus/storage';
import { EventBus } from '@localcircus/core';

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
    commit?: string;
    branch?: string;
    tag?: string;
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
  createdAt?: number;
  updatedAt?: number;
}

export interface CreateManifest {
  name: string;
  type: ArtifactType;
  version: string;
  displayName?: string;
  capabilities?: Capability[];
  dependencies?: Dependency[];
  compatibility?: Compatibility;
  provenance?: Provenance;
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
// Artifact Manager
// ============================================================================

export interface ArtifactManagerConfig {
  storagePath?: string;
  eventBus?: EventBus;
}

export class ArtifactManager {
  private storage: LocalStorage;
  private eventBus: EventBus;

  constructor(config: ArtifactManagerConfig = {}) {
    this.storage = new LocalStorage({
      basePath: config.storagePath || getDefaultStoragePath(),
    });
    this.eventBus = config.eventBus || new EventBus();
  }

  async init(): Promise<void> {
    await this.storage.init();
  }

  /**
   * Create a new artifact
   */
  async create(manifest: CreateManifest): Promise<ArtifactDNA> {
    const now = Date.now();
    
    const artifact: ArtifactDNA = {
      uuid: uuidv4(),
      name: manifest.name,
      type: manifest.type,
      version: manifest.version,
      displayName: manifest.displayName,
      capabilities: manifest.capabilities || [],
      dependencies: manifest.dependencies || [],
      compatibility: manifest.compatibility || {},
      provenance: manifest.provenance || {},
      signatures: {},
      metadata: {
        description: manifest.metadata?.description || '',
        keywords: manifest.metadata?.keywords || [],
        license: manifest.metadata?.license || 'MIT',
        homepage: manifest.metadata?.homepage,
        documentation: manifest.metadata?.documentation,
        repository: manifest.metadata?.repository,
      },
      createdAt: now,
      updatedAt: now,
    };

    const validation = this.validate(artifact);
    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    await this.storage.save(artifact.uuid, artifact);
    this.eventBus.emit('artifact:created', { artifact });

    return artifact;
  }

  /**
   * Get an artifact by UUID
   */
  async get(uuid: string): Promise<ArtifactDNA | null> {
    return this.storage.read(uuid);
  }

  /**
   * Get artifact by name
   */
  async getByName(name: string): Promise<ArtifactDNA | null> {
    const all = await this.list();
    return all.find(a => a.name === name) || null;
  }

  /**
   * Update an artifact
   */
  async update(uuid: string, changes: Partial<ArtifactDNA>): Promise<ArtifactDNA> {
    const existing = await this.get(uuid);
    if (!existing) {
      throw new ArtifactNotFoundError(uuid);
    }

    const updated: ArtifactDNA = {
      ...existing,
      ...changes,
      uuid,
      updatedAt: Date.now(),
    };

    const validation = this.validate(updated);
    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    await this.storage.save(uuid, updated);
    this.eventBus.emit('artifact:updated', { artifact: updated });

    return updated;
  }

  /**
   * Delete an artifact
   */
  async delete(uuid: string): Promise<void> {
    const existing = await this.get(uuid);
    if (!existing) {
      throw new ArtifactNotFoundError(uuid);
    }

    await this.storage.delete(uuid);
    this.eventBus.emit('artifact:deleted', { uuid });
  }

  /**
   * List all artifacts
   */
  async list(filter?: { type?: ArtifactType }): Promise<ArtifactDNA[]> {
    const files = await this.storage.listWithMetadata();
    let artifacts = files.map(f => f.data);

    if (filter?.type) {
      artifacts = artifacts.filter(a => a.type === filter.type);
    }

    return artifacts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  /**
   * Search artifacts
   */
  async search(query: string): Promise<ArtifactDNA[]> {
    const all = await this.list();
    const lowerQuery = query.toLowerCase();

    return all.filter(a => 
      a.name.toLowerCase().includes(lowerQuery) ||
      a.metadata.description.toLowerCase().includes(lowerQuery) ||
      a.metadata.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Validate an artifact
   */
  validate(artifact: ArtifactDNA): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!artifact.uuid) errors.push({ code: 'MISSING_UUID', message: 'UUID is required' });
    if (!artifact.name) errors.push({ code: 'MISSING_NAME', message: 'Name is required' });
    if (!artifact.type) errors.push({ code: 'MISSING_TYPE', message: 'Type is required' });
    if (!artifact.version) errors.push({ code: 'MISSING_VERSION', message: 'Version is required' });

    // Name format
    if (artifact.name && !/^[a-z][a-z0-9-]*$/.test(artifact.name)) {
      errors.push({ 
        code: 'INVALID_NAME', 
        message: 'Name must be lowercase with hyphens only',
        field: 'name' 
      });
    }

    // Version format (semver)
    if (artifact.version && !/^\d+\.\d+\.\d+/.test(artifact.version)) {
      errors.push({ 
        code: 'INVALID_VERSION', 
        message: 'Version must be semver (x.y.z)',
        field: 'version' 
      });
    }

    // Metadata
    if (!artifact.metadata?.description) {
      warnings.push({ code: 'NO_DESCRIPTION', message: 'Description is recommended' });
    }

    if (!artifact.metadata?.license) {
      warnings.push({ code: 'NO_LICENSE', message: 'License is recommended' });
    }

    // Capabilities
    if (!artifact.capabilities?.length) {
      warnings.push({ code: 'NO_CAPABILITIES', message: 'No capabilities defined' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Get artifact stats
   */
  async stats(): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const all = await this.list();
    const storageStats = await this.storage.stats();

    const byType: Record<string, number> = {};
    for (const artifact of all) {
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
    }

    return {
      total: all.length,
      byType,
      totalSize: storageStats.totalSize,
    };
  }
}

// ============================================================================
// Artifact Builder
// ============================================================================

export class ArtifactBuilder {
  private artifact: Partial<ArtifactDNA> = {
    capabilities: [],
    dependencies: [],
    compatibility: {},
    provenance: {},
    signatures: {},
    metadata: { description: '', keywords: [], license: 'MIT' },
  };

  name(name: string): this {
    this.artifact.name = name;
    return this;
  }

  type(type: ArtifactType): this {
    this.artifact.type = type;
    return this;
  }

  version(version: string): this {
    this.artifact.version = version;
    return this;
  }

  displayName(name: string): this {
    this.artifact.displayName = name;
    return this;
  }

  capability(id: string, version?: string): this {
    this.artifact.capabilities!.push({ id, version });
    return this;
  }

  dependency(name: string, versionRange: string, type?: ArtifactType): this {
    this.artifact.dependencies!.push({
      reference: { name, type },
      versionRange,
      optional: false,
    });
    return this;
  }

  platform(platform: Platform): this {
    if (!this.artifact.compatibility!.platforms) {
      this.artifact.compatibility!.platforms = [];
    }
    this.artifact.compatibility!.platforms.push(platform);
    return this;
  }

  description(description: string): this {
    this.artifact.metadata!.description = description;
    return this;
  }

  keyword(keyword: string): this {
    this.artifact.metadata!.keywords!.push(keyword);
    return this;
  }

  license(license: string): this {
    this.artifact.metadata!.license = license;
    return this;
  }

  repository(url: string): this {
    this.artifact.metadata!.repository = url;
    return this;
  }

  build(): ArtifactDNA {
    if (!this.artifact.name || !this.artifact.type || !this.artifact.version) {
      throw new Error('Name, type, and version are required');
    }

    const now = Date.now();
    return {
      uuid: uuidv4(),
      name: this.artifact.name,
      type: this.artifact.type,
      version: this.artifact.version,
      displayName: this.artifact.displayName,
      capabilities: this.artifact.capabilities || [],
      dependencies: this.artifact.dependencies || [],
      compatibility: this.artifact.compatibility || {},
      provenance: this.artifact.provenance || {},
      signatures: this.artifact.signatures || {},
      metadata: {
        description: this.artifact.metadata?.description || '',
        keywords: this.artifact.metadata?.keywords || [],
        license: this.artifact.metadata?.license || 'MIT',
        homepage: this.artifact.metadata?.homepage,
        documentation: this.artifact.metadata?.documentation,
        repository: this.artifact.metadata?.repository,
      },
      createdAt: now,
      updatedAt: now,
    };
  }
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

export class ValidationException extends ArtifactError {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

export class ArtifactNotFoundError extends ArtifactError {
  uuid: string;

  constructor(uuid: string) {
    super(`Artifact not found: ${uuid}`);
    this.name = 'ArtifactNotFoundError';
    this.uuid = uuid;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ArtifactManager;
