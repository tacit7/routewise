# RouteWise Step 2 Page – Action Plan

## ✅ Goal
Improve visual hierarchy, clarity, accessibility, and interactivity of the trip planning form without sacrificing the clean design.

---

## 🧱 Structural / UX Fixes

### 1. Remove Duplicate Step Label
- ❌ Current: “Step 2 of 7” appears twice.
- ✅ Fix: Keep it in the progress bar header. Remove it from the inner card.

### 2. Clarify and Separate Headings
- Make the main heading `Locations` bolder and larger.
- Make the subtext ("Specify where your journey...") smaller and lighter.
- Use clear spacing to separate label from inputs.

### 3. Make “Add a Stop Along the Way” a True Button
- Change from plain text to a real button:
  ```html
  <button class="text-sm text-primary hover:underline flex items-center gap-1">
    <PlusIcon /> Add Stop
  </button>
  ```
- Disable until start and end are filled in.

---

## 🎨 Visual and Color Adjustments

### 4. Improve Input Border Visibility
- Current input borders (`#e5e7eb`) are too light.
- ✅ Fix: Use `#d1d5db` or Tailwind’s `border-gray-300`.

### 5. Adjust “I’m Flexible” Box Contrast
- The light blue text lacks contrast.
- ✅ Fix: Darken the instructional blue to `#4a90e2` or Tailwind `text-blue-600`.

### 6. Use Accent Color for Optional Elements
- Apply your `--accent` or `--accent-foreground` color to:
  - "I’m flexible with my destinations"
  - Optional stops
  - Tooltips or hints

---

## 🧩 Interactivity and Feedback

### 7. Add Inline Validation or Tooltip for Disabled Next Button
- When the “Next” button is disabled, explain why.
- ✅ Fix: Tooltip or inline text:
  > “Please enter both a start and destination city.”

### 8. Highlight Active/Focused Input
- Inputs should have a visible focus ring.
- ✅ Fix: Add outline or border color on `:focus` (use `--ring` or `--accent`).

---

## 📱 Mobile Responsiveness

### 9. Collapse Optional Stops on Mobile
- Optional stops take up too much vertical space.
- ✅ Fix: Show a toggle button:  
  “+ Add Stops” → expands a collapsible section.

---

## 🎨 Optional Enhancements

### 10. Microcopy for Emotional Design
- Add warmth and encouragement:
  - _“Let’s start planning your adventure.”_
  - _“Need help? Try ‘I’m flexible’ to discover cool spots.”_

### 11. Light Hover Effects
- Add light hover styles on form elements and buttons:
  - `hover:bg-muted-hover`
  - `hover:border-accent`

---

## ✅ Final Plan: Summary Checklist

| Task | Priority | Type |
|------|----------|------|
| Remove duplicate step label | High | Structural |
| Improve heading/subheading hierarchy | High | UX |
| Make “Add Stop” a real button | High | UX |
| Improve input border contrast | High | Visual |
| Darken blue guidance text | High | Accessibility |
| Apply accent color to optional UI | Medium | Branding |
| Add tooltip or inline message for disabled "Next" | Medium | UX |
| Highlight focused inputs | Medium | Interactivity |
| Collapse optional stops on mobile | Medium | Mobile UX |
| Add microcopy for warmth | Low | Emotional UX |
| Add hover effects for buttons/inputs | Low | Visual polish |
