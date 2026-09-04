---
name: devops-docker-dashboard
description: "Operate Carni-mvp through Docker-first commands, compose workflows, containerized npm usage, and dashboard-safe runtime checks for local and CI environments."
metadata:
	trigger: "Use when running builds, compose services, devcontainer commands, or documenting Docker workflows for the repo."
	scope: [docker, devcontainer, compose, devops, runtime]
---

# DevOps Docker Dashboard

## Purpose

Keep runtime and validation reproducible by forcing container-first execution.

## Rules

- run all `npm` commands in Docker or `.devcontainer/`
- prefer `docker compose -f .devcontainer/docker-compose.yml`
- validate build and syntax before release or merge
- document the exact container command used for verification

## Command Patterns

- `docker compose -f .devcontainer/docker-compose.yml run --rm app sh -lc 'npm ci && node --check app.js && npm run build'`
- `docker compose -f .devcontainer/docker-compose.yml run --rm app sh -lc 'npm run ebac'`
