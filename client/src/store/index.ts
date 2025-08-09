import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Slices
import authSlice from './slices/authSlice'
import tripSlice from './slices/tripSlice'
import wizardSlice from './slices/wizardSlice'
import uiSlice from './slices/uiSlice'

const rootReducer = combineReducers({
  auth: authSlice,
  trips: tripSlice,
  wizard: wizardSlice,
  ui: uiSlice,
})

const persistConfig = {
  key: 'inspector-owllie',
  storage,
  // Only persist specific slices to avoid bloating localStorage
  whitelist: ['auth', 'wizard'] // Don't persist UI state or temporary data
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch