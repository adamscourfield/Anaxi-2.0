# Anaxi module map (current refactor baseline)

This document defines the platform structure we are moving to **without removing existing capability**.

## Principles

- Keep one codebase, one database, one auth system.
- Preserve all existing workflows that are already live.
- Reorganize by domain ownership (module boundaries), not by rewriting logic.

## Product domains

### 1) Instruction (Observe)
Primary purpose: teaching quality workflows.

Current scope:
- Observation feed
- Signals history
- Observation signal model and drift parameters
- Instruction-oriented analytics and drilldowns

### 2) Culture (Behaviour)
Primary purpose: behaviour and on-call workflows.

Current scope:
- Students behaviour context and imports
- On-call requests and triage
- Behaviour-linked analysis surfaces

### 3) Operations
Primary purpose: school operational workflows.

Current scope:
- Meetings
- Leave of absence requests and approvals

### 4) Analytics
Cross-domain reporting and insight views.

Current scope:
- Teacher analysis
- CPD priorities
- Student priorities
- Explorer views

### 5) Administration
Tenant configuration and controls.

Current scope:
- Users, departments, settings, feature toggles
- Taxonomies and leave approval rules

## Non-goals for this phase

- No module split into separate repos/services.
- No replacement of existing observation signals.
- No replacement of existing drift parameters.
- No regression in leave, meetings, on-call, behaviour, or observation flows.

## Refactor intent

This phase is a packaging and boundary clarification phase.
If behaviour changes, it must be treated as a bug unless explicitly approved.
