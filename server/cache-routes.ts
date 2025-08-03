import { Router } from 'express';
import { enhancedGoogleCache } from './enhanced-google-cache';
import { log } from './logger';

const router = Router();

/**
 * Cache management endpoints for development
 */

// Get cache statistics and usage info
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await enhancedGoogleCache.getDevCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error('Error getting cache stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

// Clear development cache (dev only)
router.delete('/cache/clear', async (req, res) => {
  try {
    const cleared = await enhancedGoogleCache.clearDevCache();
    
    if (cleared) {
      res.json({
        success: true,
        message: 'Development cache cleared successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cache clear not available in production'
      });
    }
  } catch (error) {
    log.error('Error clearing cache', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Cache warming endpoint (pre-populate common routes)
router.post('/cache/warm', async (req, res) => {
  const { routes } = req.body;
  
  if (!routes || !Array.isArray(routes)) {
    return res.status(400).json({
      success: false,
      error: 'routes array is required'
    });
  }

  try {
    const results = [];
    
    for (const route of routes) {
      const { start, end, force = false } = route;
      
      if (!start || !end) {
        results.push({
          route: `${start} → ${end}`,
          status: 'skipped',
          reason: 'Missing start or end city'
        });
        continue;
      }

      // Check if already cached (unless force is true)
      if (!force) {
        const cached = await enhancedGoogleCache.getCachedRoutePois(start, end);
        if (cached) {
          results.push({
            route: `${start} → ${end}`,
            status: 'already_cached',
            poisCount: cached.length
          });
          continue;
        }
      }

      // Here you would call your actual POI fetching logic
      // This is a placeholder - you'd integrate with your existing POI service
      results.push({
        route: `${start} → ${end}`,
        status: 'warming_scheduled',
        message: 'Cache warming scheduled (implement with actual POI service)'
      });
    }
    
    res.json({
      success: true,
      message: `Processed ${routes.length} routes for cache warming`,
      results
    });
  } catch (error) {
    log.error('Error warming cache', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm cache'
    });
  }
});

// Get cache usage for specific route
router.get('/cache/route/:start/:end', async (req, res) => {
  try {
    const { start, end } = req.params;
    
    const routePois = await enhancedGoogleCache.getCachedRoutePois(start, end);
    const routePolyline = await enhancedGoogleCache.getCachedRoutePolyline(start, end);
    const routeData = await enhancedGoogleCache.getCachedRoute(start, end, 'DRIVING');
    
    res.json({
      success: true,
      route: `${start} → ${end}`,
      cached: {
        pois: routePois ? {
          found: true,
          count: routePois.length,
          preview: routePois.slice(0, 3).map(poi => poi.name)
        } : { found: false },
        polyline: routePolyline ? { found: true } : { found: false },
        directions: routeData ? { 
          found: true, 
          distance: routeData.distance,
          duration: routeData.duration 
        } : { found: false }
      }
    });
  } catch (error) {
    log.error('Error getting route cache info', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get route cache information'
    });
  }
});

export default router;