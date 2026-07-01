# Scoring Architecture: Event-Driven Multi-Tenant Intelligence

This document describes how HHR evolves from a static directory into a real-time
intelligence platform. The core insight: *ingest public signals once, compute many
tenant-specific rankings efficiently.*

## Core Problem

Two constantly changing data streams:

1. **Public ingestion signals** — TomTom, OSM Overpass, state regulatory scrapers,
   bid feeds, EPA feeds, permit feeds, web crawlers, vendor submissions
2. **Sub-tenant scoring** — each tenant scores vendors differently (different
   weights, different verticals)

## Three-Layer Architecture

```
┌─────────────────────┐
│  Public Data Sources │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Ingestion Pipeline  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Canonical Vendor Graph│
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│     Signal Store     │ ← append-only event stream
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│    Score Engine      │ ← multi-tenant
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Tenant Score Cache  │ ← Redis hot cache
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│     Search API       │
└─────────────────────┘
```

### Layer 1 — Canonical Vendor Graph

Single source of truth. Normalized vendor records shared across all tenants.

### Layer 2 — Signal Store

Every incoming change becomes an event (append-only event stream). Each event
triggers recalculation only for *impacted tenants*, not all tenants.

### Layer 3 — Tenant Score Engine

Multi-tenant scoring. Each tenant has its own `TenantProfile` with scoring
weights. Only impacted tenants recalculate when a signal arrives.

## Scoring Modes

| Mode | Latency | Storage | Trigger |
|------|---------|---------|---------|
| Hot (real-time) | < 200ms | Redis | search, bid alerts |
| Cold (batch) | hourly/nightly | Supabase | ranking, ML updates |

## Worker Architecture

Don't run scoring inside API routes. Use dedicated workers:

```
API Layer → Event Bus → Scoring Worker
                        Compliance Worker
                        Bid Worker
                        Recommendation Worker
```

## Vendor Score Formula (5 Components)

```
Vendor Score = Base Relevance + Compliance + Geo + Feedback + Activity
```

## Feedback Trust Weighting

```
Feedback Impact = Vote × User Trust × Confidence
```

- Anonymous user: weight = 0.2
- Trusted paying contractor: weight = 1.0
- Power user with strong history: weight = 2.0

## Sync Frequency by Data Type

| Freshness | Data Sources |
|-----------|-------------|
| Real-time | feedback, bids, vendor availability |
| Near real-time (5–15 min) | TomTom, Overpass, new listings |
| Daily | EPA, permits, compliance databases |
| Weekly | deep crawls, full rescoring |

## Recommended Stack

| Layer | Tech |
|-------|------|
| Control Plane | Supabase |
| Event Bus | Redis Streams |
| Hot Cache | Redis (Upstash) |
| Workers | RunPod / DO Worker Nodes |
| Frontend | Vercel (Next.js) |

## Flow

```
Public APIs → Ingestion → [Supabase]
                        → [Redis Streams] → Scoring/Compliance/Bid Workers
                                          → [Redis Cache] → Search API → Frontend
```

Not: Search → Score → Return
Instead: Ingest → Normalize → Event → Recalculate → Cache → Serve
