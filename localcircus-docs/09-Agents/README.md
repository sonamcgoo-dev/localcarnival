# Agents System

> Autonomous AI agents in LocalCircus.

## Overview

Agents are AI assistants that can use tools, maintain context, and autonomously perform tasks within LocalCircus.

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LocalCircus Agent                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Agent Core                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Provider │  │  Memory  │  │  Tools   │  │   LLM    │ │ │
│  │  │  Router  │  │  Manager │  │ Registry │  │  Engine  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Capabilities                           │ │
│  │  Reasoning │ Planning │ Tool Use │ Learning │ Memory     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Definition

### DNA Structure

```typescript
interface AgentArtifact extends ArtifactDNA {
  type: 'agent';
  
  capabilities: [
    { id: 'agent:task' | 'agent:chat' | 'agent:reasoning' }
  ];
  
  agentConfig: {
    // Model configuration
    model?: ModelConfig;
    provider?: string;
    
    // Personality
    name?: string;
    description?: string;
    systemPrompt?: string;
    
    // Capabilities
    tools?: string[];       // Tool artifact names
    workflows?: string[];   // Workflow artifact names
    datasets?: string[];    // Dataset artifact names
    
    // Memory
    memory?: MemoryConfig;
    
    // Behavior
    behavior?: BehaviorConfig;
  };
}

interface ModelConfig {
  modelId: string;
  temperature?: number;      // 0.0 - 2.0
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

interface MemoryConfig {
  // Short-term (conversation)
  shortTerm: {
    enabled: boolean;
    maxMessages: number;
    summarizeAfter?: number;
  };
  
  // Long-term (persistent)
  longTerm: {
    enabled: boolean;
    maxEntries: number;
    importanceThreshold?: number;
  };
}

interface BehaviorConfig {
  // Decision making
  confirmDestructive?: boolean;
  maxIterations?: number;
  
  // Tool usage
  autoUseTools?: boolean;
  toolChoice?: 'auto' | 'none';
  
  // Output
  verbose?: boolean;
  includeThoughts?: boolean;
}
```

## Agent Types

```typescript
type AgentType = 
  | 'general'      // General purpose
  | 'specialist'  // Domain expert
  | 'assistant'   // User assistant
  | 'coder'       // Code-focused
  | 'analyst'     // Data analyst
  | 'researcher'; // Research focused
```

### Type Configurations

```typescript
const AgentTypeConfigs: Record<AgentType, Partial<AgentConfig>> = {
  general: {
    systemPrompt: 'You are a helpful assistant...',
    behavior: { confirmDestructive: true }
  },
  
  specialist: {
    systemPrompt: 'You are an expert in {domain}...',
    behavior: { autoUseTools: true, maxIterations: 10 }
  },
  
  assistant: {
    systemPrompt: 'You are a friendly assistant...',
    memory: { longTerm: { enabled: true } }
  },
  
  coder: {
    systemPrompt: 'You are an expert programmer...',
    tools: ['read-file', 'write-file', 'execute', 'search'],
    behavior: { confirmDestructive: false }
  },
  
  analyst: {
    systemPrompt: 'You are a data analyst...',
    tools: ['query-data', 'visualize', 'export'],
    behavior: { includeThoughts: true }
  },
  
  researcher: {
    systemPrompt: 'You are a research assistant...',
    tools: ['search', 'read-document', 'cite'],
    behavior: { maxIterations: 50 }
  }
};
```

## Tool Use

### Tool Registration

```typescript
interface AgentTools {
  // Available tools
  available: Tool[];
  
  // Tool selection strategy
  selection: 'auto' | 'manual' | 'required';
  
  // Tool configuration
  config: {
    maxToolsPerTurn?: number;
    toolRetryCount?: number;
    timeout?: number;
  };
}
```

### Tool Execution

```typescript
interface ToolExecution {
  tool: string;
  
  // Parameters
  params: Record<string, any>;
  
  // Result
  result?: ToolResult;
  error?: string;
  
  // Timing
  startedAt: string;
  completedAt?: string;
  duration?: number;
  
  // Context
  attempt: number;
  thought?: string;  // Reasoning for tool choice
}
```

## Memory System

### Memory Layers

```typescript
interface AgentMemory {
  // Working memory
  working: {
    messages: Message[];
    context: Record<string, any>;
    scratchpad: string[];
  };
  
  // Semantic memory
  semantic: {
    facts: Fact[];
    embeddings: Vector[];
  };
  
  // Episodic memory
  episodic: {
    episodes: Episode[];
    patterns: Pattern[];
  };
  
  // Procedural memory
  procedural: {
    learned: LearnedProcedure[];
    habits: Habit[];
  };
}
```

### Memory Operations

```typescript
interface MemoryOperations {
  // Add to memory
  remember(content: string, importance?: number): Promise<void>;
  
  // Retrieve from memory
  recall(query: string): Promise<MemoryEntry[]>;
  
  // Search
  search(query: string, filters?: SearchFilters): Promise<MemoryEntry[]>;
  
  // Forget
  forget(key: string): Promise<void>;
  
  // Summarize
  summarize(conversationId: string): Promise<string>;
}
```

## Planning

### Task Planning

```typescript
interface TaskPlan {
  id: string;
  
  // Goal
  goal: string;
  
  // Steps
  steps: PlanStep[];
  
  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  
  // Current step
  currentStepIndex: number;
  
  // Results
  results: Record<string, any>;
  errors: string[];
}

interface PlanStep {
  id: string;
  
  // Description
  description: string;
  
  // Tool/task
  type: 'tool' | 'thought' | 'query';
  action?: string;
  params?: Record<string, any>;
  
  // Dependencies
  dependsOn: string[];
  
  // Status
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'failed';
  
  // Result
  result?: any;
  error?: string;
}
```

### Planning Algorithm

```typescript
interface PlanningConfig {
  // Strategy
  strategy: 'react' | 'plan_then_act' | 'hierarchical';
  
  // Replanning
  replanOnFailure: boolean;
  maxReplans: number;
  
  // Validation
  validatePlan: boolean;
  allowPartialExecution: boolean;
}
```

## Multi-Agent

### Team Structure

```typescript
interface AgentTeam {
  id: string;
  name: string;
  
  // Members
  agents: TeamAgent[];
  
  // Configuration
  config: TeamConfig;
  
  // Communication
  communication: 'hierarchical' | 'democratic' | 'hub_and_spoke';
  
  // Shared context
  sharedMemory: SharedMemory;
}

interface TeamAgent {
  agentId: string;
  role: 'lead' | 'worker' | 'specialist';
  
  // Assignment
  currentTask?: Task;
  taskHistory: Task[];
  
  // Status
  status: 'available' | 'busy' | 'waiting';
  
  // Capabilities
  expertise: string[];
  tools: string[];
}
```

### Agent Communication

```typescript
interface AgentMessage {
  from: string;       // Agent ID
  to: string | 'team'; // Agent ID or broadcast
  
  type: 'task' | 'result' | 'question' | 'answer' | 'info';
  
  content: any;
  
  // Context
  replyTo?: string;
  inResponseTo?: string;
  
  timestamp: string;
}
```

## Agent Sessions

### Session Management

```typescript
interface AgentSession {
  id: string;
  
  // Agent
  agentId: string;
  
  // User
  userId: string;
  
  // Context
  workspaceId?: string;
  
  // State
  status: 'active' | 'idle' | 'ended';
  
  // Metrics
  messages: number;
  toolsUsed: number;
  duration: number;
  
  // History
  startedAt: string;
  endedAt?: string;
}

interface CreateSessionRequest {
  agentId: string;
  userId: string;
  
  // Initial context
  workspaceId?: string;
  prompt?: string;
  context?: Record<string, any>;
}
```

## CLI Commands

```bash
# List agents
circus agents list

# Create agent
circus agents create my-agent --type specialist

# Configure agent
circus agents config my-agent --model gpt-4

# Start session
circus agents chat my-agent

# View sessions
circus agents sessions my-agent

# Add to team
circus agents team add my-team --agent my-agent --role worker
```

## API Endpoints

```typescript
// Agent management
GET    /agents
POST   /agents
GET    /agents/:id
PUT    /agents/:id
DELETE /agents/:id

// Sessions
POST   /agents/:id/sessions
GET    /agents/:id/sessions
DELETE /sessions/:id

// Chat
POST   /sessions/:id/chat

// Memory
GET    /agents/:id/memory
POST   /agents/:id/memory
DELETE /agents/:id/memory/:memoryId

// Teams
GET    /teams
POST   /teams
GET    /teams/:id
PUT    /teams/:id
```

## Related Documents

- [Agent Collaboration](../06-BigTop/agent-collaboration.md)
- [Plugin SDK](../13-Plugin-SDK/README.md)
- [LCA-0002: Artifact DNA](../localcircus-specs/lca/active/lca-0002-artifact-dna.md)
