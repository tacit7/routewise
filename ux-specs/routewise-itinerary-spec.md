# RouteWise – Itinerary Planning Page Spec

## 🧭 Overview
This page allows users to plan their trip by organizing selected places into a day-by-day itinerary. Each day contains a list of places with support for drag-and-drop, notes, time-of-day tagging, and map integration.

---

## 🗂 Layout Structure

### Top Section: Trip Overview
- Trip title
- Start and end dates
- "Add a Day" button
- "Open Full Route in Google Maps" button

---

## 📅 Daily Itinerary Cards (Repeat for each day)
### Day Header:
- Format: “Day 2 – Zion National Park”
- Date (e.g. “March 24, 2025”)
- Collapse/Expand toggle

### Map View:
- Embedded Google Map (lazy loaded)
- Display of daily mileage + drive time

### Place List:
Each place card includes:
- Thumbnail image
- Place name
- Category icon (restaurant, park, etc.)
- Time-of-day tag (Morning, Afternoon, Evening)
- Optional notes field
- “View on Maps” button/icon
- Trash/delete icon
- Drag handle

---

## ➕ Add Place UI
- “+ Add Place” button at bottom of each day
- Modal with:
  - Search bar
  - Tabs: My Saved Places, Explore, Categories
  - Preview cards with quick-add

---

## 📱 Mobile Design
- Day selector (accordion or swipeable)
- Stack layout for days
- Tap-to-reorder alternative to drag-and-drop
- Large buttons and touch areas
- Floating “+ Add Place” button

---

## 💾 Data & State Management
- Auto-save on all interactions to localStorage and backend
- Undo snackbar for deletes
- Load saved trip on page entry

---

## 🧠 Empty & Feedback States
- Empty day message: “Nothing planned yet – let’s explore!”
- Auto-save confirmation checkmark
- Error and fallback handling for map and place data

---

## ✨ Optional Features
- Weather forecast widget for each day/location
- .ICS export per day
- AI “Suggest a stop” prompts
- Icon-based color coding by time-of-day

---

## 🎨 Style Guide
- Rounded cards with soft shadows
- Subtle background gradients
- Sticky headers
- Pastel time-of-day labels
- Accessible contrast and large tap targets