# Visual Workflow Builder

> Drag-and-drop workflow creation on the Big Top canvas.

## Overview

The Visual Workflow Builder enables users to create automation workflows (Acts) through an intuitive node-based interface on the Big Top canvas.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Visual Workflow Builder                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────────────────────────────────────┐    │
│  │  Node   │  │                                          │    │
│  │ Palette │  │              Canvas                      │    │
│  │          │  │                                          │    │
│  │ [Trigger]│  │    ┌─────┐       ┌─────┐             │    │
│  │ [Action] │  │    │Start│──────▶│Action│             │    │
│  │ [Logic]  │  │    └─────┘       └─────┘             │    │
│  │ [Output] │  │           │        │                   │    │
│  │          │  │           ▼        ▼                   │    │
│  │ [Search] │  │         ┌─────┐  ┌─────┐            │    │
│  └──────────┘  │         │Cond │  │Output│            │    │
│                 │         └──┬──┘  └─────┘            │    │
│  ┌──────────┐  │            │                          │    │
│  │Properties│  │            ▼                          │    │
│  │  Panel   │  │          ┌─────┐                     │    │
│  │          │  │          │End  │                     │    │
│  │ Config   │  │          └─────┘                     │    │
│  │ Inputs   │  │                                          │    │
│  │ Outputs  │  └──────────────────────────────────────────┘    │
│  └──────────┘                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Toolbar: [▶Run] [⏹Stop] [↩Undo] [↪Redo] [🔍Zoom]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Node Types

### 1. Trigger Nodes

Initiate workflow execution.

```typescript
interface TriggerNode {
  type: 'trigger';
  triggerType: TriggerType;
  config: TriggerConfig;
}

type TriggerType = 
  | 'schedule'      // Cron-based
  | 'webhook'       // HTTP trigger
  | 'event'         // System event
  | 'manual'        // Manual trigger
  | 'file'          // File-based
  | 'queue';        // Message queue

interface ScheduleTriggerConfig {
  cron: string;           // Cron expression
  timezone: string;        // IANA timezone
  enabled: boolean;
}

interface WebhookTriggerConfig {
  path: string;            // URL path
  method: 'GET' | 'POST';
  auth?: AuthConfig;
}
```

### 2. Action Nodes

Execute operations.

```typescript
interface ActionNode {
  type: 'action';
  actionType: ActionType;
  config: ActionConfig;
}

type ActionType =
  | 'http'           // HTTP request
  | 'transform'      // Data transformation
  | 'script'         // Custom script
  | 'agent'          // Run agent
  | 'tool'           // Run tool
  | 'notification'   // Send notification
  | 'database'       // Database operation
  | 'file';         // File operation

interface HTTPActionConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}
```

### 3. Logic Nodes

Control flow.

```typescript
interface LogicNode {
  type: 'logic';
  logicType: LogicType;
  config: LogicConfig;
}

type LogicType =
  | 'condition'      // If/else
  | 'switch'         // Switch/case
  | 'loop'           // For each / while
  | 'parallel';      // Parallel execution

interface ConditionConfig {
  expression: string;     // e.g., "{{data.status}} == 'active'"
  trueBranch: string;     // Node ID for true
  falseBranch: string;    // Node ID for false
}

interface LoopConfig {
  iterator: 'array' | 'range' | 'times';
  variableName: string;   // e.g., "item"
  maxIterations?: number;
}
```

### 4. Transform Nodes

Data manipulation.

```typescript
interface TransformNode {
  type: 'transform';
  transformType: TransformType;
  config: TransformConfig;
}

type TransformType =
  | 'filter'         // Filter array items
  | 'map'            // Transform array items
  | 'reduce'         // Aggregate array
  | 'merge'          // Merge objects
  | 'template';      // String template

interface FilterTransformConfig {
  inputArray: string;      // e.g., "{{steps.fetch.items}}"
  condition: string;      // e.g., "item.price > 100"
}
```

## Node Structure

```typescript
interface WorkflowNode {
  id: string;
  type: NodeType;
  
  // Position (canvas coordinates)
  position: { x: number; y: number };
  
  // Size
  size?: { width: number; height: number };
  
  // Node-specific config
  config: NodeConfig;
  
  // Ports
  inputs: Port[];
  outputs: Port[];
  
  // State
  isSelected: boolean;
  isLocked: boolean;
  isError: boolean;
  
  // Metadata
  label?: string;
  icon?: string;
  description?: string;
}

interface Port {
  id: string;
  name: string;
  type: DataType;
  direction: 'input' | 'output';
  required?: boolean;
  defaultValue?: any;
}

type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any';
```

## Connections

### Connection Types

```typescript
interface Connection {
  id: string;
  
  // Endpoints
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  
  // Path
  pathType: 'default' | 'smooth' | 'straight';
  
  // Animation
  isActive: boolean;      // Currently executing
  isError: boolean;
}
```

### Connection Rules

| Rule | Description |
|------|-------------|
| Type matching | Output type must match input type |
| One-to-many | One output can connect to many inputs |
| Many-to-one | Multiple outputs cannot connect to one input |
| No cycles | No circular connections (except loop nodes) |

## Node Palette

### Palette Structure

```typescript
interface NodePalette {
  categories: PaletteCategory[];
  searchQuery: string;
  recentNodes: string[];
}

interface PaletteCategory {
  id: string;
  name: string;
  icon: string;
  nodes: PaletteNode[];
}

interface PaletteNode {
  type: NodeType;
  name: string;
  description: string;
  icon: string;
  
  // For search
  keywords: string[];
  examples: string[];
}
```

### Default Categories

| Category | Icon | Nodes |
|----------|------|-------|
| Triggers | ⚡ | Schedule, Webhook, Event, Manual |
| HTTP | 🌐 | GET, POST, PUT, DELETE |
| Data | 📊 | Filter, Map, Reduce, Merge |
| Logic | 🔀 | If, Switch, Loop, Parallel |
| AI | 🤖 | Agent, Embed, Search |
| Tools | 🔧 | Calculator, Formatter, Encoder |
| Output | 📤 | Notification, Log, Save |

## Canvas Features

### Pan & Zoom

```typescript
interface CanvasView {
  // Position
  panX: number;
  panY: number;
  
  // Zoom (0.1 to 4.0)
  zoom: number;
  
  // Grid
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// Controls
- Mouse drag: Pan canvas
- Scroll wheel: Zoom
- Double-click: Reset view
- Keyboard shortcuts: Cmd+0 (fit), Cmd+1 (100%)
```

### Selection

```typescript
interface SelectionManager {
  selectNode(nodeId: string, additive?: boolean): void;
  selectMultiple(nodeIds: string[]): void;
  selectAll(): void;
  selectInRect(rect: Rect): void;  // Marquee selection
  clearSelection(): void;
}

// Keyboard
- Click: Select single
- Shift+Click: Add to selection
- Cmd+A: Select all
- Escape: Clear selection
```

### Alignment

```typescript
interface AlignmentTool {
  // Align selected nodes
  alignLeft(): void;      // Left edge
  alignRight(): void;     // Right edge
  alignTop(): void;       // Top edge
  alignBottom(): void;     // Bottom edge
  alignCenterX(): void;    // Horizontal center
  alignCenterY(): void;    // Vertical center
  
  // Distribute
  distributeH(): void;      // Horizontal spacing
  distributeV(): void;     // Vertical spacing
}
```

## Validation

### Real-time Validation

```typescript
interface WorkflowValidator {
  validate(workflow: Workflow): ValidationResult;
  validateNode(node: WorkflowNode): NodeValidation[];
  validateConnections(connections: Connection[]): ConnectionValidation[];
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  nodeId?: string;
  type: 'error' | 'warning';
  code: string;
  message: string;
  fix?: string;  // Suggested fix
}
```

### Validation Rules

| Rule | Error Code | Description |
|------|------------|-------------|
| Orphan node | `ORPHAN_NODE` | Node with no inputs connected |
| Missing required | `MISSING_REQUIRED` | Required port not connected |
| Type mismatch | `TYPE_MISMATCH` | Connected ports have incompatible types |
| Cycle detected | `CYCLE_DETECTED` | Circular connection found |
| Invalid expression | `INVALID_EXPRESSION` | Expression syntax error |
| Missing trigger | `NO_TRIGGER` | Workflow has no trigger node |

## Properties Panel

### Panel Sections

```typescript
interface PropertiesPanel {
  node: WorkflowNode;
  
  // Sections
  general: GeneralSection;
  config: ConfigSection;
  inputs: InputsSection;
  outputs: OutputsSection;
  advanced: AdvancedSection;
}

interface GeneralSection {
  name: string;           // Editable label
  description?: string;
  icon?: string;
}

interface ConfigSection {
  fields: ConfigField[];
}

interface ConfigField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'code' | 'secret';
  label: string;
  value: any;
  placeholder?: string;
  options?: { label: string; value: any }[];
  required?: boolean;
  validation?: ValidationRule[];
}
```

## Workflow Definition

### JSON Format

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  
  // Version
  version: string;
  
  // Nodes
  nodes: WorkflowNode[];
  
  // Connections
  connections: Connection[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Settings
  settings: WorkflowSettings;
}

interface WorkflowSettings {
  timeout?: number;           // Max execution time (ms)
  retryOnError?: boolean;
  maxRetries?: number;
  continueOnError?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

### Example

```json
{
  "id": "wf-001",
  "name": "Daily Report",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": { "x": 100, "y": 100 },
      "config": {
        "triggerType": "schedule",
        "cron": "0 9 * * *",
        "timezone": "America/New_York"
      }
    },
    {
      "id": "fetch-1",
      "type": "action",
      "position": { "x": 300, "y": 100 },
      "config": {
        "actionType": "http",
        "method": "GET",
        "url": "https://api.example.com/data"
      }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "sourceNodeId": "trigger-1",
      "sourcePortId": "output",
      "targetNodeId": "fetch-1",
      "targetPortId": "input"
    }
  ],
  "settings": {
    "timeout": 60000,
    "retryOnError": true,
    "maxRetries": 3
  }
}
```

## Import/Export

### Export

```typescript
interface WorkflowExporter {
  // Export as JSON
  exportJSON(workflow: Workflow): string;
  
  // Export as image
  exportImage(format: 'png' | 'svg'): Promise<Blob>;
  
  // Export as YAML
  exportYAML(): string;
}
```

### Import

```typescript
interface WorkflowImporter {
  // Import from JSON
  importJSON(json: string): Workflow;
  
  // Import from YAML
  importYAML(yaml: string): Workflow;
  
  // Import from YAML
  importFromFile(file: File): Promise<Workflow>;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected |
| `Cmd+C` | Copy |
| `Cmd+V` | Paste |
| `Cmd+D` | Duplicate |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `Cmd+G` | Group |
| `Cmd+Shift+G` | Ungroup |
| `Space+Drag` | Pan |
| `Cmd+A` | Select all |
| `Cmd+F` | Search nodes |
| `Cmd+0` | Fit view |
| `Cmd+1` | Zoom 100% |
| `+` | Zoom in |
| `-` | Zoom out |

## Related Documents

- [Acts (Workflows)](../10-Acts) — Workflow specification
- [Big Top Canvas](../01-LocalCircus/bigtop.md) — Canvas base
- [LCA-0002: Artifact DNA](../localcircus-specs/lca/active/lca-0002-artifact-dna.md) — Workflow artifact type
