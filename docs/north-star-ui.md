# North Star UI Guide

This document defines the **single source of truth** for our UI styling. Every component, page, and feature must align with these guidelines. This ensures visual consistency, faster development, and a cohesive product experience.

---

## 1. Core Principles
- **Consistency over creativity**: follow the system, don’t invent new styles.
- **Mobile-first design**: all components should look great on small screens by default.
- **Accessible by design**: meet WCAG 2.1 AA for color contrast and keyboard navigation.
- **Performance-aware**: avoid bloated styles or unnecessary DOM complexity.

---

## 2. Colors & Semantic Tokens
Always use shadcn/ui semantic tokens for consistency and theme support:

| Usage              | Semantic Token         | CSS Class              | Notes |
|--------------------|------------------------|------------------------|-------|
| Background         | `bg-background`        | Background color       | App main background |
| Cards/Surfaces     | `bg-card`              | Card background        | Cards, modals, panels |
| Text Primary       | `text-foreground`      | Primary text           | Main content text |
| Text Secondary     | `text-muted-foreground`| Secondary text         | Captions, descriptions |
| Borders            | `border-border`        | Border color           | All borders, dividers |
| Primary Actions    | `bg-primary`           | Primary background     | CTAs, active states |
| Primary Text       | `text-primary-foreground` | Text on primary     | Text on primary bg |
| Success            | `bg-emerald-500`       | Success color          | Success states |
| Warning            | `bg-yellow-500`        | Warning color          | Warning states |
| Error/Destructive  | `bg-destructive`       | Error color            | Error states |
| Accent             | `bg-accent`            | Accent background      | Hover states |
| Muted Areas        | `bg-muted`             | Muted background       | Disabled, inactive |
| Input              | `bg-input`             | Input background       | Form inputs |
| Popover            | `bg-popover`           | Popover background     | Dropdowns, tooltips |

**Key Principle**: Never use custom CSS variables or hex colors. Always use shadcn/ui semantic tokens for automatic theme support.

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

### List Item Hover Pattern
For interactive list items (POI cards, search results, etc.), use **rounded cards with border-only highlights**:

```tsx
<div className="p-4 border-2 border-border hover:border-primary cursor-pointer transition-colors rounded-lg">
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1">
      <h3 className="font-medium text-foreground mb-2">Title</h3>
      <Badge variant="secondary" className="mb-2">category</Badge>
      {/* Content */}
    </div>
    <Button size="sm" className="w-8 h-8 p-0 rounded-full">
      <Plus className="h-4 w-4" />
    </Button>
  </div>
</div>
```

**Key characteristics:**
- Rounded card design with `rounded-lg` and `border-2`
- Maintains clean background (no background color changes)
- Border-only hover states: `border-border` to `hover:border-primary`
- Spacing between cards using `space-y-3` in container
- Categories displayed as badges, not plain text
- Provides subtle visual feedback without overwhelming the design

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
❌ **Custom CSS variables instead of semantic tokens** (`--my-color` vs `bg-card`)  
❌ **Hex colors in components** (`#ffffff` vs `text-foreground`)  
❌ **Inline font sizes outside the scale** (`text-[17px]` vs `text-base`)  
❌ **Arbitrary breakpoints** (`max-w-[850px]` vs `max-w-4xl`)  
❌ **Copy-pasting markup without reusing components**  
❌ **Transparent backgrounds for dropdowns/popovers** (use solid `bg-popover`)

## 10. Migration Checklist
When updating components to North Star UI:
- ✅ Replace `var(--surface)` with `bg-card`
- ✅ Replace `var(--border)` with `border-border`  
- ✅ Replace `text-fg` with `text-foreground`
- ✅ Replace `bg-blue-600` with `bg-primary`
- ✅ Replace `bg-red-600` with `bg-destructive`
- ✅ Ensure all dropdowns use `bg-popover` for solid backgrounds
