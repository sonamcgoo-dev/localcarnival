# Verification

> Identity and artifact verification in LocalCircus.

## Overview

Verification ensures authenticity of publishers and quality of artifacts through systematic checks.

## Publisher Verification

### Verification Levels

```typescript
type PublisherVerificationLevel = 
  | 'none'           // Unverified
  | 'email'          // Email verified
  | 'phone'          // Phone verified
  | 'identity'       // Government ID verified
  | 'organization';  // Organization verified
```

### Verification Process

```
┌─────────────────┐
│  Email Verified  │ ← Step 1 (required)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phone Verified  │ ← Step 2 (optional)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Identity Verified│ ← Step 3 (optional)
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Organization Verified│ ← Step 4 (optional)
└─────────────────────┘
```

### Verification Methods

#### Email Verification

```typescript
interface EmailVerification {
  userId: string;
  email: string;
  
  status: 'pending' | 'verified' | 'failed';
  
  // Verification
  sentAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  
  // Method
  method: 'link' | 'code';
}
```

#### Phone Verification

```typescript
interface PhoneVerification {
  userId: string;
  phone: string;
  country: string;
  
  status: 'pending' | 'verified' | 'failed';
  
  // Verification
  sentAt: string;
  verifiedAt?: string;
  
  // Method
  method: 'sms' | 'whatsapp';
  codeLength: 6;
}
```

#### Identity Verification

```typescript
interface IdentityVerification {
  userId: string;
  
  status: 'pending' | 'in_review' | 'verified' | 'rejected';
  
  // Documents
  documents: {
    type: 'passport' | 'drivers_license' | 'national_id';
    country: string;
    uploadedAt: string;
    reviewedAt?: string;
  }[];
  
  // Biometric check
  selfieVerified: boolean;
  
  // Review
  reviewerId?: string;
  reviewNotes?: string;
  
  // Result
  rejectionReason?: string;
}
```

#### Organization Verification

```typescript
interface OrganizationVerification {
  userId: string;
  organizationId: string;
  
  status: 'pending' | 'in_review' | 'verified' | 'rejected';
  
  // Organization details
  organization: {
    name: string;
    type: 'company' | 'nonprofit' | 'government' | 'individual';
    registrationNumber?: string;
    country: string;
    website?: string;
  };
  
  // Verification documents
  documents: {
    type: 'business_registration' | 'tax_certificate' | 'domain_verification';
    uploadedAt: string;
    reviewedAt?: string;
  }[];
  
  // Domain verification
  domainVerified: boolean;
  dnsRecord?: string;
  
  // Review
  reviewerId?: string;
  reviewNotes?: string;
}
```

## Artifact Verification

### Verification Levels

```typescript
type ArtifactVerificationLevel = 
  | 'none'           // Unverified
  | 'automated'      // Passed automated checks
  | 'community'      // Community reviewed
  | 'security';      // Security audited
```

### Automated Verification

```typescript
interface AutomatedVerification {
  artifactId: string;
  
  status: 'pending' | 'passed' | 'failed' | 'warning';
  
  // Checks performed
  checks: {
    id: string;
    name: string;
    status: 'pass' | 'fail' | 'warning';
    details?: string;
    findings?: VerificationFinding[];
  }[];
  
  // Overall
  passedAt?: string;
  score?: number;  // 0-100
  
  // Re-verification
  lastChecked: string;
  autoRenew: boolean;
}

interface VerificationFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  rule: string;
  message: string;
  location?: { file: string; line: number; column: number };
  suggestion?: string;
}
```

### Automated Checks

| Check | Description | Severity |
|-------|-------------|----------|
| `dna-valid` | Valid DNA structure | critical |
| `dna-complete` | All required fields | high |
| `no-secrets` | No hardcoded secrets | critical |
| `license-valid` | Valid SPDX license | high |
| `license-compatible` | Compatible with ecosystem | medium |
| `no-malware` | No malicious code patterns | critical |
| `type-correct` | Type definitions correct | medium |
| `exports-valid` | Entry points valid | medium |
| `size-reasonable` | Artifact size OK | low |

### Security Audit Verification

```typescript
interface SecurityAudit {
  artifactId: string;
  
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  
  // Audit details
  auditor: {
    id: string;
    name: string;
    organization?: string;
    credentials: string[];
  };
  
  // Scope
  scope: {
    staticAnalysis: boolean;
    dynamicAnalysis: boolean;
    dependencyAudit: boolean;
   渗透测试?: boolean;
  };
  
  // Results
  findings: SecurityFinding[];
  cvssScore?: number;  // 0-10
  
  // Report
  reportUrl?: string;
  reportHash?: string;
  
  // Timeline
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
}

interface SecurityFinding {
  id: string;
  
  // Classification
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cweId?: string;        // CWE identifier
  cveId?: string;        // CVE if applicable
  
  // Details
  title: string;
  description: string;
  location?: string;
  poc?: string;          // Proof of concept
  
  // Remediation
  recommendation: string;
  estimatedFixTime?: string;
  
  // Status
  status: 'open' | 'accepted' | 'mitigated' | 'false_positive';
  resolvedAt?: string;
}
```

## Verification Badges

```typescript
interface VerificationBadge {
  type: BadgeType;
  name: string;
  description: string;
  
  // Criteria
  criteria: {
    verificationLevel: PublisherVerificationLevel;
    trustScore?: number;
    artifactCount?: number;
    passedChecks?: string[];
  };
  
  // Display
  icon: string;
  color: string;
  tooltip: string;
}

type BadgeType = 
  | 'verified_email'
  | 'verified_phone'
  | 'verified_identity'
  | 'verified_organization'
  | 'security_audited'
  | 'top_publisher'
  | 'official_partner';
```

### Badge Display

```
┌─────────────────────────────────────────────────────────────┐
│ Publisher: LocalCircus Team                                │
│                                                             │
│ 🏆 Gold Publisher                                          │
│ ✓ Email Verified                                           │
│ ✓ Identity Verified                                        │
│ 🔒 Security Audited                                        │
└─────────────────────────────────────────────────────────────┘
```

## Verification UI

### Verification Center

```
┌─────────────────────────────────────────────────────────────┐
│ Verification Center                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Your Verification Status                                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✓ Email      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ✓ │
│ │ ✓ Phone      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ✓ │
│ │ ⏳ Identity  ━━━━━══                            │ 50%│ │
│ │ ○ Organization                                     │ — │ │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Pending Actions                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📋 Upload ID document for Identity Verification     │ → │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Your Badges                                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✓ Verified Email    │ ✓ Verified Phone    │ ⏳ ID │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Verification API

```typescript
// Start verification
POST /verification/email
{ "email": "user@example.com" }

POST /verification/phone
{ "phone": "+1234567890", "country": "US" }

POST /verification/identity
{ 
  "documentType": "passport",
  "country": "US",
  "documentImage": "base64...",
  "selfieImage": "base64..."
}

// Check status
GET /verification/status

// Get verification details
GET /verification/email
GET /verification/phone
GET /verification/identity

// Artifact verification
GET /artifacts/:id/verification
POST /artifacts/:id/verify
```

## Security Considerations

### Data Handling

```typescript
interface SecurityProtocol {
  // Document storage
  documentStorage: {
    encryption: 'AES-256';
    storageLocation: 'secure';
    retentionDays: 90;
    autoDelete: boolean;
  };
  
  // Access control
  accessControl: {
    reviewers: string[];  // IDs of who can see
    auditLogging: boolean;
    sessionTimeout: number;  // minutes
  };
  
  // Privacy
  privacy: {
    piiMasking: boolean;
    dataMinimization: boolean;
    consentRequired: boolean;
  };
}
```

### Compliance

- **GDPR** compliant
- **CCPA** compliant
- **SOC 2** audited
- Data residency options available

## CLI Commands

```bash
# Start verification
circus verify email
circus verify phone
circus verify identity

# Check status
circus verify status

# View artifact verification
circus verify artifact my-plugin

# Request security audit
circus verify audit-request my-plugin
```

## Related Documents

- [Trust Scoring](./trust-scoring.md)
- [Review System](./review-system.md)
- [Publisher Guide](../06-Marketplace/publisher-guide.md)
