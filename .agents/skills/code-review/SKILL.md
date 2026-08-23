---
name: code-review
description: >-
  Perform high-standard, structured code reviews evaluating correctness, TypeScript types,
  performance, security, architectural boundaries, and specification alignment.
---

# Code Review Protocol

A disciplined, exhaustive code review procedure evaluating pull requests, git diffs, and feature implementations.

## Review Dimensions

### 1. Specification & Requirements Alignment
- Does the code fulfill all user and business requirements?
- Are edge cases (empty states, loading states, error handling, network timeouts) properly handled?

### 2. TypeScript & Type Safety
- Are all types explicit, strict, and aligned with domain models?
- Are there any `any`, unsafe type assertions (`as unknown as T`), or unhandled `null`/`undefined` scenarios?
- Are props interfaces cleanly documented and minimal?

### 3. Architecture & Separation of Concerns
- Does the change maintain deep module boundaries?
- Is business logic isolated from UI presentation?
- Are database / external API calls encapsulated inside dedicated client libraries?

### 4. Performance & Resource Efficiency
- Next.js 15 optimization: Are Server Components used wherever client interactivity is not required?
- Are images utilizing `next/image` with proper sizing and priority attributes?
- Are hooks properly memoized where heavy computations occur, without unnecessary re-renders?

### 5. Security & Data Integrity
- Are inputs validated and sanitized before database queries or API payloads?
- Are environment variables, API secrets, and sensitive credentials kept out of client bundles?
- Are Supabase RLS (Row Level Security) policies respected?

## Review Output Format
Provide feedback structured by severity:
- 🔴 **Blocker (Must Fix)**: Bugs, security vulnerabilities, type regressions, broken specs.
- 🟡 **Improvement (Recommended)**: Performance bottlenecks, coupling issues, code style improvements.
- 🟢 **Nitpick / Note (Optional)**: Minor naming suggestions or micro-optimizations.
