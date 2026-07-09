/**
 * Codex Types
 * 
 * Types for documentation and knowledge management.
 */

export interface Document {
  id: string;
  title: string;
  slug: string;
  content: string;
  format: DocumentFormat;
  category: DocumentCategory;
  tags: string[];
  author?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  draft: boolean;
  metadata: DocumentMetadata;
}

export type DocumentFormat = 'markdown' | 'html' | 'plaintext' | 'asciidoc';

export type DocumentCategory = 
  | 'getting-started'
  | 'tutorials'
  | 'guides'
  | 'api-reference'
  | 'specifications'
  | 'architecture'
  | 'patterns'
  | 'troubleshooting'
  | 'contributing';

export interface DocumentMetadata {
  description?: string;
  author?: string;
  version?: string;
  requiresLocalCircus?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  prerequisites?: string[];
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  tags: string[];
  linkedArtifacts: string[];
  linkedDocuments: string[];
  linkedEntries: string[];
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

export type KnowledgeType = 
  | 'concept'
  | 'fact'
  | 'procedure'
  | 'best-practice'
  | 'troubleshooting'
  | 'tip';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedArtifacts: string[];
  linkedDocuments: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchIndex {
  documents: Map<string, DocumentIndex>;
  entries: Map<string, EntryIndex>;
}

export interface DocumentIndex {
  id: string;
  title: string;
  content: string;
  tokens: Set<string>;
}

export interface EntryIndex {
  id: string;
  title: string;
  content: string;
  tokens: Set<string>;
}

export interface SearchResult {
  id: string;
  type: 'document' | 'knowledge' | 'note';
  title: string;
  snippet: string;
  score: number;
  highlights: string[];
}

export interface SearchOptions {
  query: string;
  type?: 'document' | 'knowledge' | 'note' | 'all';
  category?: DocumentCategory;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  category: DocumentCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
}

export interface TutorialStep {
  order: number;
  title: string;
  content: string;
  code?: CodeExample;
  verification?: string;
}

export interface CodeExample {
  language: string;
  code: string;
  filename?: string;
  runnable?: boolean;
}

export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags: string[];
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description: string;
  example?: any;
}

export interface APIRequestBody {
  description: string;
  contentType: string;
  schema: any;
  example?: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  example?: any;
}

export interface Pattern {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  problem: string;
  solution: string;
  examples: PatternExample[];
  relatedPatterns: string[];
  tags: string[];
}

export type PatternCategory = 
  | 'architectural'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'deployment';

export interface PatternExample {
  title: string;
  language?: string;
  code?: string;
  description: string;
}
