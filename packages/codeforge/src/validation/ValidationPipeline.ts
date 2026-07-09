/**
 * ValidationPipeline
 * 
 * Validates artifacts against LocalCircus standards.
 */

import { ArtifactDNA } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { ValidationRule, ValidationResult } from '../types';

// Built-in validation rules
const BUILT_IN_RULES: ValidationRule[] = [
  // Identity rules
  {
    id: 'uuid-required',
    name: 'UUID Required',
    description: 'Artifact must have a UUID',
    severity: 'error',
    check: (dna) => ({
      valid: !!dna.uuid,
      ruleId: 'uuid-required',
      message: 'UUID is required',
      field: 'uuid'
    })
  },
  {
    id: 'name-required',
    name: 'Name Required',
    description: 'Artifact must have a name',
    severity: 'error',
    check: (dna) => ({
      valid: !!dna.name,
      ruleId: 'name-required',
      message: 'Name is required',
      field: 'name'
    })
  },
  {
    id: 'name-format',
    name: 'Name Format',
    description: 'Name must be lowercase with hyphens only',
    severity: 'error',
    check: (dna) => ({
      valid: !dna.name || /^[a-z][a-z0-9-]*$/.test(dna.name),
      ruleId: 'name-format',
      message: 'Name must be lowercase with hyphens only (e.g., my-artifact)',
      field: 'name'
    })
  },
  {
    id: 'type-required',
    name: 'Type Required',
    description: 'Artifact must have a type',
    severity: 'error',
    check: (dna) => ({
      valid: !!dna.type,
      ruleId: 'type-required',
      message: 'Type is required',
      field: 'type'
    })
  },
  {
    id: 'version-required',
    name: 'Version Required',
    description: 'Artifact must have a version',
    severity: 'error',
    check: (dna) => ({
      valid: !!dna.version,
      ruleId: 'version-required',
      message: 'Version is required',
      field: 'version'
    })
  },
  {
    id: 'version-format',
    name: 'Version Format',
    description: 'Version must be semver',
    severity: 'error',
    check: (dna) => ({
      valid: !dna.version || /^\d+\.\d+\.\d+/.test(dna.version),
      ruleId: 'version-format',
      message: 'Version must be semver (e.g., 1.0.0)',
      field: 'version'
    })
  },

  // Metadata rules
  {
    id: 'description-recommended',
    name: 'Description Recommended',
    description: 'Description is recommended for discoverability',
    severity: 'warning',
    check: (dna) => ({
      valid: !!dna.metadata?.description,
      ruleId: 'description-recommended',
      message: 'Description is recommended for better discoverability',
      field: 'metadata.description'
    })
  },
  {
    id: 'keywords-recommended',
    name: 'Keywords Recommended',
    description: 'Keywords improve search discoverability',
    severity: 'info',
    check: (dna) => ({
      valid: (dna.metadata?.keywords?.length || 0) > 0,
      ruleId: 'keywords-recommended',
      message: 'Keywords improve search discoverability',
      field: 'metadata.keywords'
    })
  },
  {
    id: 'license-recommended',
    name: 'License Recommended',
    description: 'A license is recommended',
    severity: 'warning',
    check: (dna) => ({
      valid: !!dna.metadata?.license,
      ruleId: 'license-recommended',
      message: 'License is recommended',
      field: 'metadata.license'
    })
  },

  // Capability rules
  {
    id: 'capabilities-recommended',
    name: 'Capabilities Recommended',
    description: 'Declaring capabilities improves discovery',
    severity: 'info',
    check: (dna) => ({
      valid: (dna.capabilities?.length || 0) > 0,
      ruleId: 'capabilities-recommended',
      message: 'Declaring capabilities improves discovery',
      field: 'capabilities'
    })
  },

  // Provenance rules
  {
    id: 'provenance-recommended',
    name: 'Provenance Recommended',
    description: 'Source URL is recommended for verification',
    severity: 'info',
    check: (dna) => ({
      valid: !!dna.provenance?.source?.url,
      ruleId: 'provenance-recommended',
      message: 'Source URL is recommended for verification',
      field: 'provenance.source.url'
    })
  },

  // Signature rules
  {
    id: 'signature-optional',
    name: 'Signature Optional',
    description: 'Digital signatures improve trust',
    severity: 'info',
    check: (dna) => ({
      valid: !dna.signatures?.creator && !dna.signatures?.registry,
      ruleId: 'signature-optional',
      message: 'Digital signatures improve trust (optional)',
      field: 'signatures'
    })
  }
];

export interface ValidationReport {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  passed: ValidationResult[];
}

export class ValidationPipeline {
  private rules: Map<string, ValidationRule> = new Map();
  private eventBus: EventBus;

  constructor() {
    this.eventBus = new EventBus();
    
    // Register built-in rules
    for (const rule of BUILT_IN_RULES) {
      this.registerRule(rule);
    }
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
    this.eventBus.emit('rule:registered', { rule });
  }

  /**
   * Unregister a validation rule
   */
  unregisterRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.eventBus.emit('rule:unregistered', { ruleId });
    }
    return deleted;
  }

  /**
   * Get a rule by ID
   */
  getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Validate an artifact
   */
  validate(dna: ArtifactDNA): ValidationReport {
    const report: ValidationReport = {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      passed: [],
    };

    for (const rule of this.rules.values()) {
      const result = rule.check(dna);
      
      if (!result.valid) {
        switch (rule.severity) {
          case 'error':
            report.valid = false;
            report.errors.push(result);
            break;
          case 'warning':
            report.warnings.push(result);
            break;
          case 'info':
            report.info.push(result);
            break;
        }
      } else {
        report.passed.push(result);
      }
    }

    this.eventBus.emit('validation:complete', { dna: dna.uuid, report });
    
    return report;
  }

  /**
   * Validate with custom rules
   */
  validateWith(dna: ArtifactDNA, rules: ValidationRule[]): ValidationReport {
    const originalRules = new Map(this.rules);
    
    // Add temporary rules
    for (const rule of rules) {
      this.rules.set(rule.id, rule);
    }

    const report = this.validate(dna);

    // Restore original rules
    this.rules = originalRules;
    
    return report;
  }

  /**
   * Check if artifact is ready to publish
   */
  canPublish(dna: ArtifactDNA): { canPublish: boolean; blockingErrors: ValidationResult[] } {
    const report = this.validate(dna);
    
    return {
      canPublish: report.valid,
      blockingErrors: report.errors,
    };
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Format report as string
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [];
    
    lines.push(report.valid ? '✅ Validation passed' : '❌ Validation failed');
    lines.push('');
    
    if (report.errors.length > 0) {
      lines.push('Errors:');
      for (const error of report.errors) {
        lines.push(`  ❌ ${error.message}`);
      }
      lines.push('');
    }
    
    if (report.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warning of report.warnings) {
        lines.push(`  ⚠️ ${warning.message}`);
      }
      lines.push('');
    }
    
    if (report.info.length > 0) {
      lines.push('Info:');
      for (const info of report.info) {
        lines.push(`  ℹ️ ${info.message}`);
      }
      lines.push('');
    }
    
    lines.push(`${report.passed.length} checks passed`);
    
    return lines.join('\n');
  }
}

export default ValidationPipeline;
