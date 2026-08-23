---
name: tdd
description: >-
  Test-driven development with vertical slices, behavior-focused tests, and
  incremental red-green-refactor cycles across pre-agreed seams.
---

# Test-Driven Development (TDD)

TDD is the red → green → refactor loop. This skill guides the creation of resilient, high-value tests that verify behavior through public interfaces rather than brittle implementation details.

## Principles of Good Tests
1. **Behavior Over Implementation**: Tests verify behavior through public APIs and seams. Internal refactors should never break tests as long as external behavior is preserved.
2. **Vertical Slicing**: Write one test → write minimal code to make it pass → refactor → repeat. Avoid horizontal slicing (writing 10 failing tests before writing any code).
3. **Specification-Style**: Test names must read like living documentation (e.g. `it("calculates cart total with percentage discount and currency rate", ...)`).
4. **Pre-Agreed Seams**: Test at public boundaries (domain modules, custom hooks, API route handlers, utility libraries). Never test internal private state.

## The TDD Cycle

### Phase 1: Identify Seams & Test Cases
- Define the public seam under test (e.g., `src/store/useCartStore.ts`, `src/lib/catalog.ts`, or checkout order formatter).
- List the specific behaviors to verify (happy path, edge cases, zero/empty states, error handling).

### Phase 2: Red Phase (Failing Test)
- Write the smallest possible test expressing the expected behavior.
- Run the test suite and confirm it fails for the **expected reason**.

### Phase 3: Green Phase (Minimal Implementation)
- Write the simplest code necessary to make the test pass.
- Resist adding speculative features or premature abstractions.

### Phase 4: Refactor Phase (Clean Up)
- With green tests safeguarding behavior, clean up duplication, improve naming, optimize performance, and deepen module interfaces.
- Re-run tests to confirm they remain green.
