---
name: diagnose
description: >-
  Systematic bug diagnosis and troubleshooting through tight reproduction feedback loops,
  isolation, hypothesis testing, minimal instrumentation, and verified fixes.
---

# Systematic Bug Diagnosis

Disciplined approach to resolving bugs and unexpected behavior. Without a clear signal that goes "red" on the bug, code analysis and guesswork are insufficient.

## The Diagnostic Protocol

### 1. Build a Tight Feedback Loop
- **Rule**: Never attempt to fix a bug without a reproducible trigger or automated test case that reliably fails on the bug.
- Create a minimal reproduction command, script, or unit test.
- Verify the feedback loop runs in seconds (not minutes).

### 2. Isolate the Failure Boundary
- Trace data flow from input to error site.
- Narrow down the offending layer:
  - Client state / Hydration mismatch (`localStorage`, Zustand, React state).
  - API / Route handler layer (Next.js App Router).
  - Data access / Supabase query / RLS permissions.
  - Serialization / Type parsing.

### 3. Formulate & Test Hypotheses
- State a explicit hypothesis: *"The bug occurs because X receives null when Y is uninitialized."*
- Add minimal, targeted diagnostic instrumentation (logs or breakpoints) at key boundaries.
- Inspect actual runtime values against expected values.

### 4. Implement Minimal, Root-Cause Fix
- Fix the underlying architectural or logical defect, not just the symptom.
- Avoid wrapping bugs in blanket `try/catch` or `null` coalescing operators without understanding why invalid state exists.

### 5. Verify & Prevent Regression
- Run the reproduction loop: confirm the test turns green.
- Run the full test suite and build check to ensure no side effects.
- Remove temporary debug logs.
