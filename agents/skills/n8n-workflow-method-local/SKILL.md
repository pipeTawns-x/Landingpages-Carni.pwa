---
name: n8n-workflow-method-local
description: "Design local n8n workflows for Carni-mvp with explicit triggers, retries, observability, and error handling for operational automations and AI-assisted flows."
metadata:
	trigger: "Use when defining n8n workflows, webhook triggers, retries, error paths, or local automation methods."
	scope: [n8n, automation, workflows, ai, operations]
---

# N8N Workflow Method Local

## Purpose

Create local automation methods that are observable, debuggable, and safe to evolve.

## Workflow Rules

- define trigger, inputs, outputs, and failure path explicitly
- prefer idempotent actions for order or notification flows
- add retries only where duplicate side effects are controlled
- capture enough metadata for debugging and audit

## Error Review

- what happens on partial failure
- what can be retried safely
- what requires human escalation
