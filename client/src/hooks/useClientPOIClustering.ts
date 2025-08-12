import { useMemo } from 'react';
import type { Poi } from '@/types/schema';

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  pois: Poi[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  category_breakdown?: Record<string, number>;
  avg_rating?: number;
  type?: 'cluster' | 'poi';
}

interface ClusteringOptions {
  gridSize?: number; // Pixel size of clustering grid (default: 60)
  maxZoom?: number;  // Max zoom level to cluster (default: 17)
  minimumClusterSize?: number; // Minimum POIs to form cluster (default: 2)
}

/**
 * Client-side POI clustering hook with performance optimization
 * Clusters POIs based on screen distance and zoom level
 */
export function useClientPOIClustering(
  pois: Poi[],
  zoom: number,
  viewport: { north: number; south: number; east: number; west: number } | null,
  options: ClusteringOptions = {}
) {
  const { 
    gridSize = 60, 
    maxZoom = 17, 
    minimumClusterSize = 2 
  } = options;

  const clusters = useMemo(() => {
    // Don't cluster if no viewport or at high zoom levels
    if (!viewport || zoom >= maxZoom || pois.length === 0) {
      return pois.map(poi => ({
        id: `single-${poi.id}`,
        lat: poi.lat,
        lng: poi.lng,
        count: 1,
        pois: [poi],
        bounds: {
          north: poi.lat,
          south: poi.lat,
          east: poi.lng,
          west: poi.lng
        },
        category_breakdown: { [poi.category]: 1 },
        avg_rating: poi.rating || 0,
        type: 'poi' as const
      }));
    }

    // Filter POIs within viewport bounds
    const visiblePois = pois.filter(poi => 
      poi.lat <= viewport.north &&
      poi.lat >= viewport.south &&
      poi.lng <= viewport.east &&
      poi.lng >= viewport.west
    );

    if (visiblePois.length === 0) {
      return [];
    }

    // Calculate lat/lng per pixel for grid-based clustering
    const latSpan = viewport.north - viewport.south;
    const lngSpan = viewport.east - viewport.west;
    
    // Assume 800px viewport width for grid calculation
    const viewportPixels = 800;
    const gridLatSize = (latSpan / viewportPixels) * gridSize;
    const gridLngSize = (lngSpan / viewportPixels) * gridSize;

    // Group POIs into grid cells
    const gridCells = new Map<string, Poi[]>();
    
    visiblePois.forEach(poi => {
      // Calculate grid cell coordinates
      const cellLat = Math.floor((poi.lat - viewport.south) / gridLatSize);
      const cellLng = Math.floor((poi.lng - viewport.west) / gridLngSize);
      const cellKey = `${cellLat}-${cellLng}`;
      
      if (!gridCells.has(cellKey)) {
        gridCells.set(cellKey, []);
      }
      gridCells.get(cellKey)!.push(poi);
    });

    // Convert grid cells to clusters
    const resultClusters: Cluster[] = [];
    let clusterIndex = 0;

    gridCells.forEach((cellPois, cellKey) => {
      if (cellPois.length >= minimumClusterSize) {
        // Create cluster
        const bounds = cellPois.reduce(
          (acc, poi) => ({
            north: Math.max(acc.north, poi.lat),
            south: Math.min(acc.south, poi.lat),
            east: Math.max(acc.east, poi.lng),
            west: Math.min(acc.west, poi.lng)
          }),
          {
            north: cellPois[0].lat,
            south: cellPois[0].lat,
            east: cellPois[0].lng,
            west: cellPois[0].lng
          }
        );

        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;

        // Calculate category breakdown
        const categoryBreakdown: Record<string, number> = {};
        cellPois.forEach(poi => {
          categoryBreakdown[poi.category] = (categoryBreakdown[poi.category] || 0) + 1;
        });

        // Calculate average rating
        const ratingsSum = cellPois.reduce((sum, poi) => sum + (poi.rating || 0), 0);
        const avgRating = cellPois.length > 0 ? ratingsSum / cellPois.length : 0;

        resultClusters.push({
          id: `cluster-${clusterIndex++}`,
          lat: centerLat,
          lng: centerLng,
          count: cellPois.length,
          pois: cellPois,
          bounds,
          category_breakdown: categoryBreakdown,
          avg_rating: avgRating,
          type: 'cluster'
        });
      } else {
        // Add individual POIs
        cellPois.forEach(poi => {
          resultClusters.push({
            id: `single-${poi.id}`,
            lat: poi.lat,
            lng: poi.lng,
            count: 1,
            pois: [poi],
            bounds: {
              north: poi.lat,
              south: poi.lat,
              east: poi.lng,
              west: poi.lng
            },
            category_breakdown: { [poi.category]: 1 },
            avg_rating: poi.rating || 0,
            type: 'poi'
          });
        });
      }
    });

    return resultClusters;
  }, [pois, zoom, viewport, gridSize, maxZoom, minimumClusterSize]);

  // Separate single POIs from multi-POI clusters for rendering
  const singlePOIs = clusters.filter(cluster => cluster.count === 1);
  const multiPOIClusters = clusters.filter(cluster => cluster.count > 1);

  return {
    clusters,
    singlePOIs,
    multiPOIClusters,
    totalClusters: clusters.length,
    clusterCount: multiPOIClusters.length,
    singlePOICount: singlePOIs.length,
    isLoading: false,
    error: null,
    isConnected: true // Always true for client-side clustering
  };
}