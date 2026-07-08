# Forking & Collaboration

> Fork artifacts and collaborate with the community.

## Overview

LocalCircus supports forking artifacts to create derivatives and collaborate on improvements.

## Forking

### Fork Structure

```typescript
interface Fork {
  id: string;
  
  // Source
  source: {
    artifactId: string;
    artifactName: string;
    version: string;
    ownerId: string;
    ownerName: string;
  };
  
  // Fork details
  fork: {
    artifactId: string;
    name: string;
    version: string;
    ownerId: string;
    ownerName: string;
  };
  
  // Relationship
  relationship: 'fork' | 'patch' | 'port';
  
  // Sync status
  sync: {
    lastSynced: string;
    upstreamVersion: string;
    behindCount: number;
    hasConflicts: boolean;
  };
  
  // Metadata
  createdAt: string;
  reason?: string;
}
```

### Fork Workflow

```
┌─────────────────┐
│ Find artifact   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Fork"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fork dialog    │
│ - New name     │
│ - Reason       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create fork    │
│ - Copy DNA     │
│ - Link to src  │
│ - Set version  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Develop        │
│ - Make changes │
│ - Test         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Publish        │
└─────────────────┘
```

### Fork Types

| Type | Description | Use Case |
|------|-------------|----------|
| `fork` | Full copy | Major modifications |
| `patch` | Targeted changes | Bug fixes, small features |
| `port` | Platform adaptation | Cross-platform support |

### Creating a Fork

```typescript
interface CreateForkRequest {
  // Source
  sourceArtifactId: string;
  sourceVersion: string;
  
  // Fork details
  name: string;
  displayName?: string;
  
  // Relationship
  type: 'fork' | 'patch' | 'port';
  
  // Configuration
  includeDependencies: boolean;
  includeDocumentation: boolean;
  includeTests: boolean;
  
  // Metadata
  reason: string;
  changesPlanned: string;
}

interface ForkResult {
  fork: ArtifactDNA;
  
  // Files created
  filesCreated: number;
  
  // Warnings
  warnings?: string[];
}
```

### Fork Naming

```
source:  codex-search-plugin
fork:    codex-search-plugin-fork
         my-codex-search
         enterprise-codex-search
```

### Fork UI

```
┌─────────────────────────────────────────────────────────────┐
│ Fork Artifact                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Source: codex-search-plugin v2.1.0 (LocalCircus Team)     │
│                                                             │
│ Fork Name:                                                 │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ my-codex-search                                    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Type:                                                      │
│ (•) Fork    Full copy with major modifications             │
│ ( ) Patch   Targeted changes (bug fixes, small features)   │
│ ( ) Port    Adaptation for different platform              │
│                                                             │
│ Include:                                                   │
│ [✓] Dependencies                                          │
│ [✓] Documentation                                         │
│ [✓] Tests                                                 │
│                                                             │
│ Reason for forking:                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Adding custom ranking algorithm                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Cancel]                                    [Create Fork]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Synchronization

### Sync Status

```typescript
interface SyncStatus {
  forkId: string;
  
  // State
  status: 'in_sync' | 'behind' | 'conflicts' | 'diverged';
  
  // Upstream
  upstream: {
    artifactId: string;
    latestVersion: string;
    lastUpdated: string;
  };
  
  // Local
  local: {
    version: string;
    lastUpdated: string;
  };
  
  // Comparison
  comparison: {
    commitsBehind: number;
    commitsAhead: number;
    conflictingChanges: string[];
    mergeableChanges: string[];
  };
  
  // Last sync
  lastSyncedAt: string;
  lastSyncResult?: 'success' | 'failed' | 'conflicts';
}
```

### Sync Operations

```typescript
interface SyncOperations {
  // Pull upstream changes
  pull(): Promise<PullResult>;
  
  // Push to upstream (if allowed)
  push(): Promise<PushResult>;
  
  // Merge changes
  merge(options?: MergeOptions): Promise<MergeResult>;
  
  // View diff
  diff(): Promise<ChangeDiff>;
}

interface PullResult {
  success: boolean;
  changesApplied: number;
  conflicts: Conflict[];
  newVersion?: string;
}

interface Conflict {
  file: string;
  type: 'content' | 'config' | 'dna';
  localVersion: string;
  upstreamVersion: string;
  resolution?: 'local' | 'upstream' | 'merged';
}
```

### Sync UI

```
┌─────────────────────────────────────────────────────────────┐
│ Sync Status: 2 commits behind                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Upstream: codex-search-plugin v2.3.0 (LocalCircus Team)   │
│ Your fork: my-codex-search v2.1.0                         │
│                                                             │
│ Changes in upstream:                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ + Performance improvements in search algorithm       │   │
│ │ + New fuzzy matching feature                        │   │
│ │ + Bug fix: Handle empty queries                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [View Diff]  [Pull Changes]  [Ignore Updates]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Collaboration

### Collaboration Roles

```typescript
type CollaborationRole = 
  | 'owner'         // Full control
  | 'maintainer'   // Can update, can't delete
  | 'contributor'  // Can submit changes
  | 'reviewer';    // Can review, can't approve

interface Collaborator {
  userId: string;
  artifactId: string;
  
  role: CollaborationRole;
  
  // Permissions
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageCollaborators: boolean;
    canPublish: boolean;
  };
  
  // Status
  status: 'active' | 'invited' | 'pending';
  
  // Activity
  joinedAt: string;
  lastActivity?: string;
  contributions: number;
}
```

### Inviting Collaborators

```typescript
interface InviteCollaboratorRequest {
  artifactId: string;
  
  // Invite details
  email: string;
  role: CollaborationRole;
  
  // Message
  message?: string;
  
  // Permissions override
  permissions?: Partial<Collaborator['permissions']>;
}

interface CollaborationInvite {
  id: string;
  
  artifactId: string;
  artifactName: string;
  
  inviteeEmail: string;
  inviterId: string;
  
  role: CollaborationRole;
  
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  
  expiresAt: string;
  
  createdAt: string;
}
```

### Collaboration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Collaborators (4)                            [+ Invite]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Alice Chen                              Owner     │   │
│ │    alice@example.com · 127 contributions             │   │
│ │    [Manage ▼]                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Bob Smith                            Maintainer   │   │
│ │    bob@example.com · 45 contributions             │   │
│ │    [Manage ▼]                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 Charlie Brown                       Contributor  │   │
│ │    charlie@example.com · 12 contributions         │   │
│ │    [Manage ▼]                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Pending Invites (1)                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📧 dave@example.com · Contributor · [Resend] [✗] │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Contribution Workflow

### Pull Requests

```typescript
interface PullRequest {
  id: string;
  
  // Source and target
  source: {
    artifactId: string;
    version: string;
    ownerId: string;
  };
  target: {
    artifactId: string;
    version: string;
    ownerId: string;
  };
  
  // PR details
  title: string;
  description: string;
  
  // Changes
  changes: Change[];
  additions: number;
  deletions: number;
  
  // Review
  status: 'open' | 'approved' | 'changes_requested' | 'merged' | 'closed';
  reviews: Review[];
  
  // CI/CD
  checks: CICheck[];
  
  // Timeline
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

interface Change {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  diff?: string;
}
```

### PR Workflow

```
┌─────────────────┐
│ Create PR      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CI Checks      │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
    Yes  │  No
    ▼    │  ▼
    ▼    │  ┌─────────────────┐
┌────────┴┐ │ Fix issues      │
│ Reviews │ └────────┬────────┘
└────┬────┘          │
     │               │
┌────┼────┐          │
▼    │    ▼          │
Approve│ Request      │
  │   │ changes      │
  │   └──────→───────┘
  │
  ▼
┌─────────────────┐
│ Merge          │
└─────────────────┘
```

## Contribution Guidelines

### For Artifact Owners

1. **Be welcoming** — Thank contributors
2. **Review promptly** — Aim for 48-hour turnaround
3. **Give feedback** — Be constructive
4. **Merge when ready** — Don't delay unnecessarily

### For Contributors

1. **Read docs** — Check contribution guidelines
2. **Small changes** — One feature/fix per PR
3. **Test changes** — Ensure tests pass
4. **Describe well** — Explain what and why
5. **Be patient** — Review takes time

## CLI Commands

```bash
# Fork an artifact
circus fork codex-search-plugin --name my-search-plugin

# Sync with upstream
circus fork sync my-search-plugin

# View sync status
circus fork status my-search-plugin

# Invite collaborator
circus collaborate invite my-plugin --email dev@example.com --role contributor

# List collaborators
circus collaborate list my-plugin

# Create PR
circus pr create --source my-plugin --target codex-search-plugin

# List PRs
circus pr list --artifact my-plugin
```

## API Endpoints

```typescript
// Fork
POST /artifacts/:id/fork
GET /artifacts/:id/forks

// Sync
GET /forks/:id/sync
POST /forks/:id/sync/pull
POST /forks/:id/sync/push

// Collaborators
GET /artifacts/:id/collaborators
POST /artifacts/:id/collaborators
DELETE /artifacts/:id/collaborators/:userId

// Invites
GET /invites
POST /invites
DELETE /invites/:id

// PRs
POST /artifacts/:id/pull-requests
GET /pull-requests/:id
POST /pull-requests/:id/review
```

## Related Documents

- [Trust Scoring](./trust-scoring.md)
- [Review System](./review-system.md)
- [Publisher Guide](../06-Marketplace/publisher-guide.md)
