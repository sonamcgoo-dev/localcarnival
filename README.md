# LocalCircus 🎪

> A local-first creative operating environment that amplifies human capability through intelligent tools, automation, and collaboration.

## ⚡ Implementation Status

**Design Documentation:** Complete ✅  
**Implementation:** In Progress 🔄

### Milestone 1: Core Runtime ✅
- [x] Ringmaster Core with EventBus, Scheduler, MemoryManager
- [x] CLI with status, memory, schedule, events commands
- [x] Local file-based artifact storage
- [x] Plugin loading and lifecycle management

### Milestone 2: SDKs ✅
- [x] Artifact SDK - CRUD, builder, validation, search
- [x] Provider SDK - OpenAI, Ollama, ProviderManager
- [x] Workflow SDK - Executor, builder, built-in actions
- [x] CLI integration for all SDKs

### Milestone 3: Big Top ✅
- [x] Canvas engine with viewport, pan, zoom
- [x] Node system with 8 node types
- [x] Connection system with validation
- [x] Workflow builder (BigTop class)

### Milestone 4: UI Components ✅
- [x] React Canvas component with grid, nodes, connections
- [x] Toolbar with node palette and controls
- [x] useBigTop hook for state management
- [x] CLI web command (`circus web start`)

### Milestone 5: Local Zoo ✅
- [x] ArtifactBrowser - browse, search, filter
- [x] InstallManager - install, uninstall, update
- [x] 10 categories (AI Agents, Models, Workflows, etc.)
- [x] Artifact cards with icons and tags

### Phase 3: CodeForge ✅
- [x] ArtifactWizard - interactive creation
- [x] ValidationPipeline - 15 rules
- [x] Publisher - local registry publishing
- [x] CLI commands (`circus forge create`)

### Phase 4: Registry ✅
- [x] GraphDatabase - artifact relationships
- [x] SearchEngine - full-text search
- [x] CompatibilityEngine - platform/version checking
- [x] RecommendationsEngine - trending, similar
- [x] CLI commands (`circus registry`)

## Mission

Technology should disappear behind creation. LocalCircus gives creators an elevated sense of capacity, momentum, and the confidence to accomplish ambitious work.

## Design Principles

1. Everything is an Artifact
2. Every Artifact has DNA
3. Everything belongs to one ecosystem
4. Everything should increase user capability
5. Offline-first
6. Open standards
7. Extensible by design
8. Beautiful enough to inspire confidence
9. Transparent and reproducible
10. Community-first

## Ecosystem

| Component | Description |
|-----------|-------------|
| **Ringmaster Core** | Runtime, scheduling, execution, events |
| **CodeForge** | Artifact creation, validation, publishing |
| **Registry** | Artifact graph, relationships, discovery |
| **Local Zoo** | Browse, install, manage artifacts |
| **Marketplace** | Distribution, reviews, updates |
| **Codex** | Documentation, standards, tutorials |
| **Big Top** | Infinite canvas, projects, collaboration |

## Quick Start

```bash
# Install LocalCircus
curl -fsSL https://localcircus.dev/install.sh | bash

# Create an artifact
circus codeforge create my-plugin --type plugin

# Browse the Zoo
circus zoo search "search plugin"

# Install an artifact
circus zoo install codex-search-plugin
```

## Documentation

| Section | Description |
|---------|-------------|
| [Constitution](localcircus-docs/00-Constitution/) | Core philosophy and design |
| [Ringmaster Core](localcircus-docs/02-Ringmaster-Core/) | Runtime architecture |
| [Local Zoo](localcircus-docs/05-Local-Zoo/) | Artifact discovery |
| [CodeForge](localcircus-docs/03-CodeForge/) | Artifact creation |

## Specifications (LCAs)

| ID | Title | Status |
|----|-------|--------|
| [LCA-0002](./localcircus-specs/LCA-0002.md) | Artifact DNA | Active |
| [LCA-0003](./localcircus-specs/LCA-0003.md) | Artifact Card | Draft |
| [LCA-0004](./localcircus-specs/LCA-0004.md) | Registry Schema | Draft |
| [LCA-0005](./localcircus-specs/LCA-0005.md) | Capability Tags | Draft |
| LCA-0006 | Compatibility Matrix | Pending |
| LCA-0007 | Provider Interface | Pending |
| [LCA-0008](./localcircus-specs/LCA-0008.md) | Plugin Interface | Draft |

## Artifact Types

| Type | Description |
|------|-------------|
| Model | AI language models |
| Agent | Autonomous performers |
| Workflow (Act) | Automation workflows |
| Tool | Executable utilities |
| Plugin (Performer) | UI extensions |
| MCP Server | Model Context Protocol |
| Provider | AI provider connections |
| Dataset | Data resources |

## Packages

| Package | Description |
|---------|-------------|
| [packages/core](./packages/core/) | Ringmaster Core runtime |
| [packages/cli](./packages/cli/) | Command-line interface |
| [packages/storage](./packages/storage/) | Local artifact storage |
| [packages/plugin-runtime](./packages/plugin-runtime/) | Plugin system |
| [packages/artifact-sdk](./packages/artifact-sdk/) | Artifact management |
| [packages/provider-sdk](./packages/provider-sdk/) | AI provider adapters |
| [packages/workflow-sdk](./packages/workflow-sdk/) | Workflow execution |
| [packages/bigtop](./packages/bigtop/) | Infinite canvas & workflow builder |
| [packages/ui](./packages/ui/) | React components for Big Top |
| [packages/zoo](./packages/zoo/) | Local artifact browser & manager |
| [packages/codeforge](./packages/codeforge/) | Artifact creation & validation |
| [packages/registry](./packages/registry/) | Artifact registry & search |

## License

This project and its specifications are in the public domain under CC0-1.0.

---

*Technology should disappear behind creation.*
