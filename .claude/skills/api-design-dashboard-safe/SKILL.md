---
name: api-design-dashboard-safe
description: "Design safe APIs for Carni-mvp dashboards and operational flows, with a Prowler-inspired checklist for auth, secrets, tenancy, rate limits, and auditability."
metadata:
	trigger: "Use when designing endpoints, dashboard contracts, admin APIs, or secure request/response patterns."
	scope: [api, dashboard, security, backend]
---

# API Design Dashboard Safe

## Purpose

Define API contracts for dashboards and operational flows without leaking secrets, roles, or unsafe assumptions.

## Checklist

- explicit auth boundary per endpoint
- role and tenant checks before data access
- no secret values in request payloads or frontend config
- rate limits or abuse controls for public-facing routes
- audit trail for admin-impacting actions
- error responses that do not leak internals

## Prowler Mindset

- verify configuration, not just code style
- assume privilege escalation attempts exist
- require traceability for sensitive operations
