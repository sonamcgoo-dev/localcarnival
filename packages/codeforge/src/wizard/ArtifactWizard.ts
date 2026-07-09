/**
 * ArtifactWizard
 * 
 * Interactive wizard for creating artifacts.
 */

import { v4 as uuidv4 } from 'uuid';
import { ArtifactType, ArtifactMetadata, Capability, Dependency, ArtifactDNA } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { 
  WizardState, 
  GenerateOptions, 
  DEFAULT_TEMPLATES,
  TemplateFile 
} from '../types';

export interface WizardCallbacks {
  onStateChange?: (state: WizardState) => void;
  onProgress?: (step: number, total: number, message: string) => void;
  onError?: (error: Error) => void;
}

export class ArtifactWizard {
  private state: WizardState;
  private eventBus: EventBus;
  private callbacks: WizardCallbacks;

  constructor(callbacks: WizardCallbacks = {}) {
    this.state = { step: 0 };
    this.eventBus = new EventBus();
    this.callbacks = callbacks;
  }

  /**
   * Get current wizard state
   */
  getState(): WizardState {
    return { ...this.state };
  }

  /**
   * Set the artifact type
   */
  setType(type: ArtifactType): this {
    this.state.type = type;
    this.state.step = 1;
    this.emitState();
    return this;
  }

  /**
   * Set basic information
   */
  setBasicInfo(info: {
    name?: string;
    displayName?: string;
    description?: string;
    version?: string;
  }): this {
    if (info.name) this.state.name = info.name;
    if (info.displayName) this.state.displayName = info.displayName;
    if (info.description) this.state.description = info.description;
    if (info.version) this.state.version = info.version;
    this.emitState();
    return this;
  }

  /**
   * Set author information
   */
  setAuthor(author: {
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
  }): this {
    if (author.author) this.state.author = author.author;
    if (author.license) this.state.license = author.license;
    if (author.homepage) this.state.homepage = author.homepage;
    if (author.repository) this.state.repository = author.repository;
    this.emitState();
    return this;
  }

  /**
   * Set metadata
   */
  setMetadata(metadata: {
    keywords?: string[];
    template?: string;
  }): this {
    if (metadata.keywords) this.state.keywords = metadata.keywords;
    if (metadata.template) this.state.template = metadata.template;
    this.emitState();
    return this;
  }

  /**
   * Set capabilities
   */
  setCapabilities(capabilities: Capability[]): this {
    this.state.capabilities = capabilities;
    this.emitState();
    return this;
  }

  /**
   * Set dependencies
   */
  setDependencies(dependencies: Dependency[]): this {
    this.state.dependencies = dependencies;
    this.emitState();
    return this;
  }

  /**
   * Move to next step
   */
  nextStep(): this {
    this.state.step++;
    this.emitState();
    return this;
  }

  /**
   * Move to previous step
   */
  prevStep(): this {
    if (this.state.step > 0) {
      this.state.step--;
      this.emitState();
    }
    return this;
  }

  /**
   * Generate the artifact
   */
  async generate(): Promise<{ dna: ArtifactDNA; files: Map<string, string> }> {
    this.callbacks.onProgress?.(0, 5, 'Generating DNA...');

    if (!this.state.name || !this.state.type || !this.state.version) {
      throw new Error('Missing required fields: name, type, version');
    }

    const now = Date.now();

    // Create DNA
    const dna: ArtifactDNA = {
      uuid: uuidv4(),
      name: this.state.name,
      type: this.state.type,
      version: this.state.version,
      displayName: this.state.displayName,
      capabilities: this.state.capabilities || [],
      dependencies: this.state.dependencies || [],
      compatibility: this.state.compatibility || {},
      provenance: {},
      signatures: {},
      metadata: {
        description: this.state.description || '',
        keywords: this.state.keywords || [],
        license: this.state.license || 'MIT',
        homepage: this.state.homepage,
        repository: this.state.repository,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.callbacks.onProgress?.(1, 5, 'Generating files...');

    // Get template files
    const template = this.getTemplate();
    const files = new Map<string, string>();

    for (const file of template.files) {
      const content = this.interpolateTemplate(file.content, dna);
      files.set(file.path, content);
    }

    // Add DNA file
    files.set('artifact.json', JSON.stringify(dna, null, 2));
    files.set('artifact.lcadna', JSON.stringify({
      uuid: dna.uuid,
      name: dna.name,
      type: dna.type,
      version: dna.version,
    }, null, 2));

    this.callbacks.onProgress?.(3, 5, 'Validating...');

    this.callbacks.onProgress?.(5, 5, 'Complete!');

    return { dna, files };
  }

  /**
   * Get template for current type
   */
  getTemplate() {
    const template = DEFAULT_TEMPLATES[this.state.type!];
    if (!template) {
      return {
        type: this.state.type!,
        name: `${this.state.name}-template`,
        description: '',
        template: 'default',
        files: [] as TemplateFile[],
        metadata: { description: '', keywords: [], license: 'MIT' }
      };
    }
    return template;
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(content: string, dna: ArtifactDNA): string {
    return content
      .replace(/\{\{name\}\}/g, dna.name)
      .replace(/\{\{version\}\}/g, dna.version)
      .replace(/\{\{type\}\}/g, dna.type)
      .replace(/\{\{description\}\}/g, dna.metadata.description)
      .replace(/\{\{license\}\}/g, dna.metadata.license);
  }

  /**
   * Validate the current state
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.state.name) {
      errors.push('Name is required');
    } else if (!/^[a-z][a-z0-9-]*$/.test(this.state.name)) {
      errors.push('Name must be lowercase with hyphens only');
    }

    if (!this.state.type) {
      errors.push('Type is required');
    }

    if (!this.state.version) {
      errors.push('Version is required');
    } else if (!/^\d+\.\d+\.\d+/.test(this.state.version)) {
      errors.push('Version must be semver (x.y.z)');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Reset the wizard
   */
  reset(): this {
    this.state = { step: 0 };
    this.emitState();
    return this;
  }

  /**
   * Load state from options
   */
  loadFromOptions(options: GenerateOptions): this {
    this.state = {
      step: 1,
      name: options.name,
      type: options.type,
      version: options.version,
      displayName: options.displayName,
      description: options.description,
      author: options.author,
      license: options.license || 'MIT',
      template: options.template,
    };
    this.emitState();
    return this;
  }

  private emitState(): void {
    this.eventBus.emit('state:change', this.state);
    this.callbacks.onStateChange?.(this.state);
  }

  on(event: string, handler: (data: any) => void): () => void {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }
}

export default ArtifactWizard;
