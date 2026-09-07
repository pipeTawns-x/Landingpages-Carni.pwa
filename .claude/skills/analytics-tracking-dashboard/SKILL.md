---
name: analytics-tracking-dashboard
description: "Define analytics and tracking for Carni-mvp dashboards with event taxonomy, funnel metrics, privacy-aware instrumentation, and Chart.js-ready outputs."
metadata:
	trigger: "Use when planning dashboard events, analytics instrumentation, metrics naming, or Chart.js data flows."
	scope: [analytics, tracking, dashboard, metrics, chartjs]
---

# Analytics Tracking Dashboard

## Purpose

Instrument product and dashboard behavior without polluting the codebase with ad hoc event names.

## Event Design

- define actor, source, action, and outcome
- separate customer events from admin events
- include business metrics only when they can be computed reliably
- keep PII out of analytics payloads

## Dashboard Outputs

- conversion funnels
- retention and order cadence
- campaign attribution markers
- Chart.js-ready series with explicit labels and units
