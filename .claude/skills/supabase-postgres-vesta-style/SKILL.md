---
name: supabase-postgres-vesta-style
description: "Model Supabase and PostgreSQL for Carni-mvp with VESTA-style discipline: multi-tenant thinking, explicit roles, RLS on every sensitive table, and operational clarity."
metadata:
	trigger: "Use when defining Supabase schemas, Postgres tables, policies, roles, or multi-tenant access rules."
	scope: [supabase, postgres, rls, auth, data]
---

# Supabase Postgres Vesta Style

## Purpose

Create data models that can grow from MVP to operational platform without breaking auth, tenancy, or auditability.

## Requirements

- every sensitive table gets RLS
- admin actions must remain distinguishable from customer actions
- tenant boundaries must be explicit in schema design
- storage and analytics data must inherit access constraints
- roadmap features must not be documented as active infra

## Review Prompts

- what tenant key gates this row
- what actor can read, insert, update, delete
- what happens if a JWT is valid but mis-scoped
