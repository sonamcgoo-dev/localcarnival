# API Reference

> Complete API documentation for LocalCircus.

## Base URL

```
https://api.localcircus.dev/v1
```

## Authentication

All API requests require authentication:

```bash
-H "Authorization: Bearer $LOCALCIRCUS_API_KEY"
```

## Artifacts API

### List Artifacts

```
GET /artifacts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by artifact type |
| `category` | string | Filter by category |
| `query` | string | Search query |
| `limit` | number | Max results (default: 20) |
| `offset` | number | Pagination offset |

**Response:**

```json
{
  "artifacts": [
    {
      "uuid": "0191f2a7-c123-7abc-def0-123456789abc",
      "name": "codex-search-plugin",
      "type": "plugin",
      "version": "2.1.0",
      "metadata": {
        "description": "Full-text search plugin"
      }
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Get Artifact

```
GET /artifacts/:uuid
```

**Response:**

```json
{
  "uuid": "0191f2a7-c123-7abc-def0-123456789abc",
  "name": "codex-search-plugin",
  "type": "plugin",
  "version": "2.1.0",
  "displayName": "Codex Search Plugin",
  "capabilities": [
    { "id": "tool:search" }
  ],
  "dependencies": [],
  "compatibility": {
    "platforms": ["linux", "macos", "windows"]
  },
  "metadata": {
    "description": "Full-text search plugin",
    "keywords": ["search", "codex"],
    "license": "MIT"
  },
  "signatures": {
    "creator": { "algorithm": "ed25519" }
  }
}
```

### Search Artifacts

```
POST /artifacts/search
```

**Request:**

```json
{
  "query": "search plugin",
  "filters": {
    "type": ["plugin"],
    "capabilities": ["tool:search"],
    "platforms": ["linux"]
  },
  "sort": "rating",
  "limit": 10
}
```

### Create Artifact

```
POST /artifacts
```

**Request:**

```json
{
  "name": "my-plugin",
  "type": "plugin",
  "version": "1.0.0",
  "capabilities": [
    { "id": "tool:my-tool" }
  ],
  "metadata": {
    "description": "My plugin",
    "keywords": [],
    "license": "MIT"
  }
}
```

### Update Artifact

```
PUT /artifacts/:uuid
```

### Delete Artifact

```
DELETE /artifacts/:uuid
```

## Registry API

### Graph Queries

```
POST /registry/query
```

**Request:**

```graphql
{
  "query": "MATCH (a:Artifact)-[:PROVIDES]->(c:Capability {id: 'tool:search'}) RETURN a"
}
```

### Get Relationships

```
GET /registry/artifacts/:uuid/relationships
```

## Workflows API

### List Workflows

```
GET /workflows
```

### Get Workflow

```
GET /workflows/:id
```

### Create Workflow

```
POST /workflows
```

**Request:**

```json
{
  "name": "daily-report",
  "version": "1.0.0",
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * *"
  },
  "steps": [
    {
      "id": "fetch",
      "type": "action",
      "action": "http",
      "config": { "method": "GET", "url": "https://api.example.com/data" }
    }
  ]
}
```

### Run Workflow

```
POST /workflows/:id/run
```

**Request:**

```json
{
  "inputs": {
    "userId": "123"
  }
}
```

**Response:**

```json
{
  "runId": "run-456",
  "status": "running",
  "startedAt": "2026-07-08T09:00:00Z"
}
```

### Get Run

```
GET /workflows/:id/runs/:runId
```

### Cancel Run

```
POST /workflows/:id/runs/:runId/cancel
```

### List Runs

```
GET /workflows/:id/runs
```

## Jobs API

### List Jobs

```
GET /jobs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workflow` | string | Filter by workflow |
| `status` | string | Filter by status |
| `limit` | number | Max results |
| `offset` | number | Pagination offset |

### Get Job

```
GET /jobs/:id
```

### Retry Job

```
POST /jobs/:id/retry
```

### Cancel Job

```
POST /jobs/:id/cancel
```

## Providers API

### List Providers

```
GET /providers
```

### Get Provider

```
GET /providers/:id
```

### Add Provider

```
POST /providers
```

**Request:**

```json
{
  "id": "my-provider",
  "name": "My Provider",
  "type": "openai",
  "config": {
    "apiKey": "$OPENAI_API_KEY"
  }
}
```

### Test Provider

```
POST /providers/:id/test
```

## Agents API

### List Agents

```
GET /agents
```

### Get Agent

```
GET /agents/:id
```

### Create Agent

```
POST /agents
```

### Update Agent

```
PUT /agents/:id
```

### Delete Agent

```
DELETE /agents/:id
```

### Chat with Agent

```
POST /agents/:id/chat
```

**Request:**

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false
}
```

## Webhooks API

### List Webhooks

```
GET /webhooks
```

### Create Webhook

```
POST /webhooks
```

**Request:**

```json
{
  "url": "https://my-app.com/webhook",
  "events": ["job.completed", "job.failed"],
  "secret": "my-secret"
}
```

### Delete Webhook

```
DELETE /webhooks/:id
```

## WebSocket Events

### Connect

```
wss://api.localcircus.dev/v1/ws?token=$TOKEN
```

### Event Types

```typescript
// Job updates
{ type: 'job:update', data: Job }

// Workflow runs
{ type: 'workflow:start', data: Run }
{ type: 'workflow:complete', data: Run }
{ type: 'workflow:error', data: { runId, error } }

// Logs
{ type: 'log', data: LogEntry }

// Presence
{ type: 'presence:join', data: User }
{ type: 'presence:leave', data: { userId } }
```

## Error Responses

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Artifact not found",
    "details": {
      "uuid": "0191f2a7-..."
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Team | 1,000 | 100,000 |

## Pagination

All list endpoints support pagination:

```bash
GET /artifacts?limit=20&offset=0
```

**Response includes:**

```json
{
  "total": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

## Filtering

### Date Range

```bash
GET /jobs?createdAfter=2026-07-01T00:00:00Z&createdBefore=2026-07-08T00:00:00Z
```

### Sort

```bash
GET /artifacts?sort=rating&order=desc
```

### Fields

```bash
GET /artifacts?fields=name,version,type
```

## SDKs

### JavaScript/TypeScript

```bash
npm install @localcircus/sdk
```

```typescript
import { LocalCircus } from '@localcircus/sdk';

const client = new LocalCircus({
  apiKey: process.env.LOCALCIRCUS_API_KEY
});

const artifacts = await client.artifacts.list({ type: 'plugin' });
```

### Python

```bash
pip install localcircus-sdk
```

```python
from localcircus import LocalCircus

client = LocalCircus(api_key=os.environ['LOCALCIRCUS_API_KEY'])

artifacts = client.artifacts.list(type='plugin')
```

### CLI

```bash
# List artifacts
circus artifacts list

# Get artifact
circus artifacts get uuid-123

# Run workflow
circus workflow run my-workflow
```
