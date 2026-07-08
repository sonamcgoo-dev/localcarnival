# Artifact SDK

> Create and manage LocalCircus artifacts programmatically.

## Overview

The Artifact SDK provides a programmatic interface for creating, validating, publishing, and managing artifacts in the LocalCircus ecosystem.

## Installation

```bash
npm install @localcircus/artifact-sdk
```

```typescript
import { ArtifactManager } from '@localcircus/artifact-sdk';
```

## Quick Start

```typescript
import { ArtifactManager } from '@localcircus/artifact-sdk';

// Initialize
const manager = new ArtifactManager({
  registry: 'https://registry.localcircus.dev'
});

// Create an artifact
const artifact = await manager.create({
  name: 'my-search-plugin',
  type: 'plugin',
  version: '1.0.0',
  capabilities: [
    { id: 'tool:search' }
  ],
  metadata: {
    description: 'Full-text search plugin',
    keywords: ['search', 'indexing'],
    license: 'MIT'
  }
});

// Publish
await manager.publish(artifact);
```

## ArtifactDNA

The core data structure for all artifacts.

```typescript
import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';

const dna: ArtifactDNA = {
  uuid: '0191f2a7-c123-7abc-def0-123456789abc',
  name: 'codex-search-plugin',
  type: 'plugin',
  version: '2.1.0',
  displayName: 'Codex Search Plugin',
  
  capabilities: [
    {
      id: 'tool:search',
      version: '1.0',
      description: 'Full-text search capability',
      parameters: [
        { name: 'query', type: 'string', required: true },
        { name: 'limit', type: 'number', required: false, default: 10 }
      ]
    }
  ],
  
  dependencies: [
    {
      reference: { name: 'plugin-sdk', type: 'extension' },
      versionRange: '^2.0.0',
      optional: false
    }
  ],
  
  compatibility: {
    platforms: ['linux', 'macos', 'windows'],
    architectures: ['x64', 'arm64'],
    localcircus: { min: '1.5.0' }
  },
  
  provenance: {
    source: {
      url: 'https://github.com/localcircus/codex-search-plugin',
      git: { commit: 'abc123' }
    }
  },
  
  signatures: {
    creator: {
      algorithm: 'ed25519',
      keyId: 'localcircus-team',
      value: '...',
      created: '2026-06-15T10:00:00Z'
    }
  },
  
  metadata: {
    description: 'Full-text search plugin for Codex',
    keywords: ['search', 'codex', 'indexing'],
    license: 'MIT',
    homepage: 'https://localcircus.dev/plugins/codex-search'
  }
};
```

## ArtifactManager

Main class for artifact operations.

```typescript
class ArtifactManager {
  constructor(config: ArtifactManagerConfig);
  
  // CRUD operations
  create(manifest: CreateManifest): Promise<ArtifactDNA>;
  get(id: string): Promise<ArtifactDNA>;
  update(id: string, changes: Partial<ArtifactDNA>): Promise<ArtifactDNA>;
  delete(id: string): Promise<void>;
  
  // Discovery
  search(query: SearchQuery): Promise<SearchResult[]>;
  list(options?: ListOptions): Promise<ArtifactDNA[]>;
  getVersions(name: string): Promise<string[]>;
  
  // Publishing
  publish(artifact: ArtifactDNA): Promise<void>;
  unpublish(id: string): Promise<void>;
  
  // Installation
  install(id: string, options?: InstallOptions): Promise<void>;
  uninstall(id: string): Promise<void>;
  listInstalled(): Promise<InstalledArtifact[]>;
  
  // Validation
  validate(artifact: ArtifactDNA): Promise<ValidationResult>;
  validateCompatibility(artifact: ArtifactDNA): Promise<CompatibilityResult>;
}

interface ArtifactManagerConfig {
  registry: string;
  storage?: StorageAdapter;
  signer?: Signer;
}
```

### CRUD Examples

```typescript
// Create
const artifact = await manager.create({
  name: 'my-tool',
  type: 'tool',
  version: '1.0.0',
  capabilities: [{ id: 'tool:calculate' }],
  metadata: {
    description: 'A calculator tool',
    keywords: ['math', 'calculator'],
    license: 'MIT'
  }
});

// Get
const fetched = await manager.get('0191f2a7-c123-7abc-def0-123456789abc');

// Update
const updated = await manager.update('0191f2a7-...', {
  version: '1.1.0',
  metadata: {
    ...fetched.metadata,
    description: 'Updated description'
  }
});

// Delete
await manager.delete('0191f2a7-...');
```

### Search Examples

```typescript
// Basic search
const results = await manager.search({
  query: 'search plugin'
});

// Advanced search
const results = await manager.search({
  query: 'code analysis',
  filters: {
    type: ['plugin', 'tool'],
    capabilities: ['tool:analyze'],
    platforms: ['linux'],
    isVerified: true,
    minRating: 4.0
  },
  sort: 'rating',
  limit: 20,
  offset: 0
});

for (const result of results) {
  console.log(`${result.name} (${result.score})`);
}
```

### Installation Examples

```typescript
// Install
await manager.install('codex-search-plugin@2.0.0');

// Install with options
await manager.install('my-tool', {
  version: '1.5.0',
  force: false,
  includeOptional: true
});

// List installed
const installed = await manager.listInstalled();
for (const artifact of installed) {
  console.log(`${artifact.name} v${artifact.version}`);
}

// Uninstall
await manager.uninstall('my-tool');
```

## Validation

### Artifact Validation

```typescript
const result = await manager.validate(artifact);

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`[${error.code}] ${error.message}`);
  }
}

// Validation rules
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  path?: string;
}
```

### Compatibility Check

```typescript
const compatibility = await manager.validateCompatibility(artifact);

if (compatibility.compatible) {
  console.log('Compatible with current platform');
} else {
  console.log('Issues:');
  for (const issue of compatibility.issues) {
    console.log(`  - ${issue.type}: ${issue.message}`);
  }
}

interface CompatibilityResult {
  compatible: boolean;
  score: number;  // 0-100
  issues: CompatibilityIssue[];
  warnings: string[];
}
```

## Artifact Builder

Fluently build artifacts.

```typescript
import { ArtifactBuilder } from '@localcircus/artifact-sdk';

const artifact = new ArtifactBuilder()
  .name('my-search-plugin')
  .type('plugin')
  .version('1.0.0')
  .displayName('My Search Plugin')
  .capability({ id: 'tool:search' })
  .capability({ id: 'tool:index' })
  .dependency({ name: 'plugin-sdk', versionRange: '^2.0.0' })
  .platform('linux')
  .platform('macos')
  .localcircus('>=1.5.0')
  .description('A powerful search plugin')
  .keyword('search')
  .keyword('indexing')
  .license('MIT')
  .build();
```

## Registry Client

Low-level registry API access.

```typescript
import { RegistryClient } from '@localcircus/artifact-sdk';

const client = new RegistryClient({
  baseUrl: 'https://registry.localcircus.dev',
  apiKey: process.env.REGISTRY_API_KEY
});

// GraphQL queries
const artifact = await client.query(`
  query GetArtifact($name: String!) {
    artifact(name: $name) {
      uuid
      name
      version
      capabilities { id }
      metadata { description }
    }
  }
`, { name: 'codex-search-plugin' });

// REST endpoints
const versions = await client.get(`/artifacts/${id}/versions`);
const downloads = await client.get(`/artifacts/${id}/stats/downloads`);
```

## Storage Adapters

### Local Storage

```typescript
import { LocalStorageAdapter } from '@localcircus/artifact-sdk';

const storage = new LocalStorageAdapter({
  directory: '~/.localcircus/artifacts'
});

// Automatically caches downloaded artifacts
const artifact = await storage.get('codex-search-plugin');
```

### Custom Storage

```typescript
import { StorageAdapter } from '@localcircus/artifact-sdk';

class S3Storage implements StorageAdapter {
  async get(id: string): Promise<ArtifactDNA | null> {
    // Fetch from S3
  }
  
  async put(id: string, artifact: ArtifactDNA): Promise<void> {
    // Save to S3
  }
  
  async delete(id: string): Promise<void> {
    // Remove from S3
  }
  
  async list(): Promise<string[]> {
    // List all IDs
  }
}
```

## Signing

### Sign Artifacts

```typescript
import { ArtifactSigner } from '@localcircus/artifact-sdk';

const signer = new ArtifactSigner({
  keyId: 'my-publisher',
  privateKey: process.env.SIGNING_PRIVATE_KEY
});

// Sign an artifact
const signedArtifact = await signer.sign(artifact);
console.log('Signature:', signedArtifact.signatures.creator);
```

### Verify Signatures

```typescript
const verifier = new ArtifactVerifier();

const result = await verifier.verify(signedArtifact);

if (result.valid) {
  console.log('Artifact is authentic');
  console.log('Signed by:', result.signatures[0].keyId);
} else {
  console.log('Verification failed:', result.error);
}
```

## CLI Companion

```bash
# Install via SDK
npx @localcircus/artifact-sdk init

# Create artifact
npx @localcircus/artifact-sdk create --name my-plugin --type plugin

# Validate
npx @localcircus/artifact-sdk validate ./dist

# Publish
npx @localcircus/artifact-sdk publish --registry https://registry.localcircus.dev

# Search
npx @localcircus/artifact-sdk search "search plugin"

# Install
npx @localcircus/artifact-sdk install codex-search-plugin
```

## TypeScript Types

All types are exported from the SDK:

```typescript
import {
  ArtifactDNA,
  ArtifactType,
  ArtifactManager,
  ArtifactBuilder,
  Capability,
  Dependency,
  Compatibility,
  RegistryClient,
  ValidationResult,
  CompatibilityResult
} from '@localcircus/artifact-sdk';
```

## Error Handling

```typescript
import { 
  ArtifactError,
  ValidationError,
  NotFoundError,
  ConflictError,
  NetworkError 
} from '@localcircus/artifact-sdk';

try {
  await manager.publish(artifact);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.log('Artifact not found');
  } else if (error instanceof ConflictError) {
    console.log('Version already exists');
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
  }
}
```

## Related Documents

- [LCA-0002: Artifact DNA](../../localcircus-specs/lca/active/lca-0002-artifact-dna.md)
- [LCA-0003: Artifact Card](../../localcircus-specs/lca/draft/lca-0003-artifact-card.md)
- [Local Zoo CLI](../../05-Local-Zoo/cli.md)
