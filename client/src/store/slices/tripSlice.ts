import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authenticatedApiCall, API_CONFIG } from '@/lib/api-config'

// Types for trip management
interface TripLocation {
  main_text: string
  place_id?: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface Trip {
  id: string
  user_id: string
  start_city: string
  end_city: string
  route_data: any
  created_at: string
  updated_at: string
}

interface TripStats {
  total_trips: number
  total_distance: number
  total_duration: number
  favorite_destinations: string[]
}

interface RouteRequest {
  startLocation: TripLocation
  endLocation: TripLocation
  timestamp: number
}

interface TripState {
  // User's saved trips
  userTrips: Trip[]
  
  // Suggested trips
  suggestedTrips: Trip[]
  
  // Current trip planning
  currentRoute: RouteRequest | null
  routeResults: any | null
  
  // Trip stats
  stats: TripStats | null
  
  // Loading states
  isLoadingTrips: boolean
  isLoadingSuggestions: boolean
  isLoadingStats: boolean
  
  // Error states
  tripsError: string | null
  suggestionsError: string | null
  statsError: string | null
  
  // Trip comparison
  compareTrips: Trip[]
  
  // Recently viewed
  recentlyViewed: Trip[]
}

const initialState: TripState = {
  userTrips: [],
  suggestedTrips: [],
  currentRoute: null,
  routeResults: null,
  stats: null,
  isLoadingTrips: false,
  isLoadingSuggestions: false,
  isLoadingStats: false,
  tripsError: null,
  suggestionsError: null,
  statsError: null,
  compareTrips: [],
  recentlyViewed: [],
}

// Async thunks
export const fetchUserTrips = createAsyncThunk(
  'trips/fetchUserTrips',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ trips: Trip[] }>('/api/trips')
      return data.trips
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch trips')
    }
  }
)

export const fetchSuggestedTrips = createAsyncThunk(
  'trips/fetchSuggestedTrips',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ suggested_trips: Trip[] }>('/api/trips/suggested')
      return data.suggested_trips
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch suggested trips')
    }
  }
)

export const fetchTripStats = createAsyncThunk(
  'trips/fetchTripStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ stats: TripStats }>('/api/trips/stats')
      return data.stats
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch trip stats')
    }
  }
)

export const saveTrip = createAsyncThunk(
  'trips/saveTrip',
  async (tripData: { route_data: any; start_city: string; end_city: string }, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ trip: Trip }>('/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      })
      return data.trip
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save trip')
    }
  }
)

export const deleteTrip = createAsyncThunk(
  'trips/deleteTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      await authenticatedApiCall(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })
      return tripId
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete trip')
    }
  }
)

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ tripId, updates }: { tripId: string; updates: Partial<Trip> }, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ trip: Trip }>(`/api/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      return data.trip
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update trip')
    }
  }
)

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    // Route planning
    setCurrentRoute: (state, action: PayloadAction<RouteRequest>) => {
      state.currentRoute = action.payload
    },

    setRouteResults: (state, action: PayloadAction<any>) => {
      state.routeResults = action.payload
    },

    clearCurrentRoute: (state) => {
      state.currentRoute = null
      state.routeResults = null
    },

    // Trip comparison
    addToCompare: (state, action: PayloadAction<Trip>) => {
      if (state.compareTrips.length < 3 && !state.compareTrips.find(t => t.id === action.payload.id)) {
        state.compareTrips.push(action.payload)
      }
    },

    removeFromCompare: (state, action: PayloadAction<string>) => {
      state.compareTrips = state.compareTrips.filter(t => t.id !== action.payload)
    },

    clearCompareTrips: (state) => {
      state.compareTrips = []
    },

    // Recently viewed
    addToRecentlyViewed: (state, action: PayloadAction<Trip>) => {
      const trip = action.payload
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(t => t.id !== trip.id)
      // Add to beginning
      state.recentlyViewed.unshift(trip)
      // Keep only last 10
      state.recentlyViewed = state.recentlyViewed.slice(0, 10)
    },

    clearRecentlyViewed: (state) => {
      state.recentlyViewed = []
    },

    // Error handling
    clearTripsError: (state) => {
      state.tripsError = null
    },

    clearSuggestionsError: (state) => {
      state.suggestionsError = null
    },

    clearStatsError: (state) => {
      state.statsError = null
    },

    clearAllErrors: (state) => {
      state.tripsError = null
      state.suggestionsError = null
      state.statsError = null
    },

    // Optimistic updates
    optimisticallyAddTrip: (state, action: PayloadAction<Trip>) => {
      state.userTrips.unshift(action.payload)
    },

    optimisticallyRemoveTrip: (state, action: PayloadAction<string>) => {
      state.userTrips = state.userTrips.filter(t => t.id !== action.payload)
    },

    optimisticallyUpdateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.userTrips.findIndex(t => t.id === action.payload.id)
      if (index >= 0) {
        state.userTrips[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Trips
      .addCase(fetchUserTrips.pending, (state) => {
        state.isLoadingTrips = true
        state.tripsError = null
      })
      .addCase(fetchUserTrips.fulfilled, (state, action) => {
        state.userTrips = action.payload
        state.isLoadingTrips = false
        state.tripsError = null
      })
      .addCase(fetchUserTrips.rejected, (state, action) => {
        state.isLoadingTrips = false
        state.tripsError = action.payload as string
      })
      
      // Fetch Suggested Trips
      .addCase(fetchSuggestedTrips.pending, (state) => {
        state.isLoadingSuggestions = true
        state.suggestionsError = null
      })
      .addCase(fetchSuggestedTrips.fulfilled, (state, action) => {
        state.suggestedTrips = action.payload
        state.isLoadingSuggestions = false
        state.suggestionsError = null
      })
      .addCase(fetchSuggestedTrips.rejected, (state, action) => {
        state.isLoadingSuggestions = false
        state.suggestionsError = action.payload as string
      })
      
      // Fetch Trip Stats
      .addCase(fetchTripStats.pending, (state) => {
        state.isLoadingStats = true
        state.statsError = null
      })
      .addCase(fetchTripStats.fulfilled, (state, action) => {
        state.stats = action.payload
        state.isLoadingStats = false
        state.statsError = null
      })
      .addCase(fetchTripStats.rejected, (state, action) => {
        state.isLoadingStats = false
        state.statsError = action.payload as string
      })
      
      // Save Trip
      .addCase(saveTrip.fulfilled, (state, action) => {
        // Add to user trips if not already exists
        if (!state.userTrips.find(t => t.id === action.payload.id)) {
          state.userTrips.unshift(action.payload)
        }
      })
      
      // Delete Trip
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.userTrips = state.userTrips.filter(t => t.id !== action.payload)
        state.compareTrips = state.compareTrips.filter(t => t.id !== action.payload)
        state.recentlyViewed = state.recentlyViewed.filter(t => t.id !== action.payload)
      })
      
      // Update Trip
      .addCase(updateTrip.fulfilled, (state, action) => {
        const index = state.userTrips.findIndex(t => t.id === action.payload.id)
        if (index >= 0) {
          state.userTrips[index] = action.payload
        }
      })
  },
})

export const {
  setCurrentRoute,
  setRouteResults,
  clearCurrentRoute,
  addToCompare,
  removeFromCompare,
  clearCompareTrips,
  addToRecentlyViewed,
  clearRecentlyViewed,
  clearTripsError,
  clearSuggestionsError,
  clearStatsError,
  clearAllErrors,
  optimisticallyAddTrip,
  optimisticallyRemoveTrip,
  optimisticallyUpdateTrip,
} = tripSlice.actions

// Selectors
export const selectTrips = (state: { trips: TripState }) => state.trips
export const selectUserTrips = (state: { trips: TripState }) => state.trips.userTrips
export const selectSuggestedTrips = (state: { trips: TripState }) => state.trips.suggestedTrips
export const selectCurrentRoute = (state: { trips: TripState }) => state.trips.currentRoute
export const selectRouteResults = (state: { trips: TripState }) => state.trips.routeResults
export const selectTripStats = (state: { trips: TripState }) => state.trips.stats
export const selectCompareTrips = (state: { trips: TripState }) => state.trips.compareTrips
export const selectRecentlyViewed = (state: { trips: TripState }) => state.trips.recentlyViewed
export const selectTripsLoading = (state: { trips: TripState }) => ({
  trips: state.trips.isLoadingTrips,
  suggestions: state.trips.isLoadingSuggestions,
  stats: state.trips.isLoadingStats,
})
export const selectTripsErrors = (state: { trips: TripState }) => ({
  trips: state.trips.tripsError,
  suggestions: state.trips.suggestionsError,
  stats: state.trips.statsError,
})

export default tripSlice.reducer