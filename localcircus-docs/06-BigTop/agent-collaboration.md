# Agent Collaboration

> Multi-agent workspace coordination.

## Overview

Agent Collaboration enables multiple AI agents to work together on complex tasks, sharing context, delegating work, and communicating effectively.

## Team Model

### Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Team                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent    │  │   Agent    │  │   Agent    │            │
│  │   Alpha    │  │   Beta     │  │   Gamma    │            │
│  │  (Lead)   │  │  (Worker)  │  │  (Worker)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                                                    │
│         │ Shared Context                                     │
│         ▼                                                    │
│  ┌─────────────────────────────┐                              │
│  │      Shared Memory         │                              │
│  │  - Task Queue              │                              │
│  │  - Shared Knowledge        │                              │
│  │  - Team History            │                              │
│  └─────────────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Team

```typescript
interface Team {
  id: string;
  name: string;
  
  // Members
  agents: TeamMember[];
  
  // Configuration
  config: TeamConfig;
  
  // Shared resources
  sharedContext: SharedContext;
  
  // State
  state: TeamState;
  
  // Metadata
  createdAt: string;
  createdBy: string;
}

interface TeamMember {
  agentId: string;
  name: string;
  role: AgentRole;
  
  // Capabilities
  capabilities: Capability[];
  
  // Current assignment
  currentTask?: Task;
  
  // Status
  status: 'available' | 'busy' | 'offline';
  
  // Metrics
  completedTasks: number;
  successRate: number;
}

type AgentRole = 
  | 'lead'          // Orchestrates others
  | 'worker'        // Executes tasks
  | 'specialist';   // Expert in domain

interface TeamConfig {
  // Communication
  communicationMode: 'hierarchical' | 'democratic' | 'hub-and-spoke';
  
  // Task distribution
  taskAssignment: 'manual' | 'capability-based' | 'load-balanced';
  
  // Decision making
  decisionThreshold: number;  // Votes needed (for democratic)
  
  // Timeouts
  taskTimeout?: number;
  responseTimeout?: number;
}
```

### Task

```typescript
interface Task {
  id: string;
  
  // Definition
  name: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  
  // Assignment
  assignedTo?: string;      // Agent ID
  createdBy: string;
  
  // Requirements
  requiredCapabilities: Capability[];
  estimatedDuration?: number;
  
  // State
  status: TaskStatus;
  progress?: number;
  
  // Results
  result?: any;
  error?: TaskError;
  
  // Hierarchy
  parentTaskId?: string;
  subtasks: string[];
  
  // Timing
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

## Communication

### Message Types

```typescript
interface AgentMessage {
  id: string;
  
  // Routing
  from: string;           // Agent ID
  to: string | 'broadcast'; // Agent ID or all
  
  // Content
  type: MessageType;
  content: any;
  
  // Context
  replyTo?: string;       // Message ID this replies to
  inResponseTo?: string;
  
  // Metadata
  timestamp: string;
  expiresAt?: string;
}

type MessageType =
  | 'task_request'      // Request a task
  | 'task_offer'         // Offer to do task
  | 'task_assigned'      // Task assigned
  | 'task_started'       // Work started
  | 'task_progress'      // Progress update
  | 'task_completed'     // Work done
  | 'task_failed'        // Work failed
  | 'help_request'       // Need assistance
  | 'help_offer'         // Offering help
  | 'question'           // Asking question
  | 'answer'            // Providing answer
  | 'information'        // Sharing info
  | 'feedback'          // Giving feedback
  | 'query';           // Querying state
```

### Communication Patterns

#### 1. Hierarchical (Lead-Worker)

```
Lead Agent
    │
    ├──▶ Worker Alpha (task assignment)
    │       │
    │       └──▶ (reports back)
    │
    ├──▶ Worker Beta (task assignment)
    │       │
    │       └──▶ (reports back)
    │
    └──▶ Worker Gamma (task assignment)
            │
            └──▶ (reports back)
```

#### 2. Democratic

```
┌─────────┐
│ Agent A │◀──────────────────────────▶┌─────────┐
└────┬────┘                              │ Agent B │
     │                                    └────┬────┘
     │                                          │
     │        ┌──────────────────────┐        │
     └───────▶│    Shared Context     │◀───────┘
              └──────────────────────┘
```

#### 3. Hub-and-Spoke

```
        ┌─────────┐
        │ Agent A │
        └────┬────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌───────┐┌───────┐┌───────┐
│Agent B││Agent C││Agent D│
└───────┘└───────┘└───────┘
```

## Task Delegation

### Delegation Flow

```typescript
interface TaskDelegation {
  // Lead assigns task
  assignTask(task: Task, agentId: string): Promise<DelegationResult>;
  
  // Agent accepts/declines
  acceptTask(taskId: string): Promise<void>;
  declineTask(taskId: string, reason?: string): Promise<void>;
  
  // Progress reporting
  reportProgress(taskId: string, progress: number): Promise<void>;
  
  // Completion
  completeTask(taskId: string, result: any): Promise<void>;
}

interface DelegationResult {
  success: boolean;
  assignedAgent?: string;
  estimatedCompletion?: string;
  alternativeAgents?: string[];
}
```

### Delegation UI

```
┌─────────────────────────────────────────────────────────────┐
│ Task: Generate Performance Report                          │
├─────────────────────────────────────────────────────────────┤
│ Description: Compile metrics from all data sources...      │
│                                                              │
│ Required: data-analysis, report-generation                 │
│ Priority: High                                             │
├─────────────────────────────────────────────────────────────┤
│ Available Agents:                                           │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🤖 Alpha (Lead)                         Available    │   │
│ │     Capabilities: data-analysis, strategy         │   │
│ │     Current: Writing documentation                │   │
│ │                                     [Assign]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🤖 Beta (Worker)                         Available    │   │
│ │     Capabilities: data-analysis, visualization     │   │
│ │     Current: Idle                                 │   │
│ │                                     [Assign]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🤖 Gamma (Worker)                       Busy         │   │
│ │     Capabilities: visualization, report-generation │   │
│ │     Current: Generating charts                      │   │
│ │                         (ETA: 15 min)    [Assign]   │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Shared Context

### Context Structure

```typescript
interface SharedContext {
  // Shared knowledge
  knowledge: KnowledgeEntry[];
  
  // Task queue
  taskQueue: Task[];
  
  // Team memory
  teamMemory: MemoryEntry[];
  
  // Recent activity
  activityLog: ActivityEntry[];
  
  // Agreements
  agreements: Agreement[];
}

interface KnowledgeEntry {
  id: string;
  content: string;
  category: 'fact' | 'preference' | 'decision' | 'constraint';
  
  // Source
  contributedBy: string;  // Agent ID
  
  // Metadata
  confidence: number;      // 0-1
  verifiedBy: string[];    // Agent IDs that verified
  
  // Temporal
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}
```

### Context Sync

```typescript
interface ContextSync {
  // Push changes
  push(entry: ContextEntry): Promise<void>;
  
  // Pull updates
  pull(since: string): Promise<ContextUpdate[]>;
  
  // Subscribe
  subscribe(handler: (update: ContextUpdate) => void): Unsubscribe;
}

interface ContextUpdate {
  type: 'added' | 'updated' | 'removed';
  entry: ContextEntry;
  updatedBy: string;
  timestamp: string;
}
```

## Multi-Agent Canvas

### Agent Nodes

```typescript
interface AgentCanvasNode {
  agentId: string;
  
  // Position
  position: { x: number; y: number };
  
  // Display
  avatar: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  
  // Visualization
  isThinking: boolean;
  messageCount: number;
}

type AgentStatus = 'available' | 'busy' | 'thinking' | 'waiting' | 'error';
```

### Canvas View

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Agent Workspace                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                     │
│  │  🤖     │  "Alpha"                                           │
│  │  Lead  │  Status: Working                                    │
│  └────┬────┘  Task: Generate Report                           │
│       │                                                         │
│       │ assigns                                                 │
│       ▼                                                         │
│  ┌─────────┐                                                     │
│  │  🤖     │  "Beta"                                            │
│  │ Worker │  Status: Working                                    │
│  └────┬────┘  Task: Fetch Data                                 │
│       │                                                         │
│       │ reports                                                 │
│       ▼                                                         │
│  ┌─────────┐                                                     │
│  │  🤖     │  "Gamma"                                           │
│  │ Worker │  Status: Idle                                       │
│  └─────────┘                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Shared Context: 15 entries │ Tasks: 3 active │ Agents: 3     │
└─────────────────────────────────────────────────────────────────┘
```

## Role-Based Access

### Roles

```typescript
interface RolePermissions {
  role: AgentRole;
  
  // Task permissions
  canAssignTasks: boolean;
  canAcceptTasks: boolean;
  canCancelTasks: boolean;
  canDelegateTasks: boolean;
  
  // Context permissions
  canWriteContext: boolean;
  canDeleteContext: boolean;
  canVerifyContext: boolean;
  
  // Communication
  canBroadcast: boolean;
  canDirectMessage: boolean;
  
  // Management
  canManageTeam: boolean;
  canInviteAgents: boolean;
  canRemoveAgents: boolean;
}
```

### Default Permissions

| Permission | Lead | Worker | Specialist |
|------------|------|--------|------------|
| Assign tasks | ✓ | ✗ | ✗ |
| Accept tasks | ✓ | ✓ | ✓ |
| Delegate tasks | ✓ | ✗ | ✗ |
| Write context | ✓ | ✓ | ✓ |
| Delete context | ✓ | ✗ | ✗ |
| Broadcast | ✓ | ✗ | ✓ |
| Direct message | ✓ | ✓ | ✓ |
| Manage team | ✓ | ✗ | ✗ |

## Agent Collaboration API

```typescript
interface AgentCollaboration {
  // Team management
  createTeam(config: TeamConfig): Promise<Team>;
  joinTeam(teamId: string): Promise<void>;
  leaveTeam(): Promise<void>;
  
  // Task management
  createTask(task: CreateTask): Promise<Task>;
  assignTask(taskId: string, agentId: string): Promise<void>;
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  
  // Communication
  sendMessage(message: AgentMessage): Promise<void>;
  getMessages(since?: string): Promise<AgentMessage[]>;
  
  // Context
  readContext(): Promise<SharedContext>;
  writeContext(entry: ContextEntry): Promise<void>;
  
  // Monitoring
  getTeamStatus(): Promise<TeamStatus>;
  getAgentStatus(agentId: string): Promise<AgentStatus>;
}
```

## CLI Commands

```bash
# Team management
circus team create "Report Team" --mode hierarchical
circus team join team-123
circus team leave

# List team
circus team list
circus team show team-123

# Task management
circus team task create "Fetch data" --priority high
circus team task assign task-456 --to beta
circus team task list

# Communication
circus team send "Gamma" "Need the charts"
circus team broadcast "Meeting in 5 minutes"

# Context
circus team context read
circus team context add "Use metric X for reporting"
```

## Best Practices

### For Leads

1. **Clear task definition** — Provide detailed task descriptions
2. **Right capability match** — Assign to agents with required capabilities
3. **Monitor progress** — Track task completion
4. **Handle failures** — Reassign or handle failed tasks

### For Workers

1. **Request clarification** — Ask if task is unclear
2. **Report progress** — Keep lead informed
3. **Ask for help** — Request assistance when stuck
4. **Document results** — Provide clear outputs

### For All Agents

1. **Respect context** — Don't overwrite others' work
2. **Verify information** — Cross-check shared facts
3. **Communicate clearly** — Be concise and specific
4. **Stay in role** — Follow assigned responsibilities

## Related Documents

- [Shared Canvas](./shared-canvas.md) — Real-time collaboration
- [Live Jobs Dashboard](./live-jobs.md) — Task monitoring
- [Agents System](../09-Agents) — Agent specifications
- [Memory Service](../02-Ringmaster-Core/memory.md) — Shared memory
