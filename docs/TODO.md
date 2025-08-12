# RouteWise TODO List

## 🚨 HIGH PRIORITY - IMPORTANT

### ⭐ Zoom-Based POI Quality Filtering System
**PRIORITY**: CRITICAL - Replace clustering with intelligent POI filtering  
**STATUS**: Ready for Implementation  
**OWNER**: Development Team  
**DUE**: Next Sprint  

**Problem**: Current POI clustering is visually unappealing and doesn't match user expectations. Clusters create visual clutter and poor UX.

**Solution**: Implement zoom-based quality filtering where different zoom levels show different quality tiers of POIs:

#### Implementation Details:
- **Zoom 1-8** (Country/State): Only 5-star landmarks (max 10 POIs)
- **Zoom 9-12** (City): 4.5+ star attractions (max 25 POIs) 
- **Zoom 13-15** (Neighborhood): 4+ star places (max 50 POIs)
- **Zoom 16-18** (Street): Everything 3+ stars (max 100 POIs)

#### Technical Requirements:
1. **POI Quality Scoring Algorithm**:
   - Rating weight (40%): 4.8+ = 40pts, 4.5+ = 35pts, 4.0+ = 25pts
   - Review count weight (30%): 1000+ = 30pts, 500+ = 25pts, 100+ = 20pts
   - Category importance weight (30%): landmarks = 30pts, restaurants = 25pts

2. **Smart Filtering Hook**: `useZoomBasedPOIs(pois, zoom)`
3. **Performance Optimization**: Limit POIs per zoom level
4. **Fallback Handling**: When no high-quality POIs exist

#### Files to Modify:
- `client/src/hooks/useZoomBasedPOIs.ts` (new)
- `client/src/components/interactive-map.tsx` (replace clustering)
- `client/src/components/places-view.tsx` (update POI handling)

#### Benefits:
✅ Clean visual design at every zoom level  
✅ Better performance (fewer DOM elements)  
✅ Intuitive user experience (zoom in = see more)  
✅ Quality-focused recommendations  
✅ No complex cluster state management  

#### Success Metrics:
- No visual cluster bubbles
- Smooth zoom performance 
- Quality POIs surfaced at appropriate zoom levels
- User can discover more by zooming in

---

## 🔧 MEDIUM PRIORITY

### Map Performance Optimizations
**STATUS**: In Progress  
- [x] Fix zoom fighting issues with debounced events
- [x] Optimize TanStack Query cache settings  
- [ ] Implement virtual scrolling for POI sidebar
- [ ] Add POI image lazy loading

### Route Visualization  
**STATUS**: Pending  
- [ ] Add driving directions polyline
- [ ] Integrate Google Directions API
- [ ] Show route duration and distance

---

## 🎨 LOW PRIORITY

### UI/UX Improvements
**STATUS**: Backlog  
- [ ] Mobile-responsive map controls
- [ ] Enhanced loading states
- [ ] POI category filtering
- [ ] Save favorite locations

### Documentation
**STATUS**: Ongoing  
- [x] Document refactor branch merge issues
- [ ] Update API integration docs
- [ ] Add troubleshooting guides