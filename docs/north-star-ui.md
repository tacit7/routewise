# North Star UI Guide

This document defines the **single source of truth** for our UI styling. Every component, page, and feature must align with these guidelines. This ensures visual consistency, faster development, and a cohesive product experience.

---

## 1. Core Principles
- **Consistency over creativity**: follow the system, don’t invent new styles.
- **Mobile-first design**: all components should look great on small screens by default.
- **Accessible by design**: meet WCAG 2.1 AA for color contrast and keyboard navigation.
- **Performance-aware**: avoid bloated styles or unnecessary DOM complexity.

---

## 2. Colors
| Usage              | Token                  | Value (Example)        | Notes |
|--------------------|------------------------|------------------------|-------|
| Background         | `--bg`                 | `hsl(210, 20%, 98%)`    | App main background |
| Surface            | `--surface`            | `hsl(0, 0%, 100%)`      | Cards, modals |
| Surface Alt        | `--surface-alt`        | `hsl(210, 25%, 97%)`    | Subtle panels |
| Border             | `--border`             | `hsl(214, 32%, 91%)`    | Borders, dividers |
| Primary            | `--primary`            | `#059669`               | Actions & CTAs |
| Primary Foreground | `--primary-foreground` | `#FFFFFF`               | Text on primary |
| Error              | `--error`              | `#DC2626`               | Validation errors |
| Success            | `--success`            | `#16A34A`               | Success messages |
| Warning            | `--warning`            | `#FACC15`               | Alerts |
| Info               | `--info`               | `#2563EB`               | Info messages |

---

## 3. Typography
- **Font Family:** Inter, sans-serif
- **Font Sizes:**
  - Heading 1: `text-3xl font-bold`
  - Heading 2: `text-2xl font-semibold`
  - Body: `text-base`
  - Small: `text-sm`
- **Line height:** 1.4–1.6 for body, 1.2 for headings.
- **Weight:** Use bold for emphasis, not for decoration.

---

## 4. Spacing & Layout
- **Base unit:** `4px` — all spacing multiples of 4.
- **Padding inside components:** `p-4` (16px) standard, adjust proportionally for small variants.
- **Max content width:** `max-w-screen-xl` for page layouts.
- **Gutters:** `gap-4` for small, `gap-6` for large sections.

---

## 5. Components
Every component must:
1. Be implemented as a reusable UI component (`components/ui`).
2. Support size, variant, and state props.
3. Include mobile-responsive rules internally.
4. Avoid inline styles unless dynamic (computed at runtime).

**Example Button Props:**
```tsx
<Button variant="primary" size="md" disabled>
  Save Changes
</Button>
```
Variants: `primary`, `secondary`, `outline`, `ghost`, `link`  
Sizes: `sm`, `md`, `lg`

---

## 6. Interaction States
- **Hover:** Slight elevation or background tint.
- **Focus:** Always have a visible outline (`focus:ring-2 focus:ring-primary`).
- **Active:** Pressed-down feel with reduced brightness.
- **Disabled:** Reduced opacity, no pointer events.

---

## 7. Responsive Breakpoints
- **sm:** 640px  
- **md:** 768px  
- **lg:** 1024px  
- **xl:** 1280px  
- **2xl:** 1536px  
Design mobile-first, then scale up.

---

## 8. Review & Enforcement
- **Design Gatekeeper:** All PRs must be reviewed for adherence.
- **Linting:** ESLint + Stylelint rules to block rogue styling.
- **Kitchen Sink Page:** Updated with all variants whenever a component changes.

---

## 9. Anti-Patterns
❌ New color values in random components  
❌ Inline font sizes  
❌ Arbitrary breakpoints outside our scale  
❌ Copy-pasting markup without reusing components
