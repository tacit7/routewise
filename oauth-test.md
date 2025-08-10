# OAuth Integration Test

## Test Checklist

After restarting the dev server with the `VITE_GOOGLE_CLIENT_ID` environment variable:

### ✅ Basic Setup
- [ ] Navigate to `http://localhost:3001/login`
- [ ] No console errors about missing client_id
- [ ] Google button renders properly

### ✅ Authentication Flow
- [ ] Click "Continue with Google" button
- [ ] Google One Tap prompt appears OR Google popup opens
- [ ] Sign in with Google account
- [ ] Redirect to dashboard after successful auth
- [ ] User info displayed correctly in mobile menu

### ✅ Token Management
- [ ] Check browser console - no token errors
- [ ] Check localStorage - Google user and token stored
- [ ] Navigate between pages - auth state persists
- [ ] Refresh page - user remains logged in

### ✅ API Integration
- [ ] API calls include Google ID token in Authorization header
- [ ] Backend receives and validates Google tokens properly
- [ ] User data syncs correctly

### 🔧 Troubleshooting
If issues persist:
1. Check Google Cloud Console OAuth configuration
2. Verify authorized JavaScript origins include `http://localhost:3001`
3. Ensure client ID is for "Web application" type
4. Check network tab for API call headers

## Expected Behavior
- Clean OAuth flow with Google Identity Services
- Automatic token management and validation
- Seamless authentication across desktop and mobile
- Proper logout and session cleanup