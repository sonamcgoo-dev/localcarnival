# Artifact Reference

> Complete reference for all artifact types.

## Overview

Every item in LocalCircus is an **Artifact**. All artifacts share common properties defined in [LCA-0002: Artifact DNA](../../localcircus-specs/lca/active/lca-0002-artifact-dna.md).

## Artifact Types

| Type | Category | Description |
|------|----------|-------------|
| `model` | Animal | AI language models |
| `agent` | Performer | Autonomous AI agents |
| `workflow` | Act | Automation workflows |
| `tool` | Tool | Executable utilities |
| `plugin` | Performer | UI extensions |
| `extension` | Performer | System extensions |
| `mcp-server` | Box | MCP servers |
| `acp-tool` | Tool | ACP tools |
| `api-connector` | Connector | API connections |
| `dataset` | Knowledge | Data collections |
| `knowledge-pack` | Knowledge | Structured knowledge |
| `prompt-pack` | Knowledge | Prompt templates |
| `memory-pack` | Knowledge | Memory configurations |
| `theme` | Style | Visual themes |
| `workspace` | Big Top | Workspace templates |
| `project-template` | Template | Project templates |
| `benchmark` | Measure | Performance benchmarks |
| `evaluation` | Measure | Evaluation frameworks |
| `documentation` | Doc | Documentation |

---

## Model

> AI language models (Animal category).

### DNA Structure

```typescript
interface ModelArtifact extends ArtifactDNA {
  type: 'model';
  
  capabilities: [
    { id: 'model:chat' | 'model:completion' | 'model:embedding' | 'model:image' }
  ];
  
  modelConfig: {
    provider: string;
    modelId: string;
    contextWindow: number;
    supportsStreaming: boolean;
    supportsFunctionCalling?: boolean;
    supportsVision?: boolean;
    
    pricing?: {
      input: number;    // Per 1M tokens
      output: number;
      currency: string;
    };
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-123456789abc",
  "name": "openai-gpt-4",
  "type": "model",
  "version": "1.0.0",
  "capabilities": [
    { "id": "model:chat", "version": "1.0" }
  ],
  "modelConfig": {
    "provider": "openai",
    "modelId": "gpt-4",
    "contextWindow": 128000,
    "supportsStreaming": true,
    "supportsFunctionCalling": true,
    "supportsVision": true,
    "pricing": {
      "input": 30,
      "output": 60,
      "currency": "USD"
    }
  }
}
```

---

## Agent

> Autonomous AI agents (Performer category).

### DNA Structure

```typescript
interface AgentArtifact extends ArtifactDNA {
  type: 'agent';
  
  capabilities: [
    { id: 'agent:task' | 'agent:chat' | 'agent:reasoning' }
  ];
  
  agentConfig: {
    provider?: string;
    model?: string;
    
    systemPrompt?: string;
    
    tools?: string[];          // Tool artifact names
    workflows?: string[];     // Workflow artifact names
    
    memory?: {
      shortTerm?: boolean;
      longTerm?: boolean;
    };
    
    behavior?: {
      confirmDestructive?: boolean;
      maxIterations?: number;
    };
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-234567890abc",
  "name": "code-reviewer-agent",
  "type": "agent",
  "version": "1.0.0",
  "capabilities": [
    { "id": "agent:task" }
  ],
  "agentConfig": {
    "model": "openai-gpt-4",
    "systemPrompt": "You are an expert code reviewer...",
    "tools": ["read-file-tool", "analyze-code-tool"],
    "memory": {
      "shortTerm": true,
      "longTerm": true
    }
  }
}
```

---

## Workflow (Act)

> Automation workflows (Act category).

### DNA Structure

```typescript
interface WorkflowArtifact extends ArtifactDNA {
  type: 'workflow';
  
  capabilities: [
    { id: 'workflow:execute' }
  ];
  
  workflowConfig: {
    trigger: TriggerConfig;
    steps: StepConfig[];
    
    settings?: {
      timeout?: number;
      maxRetries?: number;
      continueOnError?: boolean;
    };
  };
}

interface TriggerConfig {
  type: 'schedule' | 'webhook' | 'event' | 'manual' | 'queue';
  config: Record<string, any>;
}

interface StepConfig {
  id: string;
  type: 'action' | 'logic' | 'transform';
  action?: string;
  config: Record<string, any>;
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-345678901abc",
  "name": "daily-report-workflow",
  "type": "workflow",
  "version": "1.0.0",
  "capabilities": [
    { "id": "workflow:execute" }
  ],
  "workflowConfig": {
    "trigger": {
      "type": "schedule",
      "config": { "cron": "0 9 * * *" }
    },
    "steps": [
      { "id": "fetch", "type": "action", "action": "http", "config": {} },
      { "id": "process", "type": "transform", "config": {} }
    ]
  }
}
```

---

## Tool

> Executable utilities (Tool category).

### DNA Structure

```typescript
interface ToolArtifact extends ArtifactDNA {
  type: 'tool';
  
  capabilities: [
    { id: 'tool:{tool-name}' }
  ];
  
  toolConfig: {
    language?: 'javascript' | 'python' | 'bash';
    entryPoint?: string;
    parameters?: JSONSchema;
    permissions?: string[];
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-456789012abc",
  "name": "json-formatter-tool",
  "type": "tool",
  "version": "1.0.0",
  "capabilities": [
    { "id": "tool:json-format" }
  ],
  "toolConfig": {
    "language": "javascript",
    "entryPoint": "dist/index.js",
    "parameters": {
      "type": "object",
      "properties": {
        "input": { "type": "string" },
        "indent": { "type": "number", "default": 2 }
      }
    }
  }
}
```

---

## Plugin (Performer)

> UI extensions (Performer category).

### DNA Structure

```typescript
interface PluginArtifact extends ArtifactDNA {
  type: 'plugin';
  
  capabilities: [
    { id: 'command:{name}' | 'tool:{name}' | 'ui:panel' | 'ui:sidebar' }
  ];
  
  pluginConfig: {
    main: string;
    ui?: {
      panels?: string[];
      sidebar?: string[];
    };
    permissions?: string[];
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-567890123abc",
  "name": "git-integration-plugin",
  "type": "plugin",
  "version": "1.0.0",
  "capabilities": [
    { "id": "command:git-status" },
    { "id": "ui:sidebar" }
  ],
  "pluginConfig": {
    "main": "dist/index.js",
    "ui": {
      "sidebar": "git-sidebar"
    },
    "permissions": ["filesystem:read", "network:request"]
  }
}
```

---

## MCP Server

> Model Context Protocol servers (Box category).

### DNA Structure

```typescript
interface MCPServerArtifact extends ArtifactDNA {
  type: 'mcp-server';
  
  capabilities: [
    { id: 'mcp:resource' | 'mcp:tool' | 'mcp:prompt' }
  ];
  
  mcpConfig: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    
    resources?: string[];
    tools?: string[];
    prompts?: string[];
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-678901234abc",
  "name": "filesystem-mcp-server",
  "type": "mcp-server",
  "version": "1.0.0",
  "capabilities": [
    { "id": "mcp:resource" },
    { "id": "mcp:tool" }
  ],
  "mcpConfig": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
    "resources": ["file://*"],
    "tools": ["read_file", "write_file", "list_directory"]
  }
}
```

---

## Dataset

> Data collections (Knowledge category).

### DNA Structure

```typescript
interface DatasetArtifact extends ArtifactDNA {
  type: 'dataset';
  
  capabilities: [
    { id: 'storage:data' }
  ];
  
  datasetConfig: {
    format: 'json' | 'csv' | 'parquet' | 'sqlite';
    size?: number;
    rowCount?: number;
    schema?: JSONSchema;
    source?: string;
  };
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-789012345abc",
  "name": "sample-products-dataset",
  "type": "dataset",
  "version": "1.0.0",
  "capabilities": [
    { "id": "storage:data" }
  ],
  "datasetConfig": {
    "format": "json",
    "size": 1048576,
    "rowCount": 10000,
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "price": { "type": "number" }
      }
    }
  }
}
```

---

## Theme

> Visual themes (Style category).

### DNA Structure

```typescript
interface ThemeArtifact extends ArtifactDNA {
  type: 'theme';
  
  capabilities: [
    { id: 'ui:theme' }
  ];
  
  themeConfig: {
    extends?: string;          // Parent theme
    colors?: ThemeColors;
    typography?: ThemeTypography;
    spacing?: ThemeSpacing;
    shadows?: ThemeShadows;
  };
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}
```

### Example

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-890123456abc",
  "name": "midnight-theme",
  "type": "theme",
  "version": "1.0.0",
  "capabilities": [
    { "id": "ui:theme" }
  ],
  "themeConfig": {
    "extends": "dark",
    "colors": {
      "primary": "#6366f1",
      "secondary": "#8b5cf6",
      "background": "#0f172a",
      "surface": "#1e293b",
      "text": "#f1f5f9",
      "border": "#334155"
    }
  }
}
```

---

## Common Properties

### Metadata (Required)

```typescript
interface ArtifactMetadata {
  description: string;      // Max 1000 chars
  keywords: string[];       // Max 10 items
  license: string;          // SPDX identifier
  homepage?: string;         // URL
  documentation?: string;   // URL
  repository?: string;      // URL
}
```

### Compatibility

```typescript
interface ArtifactCompatibility {
  platforms?: ('linux' | 'macos' | 'windows' | 'wasm')[];
  architectures?: ('x64' | 'arm64' | 'wasm32')[];
  localcircus?: { min?: string; max?: string };
  runtime?: { type: string; versionRange?: string }[];
}
```

### Signatures

```typescript
interface ArtifactSignatures {
  creator?: Signature;
  registry?: Signature;
}

interface Signature {
  algorithm: 'ed25519' | 'rsa' | 'ecdsa';
  keyId: string;
  value: string;
  created: string;
}
```

---

## Capability Reference

| Category | Capability | Description |
|----------|------------|-------------|
| Model | `model:chat` | Conversational AI |
| Model | `model:completion` | Text completion |
| Model | `model:embedding` | Text embeddings |
| Model | `model:image` | Image generation |
| Agent | `agent:task` | Task execution |
| Agent | `agent:chat` | Conversational |
| Workflow | `workflow:execute` | Automation |
| Tool | `tool:{name}` | Custom tool |
| Plugin | `command:{name}` | CLI command |
| Plugin | `ui:panel` | Panel UI |
| MCP | `mcp:resource` | MCP resources |
| MCP | `mcp:tool` | MCP tools |
| Storage | `storage:data` | Data storage |
| UI | `ui:theme` | Theme |

---

## Related Documents

- [LCA-0002: Artifact DNA](../../localcircus-specs/lca/active/lca-0002-artifact-dna.md)
- [LCA-0003: Artifact Card](../../localcircus-specs/lca/draft/lca-0003-artifact-card.md)
- [LCA-0005: Capability Tags](../../localcircus-specs/lca/draft/lca-0005-capability-tags.md)
