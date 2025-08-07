# UX/UI Spec – Trip Day Planner Screen

## Purpose
Allow the user to organize saved trip places into daily itineraries by dragging places between the “Your Trip Places” pool and each day’s schedule.  
The UI must make scheduling intuitive, avoid time conflicts, and keep the visual hierarchy clear.

---

## 1. Layout

| Area | Description |
|------|-------------|
| **Header** | Shows “Back to Route Results” link, page title `My Trip`, and subtitle `Organize your X saved places into daily plans`. |
| **Day Tabs** | Horizontal tab row with each day labeled (`Day 1`, `Day 2`, etc.) plus a `+` button to add a new day. |
| **Main Content** | Split into two columns: Left = current day’s schedule. Right = “Your Trip Places” pool. |
| **Responsive Behavior** | On small screens, stacks into a single column: Day schedule on top, Trip Places below. |

---

## 2. Color & Style Tokens
*(Light mode values; dark mode mirrors hue but adjusts lightness)*

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `hsl(210 20% 98%)` | App background |
| `--surface` | `hsl(0 0% 100%)` | Cards, tab active background |
| `--surface-alt` | `hsl(210 25% 97%)` | Pills, subtle panels |
| `--text` | `hsl(215 18% 18%)` | Primary text |
| `--text-muted` | `hsl(215 12% 42%)` | Secondary text |
| `--border` | `hsl(214 28% 88%)` | Dividers, card borders |
| `--primary` | `hsl(160 84% 36%)` | Brand green (actions, active tab) |
| `--primary-50` | `hsl(160 60% 96%)` | Tint backgrounds |
| `--primary-200` | `hsl(160 46% 86%)` | Drop slot border |
| `--warning` | `hsl(42 95% 45%)` | Rating star color |
| `--focus` | `hsl(217 92% 60%)` | Focus ring |

---

## 3. Components

### A. Header
- **Back Link**: Text + chevron icon, muted color, hover → primary color.
- **Title**: `22px`, bold.
- **Subtitle**: `14px`, muted text.

### B. Day Tabs
- **Default Tab**: Border `--border`, background `transparent`, text `--text`.
- **Hover**: `background: --primary-50`.
- **Active Tab**: `background: --primary`, text white, no border, small shadow.
- **+ Tab**: Same style as default; hover same as others.

### C. Day Schedule Column
- **Section Title**: `20px` bold.
- **Date**: `13px` muted.
- **Divider**: 1px solid `--border`, 12px vertical spacing.
- **Place Card**:
  - Container: `--surface`, border, rounded `16px`, small shadow.
  - **Header Row**:  
    - Title: `16px` bold.  
    - Category: `12px` muted.  
    - Drag handle: Grip dots (`cursor: grab`), hover → background `--surface-alt`.
  - **Body Row**:  
    - Time pill: Rounded, background `--surface-alt`, bordered, `14px` text.  
    - Rating: Inline pill, background `--surface-alt`, gold star icon.

### D. Your Trip Places Column
- **Panel**: `background: --primary-50`, border `--primary-100`, rounded `16px`, padded `16px`.
- **Instruction Text**: `14px` muted, line below title.
- **Card Grid**:  
  - Responsive: `1col` mobile, `2col` md, `3col` xl.  
  - Card style matches Day Schedule cards, but includes an image at top (`140px` height) and ellipsis button.

### E. Drag & Drop States
- **Dragging Item**: Slight rotation/scale(1.02), elevated shadow.
- **Drop Slot**: Dashed border `--primary-200`, background `--primary-50`, rounded corners, label text muted.

---

## 4. Interaction Rules

1. **Dragging**:
   - User can drag from “Your Trip Places” → Day Schedule.
   - User can drag from Day Schedule → “Your Trip Places” (unschedule).
   - User can reorder items within the Day Schedule.

2. **Sorting Logic**:
   - On reorder within Day Schedule, update state array order.
   - On drop into Day Schedule, auto-assign a suggested time based on previous item’s end time + travel time.

3. **Feedback**:
   - Show placeholder drop slot where the item will land.
   - Maintain smooth transitions when reordering.

4. **Accessibility**:
   - Tabs and drag handles must be keyboard-focusable.
   - Focus ring = `2px solid --focus` with `2px` offset.
   - Ensure color contrast ratio ≥ 4.5:1 for all text.

---

## 5. Empty States
- **Empty Day Schedule**: Show large dashed placeholder with text “Drag places here to start your day.”
- **Empty Trip Places**: Show message “You’ve scheduled all your places” with link to add more.

---

## 6. Responsive Behavior
- **<640px**: Stack columns vertically; Trip Places below Day Schedule.
- **640–1024px**: Two-column layout; Trip Places grid at 2 cols.
- **>1024px**: Two-column layout; Trip Places grid at 3 cols.

---

## 7. Motion
- **Hover**: Cards gain slight shadow (`transition: 120ms ease-out`).
- **Drag Start**: Scale 1.02, shadow-lg.
- **Drop**: Smooth snap into place (`transition: 180ms ease-in`).

---

## 8. Assets
- **Icons**: Use consistent set (e.g., Heroicons or Lucide) for clock, star, grip handle, ellipsis.
- **Images**: 16:9 ratio thumbnails; rounded top corners.
