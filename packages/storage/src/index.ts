/**
 * LocalCircus Storage
 * 
 * Local storage for artifacts.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

export interface StorageConfig {
  basePath: string;
}

export interface ArtifactFile {
  uuid: string;
  data: any;
  createdAt: number;
  updatedAt: number;
}

export class LocalStorage {
  private basePath: string;

  constructor(config: StorageConfig) {
    this.basePath = config.basePath;
  }

  /**
   * Initialize storage
   */
  async init(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  /**
   * Get storage path for an artifact
   */
  private getArtifactPath(uuid: string): string {
    return path.join(this.basePath, `${uuid}.json`);
  }

  /**
   * Save an artifact
   */
  async save(uuid: string, data: any): Promise<void> {
    const filePath = this.getArtifactPath(uuid);
    const now = Date.now();
    
    // Check if exists
    let createdAt = now;
    if (existsSync(filePath)) {
      const existing = await this.readFile(uuid);
      if (existing) {
        createdAt = existing.createdAt;
      }
    }

    const file: ArtifactFile = {
      uuid,
      data,
      createdAt,
      updatedAt: now,
    };

    await fs.writeFile(filePath, JSON.stringify(file, null, 2), 'utf-8');
  }

  /**
   * Read an artifact
   */
  async read(uuid: string): Promise<any | null> {
    const file = await this.readFile(uuid);
    return file?.data ?? null;
  }

  /**
   * Read artifact file
   */
  async readFile(uuid: string): Promise<ArtifactFile | null> {
    const filePath = this.getArtifactPath(uuid);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Delete an artifact
   */
  async delete(uuid: string): Promise<boolean> {
    const filePath = this.getArtifactPath(uuid);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all artifacts
   */
  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  /**
   * List all artifacts with metadata
   */
  async listWithMetadata(): Promise<ArtifactFile[]> {
    const uuids = await this.list();
    const files: ArtifactFile[] = [];

    for (const uuid of uuids) {
      const file = await this.readFile(uuid);
      if (file) {
        files.push(file);
      }
    }

    return files.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Check if artifact exists
   */
  async exists(uuid: string): Promise<boolean> {
    const filePath = this.getArtifactPath(uuid);
    return existsSync(filePath);
  }

  /**
   * Get artifact metadata
   */
  async getMetadata(uuid: string): Promise<{ createdAt: number; updatedAt: number } | null> {
    const file = await this.readFile(uuid);
    if (!file) return null;
    
    return {
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  /**
   * Export all artifacts
   */
  async export(): Promise<ArtifactFile[]> {
    return this.listWithMetadata();
  }

  /**
   * Import artifacts
   */
  async import(files: ArtifactFile[]): Promise<void> {
    await this.init();
    
    for (const file of files) {
      await this.save(file.uuid, file.data);
    }
  }

  /**
   * Clear all artifacts
   */
  async clear(): Promise<void> {
    const files = await fs.readdir(this.basePath);
    
    for (const file of files) {
      await fs.unlink(path.join(this.basePath, file));
    }
  }

  /**
   * Get storage stats
   */
  async stats(): Promise<{
    count: number;
    totalSize: number;
    oldest?: number;
    newest?: number;
  }> {
    const files = await this.listWithMetadata();
    
    if (files.length === 0) {
      return { count: 0, totalSize: 0 };
    }

    let totalSize = 0;
    for (const file of files) {
      const filePath = this.getArtifactPath(file.uuid);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;
    }

    return {
      count: files.length,
      totalSize,
      oldest: Math.min(...files.map(f => f.createdAt)),
      newest: Math.max(...files.map(f => f.updatedAt)),
    };
  }
}

// Default storage path
export function getDefaultStoragePath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  return path.join(home, '.localcircus', 'storage');
}

// Factory
export function createStorage(basePath?: string): LocalStorage {
  return new LocalStorage({
    basePath: basePath || getDefaultStoragePath(),
  });
}
