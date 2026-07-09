/**
 * Zoo Types
 * 
 * Types for the Local Zoo artifact browser and manager.
 */

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';

export interface ArtifactCard {
  artifact: ArtifactDNA;
  displayName: string;
  shortDescription: string;
  icon: string;
  category: Category;
  tags: string[];
  rating?: number;
  downloads?: number;
  installed?: boolean;
  updateAvailable?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  types: ArtifactType[];
}

export interface ZooConfig {
  storagePath?: string;
  registryURL?: string;
  autoUpdate?: boolean;
}

export interface InstallOptions {
  version?: string;
  force?: boolean;
  dependencies?: boolean;
}

export interface InstallResult {
  success: boolean;
  artifact: ArtifactDNA;
  installedAt: number;
  errors?: string[];
}

export interface UpdateInfo {
  artifact: ArtifactDNA;
  currentVersion: string;
  latestVersion: string;
  changelog?: string;
}

export interface SearchFilters {
  type?: ArtifactType;
  category?: string;
  tags?: string[];
  installed?: boolean;
  hasUpdate?: boolean;
  query?: string;
}

export interface SortOptions {
  field: 'name' | 'downloads' | 'rating' | 'updated' | 'installed';
  direction: 'asc' | 'desc';
}

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'ai-agents',
    name: 'AI Agents',
    icon: '🤖',
    description: 'Autonomous AI agents and performers',
    color: '#6366f1',
    types: ['agent'],
  },
  {
    id: 'models',
    name: 'Models',
    icon: '🦄',
    description: 'AI language models and embeddings',
    color: '#8b5cf6',
    types: ['model'],
  },
  {
    id: 'workflows',
    name: 'Workflows',
    icon: '🔗',
    description: 'Automation workflows and acts',
    color: '#10b981',
    types: ['workflow'],
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: '🔧',
    description: 'Utility tools and utilities',
    color: '#f59e0b',
    types: ['tool'],
  },
  {
    id: 'plugins',
    name: 'Plugins',
    icon: '🎭',
    description: 'UI extensions and performers',
    color: '#ec4899',
    types: ['plugin', 'extension'],
  },
  {
    id: 'servers',
    name: 'Servers',
    icon: '🖥️',
    description: 'MCP and ACP servers',
    color: '#14b8a6',
    types: ['mcp-server', 'acp-tool'],
  },
  {
    id: 'connectors',
    name: 'Connectors',
    icon: '🔌',
    description: 'API connectors and integrations',
    color: '#f97316',
    types: ['api-connector'],
  },
  {
    id: 'data',
    name: 'Data',
    icon: '📊',
    description: 'Datasets and knowledge packs',
    color: '#3b82f6',
    types: ['dataset', 'knowledge-pack'],
  },
  {
    id: 'prompts',
    name: 'Prompts',
    icon: '💬',
    description: 'Prompt packs and templates',
    color: '#a855f7',
    types: ['prompt-pack', 'memory-pack'],
  },
  {
    id: 'themes',
    name: 'Themes',
    icon: '🎨',
    description: 'Visual themes and styles',
    color: '#eab308',
    types: ['theme'],
  },
];

// Get icon for artifact type
export function getTypeIcon(type: ArtifactType): string {
  const icons: Record<string, string> = {
    'model': '🦄',
    'agent': '🤖',
    'workflow': '🔗',
    'tool': '🔧',
    'plugin': '🎭',
    'extension': '🔌',
    'mcp-server': '🖥️',
    'acp-tool': '⚡',
    'api-connector': '🔌',
    'dataset': '📊',
    'knowledge-pack': '📚',
    'prompt-pack': '💬',
    'memory-pack': '🧠',
    'theme': '🎨',
    'workspace': '🏠',
    'project-template': '📋',
    'benchmark': '🏆',
    'evaluation': '📏',
    'documentation': '📖',
  };
  return icons[type] || '📦';
}

// Get category for artifact
export function getCategoryForType(type: ArtifactType): Category {
  const category = DEFAULT_CATEGORIES.find(c => c.types.includes(type));
  return category || {
    id: 'other',
    name: 'Other',
    icon: '📦',
    description: 'Miscellaneous artifacts',
    color: '#6b7280',
    types: [],
  };
}
