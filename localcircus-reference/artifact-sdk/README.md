# Artifact SDK Reference Implementation

> Reference implementation of the LocalCircus Artifact SDK.

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { ArtifactManager, ArtifactBuilder } from './src';

// Using the manager
const manager = new ArtifactManager({ registry: 'https://registry.localcircus.dev' });

const artifact = await manager.create({
  name: 'my-search-plugin',
  type: 'plugin',
  version: '1.0.0',
  capabilities: [{ id: 'tool:search' }],
  metadata: {
    description: 'A search plugin',
    license: 'MIT'
  }
});

// Using the builder
const artifact2 = new ArtifactBuilder()
  .name('another-plugin')
  .type('plugin')
  .version('1.0.0')
  .capability({ id: 'tool:calculate' })
  .platform('linux')
  .description('A calculator plugin')
  .build();
```

## Running Tests

```bash
npm test
```

## Reference

See [Artifact SDK Documentation](../../localcircus-docs/11-Artifact-SDK/README.md) for full API documentation.
