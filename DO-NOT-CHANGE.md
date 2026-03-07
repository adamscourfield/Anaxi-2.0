# Refactor guardrails (do not change without explicit sign-off)

## Preserve exactly

- Observation signal definitions currently in production.
- Observation drift parameters currently in production.
- Existing observation capture workflow and throughput.
- Existing leave request + approval workflow.
- Existing meetings workflow.
- Existing on-call workflow.
- Existing behaviour workflows and imports.

## Allowed in this phase

- Navigation relabeling / grouping by module domain.
- Internal file organization improvements.
- Shared entity / ID consistency improvements.
- Permission mapping cleanup (capability-based checks) with no access regressions.
- Home-screen contract scaffolding.

## Explicitly out of scope

- Feature removal.
- Mandatory user retraining due to workflow redesign.
- Splitting into multiple repos or multiple databases.

## Regression checklist

Before merging any related change, verify:

1. Observe: create + submit walkthrough/observation still works.
2. Observe: existing signals and drift behaviour are unchanged.
3. Behaviour/on-call: log and action a request still works.
4. Meetings: create/view/update still works.
5. Leave: request/approve still works.
6. Role-based access remains correct for all above.
