# Shared Canvas

> Real-time collaboration on the Big Top canvas.

## Overview

Shared Canvas enables multiple users and agents to work together on the same Big Top canvas in real-time, seeing each other's cursors, selections, and changes instantly.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Shared Canvas                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Canvas Layer                          │   │
│  │                                                         │   │
│  │     ┌─────┐                      ┌─────┐              │   │
│  │     │Node │  👆 User A (editing)  │Node │              │   │
│  │     └─────┘                      └─────┘              │   │
│  │                    👆 User B (viewing)                 │   │
│  │         ┌─────┐                                        │   │
│  │         │Node │                                        │   │
│  │         └─────┘                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Presence Bar: [A] Alice  [B] Bob  [C] Charlie           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    Collaboration Server                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Presence │  │  Cursor  │  │  Change  │  │  Lock    │     │
│  │ Service  │  │  Sync    │  │  Merge   │  │  Manager │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Presence

### User Presence

```typescript
interface UserPresence {
  userId: string;
  userName: string;
  
  // Cursor position
  cursor: {
    x: number;
    y: number;
    visible: boolean;
  };
  
  // Viewport
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  
  // Selection
  selection: string[];  // Selected node IDs
  
  // Activity
  isActive: boolean;
  lastActiveAt: string;
  
  // Color (for cursors)
  color: string;
  
  // Avatar
  avatar?: string;
}
```

### Presence Display

```
┌─────────────────────────────────────────────────────────────────┐
│ Presence: [👤 Alice] [👤 Bob] [👤 Charlie] [+3]               │
└─────────────────────────────────────────────────────────────────┘

On canvas:
         Alice's cursor
            👆
            │
    ┌───────┴───────┐
    │    Alice's    │
    │    Selection  │
    └───────────────┘
                    │
                    │ Bob's cursor
                    👆
```

## Cursors

### Cursor Types

```typescript
interface Cursor {
  userId: string;
  userName: string;
  color: string;
  
  // Position
  x: number;
  y: number;
  
  // State
  isVisible: boolean;
  
  // Action indicator
  action?: CursorAction;
}

type CursorAction = 
  | { type: 'selecting'; rect?: Rect }
  | { type: 'panning' }
  | { type: 'connecting' }
  | { type: 'typing' }
  | { type: 'dragging'; nodeIds?: string[] };
```

### Cursor Rendering

```
┌─────────────────────────────────────────────┐
│                                             │
│  Alice (blue)      Bob (green)     Charlie (purple)
│     👆                 👆               👆
│    "Selecting"     "Viewing"       "Editing"
│                                             │
└─────────────────────────────────────────────┘
```

## Selection Broadcasting

### Selection Sync

```typescript
interface SelectionSync {
  // Local selection changes
  select(nodeIds: string[]): void;
  clearSelection(): void;
  
  // Remote selections (read-only display)
  remoteSelections: Map<string, string[]>;
}
```

### Selection Display

```typescript
interface SelectionDisplay {
  // Own selection
  ownSelection: string[];
  
  // Others' selections
  remoteSelections: {
    [userId: string]: {
      nodeIds: string[];
      color: string;
      userName: string;
    };
  };
}
```

```
┌─────────────────────────────────────────────────────────────┐
│ Legend:                                                    │
│  [Blue border] Your selection                             │
│  [Dashed border] Alice's selection                        │
│  [Dotted border] Bob's selection                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                               │
│  │  Node   │ ← Your selection (blue solid)                 │
│  └─────────┘                                               │
│                                                             │
│       ┌─────────┐                                          │
│       │  Node   │ ← Alice's selection (blue dashed)       │
│       └─────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Real-time Sync

### Sync Protocol

```typescript
interface SyncProtocol {
  // Operation types
  operationType: 'create' | 'update' | 'delete' | 'move' | 'connect';
  
  // Target
  targetType: 'node' | 'connection' | 'layer' | 'canvas';
  targetId: string;
  
  // Change
  change: any;
  
  // Metadata
  userId: string;
  timestamp: number;
  operationId: string;  // For conflict resolution
}
```

### Sync Events

```typescript
interface SyncEvents {
  // Cursor movement
  'cursor:move': { userId: string; x: number; y: number };
  
  // Selection changes
  'selection:change': { userId: string; nodeIds: string[] };
  
  // Node operations
  'node:create': { userId: string; node: WorkflowNode };
  'node:update': { userId: string; nodeId: string; changes: any };
  'node:delete': { userId: string; nodeId: string };
  'node:move': { userId: string; nodeId: string; position: Point };
  
  // Connection operations
  'connection:create': { userId: string; connection: Connection };
  'connection:delete': { userId: string; connectionId: string };
  
  // Canvas operations
  'canvas:viewport': { userId: string; viewport: Viewport };
  
  // Presence
  'user:join': { userId: string; user: UserPresence };
  'user:leave': { userId: string };
  'user:active': { userId: string; isActive: boolean };
}
```

## Conflict Resolution

### Conflict Types

```typescript
interface Conflict {
  type: ConflictType;
  operations: Operation[];
  timestamp: number;
}

type ConflictType = 
  | 'concurrent_edit'    // Same property edited
  | 'concurrent_delete'  // Deleted while editing
  | 'concurrent_move'    // Moved simultaneously
  | 'reference_missing'; // Connected node deleted
```

### Resolution Strategies

```typescript
interface ConflictResolution {
  strategy: ResolutionStrategy;
  
  // For concurrent edits
  resolveByTimestamp(operations: Operation[]): Operation;
  resolveByUser(operations: Operation[], priorityUserId: string): Operation;
  resolveByMerge(operations: Operation[]): MergedOperation;
}

type ResolutionStrategy = 
  | 'last-write-wins'      // Most recent change wins
  | 'first-write-wins'    // First change wins
  | 'user-priority'       // Higher priority user wins
  | 'merge'               // Attempt automatic merge
  | 'manual';             // Ask user to resolve
```

### Conflict UI

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Conflict Detected                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Both you and Alice edited "Node A" simultaneously:         │
│                                                             │
│ Your version:          Alice's version:                    │
│ ┌────────────────┐     ┌────────────────┐                │
│ │ Label: "Fetch" │     │ Label: "Get"   │                │
│ │ Color: Blue    │     │ Color: Blue    │                │
│ └────────────────┘     └────────────────┘                │
│                                                             │
│ Resolution:                                                │
│ [Keep Mine] [Keep Theirs] [Merge Both] [Ask Alice]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Locking

### Lock Types

```typescript
interface Lock {
  type: LockType;
  targetId: string;
  userId: string;
  acquiredAt: string;
  expiresAt?: string;
}

type LockType = 
  | 'edit'      // Full edit access
  | 'view'      // View only (can't select)
  | 'comment';  // Can add comments only
```

### Lock Behavior

```typescript
interface LockManager {
  // Acquire lock
  acquireLock(type: LockType, targetId: string): Promise<Lock>;
  
  // Release lock
  releaseLock(targetId: string): Promise<void>;
  
  // Check lock status
  getLockStatus(targetId: string): Promise<Lock | null>;
  
  // Force release (admin only)
  forceRelease(targetId: string): Promise<void>;
}
```

### Lock UI

```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Node A is being edited by Alice                        │
│                                                             │
│ [Request Edit Access] [View Anyway] [Go to Node]         │
└─────────────────────────────────────────────────────────────┘
```

## Comments

### Comment Structure

```typescript
interface Comment {
  id: string;
  
  // Content
  content: string;
  author: UserInfo;
  
  // Position
  position: {
    x: number;
    y: number;
  };
  
  // Target (optional)
  targetType?: 'node' | 'connection' | 'canvas';
  targetId?: string;
  
  // Replies
  replies: CommentReply[];
  
  // State
  resolved: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Comment Display

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌─────────┐                                             │
│    │  Node   │                                            │
│    └────┬────┘                                             │
│         │                                                  │
│         │ 💬 2 comments                                    │
│         │                                                  │
│         ▼                                                  │
│    ┌─────────────────────────────────────┐                │
│    │ 💬 Alice: "Should we add error handling?" │         │
│    │    2 hours ago                        │                │
│    │    👍 1  [Reply] [Resolve]           │                │
│    │                                       │                │
│    │    └─ Bob: "Good point, I'll add it" │                │
│    │         1 hour ago                    │                │
│    └─────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Permissions

### Permission Levels

```typescript
interface CanvasPermissions {
  userId: string;
  canvasId: string;
  
  // Access level
  access: 'none' | 'view' | 'edit' | 'admin';
  
  // Specific permissions
  canCreateNodes: boolean;
  canEditNodes: boolean;
  canDeleteNodes: boolean;
  canMoveNodes: boolean;
  canConnectNodes: boolean;
  canAddComments: boolean;
  canResolveComments: boolean;
  canManageUsers: boolean;
  canDeleteCanvas: boolean;
}
```

### Default Permissions

| Permission | Owner | Editor | Viewer |
|------------|-------|--------|--------|
| View canvas | ✓ | ✓ | ✓ |
| Create nodes | ✓ | ✓ | ✗ |
| Edit nodes | ✓ | ✓ | ✗ |
| Delete nodes | ✓ | ✓ | ✗ |
| Move nodes | ✓ | ✓ | ✗ |
| Add comments | ✓ | ✓ | ✓ |
| Resolve comments | ✓ | ✓ | ✗ |
| Manage users | ✓ | ✗ | ✗ |
| Delete canvas | ✓ | ✗ | ✗ |

## Sharing

### Share Dialog

```typescript
interface ShareDialog {
  // Current permissions
  permissions: CanvasPermissions[];
  
  // Invite
  invite(email: string, access: AccessLevel): Promise<void>;
  
  // Generate link
  generateLink(access: AccessLevel): Promise<ShareLink>;
  
  // Copy link
  copyLink(): void;
}

interface ShareLink {
  url: string;
  access: AccessLevel;
  expiresAt?: string;
}
```

### Share Options

```
┌─────────────────────────────────────────────────────────────┐
│ Share "Daily Report Workflow"                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Link sharing:                                              │
│ [Anyone with link can view ▼]                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🔗 https://circus.app/w/daily-report?share=abc123  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                        [Copy] [Revoke]     │
│                                                             │
│ People with access:                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Alice (you)        Owner           [Manage]      │   │
│ │ 👤 Bob                 Can edit       [Manage]      │   │
│ │ 👤 Charlie             Can view       [Manage]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [+ Add people]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Protocol

### Connection

```typescript
interface CollaborationConnection {
  // Connect
  connect(canvasId: string, token: string): Promise<void>;
  
  // Disconnect
  disconnect(): void;
  
  // Reconnect
  reconnect(): Promise<void>;
  
  // Status
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
}
```

### Message Format

```typescript
interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
  clientId: string;
}
```

## CLI Commands

```bash
# Share canvas
circus canvas share canvas-123 --access edit --email bob@example.com

# Generate link
circus canvas share-link canvas-123 --access view

# List collaborators
circus canvas collaborators canvas-123

# Remove collaborator
circus canvas remove-access canvas-123 --user bob@example.com
```

## Related Documents

- [Visual Workflow Builder](./visual-builder.md) — Canvas features
- [Agent Collaboration](./agent-collaboration.md) — Multi-agent work
- [Big Top Canvas](../01-LocalCircus/bigtop.md) — Canvas base
