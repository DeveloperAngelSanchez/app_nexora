---
name: request-refactor-plan
description: >-
  Create structured, incremental, and risk-managed refactoring plans to improve code quality
  without breaking existing functionality or causing regressions.
---

# Refactoring Plan Protocol

When proposing or executing non-trivial refactorings, follow a structured, phased plan that preserves functionality and minimizes regression risk.

## Refactoring Workflow

### 1. Define the Objective & Boundaries
- Clearly state **why** the refactor is needed (e.g., eliminating code duplication, improving TypeScript type safety, decoupling business logic from UI).
- Define what is **in-scope** and what is **explicitly out-of-scope**.
- Identify all affected files, components, and callers.

### 2. Establish Invariants & Safety Nets
- Verify that existing automated checks and type checking (`pnpm tsc --noEmit`) pass before making any changes.
- Identify or write smoke test cases that verify critical user journeys (e.g. adding items to cart, checkout redirection, search filtering).

### 3. Incremental Step Sequence
Break the refactoring into small, atomic, reversible steps:
1. **Add new interface / module** alongside the old implementation.
2. **Migrate callers one by one** to the new interface, testing after each migration.
3. **Deprecate and remove old implementation** once all call sites are verified.
4. **Final clean up** of obsolete types, imports, and helper functions.

### 4. Verification & Validation
- Re-run TypeScript build check.
- Validate that bundle size and runtime performance are maintained or improved.
- Test interactive user flows in the browser.
