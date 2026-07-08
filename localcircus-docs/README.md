# LocalCircus Documentation

> Design and architecture documentation for LocalCircus.

## Quick Links

| Section | Description |
|---------|-------------|
| [Constitution](./00-Constitution/) | Core philosophy and design principles |
| [LocalCircus](./01-LocalCircus/) | Application UI components |
| [Ringmaster Core](./02-Ringmaster-Core/) | Runtime architecture |
| [CodeForge](./03-CodeForge/) | Artifact creation |
| [Registry](./04-Registry/) | Artifact registry |
| [Local Zoo](./05-Local-Zoo/) | Artifact discovery |
| [Big Top](./06-BigTop/) | Canvas and collaboration |
| [Marketplace](./06-Marketplace/) | Publishing and distribution |
| [Community](./07-Community/) | Reviews, trust, verification |
| [Codex](./08-Codex/) | Documentation system |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LocalCircus                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Big     │  │   Local    │  │   Code     │             │
│  │    Top     │  │    Zoo     │  │    Forge    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │  Ringmaster │                               │
│                   │    Core     │                               │
│                   └──────┬──────┘                               │
│                          │                                      │
│         ┌────────────────┼────────────────┐                   │
│         │                │                │                     │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐           │
│  │  Registry   │  │  Providers  │  │   Memory    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase Status

| Phase | Status | Documents |
|-------|--------|-----------|
| Phase 0 | ✅ | Naming, Brand, Governance |
| Phase 1 | ✅ | 7 LCAs + TypeScript types |
| Phase 2 | ✅ | Ringmaster Core, Registry, Provider, Memory |
| Phase 3 | ✅ | CodeForge |
| Phase 4 | ✅ | Big Top, Workspace, Command Palette, Theme |
| Phase 5 | ✅ | Local Zoo, Marketplace |
| Phase 6 | ✅ | Visual Builder, Live Jobs, Agent Collab, Shared Canvas |
| Phase 7 | ✅ | SDKs (Artifact, Plugin, Provider, Workflow) |
| Phase 8 | ✅ | Codex (Architecture, Tutorials, API, Artifact Ref) |
| Phase 9 | ✅ | Community (Reviews, Trust, Verification, Forking) |

## Getting Started

1. Read the [Constitution](./00-Constitution/) to understand the design philosophy
2. Review the [LCAs](../localcircus-specs/lca/) for technical specifications
3. Explore the component documentation for your area of interest

## Contributing

See [Contributing Guide](../localcircus-specs/governance/CONTRIBUTING.md) for how to contribute documentation.
