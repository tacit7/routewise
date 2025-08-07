# 🧭 RouteWise UI Action Plan: Expandable Sidebar Tab

## 🎯 Goal

Implement a vertical toggle tab for the left-hand "Places Along Route" sidebar that toggles between:

- **Collapsed width** (approx. 320px)
- **Expanded width** (50% of the screen)

---

## ✅ Tasks

### 1. Toggleable Sidebar State

- [ ] Create `expanded` boolean state using `useState` in the sidebar component
- [ ] Toggle this state on tab click
- [ ] Add CSS class toggling: `.route-sidebar` vs `.route-sidebar.expanded`

---

### 2. Vertical Expand/Collapse Tab

- [ ] Add a `div` element as a vertical tab attached to the sidebar's right edge
- [ ] Show `>` icon when collapsed, `<` icon when expanded
- [ ] Style:
  - `position: absolute` on right center edge
  - `background-color: #e53935` (RouteWise red)
  - `border-radius: 0 4px 4px 0`
  - Recommended size: `width: 24px`, `height: 80px`
- [ ] Make it clickable with cursor/hover styling

---

### 3. Animate Sidebar Transition

- [ ] Add `transition: width 0.3s ease` to the sidebar container
- [ ] Default width: `320px`
- [ ] Expanded width: `50vw`
- [ ] Ensure inner content is scrollable or wraps appropriately

---

### 4. Responsive Behavior

- [ ] On mobile/tablet, sidebar may collapse to drawer or bottom sheet
- [ ] Optionally hide the tab if screen too small
- [ ] Ensure sidebar doesn’t overlap trip buttons or map controls

---

### 5. Map Layout Handling

- [ ] Ensure map resizes or shifts when sidebar expands/collapses
- [ ] If using Google Maps, trigger resize event:
  ```ts
  google.maps.event.trigger(map, 'resize')
  ```

---

### 6. Accessibility

- [ ] Add `role="button"` and `aria-expanded={expanded}` to the tab
- [ ] Enable keyboard navigation: tab to select, enter to activate
- [ ] Optional: add focus ring and tooltips for screen reader users

---

## 📁 Deliverables

- [ ] Updated sidebar component with toggle behavior
- [ ] Styled expand/collapse tab
- [ ] Smooth transition animations
- [ ] Verified responsive behavior
- [ ] Optional: Figma alignment, motion/easing spec

---

## 💬 Notes

- Design reference: red tab in screenshot provided
- If time allows, consider adding keyboard shortcuts (`[` to collapse, `]` to expand)
- Make sure map and sidebar don’t clash visually in expanded mode
