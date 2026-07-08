# Marketplace Publisher Guide

> Share your artifacts with the LocalCircus ecosystem.

## Publishing Flow

```
1. Create artifact in CodeForge
2. Run benchmarks
3. Sign artifact
4. Submit for review
5. Community review (3-7 days)
6. Published to marketplace
```

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| LocalCircus account | Required |
| Complete DNA | All required fields |
| Passing benchmarks | Performance validation |
| Valid signature | Cryptographic signing |

## Publishing Steps

### 1. Prepare Artifact

```bash
circus codeforge validate my-artifact/
circus codeforge benchmark my-artifact/
```

### 2. Sign Artifact

```bash
circus keys generate --name "My Publisher"
circus codeforge sign my-artifact/ --key "My Publisher"
```

### 3. Submit

```bash
circus marketplace submit my-artifact/ --category plugin
```

## Review Process

| Stage | Duration |
|-------|----------|
| Automated checks | ~5 min |
| Community review | 3-7 days |
| Moderation | 1-2 days |

## Publisher Dashboard

### Metrics

| Metric | Description |
|--------|-------------|
| Artifacts | Total published |
| Downloads | Total installations |
| Avg Rating | Star rating |

### Version Management

```bash
# Release new version
circus marketplace release <artifact> --version 2.2.0

# Deprecate old version
circus marketplace deprecate <artifact> --version 1.0.0
```

## Review States

| State | Description |
|-------|-------------|
| `pending` | Awaiting review |
| `changes_requested` | Needs revisions |
| `approved` | Ready to publish |
| `rejected` | Not approved |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic publishing |
| Pro | $9/mo | Analytics |
| Team | $49/mo | 5 publishers |

Revenue: 70% creator share for paid downloads.

## CLI Reference

```bash
# Submit
circus marketplace submit <artifact> --category plugin

# Release
circus marketplace release <artifact> --version <version>

# Analytics
circus marketplace analytics <artifact>
```
