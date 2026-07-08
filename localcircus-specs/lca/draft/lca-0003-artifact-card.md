---
lca: LCA-0003
title: Artifact Card Specification
author: LocalCircus
status: Draft
created: 2026-07-08
version: 0.1
---

# LCA-0003: Artifact Card Specification

## Summary

This specification defines the Artifact Card — the visual component for displaying artifacts throughout the LocalCircus ecosystem.

## Card Variants

| Variant | Dimensions | Use Case |
|---------|------------|----------|
| Grid | 280×360px | Browser grid view |
| List | 72px height | Browser list view |
| Detail | 400×auto | Modal/detail view |

## Grid Card Layout

```
┌────────────────────────────────┐
│ ┌──────┐ Name                  │
│ │ Icon │ v1.2.3 · type       │
│ └──────┴────────────────────── │
│ Description text...            │
├────────────────────────────────┤
│ ⚡ capability  🔧 capability   │
├────────────────────────────────┤
│ ⭐⭐⭐⭐☆  │  ✓ Verified       │
└────────────────────────────────┘
```

## Card Components

### Header
- Icon (48×48px)
- Name (truncated at 32 chars)
- Version badge
- Type badge

### Description
- 2 lines max (48px)
- Truncated with ellipsis

### Capability Badges
- Max 4 displayed
- Pill style (24px height)
- Icon + label

### Footer
- Star rating (0-5)
- Verified badge
- Install count

## CSS Variables

```css
:root {
  --card-bg: var(--color-background-elevated);
  --card-border: var(--color-border-default);
  --card-radius: var(--border-radius-lg);
  --card-padding: var(--spacing-4);
  --card-shadow: var(--shadow-sm);
  
  --card-icon-size: 48px;
  --card-name-size: var(--font-size-base);
  --card-desc-size: var(--font-size-sm);
  --card-badge-height: 24px;
}
```

## States

| State | Appearance |
|-------|------------|
| Default | Base styling |
| Hover | Shadow elevation, border highlight |
| Selected | Brand border, subtle background |
| Disabled | 50% opacity, no interactions |
| Loading | Skeleton animation |

## Accessibility

- ARIA labels on interactive elements
- Focus visible states
- Keyboard navigation
- Screen reader announcements
