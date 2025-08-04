# 🎨 RouteWise Itinerary Planning Design System

**Feature**: Itinerary Planning Component System  
**Product**: RouteWise  
**Author**: UX Research & Design Systems Specialist  
**Date**: 2025-08-03  
**Version**: 1.0

---

## 📋 Architecture Analysis

### Current Foundation
- **shadcn/ui components** - Robust accessibility-first base components
- **CSS variable theming** - Flexible design token system via Tailwind
- **TypeScript integration** - Type-safe component APIs
- **Existing trip components** - POI cards and basic itinerary structure

### Design System Extensions Needed
- Time-of-day tagging system
- Drag-and-drop interaction patterns
- Day-based organization components
- Enhanced mobile touch patterns
- Accessibility-first reordering mechanisms

---

## ⚛️ Atomic Components

### 1. TimeOfDayTag

**Purpose**: Visual and semantic indication of when a place should be visited

```typescript
interface TimeOfDayTagProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  variant?: 'default' | 'compact';
  className?: string;
}

// Design Tokens
const timeOfDayColors = {
  morning: 'bg-amber-100 text-amber-800 border-amber-200',
  afternoon: 'bg-blue-100 text-blue-800 border-blue-200', 
  evening: 'bg-purple-100 text-purple-800 border-purple-200'
}
```

**Accessibility Requirements**:
- Color + icon combination for colorblind accessibility
- Semantic meaning conveyed through ARIA labels
- 4.5:1 minimum contrast ratio
- Screen reader announces time context

**Usage Locations**: Place cards, day headers, filtering interfaces

---

### 2. DragHandle

**Purpose**: Visual affordance for drag-and-drop reordering

```typescript
interface DragHandleProps {
  className?: string;
  variant?: 'vertical' | 'horizontal';
  'aria-label'?: string;
  onKeyboardReorder?: (direction: 'up' | 'down') => void;
}
```

**Accessibility Requirements**:
- Keyboard navigation alternative (Space + Arrow keys)
- Screen reader instructions for reordering
- Focus indicator meets 2px minimum outline
- Touch target minimum 48x48px

**Keyboard Pattern**:
- `Space`: Enter reorder mode
- `Arrow Up/Down`: Move position
- `Enter`: Confirm position
- `Escape`: Cancel reordering

---

### 3. CategoryIcon

**Purpose**: Consistent iconography for place categorization

```typescript
interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
  showLabel?: boolean;
}

// Size mapping
const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6'
}
```

**Accessibility Requirements**:
- Alt text describing category meaning
- Consistent sizing across contexts
- High contrast variants for accessibility mode
- Label text when space permits

---

## 🧬 Molecular Components

### 4. ItineraryPlaceCard

**Purpose**: Enhanced place card optimized for itinerary planning

```typescript
interface ItineraryPlaceCardProps extends Omit<PoiCardProps, 'variant'> {
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  dayIndex: number;
  placeIndex: number;
  notes?: string;
  onNotesUpdate?: (notes: string) => void;
  onTimeOfDayChange?: (timeOfDay: string) => void;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  'aria-describedby'?: string;
}
```

**Key Features**:
- Inline notes editing with auto-save
- Time-of-day selection dropdown
- Integrated drag handle
- Delete with undo functionality
- Mobile-optimized touch targets

**Accessibility Requirements**:
- `role="listitem"` within day context
- `aria-describedby` linking to notes
- Keyboard-accessible reordering
- Screen reader announces position changes
- Focus management during drag operations

**Mobile Considerations**:
- 48px minimum touch targets
- Swipe gestures for quick actions
- Haptic feedback on reorder
- Bottom sheet for editing on small screens

---

### 5. DayHeader

**Purpose**: Day organization and metadata display

```typescript
interface DayHeaderProps {
  dayNumber: number;
  date: Date;
  title?: string; // e.g. "Zion National Park"
  totalMileage?: number;
  totalDriveTime?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  onTitleEdit?: (title: string) => void;
  placeCount: number;
}
```

**Responsive Behavior**:
- **Desktop**: Inline editing, hover states
- **Tablet**: Touch-friendly editing controls  
- **Mobile**: Tap to edit, swipe to collapse

**Accessibility Requirements**:
- `role="heading"` with appropriate level
- `aria-expanded` for collapse state
- `aria-controls` linking to day content
- Keyboard accessible editing
- Screen reader announces day context

---

### 6. AddPlaceButton

**Purpose**: Context-aware place addition interface

```typescript
interface AddPlaceButtonProps {
  dayIndex: number;
  onAddPlace: (dayIndex: number) => void;
  variant?: 'floating' | 'inline' | 'compact';
  disabled?: boolean;
  'aria-label'?: string;
}
```

**Responsive Variants**:
- **Mobile**: Floating Action Button (FAB) in bottom right
- **Desktop**: Inline button at day bottom
- **Compact**: Small + icon for tight spaces

**Accessibility Requirements**:
- Clear `aria-label` describing action
- Keyboard accessible (Enter/Space)
- Focus indicator visible
- Screen reader announces day context

---

## 🏗️ Organism Components

### 7. DailyItineraryCard

**Purpose**: Complete day planning interface

```typescript
interface DailyItineraryCardProps {
  day: {
    date: Date;
    title?: string;
    places: ItineraryPlace[];
    mileage?: number;
    driveTime?: string;
  };
  dayIndex: number;
  isCollapsed?: boolean;
  onPlaceReorder: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  onPlaceUpdate: (dayIndex: number, placeIndex: number, updates: Partial<ItineraryPlace>) => void;
  onPlaceDelete: (dayIndex: number, placeIndex: number) => void;
  onAddPlace: (dayIndex: number) => void;
}
```

**Features**:
- Embedded Google Maps (lazy loaded)
- Drag-and-drop place reordering
- Collapse/expand with smooth animations
- Auto-save indicators with visual feedback
- Daily mileage and drive time calculations

**Accessibility Requirements**:
- `role="region"` with day label
- `aria-live="polite"` for auto-save announcements
- Focus management during place operations
- Keyboard navigation between places
- Screen reader friendly drag-drop alternatives

---

### 8. TripOverview

**Purpose**: High-level trip management and navigation

```typescript
interface TripOverviewProps {
  tripTitle: string;
  startDate: Date;
  endDate: Date;
  onTitleEdit: (title: string) => void;
  onDateEdit: (startDate: Date, endDate: Date) => void;  
  onAddDay: () => void;
  onOpenInMaps: () => void;
  totalDays: number;
  totalPlaces: number;
  totalMileage?: number;
}
```

**Features**:
- Inline trip title editing
- Date range picker integration
- Quick stats display
- External maps integration
- Day management controls

---

## ♿ Accessibility Implementation

### WCAG 2.1 AA Compliance

**Color & Contrast**:
- Time-of-day tags: 4.5:1 contrast minimum
- Interactive elements: 3:1 contrast for large text (>18px)
- No color-only information (icons + color combination)
- High contrast mode support

**Keyboard Navigation Patterns**:
```typescript
// Drag & Drop Keyboard Alternative
const keyboardReorderPattern = {
  'Space': 'Select item for reordering',
  'ArrowUp/ArrowDown': 'Choose new position', 
  'Enter': 'Confirm new position',
  'Escape': 'Cancel reordering',
  'Tab': 'Navigate between items'
}
```

**Screen Reader Support**:
```typescript
// ARIA Patterns Example
<div 
  role="list" 
  aria-label={`Places for day ${dayNumber}: ${dayTitle}`}
>
  <div 
    role="listitem"
    aria-describedby={`place-description-${placeId}`}
    aria-setsize={totalPlaces}
    aria-posinset={placeIndex + 1}
    tabIndex={0}
  >
    <button 
      aria-label={`Reorder ${placeName}. Current position ${placeIndex + 1} of ${totalPlaces}. Press space to start reordering.`}
    >
      <GripVertical aria-hidden="true" />
    </button>
  </div>
</div>
```

**Focus Management**:
- Visible focus indicators (2px solid outline)
- Focus trap within modals and sheets
- Focus restoration after drag operations
- Sequential tab order maintained

**Motor Accessibility**:
- 48x48px minimum touch targets
- Generous spacing (8px minimum) between interactive elements
- Alternative interaction methods for drag-and-drop
- Voice control compatibility

---

## 📱 Responsive Design Specifications

### Mobile First (320px - 768px)
```css
.daily-card {
  @apply w-full px-4 py-6;
}

.place-card {
  @apply min-h-20 p-4 border rounded-lg;
  /* Larger touch targets for mobile */
}

.add-place-fab {
  @apply fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg;
  /* Floating action button for mobile */
}

.day-header {
  @apply sticky top-0 bg-white/95 backdrop-blur-sm border-b;
  /* Sticky header for context */
}
```

### Tablet (768px - 1024px)
```css
.itinerary-layout {
  @apply max-w-4xl mx-auto px-6;
}

.daily-card {
  @apply rounded-xl shadow-lg;
}

.sidebar {
  @apply w-80 fixed right-0 top-0 h-full bg-white border-l;
  /* Place search sidebar */
}
```

### Desktop (1024px+)
```css
.itinerary-layout {
  @apply grid grid-cols-3 gap-6 max-w-7xl mx-auto;
  /* Main content + sidebar layout */
}

.daily-card {
  @apply hover:shadow-xl transition-shadow duration-200;
}

.inline-editing {
  @apply hover:bg-slate-50 transition-colors;
  /* Enhanced hover interactions */
}
```

### Responsive Breakpoints
```typescript
const breakpoints = {
  mobile: '320px - 768px',
  tablet: '768px - 1024px', 
  desktop: '1024px+',
  touch: 'any device with touch capability'
}
```

---

## 🎯 Implementation Phases

### Phase 1: Core Functionality (Week 1-2)
1. **ItineraryPlaceCard** with time-of-day tags
2. **DailyItineraryCard** with basic reordering  
3. **AddPlaceButton** mobile-optimized
4. Basic accessibility implementation

### Phase 2: Enhanced UX (Week 3-4)
4. Drag-and-drop with keyboard alternatives
5. **TripOverview** with inline editing
6. Advanced mobile gestures and animations
7. Complete accessibility audit and fixes

### Phase 3: Polish & Optimization (Week 5-6)  
7. Micro-interactions and smooth animations
8. Performance optimizations (virtualization for long lists)
9. Advanced accessibility features (voice commands)
10. Cross-browser compatibility testing

---

## 🔧 Technical Implementation Notes

### State Management
```typescript
interface ItineraryState {
  days: DayData[];
  activeDay: number;
  dragState: DragState | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}
```

### Performance Considerations
- Virtualized lists for large itineraries (>50 places)
- Lazy loading for map components
- Debounced auto-save (300ms delay)
- Image lazy loading with placeholder states

### Testing Requirements
- Unit tests for all component variants
- Accessibility testing with axe-core
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Touch device testing across form factors
- Keyboard-only navigation testing

---

## 📊 Success Metrics

### Usability Goals
- **95%** task completion rate for itinerary creation
- **<3 seconds** average time to add a place to itinerary
- **Zero** critical accessibility violations (WCAG AA)
- **80+** System Usability Scale (SUS) score

### Performance Goals  
- **<100ms** response time for drag operations
- **<2s** initial page load time
- **60fps** smooth animations on mobile devices
- **<500KB** total bundle size for itinerary components

### Accessibility Goals
- **100%** keyboard navigation coverage
- **WCAG 2.1 AA** compliance across all components
- **3:1** minimum contrast ratio for all interactive elements
- **Zero** screen reader navigation blockers