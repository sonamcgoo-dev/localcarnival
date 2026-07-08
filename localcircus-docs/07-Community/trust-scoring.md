# Trust Scoring

> Reputation and trust system for publishers and artifacts.

## Overview

Trust Scores measure the reliability and quality of publishers and their artifacts in the LocalCircus ecosystem.

## Publisher Trust Score

```typescript
interface PublisherTrustScore {
  userId: string;
  
  // Overall score (0-100)
  score: number;
  
  // Breakdown
  breakdown: {
    quality: number;       // Code quality metrics
    reliability: number;  // Uptime, responsiveness
    community: number;    // Reviews, helpfulness
    security: number;     // Security practices
    compliance: number;   // Platform compliance
  };
  
  // Tier
  tier: TrustTier;
  
  // History
  totalArtifacts: number;
  totalDownloads: number;
  activeUsers: number;
  
  // Badges
  badges: TrustBadge[];
  
  // Updates
  updatedAt: string;
}

type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface TrustBadge = 
  | { type: 'verified_publisher' }
  | { type: 'top_contributor'; count: number }
  | { type: 'security_audited' }
  | { type: 'long_time_member'; years: number }
  | { type: 'community_champion' }
  | { type: 'power_user' };
```

### Tier Thresholds

| Tier | Score | Benefits |
|------|-------|----------|
| Bronze | 0-39 | Basic publishing |
| Silver | 40-64 | Analytics, priority support |
| Gold | 65-84 | Featured placement, verified badge |
| Platinum | 85-100 | All benefits + dedicated support |

## Score Calculation

### Algorithm

```typescript
interface ScoreCalculation {
  // Input metrics
  metrics: {
    // Quality (30%)
    avgRating: number;              // 0-5
    reviewCount: number;
    codeQualityScore: number;      // Automated checks
    
    // Reliability (25%)
    artifactCount: number;
    updateFrequency: number;        // Updates per month
    bugResolutionTime: number;     // Hours
    supportResponseTime: number;   // Hours
    
    // Community (20%)
    helpfulVotesReceived: number;
    questionsAnswered: number;
    tutorialDownloads: number;
    
    // Security (15%)
    securityAuditStatus: 'none' | 'partial' | 'full';
    vulnerabilityCount: number;
    secretFreeScore: number;       // % of code without secrets
    
    // Compliance (10%)
    guidelineCompliance: number;    // 0-100%
    dnaCompletionRate: number;     // 0-100%
  };
  
  // Weights
  weights = {
    quality: 0.30,
    reliability: 0.25,
    community: 0.20,
    security: 0.15,
    compliance: 0.10
  };
  
  // Calculated score
  finalScore: number;
}
```

### Score Formula

```
score = 
  (quality * 0.30) +
  (reliability * 0.25) +
  (community * 0.20) +
  (security * 0.15) +
  (compliance * 0.10)
```

## Artifact Trust Score

```typescript
interface ArtifactTrustScore {
  artifactId: string;
  
  // Overall score (0-100)
  score: number;
  
  // Component scores
  components: {
    quality: number;         // Code quality
    popularity: number;      // Downloads, usage
    maintenance: number;      // Update frequency
    reviews: number;         // Review ratings
    security: number;        // Security assessment
  };
  
  // Metrics
  metrics: {
    downloads: number;
    ratings: number;
    reviews: number;
    avgRating: number;
    usageCount: number;     // How many workflows use this
  };
  
  // Status
  status: 'unrated' | 'pending' | 'verified' | 'flagged';
  
  // Flags
  flags: TrustFlag[];
  
  updatedAt: string;
}

interface TrustFlag {
  type: 'security' | 'quality' | 'compatibility' | 'deprecated';
  severity: 'low' | 'medium' | 'high';
  message: string;
  raisedAt: string;
  resolvedAt?: string;
}
```

## Trust Indicators

### On Artifact Cards

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Search Plugin                              ⭐4.8 │
│ v2.1.0 · plugin                                 🔒 ✓ │
├─────────────────────────────────────────────────────┤
│ By LocalCircus Team                            🏆Gold│
│ Downloads: 12.5K · Used in 234 workflows           │
│                                                     │
│ ⭐⭐⭐⭐⭐ (156 reviews)                              │
│ 📅 Updated 3 days ago                             │
└─────────────────────────────────────────────────────┘
```

### Trust Badges

| Badge | Description | Criteria |
|-------|-------------|----------|
| ✓ Verified | Identity verified | Email, phone, ID |
| 🔒 Security Audited | Passed security review | Full audit |
| 🏆 Gold Publisher | Top tier publisher | Score 65+ |
| ⭐ Top Rated | High-rated artifacts | 4.8+ avg |
| 🔄 Active Maintainer | Regular updates | Monthly |
| 📦 Verified Compatible | Tested on platforms | All listed |

## Trust Signals

### Publisher Signals

```typescript
interface TrustSignals {
  publisher: {
    // Identity verification
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    
    // Social verification
    githubConnected: boolean;
    twitterConnected?: boolean;
    linkedinConnected?: boolean;
    
    // Payment verification
    paymentVerified: boolean;
    
    // Historical
    memberSince: string;
    totalArtifacts: number;
    totalDownloads: number;
    
    // Response metrics
    avgResponseTime: number;    // Hours
    openIssuesResolved: number;
  };
  
  artifact: {
    // Quality
    passesAutomatedChecks: boolean;
    hasTests: boolean;
    testCoverage?: number;
    
    // Security
    securityAuditDate?: string;
    vulnerabilityCount: number;
    
    // Maintenance
    lastUpdate: string;
    updateFrequency: number;
    openIssues: number;
    
    // Community
    starCount: number;
    downloadCount: number;
    reviewCount: number;
    avgRating: number;
  };
}
```

## Reputation Events

```typescript
interface ReputationEvent {
  id: string;
  
  // Who
  userId: string;
  
  // What
  type: ReputationEventType;
  delta: number;          // Points change (+/-)
  
  // Context
  artifactId?: string;
  description: string;
  
  createdAt: string;
}

type ReputationEventType = 
  | 'artifact_published'
  | 'artifact_downloaded'
  | 'review_received'
  | 'helpful_vote_received'
  | 'question_answered'
  | 'security_audit_passed'
  | 'tier_upgraded'
  | 'badge_earned'
  | 'violation_detected'
  | 'trust_sanctioned';
```

### Point Values

| Event | Points |
|-------|--------|
| Artifact published | +10 |
| Artifact downloaded (100x) | +1 |
| 5-star review received | +5 |
| 1-star review received | -3 |
| Helpful vote received | +1 |
| Security audit passed | +50 |
| Violation detected | -20 |
| Tier upgrade | +100 |

## Trust Recovery

```typescript
interface TrustRecovery {
  // Sanction types
  type: 'warning' | 'suspension' | 'removal';
  
  // Duration
  duration?: number;  // Days
  
  // Recovery actions
  requiredActions: {
    action: string;
    completed: boolean;
    completedAt?: string;
  }[];
  
  // Timeline
  issuedAt: string;
  expiresAt?: string;
  resolvedAt?: string;
}
```

### Recovery Process

1. **Warning** — Notification + required actions
2. **Suspension** — Temporary publishing block
3. **Removal** — Account/artifact removal

## API Endpoints

```typescript
// Get publisher score
GET /publishers/:id/trust-score

// Get artifact score
GET /artifacts/:id/trust-score

// Get score history
GET /publishers/:id/trust-history

// Report trust issue
POST /trust/report
{
  "artifactId": "uuid",
  "type": "security",
  "description": "..."
}

// Appeal trust decision
POST /trust/appeal
{
  "decisionId": "uuid",
  "reason": "..."
}
```

## CLI Commands

```bash
# View your trust score
circus trust score

# View artifact trust
circus trust artifact my-plugin

# View breakdown
circus trust breakdown

# Check badges
circus trust badges

# Report issue
circus trust report --artifact my-plugin --type security
```

## Related Documents

- [Review System](./review-system.md)
- [Verification](./verification.md)
- [Publisher Guide](../06-Marketplace/publisher-guide.md)
