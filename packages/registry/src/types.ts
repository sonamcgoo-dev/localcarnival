/**
 * Registry Types
 * 
 * Types for the artifact registry.
 */

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';

export interface RegistryEntry {
  uuid: string;
  name: string;
  type: ArtifactType;
  version: string;
  versions: VersionEntry[];
  displayName: string;
  shortDescription: string;
  icon: string;
  category: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  downloads: number;
  trustLevel: TrustLevel;
  publisher: PublisherInfo;
  createdAt: number;
  updatedAt: number;
  publishedAt: number;
  verified: boolean;
  featured: boolean;
  deprecated: boolean;
  deprecationMessage?: string;
}

export interface VersionEntry {
  version: string;
  dna: ArtifactDNA;
  publishedAt: number;
  changelog?: string;
}

export type TrustLevel = 'unverified' | 'verified' | 'trusted' | 'official';

export interface PublisherInfo {
  id: string;
  name: string;
  verified: boolean;
  trustScore: number;
}

export interface DependencyNode {
  uuid: string;
  name: string;
  version: string;
  type: ArtifactType;
  optional: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  versionRange: string;
  optional: boolean;
}

export interface GraphNode {
  uuid: string;
  name: string;
  type: ArtifactType;
  version: string;
  capabilities: string[];
  dependencies: string[];
  dependents: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'depends-on' | 'provides' | 'requires';
  versionRange?: string;
}

export interface SearchQuery {
  text?: string;
  type?: ArtifactType;
  category?: string;
  tags?: string[];
  capabilities?: string[];
  trustLevel?: TrustLevel;
  minRating?: number;
  verified?: boolean;
  deprecated?: boolean;
}

export interface SearchResult {
  entry: RegistryEntry;
  score: number;
  matches: SearchMatch[];
  highlights: string[];
}

export interface SearchMatch {
  field: string;
  value: string;
  score: number;
}

export interface CompatibilityResult {
  compatible: boolean;
  platform?: string;
  architecture?: string;
  issues: CompatibilityIssue[];
}

export interface CompatibilityIssue {
  type: 'platform' | 'architecture' | 'version' | 'capability';
  message: string;
  severity: 'error' | 'warning';
}

export interface Recommendation {
  artifact: RegistryEntry;
  reason: string;
  score: number;
  basedOn?: string;
}

export interface IndexStats {
  totalArtifacts: number;
  totalVersions: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  averageRating: number;
}
