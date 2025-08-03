import { TripWizardData, TripWizardDraft } from "@/types/trip-wizard";

const STORAGE_KEY = 'routewise-trip-wizard-draft';
const DRAFT_EXPIRY_HOURS = 24;

export const generateDraftId = (): string => {
  return `trip-wizard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const saveDraft = (
  data: TripWizardData,
  currentStep: number,
  completedSteps: number[],
  draftId?: string
): string => {
  const id = draftId || generateDraftId();
  const expiresAt = Date.now() + (DRAFT_EXPIRY_HOURS * 60 * 60 * 1000);
  
  const draft: TripWizardDraft = {
    id,
    currentStep,
    completedSteps,
    lastUpdated: Date.now(),
    data,
    expiresAt,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return id;
  } catch (error) {
    console.warn('Failed to save trip wizard draft:', error);
    return id;
  }
};

export const loadDraft = (): TripWizardDraft | null => {
  try {
    const draftStr = localStorage.getItem(STORAGE_KEY);
    if (!draftStr) return null;

    const draft: TripWizardDraft = JSON.parse(draftStr);
    
    // Check if draft is expired
    if (Date.now() > draft.expiresAt) {
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.warn('Failed to load trip wizard draft:', error);
    clearDraft();
    return null;
  }
};

export const clearDraft = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear trip wizard draft:', error);
  }
};

export const isDraftRecent = (draft: TripWizardDraft, minutesThreshold = 30): boolean => {
  const minutesAgo = (Date.now() - draft.lastUpdated) / (1000 * 60);
  return minutesAgo <= minutesThreshold;
};

export const hasDraftProgress = (draft: TripWizardDraft): boolean => {
  return draft.currentStep > 1 || draft.completedSteps.length > 0;
};

export const getDraftAge = (draft: TripWizardDraft): string => {
  const minutesAgo = Math.floor((Date.now() - draft.lastUpdated) / (1000 * 60));
  
  if (minutesAgo < 1) return "just now";
  if (minutesAgo === 1) return "1 minute ago";
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo === 1) return "1 hour ago";
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;
  
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
};

// Clean up expired drafts on app start
export const cleanupExpiredDrafts = (): void => {
  const draft = loadDraft();
  if (!draft) return;
  
  if (Date.now() > draft.expiresAt) {
    clearDraft();
  }
};