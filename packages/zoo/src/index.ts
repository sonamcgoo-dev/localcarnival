/**
 * Local Zoo
 * 
 * Local artifact browser and manager for LocalCircus.
 */

export * from './types';
export { ArtifactBrowser } from './browser/ArtifactBrowser';
export { InstallManager } from './install/InstallManager';

import { ArtifactManager } from '@localcircus/artifact-sdk';
import { LocalStorage, getDefaultStoragePath } from '@localcircus/storage';
import { EventBus } from '@localcircus/core';
import { ArtifactBrowser } from './browser/ArtifactBrowser';
import { InstallManager } from './install/InstallManager';
import { ZooConfig, Category, DEFAULT_CATEGORIES } from './types';

/**
 * LocalZoo - Main class for the Local Zoo
 */
export class LocalZoo {
  readonly browser: ArtifactBrowser;
  readonly install: InstallManager;
  private eventBus: EventBus;

  constructor(config: ZooConfig = {}) {
    this.eventBus = new EventBus();

    // Initialize storage
    const storage = new LocalStorage({
      basePath: config.storagePath || getDefaultStoragePath(),
    });

    // Initialize artifact manager
    const artifactManager = new ArtifactManager({
      storagePath: config.storagePath || getDefaultStoragePath(),
      eventBus: this.eventBus,
    });

    // Initialize browser and install manager
    this.browser = new ArtifactBrowser(artifactManager, this.eventBus);
    this.install = new InstallManager(artifactManager, storage, this.eventBus);
  }

  /**
   * Get all categories
   */
  getCategories(): Category[] {
    return DEFAULT_CATEGORIES;
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): Category | undefined {
    return DEFAULT_CATEGORIES.find(c => c.id === id);
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    installed: number;
    categories: number;
    byCategory: Record<string, number>;
  }> {
    const stats = await this.browser.getStats();
    return {
      total: stats.total,
      installed: stats.installed,
      categories: DEFAULT_CATEGORIES.length,
      byCategory: stats.byCategory,
    };
  }
}

// Factory
export function createZoo(config?: ZooConfig): LocalZoo {
  return new LocalZoo(config);
}

export default LocalZoo;
