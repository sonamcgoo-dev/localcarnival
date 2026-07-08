/**
 * Plugin Runtime
 * 
 * Plugin loading and management for LocalCircus.
 */

import { RingmasterCore } from '@localcircus/core';
import { LocalStorage } from '@localcircus/storage';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  
  onLoad?: (context: PluginContext) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}

export interface PluginContext {
  plugin: {
    id: string;
    name: string;
    version: string;
  };
  core: RingmasterCore;
  storage: LocalStorage;
  logger: Logger;
  config: Record<string, any>;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  main: string;
  capabilities?: string[];
  permissions?: string[];
}

export class PluginRuntime {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private core: RingmasterCore;
  private storage: LocalStorage;

  constructor(core: RingmasterCore, storage: LocalStorage) {
    this.core = core;
    this.storage = storage;
  }

  /**
   * Load a plugin
   */
  async load(pluginId: string, plugin: Plugin): Promise<void> {
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin already loaded: ${pluginId}`);
    }

    const logger: Logger = {
      debug: (msg, ...args) => console.debug(`[${pluginId}]`, msg, ...args),
      info: (msg, ...args) => console.info(`[${pluginId}]`, msg, ...args),
      warn: (msg, ...args) => console.warn(`[${pluginId}]`, msg, ...args),
      error: (msg, ...args) => console.error(`[${pluginId}]`, msg, ...args),
    };

    const context: PluginContext = {
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
      },
      core: this.core,
      storage: this.storage,
      logger,
      config: await this.loadConfig(pluginId),
    };

    const loaded: LoadedPlugin = {
      id: pluginId,
      plugin,
      context,
      loadedAt: Date.now(),
    };

    // Call onLoad
    if (plugin.onLoad) {
      try {
        await plugin.onLoad(context);
        logger.info(`Loaded plugin ${plugin.name} v${plugin.version}`);
      } catch (error) {
        logger.error('Failed to load plugin:', error);
        throw error;
      }
    }

    this.plugins.set(pluginId, loaded);
    this.core.getEventBus().emit('plugin:loaded', { pluginId, name: plugin.name });
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const loaded = this.plugins.get(pluginId);
    
    if (!loaded) {
      throw new Error(`Plugin not loaded: ${pluginId}`);
    }

    // Call onUnload
    if (loaded.plugin.onUnload) {
      try {
        await loaded.plugin.onUnload();
        loaded.context.logger.info(`Unloaded plugin ${loaded.plugin.name}`);
      } catch (error) {
        loaded.context.logger.error('Error during unload:', error);
      }
    }

    // Save config
    await this.saveConfig(pluginId, loaded.context.config);

    this.plugins.delete(pluginId);
    this.core.getEventBus().emit('plugin:unloaded', { pluginId });
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * List loaded plugins
   */
  listPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin context
   */
  getContext(pluginId: string): PluginContext | undefined {
    return this.plugins.get(pluginId)?.context;
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    const ids = Array.from(this.plugins.keys());
    
    for (const id of ids) {
      try {
        await this.unload(id);
      } catch (error) {
        console.error(`Failed to unload ${id}:`, error);
      }
    }
  }

  private async loadConfig(pluginId: string): Promise<Record<string, any>> {
    const config = await this.storage.read(`plugin:${pluginId}:config`);
    return config || {};
  }

  private async saveConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    await this.storage.save(`plugin:${pluginId}:config`, config);
  }
}

export interface LoadedPlugin {
  id: string;
  plugin: Plugin;
  context: PluginContext;
  loadedAt: number;
}

// Factory
export function createPluginRuntime(core: RingmasterCore, storage: LocalStorage): PluginRuntime {
  return new PluginRuntime(core, storage);
}
