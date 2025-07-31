A road trip planning web application called "RouteWise" with the following specifications:

Core Features

Build a full-stack web app that helps users plan road trips by finding amazing stops along their routes. The app should:

Route Planning System

Form with start city and destination city inputs
Add checkpoint/stop cities for multi-city trips
Generate Google Maps routes with embedded maps
"Plan My Route" button that opens Google Maps with the complete route
Smart Place Discovery

Show 80+ real places along the actual route path (not just in general areas)
Categories: restaurants, attractions, parks, scenic spots, markets, historic sites
Real business data with photos, ratings, hours, and contact info
Route-specific suggestions that change based on the actual path between cities
Intelligent Filtering

Category filters (All, Restaurants, Attractions, Parks, etc.)
City filters showing actual route cities (start, destination, checkpoints)
Real-time filtering without page reloads
Personal Collections

"Add to My Places" button on each location
Save complete routes with all discovered places
Home page showing saved routes and personal place collections
Quick access to previously planned trips
Place Details

Comprehensive modals with full place information
Photo galleries, ratings, reviews, hours, contact details
"View on Maps" integration for easy navigation
Distance and travel time from current location
Technical Architecture
Frontend:

React 18 with TypeScript
Vite for development and builds
Wouter for routing
TanStack Query for data fetching
