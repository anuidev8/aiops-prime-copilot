# AIOps Prime Copilot - Company/Project KPI Analytics Spec

## Document Control
- Owner: Product + Engineering
- Status: Ready for implementation planning
- Last updated: 2026-05-18
- Linked Notion target: https://www.notion.so/AIOps-Prime-Copilot-Spec-Driven-Development-364c2144fd7f81c0bb14c3e5ffb6432f

## 1) Problem
Current analysis is scoped by `services[]` + `timeWindowMinutes` and outputs incidents, analyses, PRIME KPIs, and narrative. Leadership needs a higher-level operational view by company and project, while preserving all current behavior.

Example target:
- Company: `Acme Corp`
- Project: `Project Gem`
- Services (4): `auth-api`, `payments-api`, `worker-sync`, `notifications`

The platform must produce trustworthy KPI-based project/company reporting with clear decision recommendations and polished visuals.

## 2) Goals
1. Add hierarchical scope: `company -> project -> services`.
2. Keep existing service-level logic and API compatibility.
3. Generate project/company KPI summaries from incident evidence.
4. Add recommendation outputs for business/ops decisions.
5. Improve UI with project-focused charts/cards without removing current sections.

## 3) Non-Goals
- No rewrite of ADK multi-agent pipeline.
- No removal of existing `analyze`/`prime-report` routes.
- No IAM, billing, or multi-tenant auth redesign in this phase.

## 4) Existing Logic That Must Stay
The following contracts/flows are compatibility-critical and must remain valid:
- `POST /api/aiops/analyze` request with only `services` and/or `timeWindowMinutes`.
- `POST /api/aiops/prime-report` behavior.
- Existing `AnalyzeLogsUseCase` scope -> telemetry -> analyst -> reporter pipeline.
- Existing output blocks: `IncidentTable`, `PrimeKpiCards`, `PrimeNarrative`.
- Existing front-end session flow and incremental agent tool behavior.

## 5) Functional Requirements

### FR-1 Scope Model
Extend request scope with optional fields:
- `companyId?: string`
- `projectId?: string`
- existing `services?: string[]`
- existing `timeWindowMinutes?: number`

Resolution rules:
1. `projectId` only -> resolve to project service set.
2. `projectId + services` -> intersection with project-owned services.
3. `companyId` only -> union of all services in company projects.
4. none provided -> current global behavior unchanged.

### FR-2 Ownership Metadata
Add ownership model:
- Company: `id`, `name`
- Project: `id`, `companyId`, `name`, `serviceNames[]`

### FR-3 KPI Levels
Support KPI computation for:
- Service (existing)
- Project (new)
- Company (new)

### FR-4 Recommendations
Generate recommendation objects per project/company:
- priority
- evidence (metrics)
- immediate action (24h)
- strategic action (7-30 days)
- risk level

### FR-5 UX Reporting
Add project/company visual reporting sections:
- project/company scope controls
- project health cards
- service pressure bars per project
- severity mix donut
- timeline/trend
- recommendation panel

### FR-6 Backward Compatibility
All existing payloads and flows keep working with no required client changes.

## 6) KPI Definitions

### Keep Existing KPIs
- MTTR
- Auto-handleable incident rate
- Incident density
- Root-cause confidence

### New Aggregated KPIs
- Project Incident Volume
- Critical Incident Rate = `critical / total * 100`
- Service Stability Coverage = `% services with zero critical incidents`
- Recurrent Incident Ratio = `% incidents with repeated fingerprint`
- Project Health Score (0-100)

### Initial Health Score Weighting
- 30% MTTR normalized
- 25% Critical Incident Rate
- 20% Auto-handleable Rate
- 15% Root-cause Confidence
- 10% Recurrent Incident Ratio

All thresholds and normalization constants must be explicit constants in code for auditability.

## 7) API/Contract Changes

### Request
Extend payload in:
- `src/shared/types/aiops.ts`
- `src/backend/application/contracts/analyze-logs.ts`
- `src/backend/interface/http/analyze-request-schema.ts`

Add:
- `companyId?: string`
- `projectId?: string`

### Response Query Block
Extend `query` metadata with:
- `requestedCompanyId: string | null`
- `requestedProjectId: string | null`
- `resolvedCompanyId: string | null`
- `resolvedProjectId: string | null`
- `resolvedProjectName: string | null`
- `resolvedServiceCount: number`

### PRIME Report Extension
Add optional sections to report DTO/view model:
- `projectSummary?: { projectId; projectName; healthScore; kpis[]; recommendation }`
- `companySummary?: { companyId; companyName; kpis[]; topRisks[] }`

## 8) Architecture Changes

### Domain
Add:
- `Company` entity
- `Project` entity
- ownership repository port
- `ProjectKpiAggregator` service
- `RecommendationBuilder` service

### Application
- Extend analyze command schema/contracts.
- Replace current scope-only resolver with hierarchy-aware resolver.
- Insert project/company aggregation between incident analysis and report mapping.

### Infrastructure
- Add ownership data adapter (mock seed first).
- Seed `Project Gem` with 4 services for deterministic validation.

## 9) Frontend Changes

### Scope UX
In `src/features/aiops-copilot/ui/aiops-copilot.tsx`:
- add company/project inputs
- keep existing services/time-window inputs
- auto-resolve services on project selection (visible, editable)

### New UI Blocks
Add new entity/feature blocks while preserving existing ones:
- `ProjectHealthCards`
- `ProjectServiceBarChart`
- `ProjectSeverityDonut`
- `ProjectRecommendationPanel`

### Session + Types
Update session artifacts and result merge types to carry new query/report fields safely.

## 10) Implementation Plan (Phased)

### Phase 1: Contracts + Scope Resolver (2-3 days)
Goal: accept new scope dimensions and resolve service scope deterministically.

Tasks:
1. Extend request/response TS contracts and Zod schema.
2. Create ownership domain types + repository port.
3. Implement mock ownership adapter with `Project Gem` seed.
4. Implement hierarchical scope resolver with compatibility fallback.
5. Wire resolver into `AnalyzeLogsUseCase` and `RunTelemetryUseCase`.

Acceptance:
- legacy payloads unchanged
- `projectId` resolves service set deterministically
- `projectId + services` intersection works

### Phase 2: Aggregation + Recommendations (3-4 days)
Goal: produce project/company KPIs and recommendation artifacts.

Tasks:
1. Implement KPI aggregation services and formula constants.
2. Implement health score calculation + normalization helpers.
3. Implement recommendation builder with risk tags.
4. Extend PRIME report DTO mapping/adk reporter fallback integration.
5. Update incremental tool cache patch types for enriched report payload.

Acceptance:
- `Project Gem` report reflects only its 4 services
- recommendation contains metric evidence + 24h/7-30d actions

### Phase 3: Dashboard UX (3-4 days)
Goal: render project/company insights with clear visual hierarchy.

Tasks:
1. Add company/project selectors in Copilot scope form.
2. Add project KPI/health card section.
3. Add service distribution and severity donut visuals.
4. Add recommendation decision panel.
5. Ensure loading/empty/error states for all new blocks.

Acceptance:
- switching project refreshes all charts/recommendations
- mobile and desktop layouts stay usable

### Phase 4: Validation + Hardening (2-3 days)
Goal: verify formulas, compatibility, and UX reliability.

Tasks:
1. Unit tests for resolver and KPI formula services.
2. API integration tests for new payload combinations.
3. UI rendering tests for new sections.
4. Update README with new scope model and examples.

Acceptance:
- `npm run lint` and `npm run build` pass
- tests cover compatibility + new scope behaviors

## 11) Task Backlog (Notion-Ready)

Use these as task page titles in the Notion task database.

### Foundation
1. `Implement: extend analyze contracts with companyId/projectId`
2. `Implement: ownership domain model (Company, Project)`
3. `Implement: ownership repository port + mock adapter`
4. `Implement: hierarchical scope resolver`
5. `Integrate: resolver into analyze + telemetry use cases`

### KPI + Reporting
6. `Implement: project KPI aggregator`
7. `Implement: company KPI aggregator`
8. `Implement: project health score constants + formulas`
9. `Implement: recommendation builder for project/company`
10. `Integrate: extended prime report DTO/mappers`

### Frontend
11. `Implement: company/project scope controls in analysis form`
12. `Implement: project health cards`
13. `Implement: project service pressure chart`
14. `Implement: severity donut for project scope`
15. `Implement: recommendation decision panel`
16. `Integrate: session/types for extended query + report`

### Quality
17. `Test: scope resolver matrix (legacy + project + company)`
18. `Test: KPI formula correctness and thresholds`
19. `Test: API integration for analyze/prime-report`
20. `Test: dashboard rendering states`
21. `Document: README scope + KPI extensions`

## 12) Dependency and Risk Notes

Dependencies:
- clean ownership mapping source (mock first, real source next)
- alignment on KPI thresholds with operations leadership

Key risks:
1. Scope ambiguity when `companyId`, `projectId`, and `services` conflict.
   - Mitigation: deterministic precedence rules + explicit query metadata.
2. KPI misinterpretation by stakeholders.
   - Mitigation: KPI description text + formula constants + tests.
3. UI complexity drift.
   - Mitigation: preserve current blocks and add sections incrementally.

## 13) Acceptance Matrix

### Compatibility
- [ ] Existing service/time window requests return same shape and behavior.
- [ ] Existing UI still renders with no company/project provided.

### Scope
- [ ] `projectId` resolves service list correctly.
- [ ] `companyId` aggregates company project services correctly.
- [ ] conflict cases follow documented precedence.

### KPI + Recommendations
- [ ] Health score is deterministic and test-covered.
- [ ] Recommendation includes metric evidence and action windows.

### UX
- [ ] New visuals render on desktop/mobile.
- [ ] Loading/empty/error states are clear and stable.

## 14) Suggested Delivery Milestones
- Milestone 1 (Phase 1): 2026-05-21
- Milestone 2 (Phase 2): 2026-05-26
- Milestone 3 (Phase 3): 2026-05-30
- Milestone 4 (Phase 4): 2026-06-03
