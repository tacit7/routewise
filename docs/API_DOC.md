RouteWise API Documentation

REST API for RouteWise trip planning application. Built with Phoenix 1.8.0 and PostgreSQL.

Base URL: http://localhost:4001/api

Authentication

JWT-based authentication with cookie storage. Tokens expire after 7 days.

Authentication Headers

- Cookies: auth_token (HTTP-only, secure)
- Manual: Authorization: Bearer <token>

Authentication Flow

Register

POST /api/auth/register
Content-Type: application/json

{
"username": "string", // 3-30 chars, alphanumeric + underscore
"password": "string", // 8+ chars, uppercase, lowercase, number
"email": "string", // Valid email format
"full_name": "string" // Optional
}

Response (201):
{
"success": true,
"message": "Account created successfully",
"user": {
"id": "uuid",
"username": "string",
"email": "string",
"full_name": "string",
"avatar": "string",
"provider": "local",
"created_at": "datetime"
},
"token": "jwt_token"
}

Login

POST /api/auth/login
Content-Type: application/json

{
"username": "string",
"password": "string"
}

Response (200):
{
"success": true,
"message": "Login successful",
"user": {
"id": "uuid",
"username": "string",
"email": "string",
"full_name": "string",
"avatar": "string",
"provider": "local|google",
"created_at": "datetime"
},
"token": "jwt_token"
}

Logout

POST /api/auth/logout

Response (200):
{
"success": true,
"message": "Logged out successfully"
}

Current User

GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
"success": true,
"user": {
"id": "uuid",
"username": "string",
"email": "string",
"full_name": "string",
"avatar": "string",
"provider": "local|google",
"created_at": "datetime"
}
}

Google OAuth

GET /api/auth/google
Redirects to Google OAuth flow, returns to /auth/google/callback.

---

Places API

Google Places integration with intelligent caching.

Search Places

GET /api/places/search?query=restaurant&location=40.7128,-74.0060&radius=5000

Parameters:

- query: Search term (required)
- location: Lat,lng coordinates (required)
- radius: Search radius in meters (default: 5000)
- type: Place type filter (optional)

Place Details

GET /api/places/details/:place_id

Response:
{
"id": "google_place_id",
"name": "Place Name",
"address": "Full address",
"location": {"lat": 40.7128, "lng": -74.0060},
"rating": 4.5,
"price_level": 2,
"photos": ["photo_url1", "photo_url2"],
"hours": {},
"reviews": []
}

Autocomplete

GET /api/places/autocomplete?input=pizza&location=40.7128,-74.0060

City Autocomplete

GET /api/places/city-autocomplete?input=New%20York

Nearby Places

GET /api/places/nearby?location=40.7128,-74.0060&type=restaurant&radius=1000

Place Photos

GET /api/places/photo?photo_reference=abc123&max_width=400

---

Routes API

Route calculation and optimization using Google Directions.

Calculate Route

POST /api/routes/calculate
Content-Type: application/json

{
"origin": {"lat": 40.7128, "lng": -74.0060},
"destination": {"lat": 40.7589, "lng": -73.9851},
"waypoints": [
{"lat": 40.7505, "lng": -73.9934}
],
"travel_mode": "driving|walking|transit|bicycling",
"optimize": true
}

Route from Wizard

POST /api/routes/wizard
Content-Type: application/json

{
"origin": "New York, NY",
"destination": "Boston, MA",
"interests": ["restaurants", "museums"],
"budget": "medium",
"travel_mode": "driving"
}

Optimize Waypoints

POST /api/routes/optimize
Content-Type: application/json

{
"origin": {"lat": 40.7128, "lng": -74.0060},
"destination": {"lat": 40.7589, "lng": -73.9851},
"waypoints": [
{"lat": 40.7505, "lng": -73.9934},
{"lat": 40.7614, "lng": -73.9776}
]
}

Route Alternatives

GET /api/routes/alternatives?origin=40.7128,-74.0060&destination=40.7589,-73.9851

Estimate Route

POST /api/routes/estimate
Content-Type: application/json

{
"origin": {"lat": 40.7128, "lng": -74.0060},
"destination": {"lat": 40.7589, "lng": -73.9851}
}

Estimate Costs

POST /api/routes/costs
Content-Type: application/json

{
"distance_km": 100,
"duration_hours": 2,
"travel_mode": "driving",
"fuel_price": 3.50
}

Trip Route (Authenticated)

GET /api/routes/trip/:trip_id
Authorization: Bearer <token>

---

Trips API

Trip management with public/private access control.

Public Trips

GET /api/trips/public?page=1&per_page=10

User Trips (Authenticated)

GET /api/trips
Authorization: Bearer <token>

Create Trip (Authenticated)

POST /api/trips
Authorization: Bearer <token>
Content-Type: application/json

{
"title": "Weekend in NYC",
"description": "Fun weekend trip",
"origin": "New York, NY",
"destination": "Brooklyn, NY",
"start_date": "2024-06-15",
"end_date": "2024-06-17",
"is_public": true,
"route_data": {},
"pois": []
}

Create from Wizard (Authenticated)

POST /api/trips/from_wizard
Authorization: Bearer <token>
Content-Type: application/json

{
"title": "Generated Trip",
"origin": "New York, NY",
"destination": "Boston, MA",
"interests": ["restaurants", "museums"],
"budget": "medium",
"duration_days": 3
}

Get Trip

GET /api/trips/:id

Update Trip (Authenticated)

PUT /api/trips/:id
Authorization: Bearer <token>
Content-Type: application/json

{
"title": "Updated Title",
"description": "Updated description",
"is_public": false
}

Delete Trip (Authenticated)

DELETE /api/trips/:id
Authorization: Bearer <token>

---

Interests API

User interest management for trip personalization.

Interest Categories

GET /api/interests/categories

Response:
{
"categories": [
{
"id": "uuid",
"name": "Restaurants",
"description": "Dining and food experiences",
"icon": "restaurant",
"google_types": ["restaurant", "food"]
}
]
}

User Interests (Authenticated)

GET /api/interests
Authorization: Bearer <token>

Create Interest (Authenticated)

POST /api/interests
Authorization: Bearer <token>
Content-Type: application/json

{
"category_id": "uuid",
"priority": 8
}

Update Interest (Authenticated)

PUT /api/interests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
"priority": 9
}

Delete Interest (Authenticated)

DELETE /api/interests/:id
Authorization: Bearer <token>

---

POI API

Points of interest management with Google Places integration.

List POIs

GET /api/pois?category=restaurants&location=40.7128,-74.0060&radius=5000

POI Categories

GET /api/pois/categories

Get POI

GET /api/pois/:id

Create POI (Authenticated)

POST /api/pois
Authorization: Bearer <token>
Content-Type: application/json

{
"name": "Custom POI",
"description": "My favorite spot",
"location": {"lat": 40.7128, "lng": -74.0060},
"category": "restaurant",
"google_place_id": "optional_place_id"
}

Update POI (Authenticated)

PUT /api/pois/:id
Authorization: Bearer <token>
Content-Type: application/json

{
"name": "Updated POI Name",
"description": "Updated description"
}

Delete POI (Authenticated)

DELETE /api/pois/:id
Authorization: Bearer <token>

---

System API

Health checks and monitoring.

Health Check

GET /api/health

Response:
{
"status": "ok",
"timestamp": "datetime",
"version": "1.0.0",
"database": "connected",
"cache": "operational"
}

Maps API Key

GET /api/maps-key

Dashboard

GET /api/dashboard
Authorization: Bearer <token> (optional)

---

Error Responses

Common Error Format

{
"success": false,
"error": {
"message": "Error description",
"code": "ERROR_CODE",
"details": {}
}
}

HTTP Status Codes

- 200 - Success
- 201 - Created
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (invalid/missing token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found
- 422 - Unprocessable Entity (validation errors)
- 500 - Internal Server Error

Validation Errors

{
"error": "Registration failed",
"errors": {
"username": ["can't be blank", "must be at least 3 characters"],
"email": ["has invalid format"]
}
}
