# Live Jobs Dashboard

> Real-time monitoring of workflow executions.

## Overview

The Live Jobs Dashboard provides real-time visibility into all running, completed, and failed workflow executions. It enables users to monitor progress, debug issues, and manage job lifecycle.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     Live Jobs Dashboard                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Summary Bar                                              │   │
│  │ [▶ Running: 3] [✓ Completed: 127] [✗ Failed: 5]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌───────────────────────────────────────┐   │
│  │   Filters   │  │           Job List                      │   │
│  │              │  │  ┌─────────────────────────────────┐  │   │
│  │ Status:      │  │  │ ▶ daily-report        Running │  │   │
│  │ [All ▼]     │  │  │   Step 3/5: Fetch Data          │  │   │
│  │              │  │  │   Started: 2 min ago           │  │   │
│  │ Workflow:    │  │  └─────────────────────────────────┘  │   │
│  │ [All ▼]     │  │  ┌─────────────────────────────────┐  │   │
│  │              │  │  │ ✓ email-digest      Completed   │  │   │
│  │ Date:        │  │  │   45 steps in 12s              │  │   │
│  │ [Today ▼]   │  │  │   Completed: 10 min ago        │  │   │
│  │              │  │  └─────────────────────────────────┘  │   │
│  │ [Search...] │  │  ┌─────────────────────────────────┐  │   │
│  └─────────────┘  │  │ ✗ backup-job         Failed     │  │   │
│                   │  │   Error: Connection timeout      │  │   │
│                   │  │   [Retry] [View Logs]            │  │   │
│                   │  └─────────────────────────────────┘  │   │
│                   └───────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Job States

```typescript
type JobState = 
  | 'queued'      // Waiting to start
  | 'running'     // Currently executing
  | 'completed'   // Finished successfully
  | 'failed'      // Finished with errors
  | 'cancelled'   // Manually stopped
  | 'paused';     // Paused by user
```

### State Transitions

```
┌─────────┐
│ queued  │
└────┬────┘
     │ start
     ▼
┌─────────┐     ┌───────────┐
│ running │────▶│ completed │
└────┬────┘     └───────────┘
     │
     │ fail
     ▼
┌─────────┐     ┌───────────┐
│ failed  │     │ cancelled │
└─────────┘     └───────────┘
     │
     │ retry
     ▼
┌─────────┐
│ queued  │
└─────────┘
```

## Job Data Model

```typescript
interface Job {
  id: string;
  
  // Workflow reference
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  
  // Execution info
  state: JobState;
  triggeredBy: TriggerType;
  
  // Timing
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;  // ms
  
  // Progress
  currentStep?: number;
  totalSteps: number;
  stepName?: string;
  
  // Results
  input?: any;
  output?: any;
  error?: JobError;
  
  // Metadata
  runNumber: number;     // Which run (e.g., 15th run)
  retryOf?: string;      // Job ID if this is a retry
}

interface JobError {
  code: string;
  message: string;
  stack?: string;
  nodeId?: string;
  stepIndex?: number;
}
```

## Job List View

### List Component

```typescript
interface JobListView {
  jobs: Job[];
  
  // Filters
  filters: JobFilters;
  
  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  
  // Selection
  selectedJob?: Job;
}

interface JobFilters {
  states?: JobState[];
  workflowIds?: string[];
  dateRange?: { start: string; end: string };
  searchQuery?: string;
}
```

### Job Card

```typescript
interface JobCard {
  job: Job;
  
  // Display
  variant: 'compact' | 'expanded';
  
  // Actions
  onClick(): void;
  onRetry?(): void;
  onCancel?(): void;
  onViewLogs?(): void;
}
```

### Compact Card

```
┌─────────────────────────────────────────────┐
│ [Icon] workflow-name                    [State]│
│         Step X/Y · Duration              │
└─────────────────────────────────────────────┘
```

### Expanded Card

```
┌─────────────────────────────────────────────┐
│ [Icon] workflow-name                    [State]│
├─────────────────────────────────────────────┤
│ Trigger: schedule · Started: 2 min ago     │
│ Step: 3/5 "Fetch Data"                  │
│                                             │
│ Progress: ████████░░░░░░░░░ 60%          │
│                                             │
│ [Retry] [Cancel] [View Logs] [View Details]│
└─────────────────────────────────────────────┘
```

## Job Detail View

### Detail Panel

```typescript
interface JobDetailView {
  job: Job;
  
  // Sections
  overview: OverviewSection;
  timeline: TimelineSection;
  logs: LogsSection;
  inputOutput: InputOutputSection;
}

interface OverviewSection {
  workflowName: string;
  state: JobState;
  duration: string;
  triggeredBy: string;
  triggeredAt: string;
  retryOf?: string;
}
```

### Timeline View

```typescript
interface TimelineSection {
  steps: TimelineStep[];
}

interface TimelineStep {
  index: number;
  name: string;
  nodeId: string;
  
  // Status
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  
  // Timing
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  
  // Details
  input?: any;
  output?: any;
  error?: JobError;
}
```

### Timeline Visualization

```
┌─────────────────────────────────────────────────────┐
│ Timeline                                              │
├─────────────────────────────────────────────────────┤
│ ✓ 1. Trigger              12:00:00   0.1s           │
│ ✓ 2. Fetch Data          12:00:01   2.3s           │
│ ✓ 3. Transform           12:00:03   0.5s           │
│ ● 4. Send Email          12:00:04   running...     │
│ ○ 5. Log                 pending                       │
└─────────────────────────────────────────────────────┘

Legend: ✓ completed  ● running  ✗ failed  ○ pending  ⊘ skipped
```

## Log Streaming

### Log Entry

```typescript
interface LogEntry {
  id: string;
  jobId: string;
  stepIndex?: number;
  nodeId?: string;
  
  // Content
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  
  // Context
  timestamp: string;
  source: string;        // e.g., "node:fetch-1"
  
  // Optional
  metadata?: Record<string, any>;
}
```

### Log Viewer

```typescript
interface LogViewer {
  entries: LogEntry[];
  
  // Filtering
  level: LogLevel[];     // Which levels to show
  searchQuery?: string;
  stepFilter?: number;   // Only show logs for this step
  
  // Streaming
  isLive: boolean;       // Auto-scroll enabled
  autoScroll: boolean;
  
  // Actions
  copyToClipboard(): void;
  downloadLogs(format: 'txt' | 'json'): void;
  clearLogs(): void;
}
```

### Log Display

```
┌─────────────────────────────────────────────────────┐
│ [All ▼] [Search logs...]              [↓ Download] │
├─────────────────────────────────────────────────────┤
│ 12:00:01.234 [INFO] [trigger-1] Workflow started   │
│ 12:00:01.456 [INFO] [fetch-1] Fetching data...     │
│ 12:00:02.123 [DEBUG] [fetch-1] Response: 200 OK     │
│ 12:00:02.234 [INFO] [fetch-1] Retrieved 150 items   │
│ 12:00:03.567 [INFO] [transform-1] Processing...    │
│ 12:00:03.890 [WARN] [transform-1] Item 42 skipped   │
│ 12:00:04.100 [INFO] [email-1] Sending email...      │
└─────────────────────────────────────────────────────┘
```

## Progress Indicators

### Step Progress

```typescript
interface StepProgress {
  currentStep: number;
  totalSteps: number;
  
  // Per-step progress (for long-running steps)
  stepProgress?: {
    itemsProcessed: number;
    itemsTotal: number;
    percentage: number;
    estimatedTimeRemaining?: number;
  };
}
```

### Progress Display

```
┌─────────────────────────────────────────────────────┐
│ Step 3: Fetch All Users                             │
│                                                     │
│ Items: 150 / 1000                                  │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%        │
│                                                     │
│ Estimated time remaining: 45s                       │
│                                                     │
│ [Cancel]                                           │
└─────────────────────────────────────────────────────┘
```

## Error Handling

### Error Display

```typescript
interface ErrorDisplay {
  error: JobError;
  
  // Formatting
  showStack: boolean;
  
  // Actions
  onRetry(): void;
  onViewNode(): void;
  onCopyError(): void;
}
```

### Error Card

```
┌─────────────────────────────────────────────────────┐
│ ✗ Error in Step: Fetch Data                        │
├─────────────────────────────────────────────────────┤
│ Code: CONNECTION_TIMEOUT                           │
│ Message: Failed to connect to api.example.com      │
│                                                     │
│ Stack trace:                                       │
│ at HttpAction.execute (actions/http.ts:45)          │
│ at async JobRunner.runStep (runner.ts:123)        │
│                                                     │
│ [Retry This Step] [Retry Workflow] [Copy Error]   │
└─────────────────────────────────────────────────────┘
```

## Notifications

### Notification Types

```typescript
interface JobNotification {
  type: NotificationType;
  jobId: string;
  workflowName: string;
  
  message: string;
  
  // Timing
  sentAt: string;
  read: boolean;
}

type NotificationType =
  | 'job_started'
  | 'job_completed'
  | 'job_failed'
  | 'job_cancelled'
  | 'step_completed'
  | 'step_failed';
```

### Notification Settings

```typescript
interface NotificationSettings {
  enabled: boolean;
  
  // Triggers
  onJobComplete: boolean;
  onJobFail: boolean;
  onJobStart: boolean;
  
  // Filters
  workflowIds?: string[];  // Only notify for these
  states?: JobState[];    // Only for these states
  
  // Delivery
  deliveryMethods: {
    inApp: boolean;
    email?: boolean;
    webhook?: string;
  };
}
```

## Job Actions

### Available Actions

```typescript
interface JobActions {
  // State changes
  retry(jobId: string, options?: RetryOptions): Promise<void>;
  cancel(jobId: string): Promise<void>;
  pause(jobId: string): Promise<void>;
  resume(jobId: string): Promise<void>;
  
  // Exports
  downloadLogs(jobId: string, format: 'txt' | 'json'): Promise<Blob>;
  downloadInput(jobId: string): Promise<Blob>;
  downloadOutput(jobId: string): Promise<Blob>;
}

interface RetryOptions {
  fromStep?: number;        // Start from this step
  skipFailed?: boolean;     // Skip the failed step
  clearOutputs?: boolean;   // Clear subsequent outputs
}
```

## Batch Operations

### Batch Action Bar

```typescript
interface BatchActions {
  selectedJobs: string[];  // Job IDs
  
  // Available actions
  actions: {
    name: string;
    icon: string;
    action: () => Promise<void>;
    confirm?: string;
  }[];
}
```

### Available Batch Actions

| Action | Description | Confirmation |
|--------|-------------|--------------|
| Retry All | Retry selected failed jobs | Yes |
| Cancel All | Cancel selected running jobs | Yes |
| Delete All | Delete selected jobs | Yes |
| Download Logs | Download logs for all selected | No |

## Real-time Updates

### WebSocket Events

```typescript
// Subscribe to job updates
interface JobSubscription {
  jobId?: string;          // Subscribe to specific job
  workflowId?: string;      // Or all jobs for a workflow
  
  // Events
  onJobUpdate(handler: (job: Job) => void): void;
  onLogEntry(handler: (entry: LogEntry) => void): void;
  onJobComplete(handler: (job: Job) => void): void;
  onJobError(handler: (error: JobError) => void): void;
}
```

## CLI Commands

```bash
# List jobs
circus jobs list --workflow daily-report --state failed

# View job details
circus jobs show job-123

# Stream logs
circus jobs logs job-123 --follow

# Retry failed job
circus jobs retry job-123

# Cancel running job
circus jobs cancel job-123

# Download logs
circus jobs logs job-123 --download

# Download output
circus jobs output job-123 --download
```

## Related Documents

- [Visual Workflow Builder](./visual-builder.md) — Workflow creation
- [Acts System](../10-Acts) — Workflow execution
- [Ringmaster Core Architecture](../02-Ringmaster-Core/architecture.md) — Job scheduling
