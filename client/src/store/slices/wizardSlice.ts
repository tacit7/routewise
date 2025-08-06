import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { 
  TripWizardData, 
  TripWizardDraft, 
  PlaceSuggestion, 
  BudgetRange, 
  SpecialNeedsData, 
  AccessibilityNeeds,
  TripType,
  TransportationOption,
  LodgingOption
} from '@/types/trip-wizard'

interface WizardState {
  // Current wizard session
  currentDraft: TripWizardDraft | null
  
  // UI state
  currentStep: number
  completedSteps: number[]
  totalSteps: number
  
  // Form validation
  stepErrors: Record<number, string[]>
  
  // Draft management
  savedDrafts: TripWizardDraft[]
  autoSaveEnabled: boolean
  lastSaveTime: number | null
}

// Default wizard data
const createDefaultWizardData = (): TripWizardData => ({
  tripType: 'road-trip',
  startLocation: null,
  endLocation: null,
  stops: [],
  flexibleLocations: false,
  startDate: null,
  endDate: null,
  flexibleDates: false,
  transportation: [],
  lodging: [],
  budgetRange: { min: 500, max: 2000 },
  intentions: [],
  specialNeeds: {
    pets: false,
    accessibility: false,
    kids: false,
    notes: '',
  },
  accessibility: {
    screenReader: false,
    motorImpairment: false,
    visualImpairment: false,
    cognitiveSupport: false,
    other: '',
  },
})

const initialState: WizardState = {
  currentDraft: null,
  currentStep: 0,
  completedSteps: [],
  totalSteps: 8, // Adjust based on your wizard steps
  stepErrors: {},
  savedDrafts: [],
  autoSaveEnabled: true,
  lastSaveTime: null,
}

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    // Draft management
    startNewWizard: (state, action: PayloadAction<Partial<TripWizardData> | undefined>) => {
      const now = Date.now()
      const draftId = `draft-${now}`
      
      state.currentDraft = {
        id: draftId,
        currentStep: 0,
        completedSteps: [],
        lastUpdated: now,
        data: { ...createDefaultWizardData(), ...action.payload },
        expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
      }
      
      state.currentStep = 0
      state.completedSteps = []
      state.stepErrors = {}
    },

    loadDraft: (state, action: PayloadAction<string>) => {
      const draft = state.savedDrafts.find(d => d.id === action.payload)
      if (draft && draft.expiresAt > Date.now()) {
        state.currentDraft = draft
        state.currentStep = draft.currentStep
        state.completedSteps = draft.completedSteps
      }
    },

    saveDraft: (state) => {
      if (!state.currentDraft) return
      
      const now = Date.now()
      state.currentDraft.lastUpdated = now
      state.lastSaveTime = now
      
      // Update or add to saved drafts
      const existingIndex = state.savedDrafts.findIndex(d => d.id === state.currentDraft!.id)
      if (existingIndex >= 0) {
        state.savedDrafts[existingIndex] = state.currentDraft
      } else {
        state.savedDrafts.push(state.currentDraft)
      }
    },

    deleteDraft: (state, action: PayloadAction<string>) => {
      state.savedDrafts = state.savedDrafts.filter(d => d.id !== action.payload)
      if (state.currentDraft?.id === action.payload) {
        state.currentDraft = null
        state.currentStep = 0
        state.completedSteps = []
      }
    },

    clearExpiredDrafts: (state) => {
      const now = Date.now()
      state.savedDrafts = state.savedDrafts.filter(d => d.expiresAt > now)
    },

    // Navigation
    goToStep: (state, action: PayloadAction<number>) => {
      const step = action.payload
      if (step >= 0 && step < state.totalSteps) {
        state.currentStep = step
        if (state.currentDraft) {
          state.currentDraft.currentStep = step
        }
      }
    },

    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        // Mark current step as completed
        if (!state.completedSteps.includes(state.currentStep)) {
          state.completedSteps.push(state.currentStep)
        }
        
        state.currentStep += 1
        
        if (state.currentDraft) {
          state.currentDraft.currentStep = state.currentStep
          state.currentDraft.completedSteps = state.completedSteps
        }
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
        if (state.currentDraft) {
          state.currentDraft.currentStep = state.currentStep
        }
      }
    },

    markStepComplete: (state, action: PayloadAction<number>) => {
      const step = action.payload
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step)
        if (state.currentDraft) {
          state.currentDraft.completedSteps = state.completedSteps
        }
      }
    },

    // Form data updates
    updateTripType: (state, action: PayloadAction<TripType>) => {
      if (state.currentDraft) {
        state.currentDraft.data.tripType = action.payload
      }
    },

    updateLocations: (state, action: PayloadAction<{
      startLocation?: PlaceSuggestion | null
      endLocation?: PlaceSuggestion | null
      stops?: PlaceSuggestion[]
      flexibleLocations?: boolean
    }>) => {
      if (state.currentDraft) {
        const { startLocation, endLocation, stops, flexibleLocations } = action.payload
        
        if (startLocation !== undefined) state.currentDraft.data.startLocation = startLocation
        if (endLocation !== undefined) state.currentDraft.data.endLocation = endLocation
        if (stops !== undefined) state.currentDraft.data.stops = stops
        if (flexibleLocations !== undefined) state.currentDraft.data.flexibleLocations = flexibleLocations
      }
    },

    updateDates: (state, action: PayloadAction<{
      startDate?: Date | null
      endDate?: Date | null
      flexibleDates?: boolean
    }>) => {
      if (state.currentDraft) {
        const { startDate, endDate, flexibleDates } = action.payload
        
        if (startDate !== undefined) state.currentDraft.data.startDate = startDate
        if (endDate !== undefined) state.currentDraft.data.endDate = endDate
        if (flexibleDates !== undefined) state.currentDraft.data.flexibleDates = flexibleDates
      }
    },

    updateTransportation: (state, action: PayloadAction<TransportationOption[]>) => {
      if (state.currentDraft) {
        state.currentDraft.data.transportation = action.payload
      }
    },

    updateLodging: (state, action: PayloadAction<LodgingOption[]>) => {
      if (state.currentDraft) {
        state.currentDraft.data.lodging = action.payload
      }
    },

    updateBudget: (state, action: PayloadAction<BudgetRange>) => {
      if (state.currentDraft) {
        state.currentDraft.data.budgetRange = action.payload
      }
    },

    updateIntentions: (state, action: PayloadAction<string[]>) => {
      if (state.currentDraft) {
        state.currentDraft.data.intentions = action.payload
      }
    },

    updateSpecialNeeds: (state, action: PayloadAction<SpecialNeedsData>) => {
      if (state.currentDraft) {
        state.currentDraft.data.specialNeeds = action.payload
      }
    },

    updateAccessibility: (state, action: PayloadAction<AccessibilityNeeds>) => {
      if (state.currentDraft) {
        state.currentDraft.data.accessibility = action.payload
      }
    },

    // Validation
    setStepErrors: (state, action: PayloadAction<{ step: number; errors: string[] }>) => {
      const { step, errors } = action.payload
      if (errors.length > 0) {
        state.stepErrors[step] = errors
      } else {
        delete state.stepErrors[step]
      }
    },

    clearStepErrors: (state, action: PayloadAction<number>) => {
      delete state.stepErrors[action.payload]
    },

    clearAllErrors: (state) => {
      state.stepErrors = {}
    },

    // Settings
    toggleAutoSave: (state) => {
      state.autoSaveEnabled = !state.autoSaveEnabled
    },

    // Wizard completion/reset
    resetWizard: (state) => {
      state.currentDraft = null
      state.currentStep = 0
      state.completedSteps = []
      state.stepErrors = {}
    },
  },
})

export const {
  startNewWizard,
  loadDraft,
  saveDraft,
  deleteDraft,
  clearExpiredDrafts,
  goToStep,
  nextStep,
  previousStep,
  markStepComplete,
  updateTripType,
  updateLocations,
  updateDates,
  updateTransportation,
  updateLodging,
  updateBudget,
  updateIntentions,
  updateSpecialNeeds,
  updateAccessibility,
  setStepErrors,
  clearStepErrors,
  clearAllErrors,
  toggleAutoSave,
  resetWizard,
} = wizardSlice.actions

// Selectors
export const selectWizard = (state: { wizard: WizardState }) => state.wizard
export const selectCurrentDraft = (state: { wizard: WizardState }) => state.wizard.currentDraft
export const selectWizardData = (state: { wizard: WizardState }) => state.wizard.currentDraft?.data
export const selectCurrentStep = (state: { wizard: WizardState }) => state.wizard.currentStep
export const selectCompletedSteps = (state: { wizard: WizardState }) => state.wizard.completedSteps
export const selectStepErrors = (state: { wizard: WizardState }) => state.wizard.stepErrors
export const selectSavedDrafts = (state: { wizard: WizardState }) => state.wizard.savedDrafts
export const selectAutoSaveEnabled = (state: { wizard: WizardState }) => state.wizard.autoSaveEnabled

export default wizardSlice.reducer