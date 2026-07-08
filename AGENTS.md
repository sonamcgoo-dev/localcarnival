# LocalCircus Project Agents Memory

## Project Overview

LocalCircus is a local-first creative operating environment that amplifies human capability through intelligent tools, automation, and collaboration.

**Constitution:** See `localcircus-docs/00-Constitution/` for the full design document.

**Repository:** https://github.com/sonamcgoo-dev/localcarnival

---

## Phase Progress (as of 2026-07-08)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 | ✅ | Naming, Brand, Governance |
| Phase 1 | ✅ | 7 LCAs + TypeScript types |
| Phase 2 | ✅ | Ringmaster Core, Registry, Provider, Memory |
| Phase 3 | ✅ | CodeForge documentation |
| Phase 4 | ✅ | Big Top, Workspace, Command Palette, Theme |
| Phase 5 | ✅ | Local Zoo, Marketplace |
| Phase 6 | 📋 Pending | Visual Builder, Live Jobs, Agent Collaboration |
| Phase 7 | 📋 Pending | SDKs (Artifact, Plugin, Provider, Workflow) |
| Phase 8 | 📋 Pending | Codex (Architecture, Tutorials, API Reference) |

### Pending Tasks

See `GOOSEAGENT-TODO.md` for detailed tasks to continue the project.

---

## Repository Structure

```
localcarnival/
├── localcircus-docs/           # Design documentation
│   ├── 00-Constitution/        # Project constitution
│   ├── 01-LocalCircus/        # App UI specs
│   ├── 02-Ringmaster-Core/    # Core runtime
│   ├── 03-CodeForge/          # Artifact creation
│   ├── 04-Registry/           # Artifact registry
│   ├── 05-Local-Zoo/          # Artifact browser
│   └── 06-Marketplace/        # Publishing
├── localcircus-specs/         # LCA specifications
│   ├── lca/
│   │   ├── active/            # Active specifications
│   │   └── draft/            # Draft specifications
│   └── src/                   # TypeScript types
└── codeforge/                # CodeForge app
```

---

## LCAs (Active)

| ID | Title | Status |
|----|-------|--------|
| LCA-0002 | Artifact DNA | Active |
| LCA-0003 | Artifact Card | Draft |
| LCA-0004 | Registry Schema | Draft |
| LCA-0005 | Capability Tags | Draft |
| LCA-0006 | Compatibility Matrix | Draft |
| LCA-0007 | Provider Interface | Draft |
| LCA-0008 | Plugin Interface | Draft |

---

## Key Conventions

### Creative Language

| Technical | Creative |
|-----------|----------|
| Workflow | Act |
| Workspace | Big Top |
| Plugin | Performer |
| Install | Adopt |
| Repository | Collection |

### Naming

- Artifact names: lowercase, hyphenated (e.g., `codex-search-plugin`)
- LCAs: `lca-XXXX-descriptive-name.md`
- Directories: kebab-case

---

## Current Agents

- **OpenHands**: Created Phases 1, 2, 4, 5
- **Agent 2**: Created Phase 0 and 3
- **gooseagent**: Next tasks in `GOOSEAGENT-TODO.md`

---

## Important Notes

1. All specifications should link to relevant LCAs
2. TypeScript interfaces for all data models
3. Code examples where applicable
4. ASCII diagrams preferred over images

---

*Last updated: 2026-07-08*
