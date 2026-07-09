/**
 * CodeForge Types
 * 
 * Types for artifact creation, validation, and publishing.
 */

import { ArtifactDNA, ArtifactType, ArtifactMetadata, Capability, Dependency, Compatibility } from '@localcircus/artifact-sdk';

export interface ArtifactTemplate {
  type: ArtifactType;
  name: string;
  description: string;
  template: string;
  files: TemplateFile[];
  metadata: Partial<ArtifactMetadata>;
}

export interface TemplateFile {
  path: string;
  content: string;
  executable?: boolean;
}

export interface ArtifactProject {
  dna: ArtifactDNA;
  root: string;
  files: Map<string, string>;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (dna: ArtifactDNA) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  ruleId: string;
  message: string;
  field?: string;
}

export interface PublishConfig {
  registry?: string;
  access?: 'public' | 'private';
  force?: boolean;
  skipValidation?: boolean;
  skipSignature?: boolean;
}

export interface PublishResult {
  success: boolean;
  dna: ArtifactDNA;
  publishedAt?: number;
  url?: string;
  errors?: string[];
}

export interface SigningConfig {
  algorithm: 'ed25519' | 'rsa' | 'ecdsa';
  keyId: string;
  privateKey: string;
}

export interface GenerateOptions {
  name: string;
  type: ArtifactType;
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  license?: string;
  template?: string;
  capabilities?: string[];
  dependencies?: string[];
}

export interface WizardState {
  step: number;
  name?: string;
  type?: ArtifactType;
  version?: string;
  displayName?: string;
  description?: string;
  author?: string;
  license?: string;
  keywords?: string[];
  homepage?: string;
  repository?: string;
  template?: string;
  capabilities?: Capability[];
  dependencies?: Dependency[];
  compatibility?: Compatibility;
}

// Default templates for each artifact type
export const DEFAULT_TEMPLATES: Partial<Record<ArtifactType, ArtifactTemplate>> = {
  'agent': {
    type: 'agent',
    name: 'agent-template',
    description: 'Template for creating AI agents',
    template: 'agent',
    files: [
      { path: 'src/index.ts', content: `import { Agent } from '@localcircus/core';

export class MyAgent extends Agent {
  name = 'MyAgent';
  
  async initialize(): Promise<void> {
    // Initialize your agent
  }
  
  async process(input: string): Promise<string> {
    // Process input and return response
    return \`Processed: \${input}\`;
  }
}

export default new MyAgent();
` },
      { path: 'package.json', content: `{
  "name": "my-agent",
  "version": "1.0.0",
  "main": "dist/index.js"
}` }
    ],
    metadata: {
      description: 'An AI agent',
      keywords: ['ai', 'agent'],
      license: 'MIT'
    }
  },
  'workflow': {
    type: 'workflow',
    name: 'workflow-template',
    description: 'Template for creating workflows',
    template: 'workflow',
    files: [
      { path: 'src/index.ts', content: `import { Workflow } from '@localcircus/workflow-sdk';

export const myWorkflow = new Workflow({
  name: 'my-workflow',
  version: '1.0.0',
  steps: []
});

export default myWorkflow;
` },
      { path: 'workflow.json', content: `{
  "name": "my-workflow",
  "version": "1.0.0"
}` }
    ],
    metadata: {
      description: 'A workflow',
      keywords: ['automation'],
      license: 'MIT'
    }
  },
  'plugin': {
    type: 'plugin',
    name: 'plugin-template',
    description: 'Template for creating plugins',
    template: 'plugin',
    files: [
      { path: 'src/index.ts', content: `import type { LocalCircusPlugin, PluginContext } from '@localcircus/core';

class MyPlugin implements LocalCircusPlugin {
  async onLoad(context: PluginContext): Promise<void> {
    context.logger.info('MyPlugin loaded');
  }
  
  async onUnload(): Promise<void> {
    // Cleanup
  }
}

export default new MyPlugin();
` },
      { path: 'plugin.json', content: `{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0"
}` }
    ],
    metadata: {
      description: 'A LocalCircus plugin',
      keywords: ['plugin'],
      license: 'MIT'
    }
  },
  'tool': {
    type: 'tool',
    name: 'tool-template',
    description: 'Template for creating tools',
    template: 'tool',
    files: [
      { path: 'src/index.ts', content: `export async function myTool(input: any): Promise<any> {
  // Implement your tool
  return { result: input };
}

export default { myTool };
` }
    ],
    metadata: {
      description: 'A utility tool',
      keywords: ['tool'],
      license: 'MIT'
    }
  },
  'model': {
    type: 'model',
    name: 'model-template',
    description: 'Template for model configurations',
    template: 'model',
    files: [
      { path: 'model.json', content: `{
  "name": "my-model",
  "version": "1.0.0",
  "capabilities": ["chat"]
}` }
    ],
    metadata: {
      description: 'A model configuration',
      keywords: ['model'],
      license: 'MIT'
    }
  }
};

// Fill in defaults for types without specific templates
for (const type of ['extension', 'mcp-server', 'acp-tool', 'api-connector', 'dataset', 'knowledge-pack', 'prompt-pack', 'memory-pack', 'theme', 'workspace', 'project-template', 'benchmark', 'evaluation', 'documentation'] as ArtifactType[]) {
  if (!DEFAULT_TEMPLATES[type]) {
    DEFAULT_TEMPLATES[type] = {
      type,
      name: `${type}-template`,
      description: `Template for ${type} artifacts`,
      template: type,
      files: [
        { path: 'artifact.json', content: `{\n  "name": "my-${type}",\n  "version": "1.0.0"\n}` }
      ],
      metadata: {
        description: `A ${type} artifact`,
        keywords: [type],
        license: 'MIT'
      }
    };
  }
}
