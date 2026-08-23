---
name: improve-codebase-architecture
description: >-
  Scan the codebase for architectural friction, shallow modules, and tight coupling,
  proposing module-deepening refactors to maximize testability and AI navigability.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The primary aims are **testability**, **clarity**, and **AI-navigability**.

## Core Concepts & Vocabulary
- **Module**: A coherent unit of functionality with a well-defined boundary.
- **Interface**: The public surface exposed to callers (functions, props, types, API routes).
- **Depth**: A deep module has a simple, narrow interface that hides significant internal complexity. A shallow module has a wide interface with little internal substance.
- **Seam**: A clear boundary where modules connect, allowing substitution, testing, or mock boundaries without touching internals.
- **Locality**: Related logic and state should live close together rather than being scattered across arbitrary layers.
- **Deletion Test**: If a feature or module is removed, how much unconnected code breaks? Minimal breakage indicates healthy decoupling.

## Process

### 1. Scope & Explore
1. Focus on hot spots or active development paths first (e.g. recently modified files in `src/`).
2. Review domain types (`src/types/`) and data access layers (`src/lib/`, `src/store/`).
3. Identify shallow abstractions (e.g., utility functions that pass through without transforming, components with excessive prop drilling, or tightly coupled state).

### 2. Identify Deepening Opportunities
Look for common architectural friction points:
- **Scattered Domain Logic**: Business rules (e.g., cart discount calculations, currency conversion, stock validation) leaking into UI components.
- **Leaky Data Boundaries**: Database queries or raw schema structures exposed directly to presentation components without clean domain mapping.
- **Shallow Helpers**: Functions that only wrap one simple line of code without adding abstraction value.
- **Fragmented State**: State that could be managed locally or in a dedicated domain store split across multiple disconnected hooks.

### 3. Propose Radically Different Alternatives
For the chosen hotspot, evaluate 2-3 architectural approaches:
- **Approach A: Encapsulated Domain Module** (Hide implementation details behind a clean, unified API/Hook).
- **Approach B: Ports & Adapters** (Decouple external services like Supabase/WhatsApp/Payment gateways via domain interfaces).
- **Approach C: Caller-Optimized Composition** (Simplify component interfaces with compound components or slot patterns).

### 4. Implementation & Verification
1. Create a safe refactoring plan with incremental steps.
2. Ensure public contracts remain backward compatible or update all call sites atomically.
3. Validate with TypeScript compiler (`pnpm tsc --noEmit`) and verify user flows.
