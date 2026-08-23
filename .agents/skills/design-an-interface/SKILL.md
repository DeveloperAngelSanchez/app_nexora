---
name: design-an-interface
description: >-
  Design ergonomic, predictable, and robust TypeScript component, function, and API interfaces
  that minimize caller cognitive load and prevent invalid usage.
---

# Interface Design

This skill guides the design of developer-friendly, predictable, and maintainable interfaces for components, functions, hooks, and API routes.

## Core Rules for Interface Design

### 1. Minimal Surface Area (Narrow Interfaces)
- Expose only what callers truly need. Keep internal state, implementation mechanics, and incidental complexity hidden.
- Avoid wide prop interfaces with dozens of optional booleans. Use composition, discriminated unions, or compound components instead.

### 2. Make Invalid States Unrepresentable
- Instead of multiple optional boolean flags (e.g. `{ isLoading?: boolean; isError?: boolean; isSuccess?: boolean }`), use discriminated status unions:
  ```typescript
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```

### 3. Predictable Arguments & Return Types
- Use named object parameters for functions with more than 2 arguments.
- Prefer explicit return types over implicit inference on public boundaries.
- Provide sensible defaults for optional configuration options.

### 4. Component Interface Guidelines (React / Next.js)
- Standardize event handlers with `on[Event]` naming (e.g., `onAddToCart`, `onSelectVariant`, `onFilterChange`).
- Accept `className` and standard HTML attributes when wrapping native elements, merging styles reliably.
- Use slots or `children` for customizable UI content rather than heavy JSON config props.
