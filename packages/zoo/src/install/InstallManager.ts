/**
 * InstallManager
 * 
 * Manage artifact installation, updates, and removal.
 */

import { ArtifactManager, ArtifactDNA } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { LocalStorage } from '@localcircus/storage';
import { InstallOptions, InstallResult, UpdateInfo, ZooConfig } from '../types';

export class InstallManager {
  private artifactManager: ArtifactManager;
  private storage: LocalStorage;
  private eventBus: EventBus;
  private installedPath: string;

  constructor(
    artifactManager: ArtifactManager,
    storage: LocalStorage,
    eventBus?: EventBus
  ) {
    this.artifactManager = artifactManager;
    this.storage = storage;
    this.eventBus = eventBus || new EventBus();
    this.installedPath = 'zoo:installed';
  }

  /**
   * Install an artifact
   */
  async install(
    artifact: ArtifactDNA,
    options: InstallOptions = {}
  ): Promise<InstallResult> {
    const errors: string[] = [];

    try {
      // Check if already installed
      const existing = await this.artifactManager.get(artifact.uuid);
      if (existing && !options.force) {
        return {
          success: false,
          artifact,
          installedAt: 0,
          errors: ['Artifact is already installed'],
        };
      }

      // Install artifact
      const installed = await this.artifactManager.create({
        name: artifact.name,
        type: artifact.type,
        version: options.version || artifact.version,
        displayName: artifact.displayName,
        capabilities: artifact.capabilities,
        dependencies: options.dependencies ? artifact.dependencies : [],
        compatibility: artifact.compatibility,
        provenance: artifact.provenance,
        metadata: artifact.metadata,
      });

      // Track installation
      await this.trackInstall(artifact.uuid, installed.uuid);

      this.eventBus.emit('zoo:install', {
        artifactId: artifact.uuid,
        installedId: installed.uuid,
        version: installed.version,
      });

      return {
        success: true,
        artifact: installed,
        installedAt: Date.now(),
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        artifact,
        installedAt: 0,
        errors,
      };
    }
  }

  /**
   * Uninstall an artifact
   */
  async uninstall(artifactId: string): Promise<boolean> {
    try {
      await this.artifactManager.delete(artifactId);
      await this.untrackInstall(artifactId);

      this.eventBus.emit('zoo:uninstall', { artifactId });
      return true;
    } catch (error) {
      this.eventBus.emit('zoo:error', {
        operation: 'uninstall',
        artifactId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check for updates
   */
  async checkUpdate(artifactId: string): Promise<UpdateInfo | null> {
    const installed = await this.artifactManager.get(artifactId);
    if (!installed) return null;

    // In a real implementation, this would check against a registry
    // For now, return null (no updates)
    return null;
  }

  /**
   * Update an artifact
   */
  async update(artifactId: string): Promise<InstallResult> {
    const update = await this.checkUpdate(artifactId);
    if (!update) {
      return {
        success: false,
        artifact: {} as ArtifactDNA,
        installedAt: 0,
        errors: ['No update available'],
      };
    }

    return this.install(update.artifact, { version: update.latestVersion });
  }

  /**
   * Update all artifacts with available updates
   */
  async updateAll(): Promise<{ updated: string[]; failed: string[] }> {
    const updated: string[] = [];
    const failed: string[] = [];

    const installed = await this.artifactManager.list();

    for (const artifact of installed) {
      const update = await this.checkUpdate(artifact.uuid);
      if (update) {
        const result = await this.update(artifact.uuid);
        if (result.success) {
          updated.push(artifact.uuid);
        } else {
          failed.push(artifact.uuid);
        }
      }
    }

    return { updated, failed };
  }

  /**
   * Get installed artifact IDs
   */
  async getInstalled(): Promise<string[]> {
    const data = await this.storage.read(this.installedPath);
    return (data as string[]) || [];
  }

  /**
   * Check if artifact is installed
   */
  async isInstalled(artifactId: string): Promise<boolean> {
    const installed = await this.getInstalled();
    return installed.includes(artifactId);
  }

  /**
   * Track installation
   */
  private async trackInstall(artifactId: string, installedId: string): Promise<void> {
    const installed = await this.getInstalled();
    if (!installed.includes(artifactId)) {
      installed.push(artifactId);
      await this.storage.save(this.installedPath, installed);
    }
  }

  /**
   * Untrack installation
   */
  private async untrackInstall(artifactId: string): Promise<void> {
    const installed = await this.getInstalled();
    const index = installed.indexOf(artifactId);
    if (index !== -1) {
      installed.splice(index, 1);
      await this.storage.save(this.installedPath, installed);
    }
  }

  /**
   * Export installed artifacts
   */
  async exportInstalled(): Promise<ArtifactDNA[]> {
    const installedIds = await this.getInstalled();
    const artifacts: ArtifactDNA[] = [];

    for (const id of installedIds) {
      const artifact = await this.artifactManager.get(id);
      if (artifact) {
        artifacts.push(artifact);
      }
    }

    return artifacts;
  }

  /**
   * Import artifacts
   */
  async importArtifacts(artifacts: ArtifactDNA[]): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const artifact of artifacts) {
      const result = await this.install(artifact);
      if (result.success) {
        imported++;
      } else if (result.errors?.includes('Artifact is already installed')) {
        skipped++;
      } else {
        errors.push(...(result.errors || []));
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default InstallManager;
