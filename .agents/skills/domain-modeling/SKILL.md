---
name: domain-modeling
description: >-
  Design robust domain models, TypeScript types, database entities, and business invariants
  for e-commerce, catalogs, carts, and checkout workflows.
---

# Domain Modeling

Domain modeling defines the core entities, business rules, invariants, and language of the application before jumping into implementation or presentation logic.

## Principles
1. **Ubiquitous Language**: Use consistent, explicit domain terms across database schemas, TypeScript interfaces, state management, and UI text (e.g. `Product`, `Variant`, `CartItem`, `Order`, `StockLevel`, `DiscountRule`).
2. **Make Illegal States Unrepresentable**: Leverage TypeScript discriminated unions and strict typing so impossible application states cannot compile.
3. **Encapsulate Invariants**: Entity rules (e.g., "cart quantity cannot be negative", "stock cannot drop below zero", "price must be non-negative") belong to the domain model, not scattered across ad-hoc React components.

## E-Commerce Domain Checklist for Nexora Store

### Core Entities & Types
- **Product**: `id`, `name`, `slug`, `brand`, `category`, `price_pen`, `original_price_pen`, `images`, `specs`, `is_featured`, `is_new`, `stock`.
- **Variant**: `id`, `product_id`, `color`, `storage_capacity`, `sku`, `price_override`, `stock`.
- **CartItem**: `productId`, `name`, `price`, `image`, `quantity`, `selectedVariant`.
- **Order / Checkout Payload**: `items`, `subtotal`, `shippingCost`, `total`, `currency`, `customerInfo` (name, phone, address, paymentMethod), `status`.

## Process
1. **Model Discovery**: Identify what real-world concepts exist and their relationships (1-to-many, many-to-many).
2. **Type Definition**: Author domain types in `src/types/` using strict TypeScript without `any` or loose index signatures.
3. **Database Schema Mapping**: Match TypeScript entities with PostgreSQL tables, constraints, and foreign keys in `supabase/schema.sql`.
4. **Validation Layer**: Implement runtime schema validation where untrusted data enters the system (API routes, webhook handlers, user inputs).
