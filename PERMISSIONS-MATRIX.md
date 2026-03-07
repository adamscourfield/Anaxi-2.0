# Permissions matrix (normalisation baseline)

Date: 2026-03-07

This file defines the capability vocabulary used during refactor.
It is intended to reduce direct role checks in UI and route handlers.

## Capability groups

### Observe
- `observe:view`
- `observe:view_all`
- `observe:create`
- `observe:configure`

### Behaviour / On-call
- `oncall:create`
- `oncall:acknowledge`
- `oncall:resolve`
- `oncall:view_all`
- `oncall:cancel`

### Students / Imports
- `students:read`
- `students:write`
- `import:write`

### Meetings / Actions
- `meetings:create`
- `meetings:view_own`
- `meetings:view_all`
- `meetings:edit`
- `meetings:delete`
- `actions:create`
- `actions:manage`
- `actions:view_own`

### Leave
- `leave:request`
- `leave:approve`
- `leave:approve_all`

### Analysis
- `analysis:view`
- `analysis:view_behaviour`
- `analysis:export`

### Admin
- `admin:access`
- `admin:users`
- `admin:settings`

## Notes

- Existing business logic remains unchanged in this phase.
- Keep using feature flags alongside capabilities where relevant.
- For current refactor, direct role checks should gradually be replaced by `hasPermission` / `hasAnyPermission`.
