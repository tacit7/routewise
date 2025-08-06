import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiCall, authenticatedApiCall, TokenManager, API_CONFIG } from '@/lib/api-config'

// Types matching your existing AuthContext
interface User {
  id: string
  username: string
  email: string
  full_name?: string
  avatar?: string
  provider: string
  created_at: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface LoginCredentials {
  username: string
  password: string
}

interface RegisterCredentials {
  username: string
  password: string
  email: string
  fullName?: string
}

interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true, // Start with loading true to check existing auth
  isAuthenticated: false,
  error: null,
}

// Async thunks for auth operations
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authenticatedApiCall<{ success: boolean; user: User }>(API_CONFIG.ENDPOINTS.ME)
      if (data.success && data.user) {
        return data.user
      }
      throw new Error('Authentication check failed')
    } catch (error) {
      // 401 is expected when not logged in
      if (error instanceof Error && error.message.includes('401')) {
        TokenManager.removeToken()
        return rejectWithValue('Not authenticated')
      }
      return rejectWithValue('Auth check failed')
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await apiCall<AuthResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      )

      if (data.success && data.user) {
        if (data.token) {
          TokenManager.setToken(data.token)
        }
        return { user: data.user, message: data.message }
      }

      return rejectWithValue(data.message || 'Login failed')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const requestBody: any = { 
        username: credentials.username, 
        password: credentials.password, 
        email: credentials.email 
      }
      if (credentials.fullName) {
        requestBody.full_name = credentials.fullName
      }

      const data = await apiCall<AuthResponse>(
        API_CONFIG.ENDPOINTS.REGISTER,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      if (data.success && data.user) {
        if (data.token) {
          TokenManager.setToken(data.token)
        }
        return { user: data.user, message: data.message }
      }

      return rejectWithValue(data.message || 'Registration failed')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiCall<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.LOGOUT, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local state and token
      TokenManager.removeToken()
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
      state.error = null
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
        state.error = null
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null // Don't show error for failed auth check
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
        state.isLoading = false
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
        state.isLoading = false
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear local state
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
  },
})

export const { clearError, setUser, clearAuth } = authSlice.actions

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

export default authSlice.reducer