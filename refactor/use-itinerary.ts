import { useEffect, useMemo, useReducer } from "react";
import type { DayData, ItineraryPlace } from "@/types/itinerary";
import { getIdentifier, serializeDays, deserializeDays } from "@/utils/itinerary";

type State = {
  days: DayData[];
  activeDay: number;
  tripTitle: string;
};

type Action =
  | { type: "INIT"; payload: State }
  | { type: "SET_ACTIVE_DAY"; index: number }
  | { type: "SET_TITLE"; title: string }
  | { type: "ADD_DAY" }
  | { type: "ASSIGN_PLACE"; place: ItineraryPlace; dayIndex: number }
  | { type: "REMOVE_PLACE"; placeId: string | number }
  | { type: "UPDATE_PLACE"; placeId: string | number; updates: Partial<ItineraryPlace> };

const STORAGE_KEY = "itineraryData";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "SET_ACTIVE_DAY":
      return { ...state, activeDay: action.index };
    case "SET_TITLE":
      return { ...state, tripTitle: action.title };
    case "ADD_DAY": {
      const nextDate = new Date(state.days[state.days.length - 1].date);
      nextDate.setDate(nextDate.getDate() + 1);
      const newDay: DayData = { date: nextDate, title: "", places: [] };
      return { ...state, days: [...state.days, newDay], activeDay: state.days.length };
    }
    case "ASSIGN_PLACE": {
      const { place, dayIndex } = action;
      const placeId = getIdentifier(place);
      const updated = { ...place, dayIndex, scheduledTime: place.scheduledTime ?? "09:00", dayOrder: state.days[dayIndex].places.length };
      const days = state.days.map((d, i) => i === dayIndex ? { ...d, places: [...d.places, updated] } : d);
      return { ...state, days };
    }
    case "REMOVE_PLACE": {
      const pid = action.placeId;
      const days = state.days.map((d) => ({ ...d, places: d.places.filter(p => getIdentifier(p) !== pid) }));
      return { ...state, days };
    }
    case "UPDATE_PLACE": {
      const { placeId, updates } = action;
      const days = state.days.map((d) => ({
        ...d,
        places: d.places.map((p) => (getIdentifier(p) === placeId ? { ...p, ...updates } : p)),
      }));
      return { ...state, days };
    }
    default:
      return state;
  }
}

export function useItinerary(initialStartDate: Date = new Date()) {
  const [state, dispatch] = useReducer(reducer, { days: [{ date: initialStartDate, places: [] }], activeDay: 0, tripTitle: "" });

  // init from storage once
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const payload: State = {
          days: deserializeDays(parsed.days ?? []),
          activeDay: parsed.activeDay ?? 0,
          tripTitle: parsed.tripTitle ?? "",
        };
        dispatch({ type: "INIT", payload });
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    const data = { days: serializeDays(state.days), activeDay: state.activeDay, tripTitle: state.tripTitle };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [state]);

  const assignedIds = useMemo(() => {
    const s = new Set<string | number>();
    state.days.forEach(d => d.places.forEach(p => s.add(getIdentifier(p))));
    return s;
  }, [state.days]);

  return {
    state,
    assignedIds,
    setActiveDay: (index: number) => dispatch({ type: "SET_ACTIVE_DAY", index }),
    setTitle: (title: string) => dispatch({ type: "SET_TITLE", title }),
    addDay: () => dispatch({ type: "ADD_DAY" }),
    assignPlace: (place: ItineraryPlace, dayIndex: number) => dispatch({ type: "ASSIGN_PLACE", place, dayIndex }),
    removePlace: (placeId: string | number) => dispatch({ type: "REMOVE_PLACE", placeId }),
    updatePlace: (placeId: string | number, updates: Partial<ItineraryPlace>) => dispatch({ type: "UPDATE_PLACE", placeId, updates }),
  };
}
