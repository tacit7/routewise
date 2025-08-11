# RouteWise Theme System

This document outlines the theme classes and design tokens available in the RouteWise application.

## Design Tokens

### Colors
- `--primary`: `hsl(160 84% 36%)` - Brand green for actions, buttons, active states
- `--surface`: `hsl(0 0% 100%)` - Card backgrounds, clean white surfaces
- `--surface-alt`: `hsl(210 25% 97%)` - Subtle panels, inactive tab backgrounds
- `--text`: `hsl(215 18% 18%)` - Primary text color
- `--text-muted`: `hsl(215 16% 35%)` - Secondary text with good contrast
- `--border`: `hsl(214 28% 88%)` - Dividers and card borders
- `--bg`: `hsl(156 30% 96)` - App background with subtle green tint

### Spacing & Layout
- `--radius`: `1rem` - Standard border radius for components

## Component Classes

### Hero Section Components

#### `.hero-card`
Main card container for hero section forms
```css
.hero-card {
  @apply bg-surface/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border/20;
  @apply p-6 md:p-8 max-w-2xl mx-auto;
}
```

#### `.hero-tabs`
Tab navigation container
```css
.hero-tabs {
  @apply flex mb-6 bg-surface-alt rounded-lg p-1 border border-border/50;
}
```

#### `.hero-tab`
Individual tab button base styles
```css
.hero-tab {
  @apply flex-1 py-2 px-4 rounded-md font-medium transition-all;
}
```

#### `.hero-tab-active` / `.hero-tab-inactive`
Tab states
```css
.hero-tab-active {
  @apply bg-surface text-primary shadow-sm border border-primary/20;
}

.hero-tab-inactive {
  @apply text-muted-foreground hover:text-foreground hover:bg-surface/50;
}
```

#### `.hero-tab-content` / `.hero-tab-title` / `.hero-tab-description`
Tab content styling
```css
.hero-tab-content {
  @apply mb-4 text-center;
}

.hero-tab-title {
  @apply text-lg font-semibold text-foreground mb-2;
}

.hero-tab-description {
  @apply text-sm text-muted-foreground;
}
```

### Card Components

#### `.overlay-card-light`
Semi-transparent card with backdrop blur
```css
.overlay-card-light {
  @apply bg-surface/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/30;
}
```

#### `.overlay-card-lighter`
More transparent version for subtle overlays
```css
.overlay-card-lighter {
  @apply bg-surface/60 backdrop-blur-sm rounded-xl shadow-md border border-border/20;
}
```

### Section Backgrounds

#### `.section-gradient-primary`
Primary brand gradient for dashboard sections
```css
.section-gradient-primary {
  @apply bg-gradient-to-br from-primary/5 via-background to-primary/10;
}
```

#### `.section-gradient-subtle`
Subtle gradient for alternating sections
```css
.section-gradient-subtle {
  @apply bg-gradient-to-r from-slate-50 to-white;
}
```

#### `.section-background-alt`
Light alternative background
```css
.section-background-alt {
  @apply bg-slate-50/50;
}
```

### Button Components

#### `.btn-primary`
Primary action buttons
```css
.btn-primary {
  @apply bg-primary hover:bg-primary/90 text-primary-foreground;
  @apply px-6 py-2 rounded-lg font-medium transition-colors;
}
```

#### `.btn-secondary`
Secondary buttons
```css
.btn-secondary {
  @apply bg-secondary hover:bg-secondary/90 text-secondary-foreground;
  @apply px-6 py-2 rounded-lg font-medium transition-colors;
}
```

#### `.btn-outline`
Outline style buttons
```css
.btn-outline {
  @apply border border-border bg-transparent hover:bg-muted;
  @apply px-6 py-2 rounded-lg font-medium transition-colors;
}
```

## Existing UX Spec Classes

### Cards
- `.itinerary-card` - Main card styling with hover effects
- `.card-elevated` - Enhanced card with stronger elevation

### Interactive Elements
- `.interactive-element` - Base transition styling for interactive elements
- `.focus-ring` - Focus ring styling for accessibility

### Trip Planning Specific
- `.trip-places-panel` - Panel background for trip places
- `.drop-zone` / `.drop-zone-active` - Drag & drop zones
- `.time-pill` / `.rating-pill` - Small pill components
- `.day-tab` / `.day-tab-active` - Day navigation tabs

## Usage Guidelines

1. **Consistency**: Always use theme classes instead of inline Tailwind utilities for common patterns
2. **Accessibility**: All interactive elements automatically include focus styling
3. **Responsiveness**: Classes include responsive modifiers where appropriate
4. **Performance**: Theme classes reduce bundle size by avoiding utility repetition

## Examples

### Basic Hero Card
```jsx
<div className="hero-card">
  <div className="hero-tabs">
    <button className={`hero-tab ${active ? 'hero-tab-active' : 'hero-tab-inactive'}`}>
      Tab Label
    </button>
  </div>
  <div className="hero-tab-content">
    <h3 className="hero-tab-title">Title</h3>
    <p className="hero-tab-description">Description</p>
  </div>
</div>
```

### Dashboard Section
```jsx
<section className="py-12 section-gradient-primary">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Section content */}
  </div>
</section>
```

### Consistent Buttons
```jsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outline Button</button>
```