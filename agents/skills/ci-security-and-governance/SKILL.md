---
name: ci-security-and-governance
description: "Harden Carni-mvp CI with governance gates, secret scanning, TruffleHog-style checks, deterministic validation, and release discipline for protected delivery paths."
metadata:
	trigger: "Use when editing CI, adding repository checks, defining merge gates, or reviewing delivery governance."
	scope: [ci, security, governance, release, devops]
---

# CI Security And Governance

## Purpose

Turn CI into a trust boundary, not just a build runner.

## Controls

- syntax and build checks for Node and frontend
- secret scanning before merge or release
- delivery claims backed by executable validation
- protected branch discipline and human review for risky changes

## Recommended Gates

- `npm ci`
- `node --check app.js`
- `npm run build`
- secret scan with TruffleHog or equivalent
- artifact sanity checks for entrypoints and manifest
