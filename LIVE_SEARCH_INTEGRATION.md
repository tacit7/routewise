# Live Search Integration Guide

Complete frontend integration guide for real-time place search with automatic TripAdvisor scraping.

## 🚀 Overview

When users search for places that aren't in our database, the backend automatically scrapes TripAdvisor in the background while providing real-time updates to the frontend.

**User Experience Flow**:
1. User searches "Austin, TX" → No results in database
2. Frontend shows "Gathering place data... 30-60 seconds"
3. Backend scrapes TripAdvisor automatically
4. Frontend receives real-time updates via WebSocket
5. Results appear when scraping completes

## 📡 Backend API Endpoints

### Primary Search Endpoint
```
GET /api/places/live-search?query=Austin, TX
```

**Response - Has Data**:
```json
{
  "places": [...],
  "scraping_status": "not_needed",
  "total": 25
}
```

**Response - No Data (Triggers Scraping)**:
```json
{
  "places": [],
  "scraping_status": "started",
  "message": "Gathering place data for Austin, TX... This may take 30-60 seconds.",
  "estimated_completion": "2024-01-15T10:30:45Z",
  "subscribe_to": "user:abc123"
}
```

### Status Check Endpoint
```
GET /api/places/scrape-status/austin-tx
```

### Polling Endpoint (Alternative to WebSocket)
```
GET /api/places/check-updates?location=Austin, TX&since=1642248645
```

## 🔌 WebSocket Implementation (Recommended)

### 1. Install Phoenix JavaScript Client

```bash
npm install phoenix
```

### 2. React Hook Implementation

```javascript
// hooks/useLiveSearch.js
import { useState, useEffect, useCallback } from 'react'
import { Socket } from 'phoenix'

export const useLiveSearch = () => {
  const [places, setPlaces] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState(null)
  const [scrapingMessage, setScrapingMessage] = useState('')
  const [socket, setSocket] = useState(null)

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = new Socket('/socket', {
      params: {} // Add auth token if needed
    })
    
    newSocket.connect()
    setSocket(newSocket)
    
    return () => newSocket.disconnect()
  }, [])

  // Create user-specific channel
  const createChannel = useCallback((userId) => {
    if (!socket) return null
    
    const channel = socket.channel(`scraping:${userId}`)
    
    channel.on('scraping_update', (payload) => {
      handleScrapingUpdate(payload)
    })
    
    channel.join()
    return channel
  }, [socket])

  const handleScrapingUpdate = (payload) => {
    switch (payload.type) {
      case 'scraping_started':
        setScrapingStatus('scraping')
        setScrapingMessage(payload.data.message || 'Gathering place data...')
        break
        
      case 'scraping_completed':
        setScrapingStatus('completed')
        setScrapingMessage('')
        // Refresh search results
        setTimeout(() => {
          // Re-run search to get new results
          window.dispatchEvent(new CustomEvent('refresh-search'))
        }, 1000)
        break
        
      case 'scraping_failed':
        setScrapingStatus('failed')
        setScrapingMessage('Unable to gather place data at this time')
        break
    }
  }

  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setPlaces([])
      return
    }

    setIsLoading(true)
    setScrapingStatus(null)
    
    try {
      const response = await fetch(`/api/places/live-search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.places.length > 0) {
        // Found existing results
        setPlaces(data.places)
        setScrapingStatus('not_needed')
      } else if (data.scraping_status === 'started') {
        // No results, scraping started
        setPlaces([])
        setScrapingStatus('scraping')
        setScrapingMessage(data.message)
        
        // Create channel for updates
        const userId = data.subscribe_to?.split(':')[1] || 'anonymous'
        createChannel(userId)
      } else {
        // No results and can't scrape
        setPlaces([])
        setScrapingStatus('no_results')
        setScrapingMessage(data.message || 'No places found')
      }
    } catch (error) {
      console.error('Search failed:', error)
      setScrapingStatus('error')
      setScrapingMessage('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    places,
    isLoading,
    scrapingStatus,
    scrapingMessage,
    searchPlaces,
    setPlaces // For manual updates
  }
}
```

### 3. Search Component

```jsx
// components/LivePlacesSearch.jsx
import React, { useState, useEffect } from 'react'
import { useLiveSearch } from '../hooks/useLiveSearch'
import ScrapingIndicator from './ScrapingIndicator'
import PlaceCard from './PlaceCard'

const LivePlacesSearch = () => {
  const [query, setQuery] = useState('')
  const { 
    places, 
    isLoading, 
    scrapingStatus, 
    scrapingMessage, 
    searchPlaces,
    setPlaces 
  } = useLiveSearch()

  // Listen for refresh events from WebSocket
  useEffect(() => {
    const handleRefresh = () => {
      if (query) {
        searchPlaces(query)
      }
    }

    window.addEventListener('refresh-search', handleRefresh)
    return () => window.removeEventListener('refresh-search', handleRefresh)
  }, [query, searchPlaces])

  const handleSearch = () => {
    searchPlaces(query)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="live-places-search">
      {/* Search Input */}
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search places (e.g., Austin, TX)"
            className="search-input"
            disabled={isLoading}
          />
          <button 
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="search-button"
          >
            {isLoading ? '🔄' : '🔍'} Search
          </button>
        </div>
      </div>

      {/* Scraping Status Indicator */}
      {scrapingStatus === 'scraping' && (
        <ScrapingIndicator message={scrapingMessage} />
      )}

      {/* Error States */}
      {scrapingStatus === 'failed' && (
        <div className="error-message">
          <h4>⚠️ Search Error</h4>
          <p>{scrapingMessage}</p>
          <button onClick={handleSearch} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {scrapingStatus === 'no_results' && (
        <div className="no-results">
          <h4>No places found</h4>
          <p>Try a more specific location (e.g., "Austin, TX" or "Miami, FL")</p>
        </div>
      )}

      {/* Results Grid */}
      {places.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h3>Found {places.length} places</h3>
            {scrapingStatus === 'completed' && (
              <div className="fresh-data-badge">
                ✨ Fresh data from TripAdvisor
              </div>
            )}
          </div>
          
          <div className="places-grid">
            {places.map((place) => (
              <PlaceCard 
                key={place.id} 
                place={place}
                isNew={scrapingStatus === 'completed'} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LivePlacesSearch
```

### 4. Scraping Indicator Component

```jsx
// components/ScrapingIndicator.jsx
import React, { useState, useEffect } from 'react'

const ScrapingIndicator = ({ message }) => {
  const [progress, setProgress] = useState(10)
  const [dots, setDots] = useState('.')

  // Animated progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95
        return prev + Math.random() * 5
      })
    }, 2000)

    return () => clearInterval(progressInterval)
  }, [])

  // Animated dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [])

  return (
    <div className="scraping-indicator">
      <div className="scraping-content">
        <div className="scraping-icon">
          <div className="spinner" />
        </div>
        
        <div className="scraping-text">
          <h4>🔍 Gathering place data{dots}</h4>
          <p>{message}</p>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
          
          <div className="scraping-details">
            <small>
              📡 Searching TripAdvisor • 🔄 Processing results • 💾 Saving to database
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScrapingIndicator
```

### 5. Place Card Component

```jsx
// components/PlaceCard.jsx
import React from 'react'

const PlaceCard = ({ place, isNew = false }) => {
  const renderStars = (rating) => {
    const stars = Math.round(rating)
    return '⭐'.repeat(stars)
  }

  return (
    <div className={`place-card ${isNew ? 'new-place' : ''}`}>
      {isNew && <div className="new-badge">New!</div>}
      
      <div className="place-header">
        <h3 className="place-name">{place.name}</h3>
        <div className="place-rating">
          {renderStars(place.rating)} {place.rating}
          <span className="review-count">
            ({place.user_ratings_total} reviews)
          </span>
        </div>
      </div>
      
      <p className="place-address">{place.address}</p>
      
      <div className="place-types">
        {place.place_types?.map((type) => (
          <span key={type} className="place-type-tag">
            {type.replace('_', ' ')}
          </span>
        ))}
      </div>
      
      <div className="place-footer">
        <div className="data-source">
          {place.data_source === 'tripadvisor_scraper' && (
            <span className="source-badge">📍 TripAdvisor</span>
          )}
        </div>
        
        {place.website && (
          <a 
            href={place.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="place-link"
          >
            View Details →
          </a>
        )}
      </div>
    </div>
  )
}

export default PlaceCard
```

## 📱 Polling Implementation (Alternative)

If WebSockets are too complex, use polling:

```javascript
// hooks/usePollingSearch.js
import { useState, useEffect, useRef } from 'react'

export const usePollingSearch = () => {
  const [places, setPlaces] = useState([])
  const [scrapingStatus, setScrapingStatus] = useState(null)
  const pollingRef = useRef(null)

  const searchPlaces = async (query) => {
    const response = await fetch(`/api/places/live-search?query=${query}`)
    const data = await response.json()
    
    if (data.scraping_status === 'started') {
      setScrapingStatus('scraping')
      startPolling(query)
    } else {
      setPlaces(data.places)
      setScrapingStatus('completed')
    }
  }

  const startPolling = (query) => {
    let lastCheck = Math.floor(Date.now() / 1000)
    
    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/places/check-updates?location=${query}&since=${lastCheck}`
        )
        const data = await response.json()
        
        if (data.new_places.length > 0) {
          setPlaces(data.new_places)
          setScrapingStatus('completed')
          clearInterval(pollingRef.current)
        }
        
        lastCheck = data.last_check
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(pollingRef.current)
        setScrapingStatus('failed')
      }
    }, 5000) // Poll every 5 seconds
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        setScrapingStatus('timeout')
      }
    }, 120000)
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  return { places, scrapingStatus, searchPlaces }
}
```

## 🎨 CSS Styles

```css
/* styles/LiveSearch.css */

.live-places-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Search Box */
.search-container {
  margin-bottom: 30px;
}

.search-box {
  display: flex;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-button {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
  background: #2563eb;
}

.search-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Scraping Indicator */
.scraping-indicator {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.scraping-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.scraping-icon {
  flex-shrink: 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0f2fe;
  border-top: 3px solid #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.scraping-text h4 {
  margin: 0 0 8px 0;
  color: #0c4a6e;
  font-size: 18px;
}

.scraping-text p {
  margin: 0 0 16px 0;
  color: #0369a1;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e0f2fe;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
  min-width: 40px;
}

.scraping-details {
  font-size: 12px;
  color: #0369a1;
  opacity: 0.8;
}

/* Results */
.results-container {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h3 {
  margin: 0;
  color: #1f2937;
}

.fresh-data-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Places Grid */
.places-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Place Cards */
.place-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.place-card:hover {
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.place-card.new-place {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-color: #22c55e;
  animation: newPlaceGlow 0.5s ease-in-out;
}

@keyframes newPlaceGlow {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.2); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.new-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #22c55e;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.place-header {
  margin-bottom: 12px;
}

.place-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
  line-height: 1.3;
}

.place-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.review-count {
  opacity: 0.7;
}

.place-address {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.place-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.place-type-tag {
  background: #f3f4f6;
  color: #4b5563;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.place-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.source-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.place-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.place-link:hover {
  color: #2563eb;
}

/* Error States */
.error-message, .no-results {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin: 20px 0;
}

.error-message h4, .no-results h4 {
  margin: 0 0 12px 0;
  color: #dc2626;
}

.error-message p, .no-results p {
  margin: 0 0 20px 0;
  color: #7f1d1d;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #b91c1c;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-box {
    flex-direction: column;
  }
  
  .scraping-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .results-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .places-grid {
    grid-template-columns: 1fr;
  }
  
  .place-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
```

## 🔧 Integration Steps

1. **Install Dependencies**:
   ```bash
   npm install phoenix
   ```

2. **Add Components**:
   - Copy the hook and components above
   - Import CSS styles
   - Add to your main search page

3. **Replace Existing Search**:
   ```jsx
   // Before
   <PlacesSearch />
   
   // After  
   <LivePlacesSearch />
   ```

4. **Configure WebSocket** (if needed):
   ```javascript
   // Add to your app config
   const socketUrl = process.env.REACT_APP_SOCKET_URL || '/socket'
   ```

## 🎯 User Experience

**Timeline**:
- **0s**: User searches "Austin, TX" 
- **0.1s**: Loading indicator appears
- **0.2s**: "Gathering place data... 30-60 seconds" message
- **0.5s**: Animated progress bar starts
- **30-45s**: WebSocket update: "Scraping completed"  
- **46s**: Results fade in with "Fresh data" badge

**Key UX Features**:
- ✅ **Instant feedback** - no waiting for scraping to start
- ✅ **Real-time updates** - users see progress
- ✅ **Smooth animations** - professional feel
- ✅ **Error handling** - graceful failure states
- ✅ **Mobile responsive** - works on all devices

Your users get an **amazing real-time experience** while TripAdvisor data is collected automatically in the background! 🚀