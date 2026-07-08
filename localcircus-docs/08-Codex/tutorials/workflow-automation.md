# Tutorial: Workflow Automation

> Automate repetitive tasks with workflows (Acts).

## Overview

Workflows (called "Acts") automate sequences of actions triggered by schedules, events, or manual triggers.

## Step 1: Create Workflow

```bash
# Create a new workflow
circus workflow create daily-summary --type scheduled

# Navigate to directory
cd daily-summary
```

## Step 2: Define Workflow

Edit `workflow.yaml`:

```yaml
name: daily-summary
version: 1.0.0
description: Generate daily summary report

trigger:
  type: schedule
  cron: "0 9 * * *"        # Every day at 9 AM
  timezone: "America/New_York"

steps:
  - id: fetch-tasks
    type: action
    action: http
    config:
      method: GET
      url: https://api.example.com/tasks?date={{yesterday}}

  - id: count-tasks
    type: transform
    transform: reduce
    input: "{{steps.fetch-tasks.output.items}}"
    initialValue: 0
    expression: "acc + 1"

  - id: send-summary
    type: action
    action: notification
    config:
      title: "Daily Summary"
      message: "You had {{steps.count-tasks.output}} tasks yesterday"
```

## Step 3: Add Inputs

```yaml
inputs:
  - name: userId
    type: string
    required: true
    description: User ID to generate summary for

trigger:
  type: webhook
  path: /webhook/daily-summary
```

## Step 4: Test Workflow

```bash
# Test run with inputs
circus workflow run daily-summary \
  --input '{"userId": "user-123"}'

# Watch execution
circus workflow logs --follow
```

## Step 5: Monitor

```bash
# View run history
circus workflow runs daily-summary

# View specific run
circus workflow run daily-summary run-456

# Stream logs
circus workflow logs daily-summary run-456 --follow
```

## Advanced: Data Pipeline

```yaml
name: etl-pipeline
version: 1.0.0

trigger:
  type: schedule
  cron: "0 */6 * * *"  # Every 6 hours

steps:
  # Extract
  - id: extract
    type: action
    action: http
    config:
      method: GET
      url: https://api.source.com/data

  # Transform
  - id: clean
    type: transform
    transform: filter
    input: "{{steps.extract.output}}"
    condition: "item.valid && item.value != null"

  - id: enrich
    type: transform
    transform: map
    input: "{{steps.clean.output}}"
    expression: |
      {
        ...item,
        processedAt: now(),
        score: item.value * item.weight
      }

  # Load
  - id: load
    type: action
    action: database
    config:
      operation: bulk-insert
      table: processed_data
      data: "{{steps.enrich.output}}"
```

## Advanced: Conditional Logic

```yaml
steps:
  - id: fetch-user
    type: action
    action: http
    config:
      url: https://api.example.com/users/{{inputs.userId}}

  - id: check-status
    type: logic
    logic: condition
    config:
      expression: "{{steps.fetch-user.output.status}} == 'active'"
      onTrue: [process-normal]
      onFalse: [process-inactive]

  - id: process-normal
    type: action
    action: process
    config:
      mode: normal

  - id: process-inactive
    type: action
    action: process
    config:
      mode: inactive
```

## Error Handling

```yaml
steps:
  - id: fetch-data
    type: action
    action: http
    config:
      url: https://api.example.com/data
    
    onError:
      action: retry
      maxRetries: 3
      delay: 1000

errorHandling:
  onError:
    - type: notification
      config:
        title: Workflow Failed
        message: "Error: {{error.message}}"
```

## Complete Example

```yaml
name: github-daily-report
version: 1.0.0
description: Generate daily GitHub activity report

trigger:
  type: schedule
  cron: "0 18 * * *"  # 6 PM daily
  timezone: "UTC"

inputs:
  - name: githubToken
    type: secret
    required: true

steps:
  - id: fetch-prs
    type: action
    action: http
    config:
      method: GET
      url: https://api.github.com/repos/localcircus/core/pulls
      headers:
        Authorization: "Bearer {{inputs.githubToken}}"

  - id: filter-open
    type: transform
    transform: filter
    input: "{{steps.fetch-prs.output}}"
    condition: "pr.state == 'open'"

  - id: count-prs
    type: transform
    transform: reduce
    input: "{{steps.filter-open.output}}"
    initialValue: 0
    expression: "acc + 1"

  - id: send-report
    type: action
    action: notification
    config:
      title: "Daily GitHub Report"
      message: |
        Open PRs: {{steps.count-prs.output}}
        
        Review your open PRs at:
        https://github.com/localcircus/core/pulls

errorHandling:
  onError:
    - type: log
      config:
        message: "Report generation failed: {{error.message}}"
```

## Visual Builder

You can also create workflows visually:

```bash
# Open visual editor
circus workflow edit daily-summary --visual
```

This opens the Big Top Visual Workflow Builder where you can drag-and-drop nodes.

## Scheduling

### Cron Syntax

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Every day at 9 AM |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 1 * *` | First day of month |

### Time Zones

```yaml
trigger:
  type: schedule
  cron: "0 9 * * *"
  timezone: "America/New_York"  # Or "Europe/London", etc.
```

## Testing & Debugging

```bash
# Dry run (don't actually execute)
circus workflow test daily-summary --dry-run

# With mock data
circus workflow test daily-summary \
  --input '{"userId": "test-user"}' \
  --mock http

# Step-by-step
circus workflow debug daily-summary --step
```

## Best Practices

1. **Keep steps simple** - One step per action
2. **Use clear IDs** - `fetch-user-data` not `step-1`
3. **Handle errors** - Always include error handling
4. **Add logging** - Use log steps for debugging
5. **Test thoroughly** - Test with edge cases

## Next Steps

- [Visual Workflow Builder](../../06-BigTop/visual-builder.md)
- [Live Jobs Dashboard](../../06-BigTop/live-jobs.md)
- [Workflow SDK Reference](../../10-Acts/README.md)
