### Pricing & Credits TODOs

Goals
- Make pricing fully model-cost–driven (no global conversion constant)
- Keep safety guardrails, but read them from `configurations`
- Keep `actualDuration` for telemetry/audit; no reconciliation needed

Tasks
- [ ] Pricing engine (model-cost–driven)
  - [ ] Remove dependency on a global `CREDITS_PER_USD` and delete it from `convex/pricing.ts`.
  - [ ] Change `calculateCreditCost` to use per-model/per-resolution credits:
        `credits = ceil(creditsPerSecond × duration)`.
  - [ ] Keep `resolution` required; continue to use `modelCosts` by `by_model_and_resolution`.
  - [ ] Validate inputs and failure states with clear errors.

- [ ] Guardrails via `configurations`
  - [ ] Replace hardcoded `PRICING_LIMITS` with config-backed keys:
        - `pricing.max_credits_per_video`
        - `pricing.max_duration_seconds`
        - `pricing.max_cost_per_second`
  - [ ] Read these values in `convex/pricing.ts` with sensible defaults if not present.
  - [ ] Enforce during cost calculation (prevents abuse/bad data).

- [ ] Data model & seeds (dev mode; DB reset OK)
  - [ ] Update `convex/schema.ts` → in `modelCosts`, add `creditsPerSecond: v.number()` (keep existing `costPerSecond` for reference).
  - [ ] Update `convex/seed.ts` → seed `creditsPerSecond` for all `(modelId, resolution)` rows.
  - [ ] Seed `configurations` for the pricing guardrails above with sensible defaults.
  - Note: No migrations needed; we can reset the DB in dev and re-run seeds.

- [ ] Code updates
  - [ ] `convex/pricing.ts`: remove `CREDITS_PER_USD` and `PRICING_LIMITS`; read guardrails from `configurations`.
  - [ ] `convex/pricing.ts`: compute credits using `creditsPerSecond`.
  - [ ] `convex/videos.ts`: keep using `calculateCreditCost` before deducting credits; no change to flow.
  - [ ] Remove any dead imports or references to deleted constants.

- [ ] Admin/config management (optional but recommended)
  - [ ] Add queries/mutations to list/update `pricing.*` configuration keys.
  - [ ] Add queries/mutations to create/update `modelCosts` rows including `creditsPerSecond`.
  - [ ] Add validation to prevent obviously loss-making updates.

- [ ] Subscriptions & credit packages alignment
  - [ ] Revisit `subscriptionPlans.monthlyCredits` and `creditPackages.credits` so user value matches the new pricing and does not guarantee negative margins.
  - [ ] (Optional) Add a sanity-check utility that compares plan/package value against median `creditsPerSecond` to flag risky settings.

- [ ] Monitoring & analytics
  - [ ] Keep storing `videos.actualDuration` (no reconciliation logic required).
  - [ ] (Optional) Log pricing inputs (modelId, resolution, duration, creditsPerSecond, computed credits) for audit.

- [ ] Tests
  - [ ] Unit tests for `calculateCreditCost` using `creditsPerSecond`.
  - [ ] Tests for guardrails loaded from `configurations`.
  - [ ] Tests for missing/inactive model/resolution scenarios.

- [ ] Docs & UI
  - [ ] Update README to describe model-cost–driven pricing and config-driven guardrails.
  - [ ] Update any admin UI/docs that previously referenced `CREDITS_PER_USD`.

- [ ] Deployment steps (dev only)
  - [ ] Reset DB and run seeds to apply schema/config/modelCosts changes.
  - [ ] Verify `getCreditCost` results across models/resolutions/durations.
  - [ ] Manual spot-checks for high/low cost models to ensure guardrails and credits behave as expected.

Notes
- We keep `actualDuration` for telemetry and potential future analytics/refunds. No reconciliation of charged credits against actual duration is required at this time.

