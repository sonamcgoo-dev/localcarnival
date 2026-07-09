/**
 * Publisher
 * 
 * Publishes artifacts to registries.
 */

import { ArtifactDNA } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { LocalStorage } from '@localcircus/storage';
import { ValidationPipeline } from '../validation/ValidationPipeline';
import { PublishConfig, PublishResult, SigningConfig } from '../types';

export class Publisher {
  private eventBus: EventBus;
  private storage: LocalStorage;
  private validation: ValidationPipeline;
  private registry: string;

  constructor(
    registry: string = 'local',
    storage?: LocalStorage,
    validation?: ValidationPipeline
  ) {
    this.eventBus = new EventBus();
    this.registry = registry;
    this.storage = storage || new LocalStorage();
    this.validation = validation || new ValidationPipeline();
  }

  /**
   * Publish an artifact
   */
  async publish(dna: ArtifactDNA, config: PublishConfig = {}): Promise<PublishResult> {
    const errors: string[] = [];

    // Validate unless skipped
    if (!config.skipValidation) {
      const { canPublish, blockingErrors } = this.validation.canPublish(dna);
      
      if (!canPublish) {
        return {
          success: false,
          dna,
          errors: blockingErrors.map(e => e.message),
        };
      }
    }

    // Sign unless skipped
    if (!config.skipSignature && !dna.signatures?.creator) {
      // In production, this would use actual signing
      // For now, just mark as unsigned
      dna.signatures = dna.signatures || {};
    }

    try {
      // Save to local storage
      await this.storage.save(`registry:${dna.uuid}`, dna);
      await this.storage.save(`registry:index:${dna.name}`, {
        uuid: dna.uuid,
        name: dna.name,
        type: dna.type,
        version: dna.version,
        updatedAt: Date.now(),
      });

      const publishedAt = Date.now();

      this.eventBus.emit('artifact:published', {
        uuid: dna.uuid,
        name: dna.name,
        version: dna.version,
        registry: this.registry,
        publishedAt,
      });

      return {
        success: true,
        dna,
        publishedAt,
        url: this.getArtifactUrl(dna),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      this.eventBus.emit('artifact:publish:error', {
        uuid: dna.uuid,
        error: errorMessage,
      });

      return {
        success: false,
        dna,
        errors,
      };
    }
  }

  /**
   * Unpublish an artifact
   */
  async unpublish(name: string, version?: string): Promise<boolean> {
    try {
      const indexKey = version 
        ? `registry:versions:${name}:${version}`
        : `registry:index:${name}`;

      await this.storage.delete(indexKey);

      this.eventBus.emit('artifact:unpublished', { name, version });
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update an existing artifact
   */
  async update(dna: ArtifactDNA): Promise<PublishResult> {
    // Check if exists
    const existing = await this.storage.read<ArtifactDNA>(`registry:${dna.uuid}`);
    
    if (!existing) {
      return {
        success: false,
        dna,
        errors: ['Artifact not found'],
      };
    }

    return this.publish(dna, { skipValidation: true });
  }

  /**
   * Deprecate an artifact
   */
  async deprecate(
    name: string,
    message: string
  ): Promise<boolean> {
    try {
      const index = await this.storage.read<any>(`registry:index:${name}`);
      
      if (index) {
        index.deprecated = true;
        index.deprecationMessage = message;
        await this.storage.save(`registry:index:${name}`, index);
      }

      this.eventBus.emit('artifact:deprecated', { name, message });
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get published artifact
   */
  async getPublished(uuid: string): Promise<ArtifactDNA | null> {
    return this.storage.read<ArtifactDNA>(`registry:${uuid}`);
  }

  /**
   * Get published artifact by name
   */
  async getByName(name: string): Promise<ArtifactDNA | null> {
    const index = await this.storage.read<{ uuid: string }>(`registry:index:${name}`);
    
    if (index?.uuid) {
      return this.storage.read<ArtifactDNA>(`registry:${index.uuid}`);
    }
    
    return null;
  }

  /**
   * List all published artifacts
   */
  async listPublished(options: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ArtifactDNA[]> {
    const artifacts: ArtifactDNA[] = [];
    const limit = options.limit || 100;
    
    // In production, this would use a proper index
    // For now, iterate through storage
    const keys = await this.storage.list?.() || [];
    
    for (const key of keys) {
      if (key.startsWith('registry:') && !key.includes(':index:')) {
        const artifact = await this.storage.read<ArtifactDNA>(key);
        if (artifact) {
          if (!options.type || artifact.type === options.type) {
            artifacts.push(artifact);
          }
        }
      }
      
      if (artifacts.length >= limit) break;
    }

    return artifacts.slice(options.offset || 0, limit);
  }

  /**
   * Get URL for published artifact
   */
  private getArtifactUrl(dna: ArtifactDNA): string {
    return `localcircus://${dna.name}@${dna.version}`;
  }

  /**
   * Set registry URL
   */
  setRegistry(registry: string): void {
    this.registry = registry;
  }

  /**
   * Get registry URL
   */
  getRegistry(): string {
    return this.registry;
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default Publisher;
