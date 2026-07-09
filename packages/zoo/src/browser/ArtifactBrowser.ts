/**
 * ArtifactBrowser
 * 
 * Browse and search artifacts in the Local Zoo.
 */

import { ArtifactManager, ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import {
  ArtifactCard,
  Category,
  SearchFilters,
  SortOptions,
  DEFAULT_CATEGORIES,
  getTypeIcon,
  getCategoryForType,
} from '../types';

export class ArtifactBrowser {
  private artifactManager: ArtifactManager;
  private eventBus: EventBus;
  private categories: Category[];
  private installedIds: Set<string> = new Set();

  constructor(artifactManager: ArtifactManager, eventBus?: EventBus) {
    this.artifactManager = artifactManager;
    this.eventBus = eventBus || new EventBus();
    this.categories = DEFAULT_CATEGORIES;
  }

  /**
   * Get all categories
   */
  getCategories(): Category[] {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  /**
   * Get category for artifact type
   */
  getCategoryForType(type: ArtifactType): Category {
    return getCategoryForType(type);
  }

  /**
   * Browse all artifacts with optional filters
   */
  async browse(filters?: SearchFilters, sort?: SortOptions): Promise<ArtifactCard[]> {
    let artifacts = await this.artifactManager.list();

    // Apply filters
    if (filters) {
      if (filters.type) {
        artifacts = artifacts.filter(a => a.type === filters.type);
      }

      if (filters.category) {
        const category = this.getCategory(filters.category);
        if (category) {
          artifacts = artifacts.filter(a => category.types.includes(a.type));
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        artifacts = artifacts.filter(a =>
          filters.tags!.some(tag =>
            a.metadata.keywords.some(k => k.toLowerCase().includes(tag.toLowerCase()))
          )
        );
      }

      if (filters.installed !== undefined) {
        if (filters.installed) {
          artifacts = artifacts.filter(a => this.installedIds.has(a.uuid));
        } else {
          artifacts = artifacts.filter(a => !this.installedIds.has(a.uuid));
        }
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        artifacts = artifacts.filter(a =>
          a.name.toLowerCase().includes(query) ||
          a.metadata.description.toLowerCase().includes(query) ||
          a.metadata.keywords.some(k => k.toLowerCase().includes(query))
        );
      }
    }

    // Apply sorting
    const sortField = sort?.field || 'name';
    const sortDir = sort?.direction || 'asc';

    artifacts.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updated':
          comparison = (a.updatedAt || 0) - (b.updatedAt || 0);
          break;
        case 'installed':
          const aInstalled = this.installedIds.has(a.uuid) ? 1 : 0;
          const bInstalled = this.installedIds.has(b.uuid) ? 1 : 0;
          comparison = aInstalled - bInstalled;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortDir === 'desc' ? -comparison : comparison;
    });

    // Convert to cards
    return artifacts.map(a => this.toCard(a));
  }

  /**
   * Search artifacts
   */
  async search(query: string): Promise<ArtifactCard[]> {
    const artifacts = await this.artifactManager.search(query);
    return artifacts.map(a => this.toCard(a));
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(id: string): Promise<ArtifactCard | null> {
    const artifact = await this.artifactManager.get(id);
    if (!artifact) {
      // Try by name
      const byName = await this.artifactManager.getByName(id);
      if (!byName) return null;
      return this.toCard(byName);
    }
    return this.toCard(artifact);
  }

  /**
   * Get artifacts by type
   */
  async getByType(type: ArtifactType): Promise<ArtifactCard[]> {
    const artifacts = await this.artifactManager.list({ type });
    return artifacts.map(a => this.toCard(a));
  }

  /**
   * Get artifacts by category
   */
  async getByCategory(categoryId: string): Promise<ArtifactCard[]> {
    const category = this.getCategory(categoryId);
    if (!category) return [];

    const artifacts = await this.artifactManager.list();
    const filtered = artifacts.filter(a => category.types.includes(a.type));
    return filtered.map(a => this.toCard(a));
  }

  /**
   * Get featured artifacts
   */
  async getFeatured(): Promise<ArtifactCard[]> {
    const artifacts = await this.artifactManager.list();
    
    // Simple featured: most recently updated with keywords
    const featured = artifacts
      .filter(a => a.metadata.keywords.length > 0)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 10);

    return featured.map(a => this.toCard(a));
  }

  /**
   * Get recently updated
   */
  async getRecent(limit = 10): Promise<ArtifactCard[]> {
    const artifacts = await this.artifactManager.list();
    
    const recent = artifacts
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit);

    return recent.map(a => this.toCard(a));
  }

  /**
   * Convert artifact to card
   */
  private toCard(artifact: ArtifactDNA): ArtifactCard {
    const category = getCategoryForType(artifact.type);

    return {
      artifact,
      displayName: artifact.displayName || artifact.name,
      shortDescription: this.truncate(artifact.metadata.description, 100),
      icon: getTypeIcon(artifact.type),
      category,
      tags: artifact.metadata.keywords.slice(0, 5),
      installed: this.installedIds.has(artifact.uuid),
    };
  }

  /**
   * Truncate text
   */
  private truncate(text: string, length: number): string {
    if (!text || text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
  }

  /**
   * Mark artifact as installed
   */
  markInstalled(artifactId: string): void {
    this.installedIds.add(artifactId);
    this.eventBus.emit('zoo:installed', { artifactId });
  }

  /**
   * Mark artifact as not installed
   */
  markUninstalled(artifactId: string): void {
    this.installedIds.delete(artifactId);
    this.eventBus.emit('zoo:uninstalled', { artifactId });
  }

  /**
   * Check if artifact is installed
   */
  isInstalled(artifactId: string): boolean {
    return this.installedIds.has(artifactId);
  }

  /**
   * Get installed artifacts
   */
  async getInstalled(): Promise<ArtifactCard[]> {
    const artifacts = await this.artifactManager.list();
    const installed = artifacts.filter(a => this.installedIds.has(a.uuid));
    return installed.map(a => this.toCard(a));
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    installed: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const artifacts = await this.artifactManager.list();

    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const artifact of artifacts) {
      const category = getCategoryForType(artifact.type);
      byCategory[category.name] = (byCategory[category.name] || 0) + 1;
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
    }

    return {
      total: artifacts.length,
      installed: this.installedIds.size,
      byCategory,
      byType,
    };
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default ArtifactBrowser;
