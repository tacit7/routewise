import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Toast types matching your existing toast system
interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

// Modal types for different modals in your app
interface Modal {
  id: string
  isOpen: boolean
  data?: any
}

interface LoadingState {
  [key: string]: boolean
}

interface UIState {
  // Global loading states
  loading: LoadingState
  
  // Toast notifications
  toasts: Toast[]
  
  // Modal management
  modals: Record<string, Modal>
  
  // Global UI settings
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  
  // Trip planning UI
  mapVisible: boolean
  routeDetailsExpanded: boolean
  filtersOpen: boolean
  
  // Search and filters
  searchQuery: string
  activeFilters: Record<string, any>
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: number
    read: boolean
  }>
  
  // App state
  isOnline: boolean
  lastSyncTime: number | null
  
  // Performance monitoring
  performanceMetrics: {
    pageLoadTime?: number
    apiResponseTimes: Record<string, number[]>
    errorCount: number
  }
}

const initialState: UIState = {
  loading: {},
  toasts: [],
  modals: {},
  theme: 'system',
  sidebarOpen: false,
  mobileMenuOpen: false,
  mapVisible: true,
  routeDetailsExpanded: false,
  filtersOpen: false,
  searchQuery: '',
  activeFilters: {},
  notifications: [],
  isOnline: true,
  lastSyncTime: null,
  performanceMetrics: {
    apiResponseTimes: {},
    errorCount: 0,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload
      state.loading[key] = loading
    },

    clearAllLoading: (state) => {
      state.loading = {}
    },

    // Toast management
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
      }
      state.toasts.push(toast)
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },

    clearAllToasts: (state) => {
      state.toasts = []
    },

    // Modal management
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      const { id, data } = action.payload
      state.modals[id] = { id, isOpen: true, data }
    },

    closeModal: (state, action: PayloadAction<string>) => {
      const id = action.payload
      if (state.modals[id]) {
        state.modals[id].isOpen = false
      }
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(id => {
        state.modals[id].isOpen = false
      })
    },

    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
    },

    // Layout management
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },

    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },

    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload
    },

    // Trip planning UI
    toggleMap: (state) => {
      state.mapVisible = !state.mapVisible
    },

    setMapVisible: (state, action: PayloadAction<boolean>) => {
      state.mapVisible = action.payload
    },

    toggleRouteDetails: (state) => {
      state.routeDetailsExpanded = !state.routeDetailsExpanded
    },

    setRouteDetailsExpanded: (state, action: PayloadAction<boolean>) => {
      state.routeDetailsExpanded = action.payload
    },

    toggleFilters: (state) => {
      state.filtersOpen = !state.filtersOpen
    },

    setFiltersOpen: (state, action: PayloadAction<boolean>) => {
      state.filtersOpen = action.payload
    },

    // Search and filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload
      state.activeFilters[key] = value
    },

    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload]
    },

    clearAllFilters: (state) => {
      state.activeFilters = {}
      state.searchQuery = ''
    },

    // Notifications
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'success' | 'warning' | 'error'
      message: string
    }>) => {
      const notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
        timestamp: Date.now(),
        read: false,
      }
      state.notifications.unshift(notification) // Add to beginning
      
      // Keep only last 50 notifications
      state.notifications = state.notifications.slice(0, 50)
    },

    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },

    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true)
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },

    clearAllNotifications: (state) => {
      state.notifications = []
    },

    // App state
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },

    updateLastSyncTime: (state) => {
      state.lastSyncTime = Date.now()
    },

    // Performance monitoring
    setPageLoadTime: (state, action: PayloadAction<number>) => {
      state.performanceMetrics.pageLoadTime = action.payload
    },

    addApiResponseTime: (state, action: PayloadAction<{ endpoint: string; time: number }>) => {
      const { endpoint, time } = action.payload
      if (!state.performanceMetrics.apiResponseTimes[endpoint]) {
        state.performanceMetrics.apiResponseTimes[endpoint] = []
      }
      
      // Keep only last 10 response times per endpoint
      const times = state.performanceMetrics.apiResponseTimes[endpoint]
      times.push(time)
      if (times.length > 10) {
        times.shift()
      }
    },

    incrementErrorCount: (state) => {
      state.performanceMetrics.errorCount += 1
    },

    resetErrorCount: (state) => {
      state.performanceMetrics.errorCount = 0
    },

    // Batch UI updates for better performance
    batchUIUpdates: (state, action: PayloadAction<{
      loading?: Record<string, boolean>
      theme?: 'light' | 'dark' | 'system'
      sidebarOpen?: boolean
      mapVisible?: boolean
      searchQuery?: string
    }>) => {
      const updates = action.payload
      
      if (updates.loading) {
        state.loading = { ...state.loading, ...updates.loading }
      }
      if (updates.theme) state.theme = updates.theme
      if (updates.sidebarOpen !== undefined) state.sidebarOpen = updates.sidebarOpen
      if (updates.mapVisible !== undefined) state.mapVisible = updates.mapVisible
      if (updates.searchQuery !== undefined) state.searchQuery = updates.searchQuery
    },
  },
})

export const {
  setLoading,
  clearAllLoading,
  addToast,
  removeToast,
  clearAllToasts,
  openModal,
  closeModal,
  closeAllModals,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleMap,
  setMapVisible,
  toggleRouteDetails,
  setRouteDetailsExpanded,
  toggleFilters,
  setFiltersOpen,
  setSearchQuery,
  setFilter,
  removeFilter,
  clearAllFilters,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearAllNotifications,
  setOnlineStatus,
  updateLastSyncTime,
  setPageLoadTime,
  addApiResponseTime,
  incrementErrorCount,
  resetErrorCount,
  batchUIUpdates,
} = uiSlice.actions

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui
export const selectLoading = (state: { ui: UIState }) => state.ui.loading
export const selectIsLoading = (key: string) => (state: { ui: UIState }) => state.ui.loading[key] || false
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts
export const selectModals = (state: { ui: UIState }) => state.ui.modals
export const selectModal = (id: string) => (state: { ui: UIState }) => state.ui.modals[id]
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen
export const selectMobileMenuOpen = (state: { ui: UIState }) => state.ui.mobileMenuOpen
export const selectMapVisible = (state: { ui: UIState }) => state.ui.mapVisible
export const selectRouteDetailsExpanded = (state: { ui: UIState }) => state.ui.routeDetailsExpanded
export const selectFiltersOpen = (state: { ui: UIState }) => state.ui.filtersOpen
export const selectSearchQuery = (state: { ui: UIState }) => state.ui.searchQuery
export const selectActiveFilters = (state: { ui: UIState }) => state.ui.activeFilters
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications
export const selectUnreadNotifications = (state: { ui: UIState }) => state.ui.notifications.filter(n => !n.read)
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline
export const selectLastSyncTime = (state: { ui: UIState }) => state.ui.lastSyncTime
export const selectPerformanceMetrics = (state: { ui: UIState }) => state.ui.performanceMetrics

export default uiSlice.reducer