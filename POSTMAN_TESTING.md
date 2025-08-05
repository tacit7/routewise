# RouteWise Phoenix Backend - Postman Testing Guide

This guide provides comprehensive Postman tests for the RouteWise Phoenix backend API.

## Files Included

- `postman-tests.json` - Complete test collection with all API endpoints
- `postman-environment.json` - Environment configuration with variables
- `POSTMAN_TESTING.md` - This guide

## Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** → **Upload Files**
3. Import both files:
   - `postman-tests.json` (Collection)
   - `postman-environment.json` (Environment)
4. Select the "RouteWise Phoenix Backend Environment" in the top-right dropdown

### 2. Prerequisites

- Phoenix backend running on `http://localhost:4001`
- PostgreSQL database configured and running
- Environment variables set (see backend CLAUDE.md)

### 3. Run Tests

**Option A: Run Full Collection**
1. Right-click on "RouteWise Phoenix Backend API" collection
2. Click "Run collection"
3. Click "Run RouteWise Phoenix Backend API"

**Option B: Run Individual Folders**
- Authentication tests
- Places API tests  
- Routes API tests
- Trips API tests (requires authentication)
- Interests API tests (requires authentication)
- Error case tests

## Test Coverage

### 🔐 Authentication Flow
- ✅ Health Check
- ✅ User Registration (with validation)
- ✅ User Login (JWT token retrieval)
- ✅ Get Current User (authenticated)

### 🌍 Places API
- ✅ Search Places (by query + location)
- ✅ Places Autocomplete
- ✅ Nearby Places (by type + location)
- ✅ Place Details (by ID)
- ✅ Place Photos

### 🛣️ Routes API
- ✅ Calculate Route (origin → destination)
- ✅ Calculate Route from Wizard Data
- ✅ Route Optimization (waypoint ordering)
- ✅ Route Estimates (distance/time)
- ✅ Route Cost Estimation

### 🧳 Trips API (Authenticated)
- ✅ Get Public Trips
- ✅ Create Trip from Wizard
- ✅ Get User's Trips
- ✅ Get Trip Details
- ✅ Update Trip
- ✅ Delete Trip

### ❤️ Interests API (Authenticated)
- ✅ Get Interest Categories
- ✅ Create User Interest
- ✅ Get User Interests
- ✅ Update User Interest
- ✅ Delete User Interest

### ❌ Error Handling
- ✅ Unauthorized Access (401)
- ✅ Validation Errors (422)
- ✅ Invalid Credentials (401)
- ✅ Not Found (404)

## Key Features

### 🔄 Automatic Token Management
- Registration automatically stores JWT token
- Login updates JWT token
- All authenticated requests use stored token

### 📊 Comprehensive Test Assertions
- Status code validation
- Response structure validation
- Data type checking
- Required field verification

### 🎲 Dynamic Test Data
- Random usernames and emails
- Prevents conflicts in test runs
- Realistic test scenarios

### 🔗 Request Chaining
- User registration → Login → Authenticated requests
- Trip creation → Trip updates → Trip deletion
- Interest creation → Interest management

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | Backend server URL | `http://localhost:4001` |
| `jwtToken` | JWT authentication token | Auto-populated |
| `userId` | Current user ID | Auto-populated |
| `tripId` | Created trip ID | Auto-populated |
| `interestId` | Created interest ID | Auto-populated |

## Sample API Calls

### Authentication
```bash
# Register
POST /api/auth/register
{
  "username": "testuser123",
  "email": "test@example.com", 
  "password": "SecurePass123!"
}

# Login
POST /api/auth/login
{
  "username": "testuser123",
  "password": "SecurePass123!"
}
```

### Trip Creation
```bash
POST /api/trips/from_wizard
Authorization: Bearer <jwt_token>
{
  "wizard_data": {
    "startCity": "San Francisco, CA",
    "endCity": "Los Angeles, CA",
    "tripType": "leisure",
    "transportation": "driving",
    "preferences": {
      "budget": "medium",
      "interests": ["food", "nature"]
    }
  },
  "calculate_route": true
}
```

## Troubleshooting

### Common Issues

**Phoenix Backend Not Running**
- Ensure: `mix phx.server` is running on port 4001
- Check: `http://localhost:4001/api/health`

**Database Connection Issues**
- Verify PostgreSQL is running
- Check database configuration in `config/dev.exs`
- Run: `mix ecto.setup` if needed

**Authentication Failures**
- Check `GUARDIAN_SECRET_KEY` environment variable
- Verify JWT token format in requests
- Run "Register User" test first to get valid token

**Google API Integration**
- Tests work without Google API keys (uses mock data)
- Real API calls require proper environment variables

### Expected Test Results

**✅ Successful Run:**
- Authentication: 4/4 tests pass
- Places API: 3/3 tests pass  
- Routes API: 3/3 tests pass
- Trips API: 5/5 tests pass
- Interests API: 3/3 tests pass
- Error Cases: 3/3 tests pass

**Total: 21/21 tests passing**

## Advanced Usage

### Custom Test Scenarios

1. **Load Testing**: Duplicate collection and run multiple times
2. **Environment Testing**: Create dev/staging/prod environments  
3. **API Monitoring**: Set up scheduled collection runs
4. **Integration Testing**: Chain with frontend tests

### Extending Tests

Add new tests by:
1. Copying existing request structure
2. Updating endpoint and payload
3. Adding appropriate test assertions
4. Managing environment variables

## Integration with CI/CD

Use Newman (Postman CLI) for automated testing:

```bash
# Install Newman
npm install -g newman

# Run tests
newman run postman-tests.json \
  -e postman-environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

This comprehensive test suite validates the entire Phoenix backend API and ensures frontend integration compatibility.