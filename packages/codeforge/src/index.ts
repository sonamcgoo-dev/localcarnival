/**
 * CodeForge
 * 
 * Artifact creation, validation, and publishing for LocalCircus.
 */

export * from './types';
export { ArtifactWizard } from './wizard/ArtifactWizard';
export type { WizardCallbacks } from './wizard/ArtifactWizard';
export { ValidationPipeline } from './validation/ValidationPipeline';
export type { ValidationReport } from './validation/ValidationPipeline';
export { Publisher } from './publishing/Publisher';

import { ArtifactWizard } from './wizard/ArtifactWizard';
import { ValidationPipeline } from './validation/ValidationPipeline';
import { Publisher } from './publishing/Publisher';
import { GenerateOptions, DEFAULT_TEMPLATES } from './types';
import { ArtifactDNA } from '@localcircus/artifact-sdk';

/**
 * CodeForge - Main class for artifact creation
 */
export class CodeForge {
  readonly wizard: ArtifactWizard;
  readonly validation: ValidationPipeline;
  readonly publisher: Publisher;

  constructor() {
    this.wizard = new ArtifactWizard();
    this.validation = new ValidationPipeline();
    this.publisher = new Publisher();
  }

  /**
   * Create a new artifact from options
   */
  async create(options: GenerateOptions): Promise<ArtifactDNA> {
    // Load options into wizard
    this.wizard.loadFromOptions(options);

    // Generate artifact
    const { dna } = await this.wizard.generate();

    return dna;
  }

  /**
   * Validate an artifact
   */
  validate(dna: ArtifactDNA) {
    return this.validation.validate(dna);
  }

  /**
   * Publish an artifact
   */
  async publish(dna: ArtifactDNA, config?: any) {
    return this.publisher.publish(dna, config);
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return Object.values(DEFAULT_TEMPLATES);
  }

  /**
   * Get template for type
   */
  getTemplate(type: string) {
    return DEFAULT_TEMPLATES[type as keyof typeof DEFAULT_TEMPLATES];
  }
}

// Factory
export function createCodeForge(): CodeForge {
  return new CodeForge();
}

export default CodeForge;
