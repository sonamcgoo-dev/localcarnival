/**
 * CompatibilityEngine
 * 
 * Checks artifact compatibility with platforms and LocalCircus versions.
 */

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';
import { Compatibility, Platform, Architecture } from '@localcircus/artifact-sdk';
import { CompatibilityResult, CompatibilityIssue } from '../types';

export class CompatibilityEngine {
  private platform: string;
  private architecture: string;
  private localcircusVersion: string;

  constructor(options?: {
    platform?: string;
    architecture?: string;
    localcircusVersion?: string;
  }) {
    this.platform = options?.platform || this.detectPlatform();
    this.architecture = options?.architecture || this.detectArchitecture();
    this.localcircusVersion = options?.localcircusVersion || '0.1.0';
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): Platform {
    const platform = process.platform;
    if (platform === 'win32') return 'windows';
    if (platform === 'darwin') return 'macos';
    if (platform === 'linux') return 'linux';
    return 'linux';
  }

  /**
   * Detect current architecture
   */
  private detectArchitecture(): Architecture {
    const arch = process.arch;
    if (arch === 'x64') return 'x64';
    if (arch === 'arm64') return 'arm64';
    return 'x64';
  }

  /**
   * Check if artifact is compatible with current environment
   */
  check(dna: ArtifactDNA): CompatibilityResult {
    return this.checkWith(dna, {
      platform: this.platform,
      architecture: this.architecture,
      localcircusVersion: this.localcircusVersion,
    });
  }

  /**
   * Check compatibility with specific environment
   */
  checkWith(
    dna: ArtifactDNA,
    environment: {
      platform: string;
      architecture: string;
      localcircusVersion: string;
    }
  ): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const compat = dna.compatibility;

    // Check platform compatibility
    if (compat.platforms && compat.platforms.length > 0) {
      if (!compat.platforms.includes(environment.platform as Platform)) {
        issues.push({
          type: 'platform',
          message: `Artifact requires ${compat.platforms.join(', ')} but running on ${environment.platform}`,
          severity: 'error',
        });
      }
    }

    // Check architecture compatibility
    if (compat.architectures && compat.architectures.length > 0) {
      if (!compat.architectures.includes(environment.architecture as Architecture)) {
        issues.push({
          type: 'architecture',
          message: `Artifact requires ${compat.architectures.join(', ')} but running on ${environment.architecture}`,
          severity: 'error',
        });
      }
    }

    // Check LocalCircus version compatibility
    if (compat.localcircus) {
      if (compat.localcircus.min) {
        if (!this.semverSatisfies(environment.localcircusVersion, `>=${compat.localcircus.min}`)) {
          issues.push({
            type: 'version',
            message: `Artifact requires LocalCircus ${compat.localcircus.min}+ but running ${environment.localcircusVersion}`,
            severity: 'error',
          });
        }
      }

      if (compat.localcircus.max) {
        if (!this.semverSatisfies(environment.localcircusVersion, `<=${compat.localcircus.max}`)) {
          issues.push({
            type: 'version',
            message: `Artifact is not compatible with LocalCircus ${environment.localcircusVersion} (max: ${compat.localcircus.max})`,
            severity: 'error',
          });
        }
      }
    }

    // Check for capability requirements
    const requiredCapabilities = this.getRequiredCapabilities(dna.type);
    for (const cap of requiredCapabilities) {
      if (!dna.capabilities.some(c => c.id === cap)) {
        issues.push({
          type: 'capability',
          message: `Artifact type ${dna.type} requires capability: ${cap}`,
          severity: 'warning',
        });
      }
    }

    return {
      compatible: issues.filter(i => i.severity === 'error').length === 0,
      platform: environment.platform,
      architecture: environment.architecture,
      issues,
    };
  }

  /**
   * Get required capabilities for artifact type
   */
  private getRequiredCapabilities(type: ArtifactType): string[] {
    const requirements: Record<ArtifactType, string[]> = {
      'model': ['chat'],
      'agent': ['chat'],
      'workflow': [],
      'tool': [],
      'plugin': [],
      'extension': [],
      'mcp-server': ['http'],
      'acp-tool': [],
      'api-connector': ['http'],
      'dataset': [],
      'knowledge-pack': [],
      'prompt-pack': [],
      'memory-pack': [],
      'theme': [],
      'workspace': [],
      'project-template': [],
      'benchmark': [],
      'evaluation': [],
      'documentation': [],
    };

    return requirements[type] || [];
  }

  /**
   * Simple semver satisfying check
   */
  private semverSatisfies(version: string, range: string): boolean {
    const cleanRange = range.replace(/[\^~>=<]+/g, '').trim();
    const [major, minor, patch] = version.split('.').map(Number);
    const [rMajor, rMinor, rPatch] = cleanRange.split('.').map(Number);

    if (range.startsWith('^')) {
      return major === rMajor && minor >= rMinor;
    }
    if (range.startsWith('~')) {
      return major === rMajor && minor === rMinor && patch >= rPatch;
    }
    if (range.startsWith('>=')) {
      return major > rMajor || (major === rMajor && minor > rMinor) ||
             (major === rMajor && minor === rMinor && patch >= rPatch);
    }
    if (range.startsWith('<=')) {
      return major < rMajor || (major === rMajor && minor < rMinor) ||
             (major === rMajor && minor === rMinor && patch <= rPatch);
    }
    if (range.startsWith('>')) {
      return major > rMajor || (major === rMajor && minor > rMinor) ||
             (major === rMajor && minor === rMinor && patch > rPatch);
    }
    if (range.startsWith('<')) {
      return major < rMajor || (major === rMajor && minor < rMinor) ||
             (major === rMajor && minor === rMinor && patch < rPatch);
    }

    // Exact match
    return major === rMajor && minor === rMinor && patch === rPatch;
  }

  /**
   * Check if two artifacts are compatible
   */
  checkPair(a: ArtifactDNA, b: ArtifactDNA): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];

    // Check dependency relationship
    for (const dep of a.dependencies) {
      if (dep.reference.name === b.name) {
        if (!this.semverSatisfies(b.version, dep.versionRange)) {
          issues.push({
            type: 'version',
            message: `${a.name} requires ${b.name} ${dep.versionRange} but ${b.name} is ${b.version}`,
            severity: 'error',
          });
        }
      }
    }

    // Check for capability conflicts
    const aCaps = a.capabilities.map(c => c.id);
    const bCaps = b.capabilities.map(c => c.id);
    
    // Example: no conflicting capabilities
    // This is a placeholder for actual conflict detection

    return {
      compatible: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Set environment info
   */
  setEnvironment(info: {
    platform?: string;
    architecture?: string;
    localcircusVersion?: string;
  }): void {
    if (info.platform) this.platform = info.platform;
    if (info.architecture) this.architecture = info.architecture;
    if (info.localcircusVersion) this.localcircusVersion = info.localcircusVersion;
  }

  /**
   * Get current environment
   */
  getEnvironment(): {
    platform: string;
    architecture: string;
    localcircusVersion: string;
  } {
    return {
      platform: this.platform,
      architecture: this.architecture,
      localcircusVersion: this.localcircusVersion,
    };
  }
}

export default CompatibilityEngine;
