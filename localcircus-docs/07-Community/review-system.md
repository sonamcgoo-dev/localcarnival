# Review System

> Community review process for artifacts in the Marketplace.

## Overview

The Review System ensures quality and safety of artifacts published to the LocalCircus Marketplace through community-driven review.

## Review States

```typescript
type ReviewState = 
  | 'pending'           // Awaiting review
  | 'in_review'         // Being reviewed
  | 'changes_requested' // Needs revisions
  | 'approved'          // Ready to publish
  | 'rejected'          // Not approved
  | 'published';        // Live in marketplace
```

### State Transitions

```
pending → in_review → approved → published
                   ↘ changes_requested → in_review
                   ↘ rejected (end state)
```

## Review Types

### 1. Automated Checks

Run automatically on submission:

```typescript
interface AutomatedCheck {
  id: string;
  name: string;
  description: string;
  
  // Execution
  type: 'lint' | 'security' | 'compatibility' | 'performance';
  status: 'pass' | 'fail' | 'warning';
  
  // Results
  findings: Finding[];
}

interface Finding {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: { file: string; line: number };
  suggestion?: string;
}
```

### Automated Checks

| Check | Description |
|-------|-------------|
| `dna-valid` | Validates Artifact DNA structure |
| `no-secrets` | Scans for hardcoded secrets |
| `type-safe` | TypeScript/JavaScript type checking |
| `license-check` | Validates license compatibility |
| `compat-check` | Platform compatibility validation |
| `size-limit` | Checks artifact size limits |

### 2. Community Review

Human review by verified users:

```typescript
interface CommunityReview {
  id: string;
  
  // Reviewer
  reviewerId: string;
  reviewerName: string;
  
  // Artifact
  artifactId: string;
  artifactVersion: string;
  
  // Review content
  type: ReviewType;
  rating: number;        // 1-5
  
  // Detailed feedback
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Line comments
  comments: ReviewComment[];
  
  // Recommendation
  recommendation: 'approve' | 'request_changes' | 'reject';
  
  // Timing
  createdAt: string;
  updatedAt: string;
}

type ReviewType = 
  | 'code_review'      // Code quality
  | 'security_review'  // Security audit
  | 'usability_review' // User experience
  | 'documentation_review';
```

## Review Process

### Submission Flow

```
┌─────────────────┐
│  Author submits  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Automated checks│
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
    Yes  │  No
    ▼    │  ▼
    ▼    │  ┌─────────────────┐
┌────────┴┐ │ Auto-reject    │
│ Assign  │ └─────────────────┘
│ reviewers│
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Community review │◀──────┐
└────────┬────────┘       │
         │                │
    ┌────┴────┐           │
    │ Decision │           │
    └────┬────┘           │
         │                │
    ┌────┼────┐          │
    ▼    │    ▼          │
 approve  │  request      │
    │    │  changes      │
    │    └──────→────────┘
    │
    ▼
┌─────────────────┐
│ Published!      │
└─────────────────┘
```

### Reviewer Assignment

```typescript
interface ReviewerAssignment {
  artifactId: string;
  version: string;
  
  // Selection criteria
  criteria: {
    expertise: string[];       // Required capabilities
    minReputation: number;
    minReviews: number;
    excludeReviewers: string[]; // Can't review twice
  };
  
  // Assigned reviewers
  assignedReviewers: AssignedReviewer[];
  
  // Deadline
  deadline: string;
}

interface AssignedReviewer {
  userId: string;
  role: 'primary' | 'secondary';
  expertise: string[];
  status: 'invited' | 'accepted' | 'declined';
}
```

## Review Comments

```typescript
interface ReviewComment {
  id: string;
  
  // Context
  reviewId: string;
  parentId?: string;  // For threaded replies
  
  // Content
  type: 'general' | 'line' | 'suggestion';
  
  // Line comment (specific location)
  location?: {
    file: string;
    lineStart: number;
    lineEnd?: number;
  };
  
  // Body
  body: string;
  
  // Reactions
  reactions: Reaction[];
  
  // Resolution
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface Reaction {
  emoji: string;
  users: string[];
}
```

### Comment UI

```
┌─────────────────────────────────────────────────────────────┐
│ Review: codex-search-plugin v2.1.0                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💬 General Comments                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👍 3                                                 │   │
│ │ Bob: Great plugin! The search performance is        │   │
│ │ excellent. Would love to see fuzzy matching added. │   │
│ │                                                     │   │
│ │ └─ Alice: Agreed! Fuzzy matching would be great.   │   │
│ │    └─ Bob: I'll add it in v2.2                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 📄 Line Comments                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ src/index.ts:42                                    │   │
│ │ > if (!query) throw new Error('Query required');   │   │
│ │                                                     │   │
│ │ Charlie: Consider allowing empty string for         │   │
│ │ "return all" behavior.                            │   │
│ │                                                     │   │
│ │ Author: Good point, I'll update this.               │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Ratings

```typescript
interface Rating {
  artifactId: string;
  version: string;
  
  userId: string;
  
  // Overall rating
  overall: number;        // 1-5
  
  // Category ratings
  categories: {
    quality: number;      // Code quality
    documentation: number; // Docs quality
    usability: number;    // Ease of use
    performance: number;  // Speed/efficiency
  };
  
  // Feedback
  title: string;          // Short summary
  body?: string;         // Detailed review
  
  // Verified download
  verifiedDownload: boolean;  // User actually downloaded
  
  // Helpful votes
  helpfulVotes: number;
  
  createdAt: string;
  updatedAt: string;
}
```

## Moderation

```typescript
interface ModerationAction {
  id: string;
  
  // Target
  targetType: 'review' | 'comment' | 'rating';
  targetId: string;
  
  // Action
  action: 'hide' | 'delete' | 'flag' | 'warn';
  reason: string;
  
  // Moderator
  moderatorId: string;
  
  // Appeals
  appealable: boolean;
  appealStatus?: 'pending' | 'approved' | 'rejected';
  
  createdAt: string;
}
```

### Moderation Rules

| Violation | Action | Appealable |
|-----------|--------|------------|
| Spam | Delete + Warn | Yes |
| Off-topic | Hide | Yes |
| Harassment | Delete + Warn | Yes |
| Malicious code | Delete + Ban | No |
| IP violation | Delete | Yes |

## CLI Commands

```bash
# Submit for review
circus marketplace submit my-plugin --category plugin

# View review status
circus marketplace review status my-plugin

# Respond to feedback
circus marketplace review respond my-plugin --message "Updated as requested"

# View assigned reviews
circus reviews assigned

# Submit review
circus reviews submit --artifact my-plugin --rating 5 --recommendation approve
```

## API Endpoints

```typescript
// Submit for review
POST /marketplace/reviews
{
  "artifactId": "uuid",
  "version": "1.0.0"
}

// Get review status
GET /marketplace/reviews/:id

// Submit review
POST /marketplace/reviews/:id/comments

// Vote helpful
POST /reviews/:id/helpful

// Appeal moderation
POST /moderation/appeals
```

## Related Documents

- [Publisher Guide](../06-Marketplace/publisher-guide.md)
- [Trust Scoring](./trust-scoring.md)
- [Verification](./verification.md)
