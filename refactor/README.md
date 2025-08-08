# Itinerary Page Refactor (Drop-in)

What you get:
- `useItinerary` hook (single source of truth, persistence built-in)
- Extracted `DailyItinerarySidebar` and `TripPlacesGrid`
- Optional map toggle in Trip Places (persisted to localStorage)
- Derived `assignedIds` (no duplicate state)

## Files
- `hooks/use-itinerary.ts`
- `components/DailyItinerarySidebar.tsx`
- `components/TripPlacesGrid.tsx`
- `types/itinerary.ts`
- `utils/itinerary.ts`
- `ItineraryPageShadcn.refactored.tsx`

## How to integrate

1. **Move files**
   Copy everything under this folder into your project matching the same subpaths:
   - `src/hooks/use-itinerary.ts`
   - `src/components/DailyItinerarySidebar.tsx`
   - `src/components/TripPlacesGrid.tsx`
   - `src/types/itinerary.ts`
   - `src/utils/itinerary.ts`
   - Replace your page with `ItineraryPageShadcn.refactored.tsx` (or merge).

2. **Types**
   Make sure `Poi` is exported at `@shared/schema`. The local `ItineraryPlace` extends it.

3. **InteractiveMap**
   `TripPlacesGrid` optionally renders `InteractiveMap` if `mapsApiKey` is passed and `showMap` is enabled.

4. **Behavior changes**
   - Assigned/unassigned is computed from the `days` state. No separate `assignedPlaceIds` state needed.
   - Drag from grid → drop on day = assign.
   - Drag from day → drop on grid = unassign.
   - Times sort the day list.

5. **Remove the old duplicate logic**
   Delete the old `assignedPlaceIds` state and localStorage wiring in your page. `useItinerary` handles it.

