import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Trash2,
  RefreshCw,
  Thermometer,
  Clock,
  MapPin,
  Route,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CacheStats {
  development: boolean;
  places: {
    type: 'redis' | 'memory';
    connected: boolean;
    totalEntries?: number;
  };
  directions: {
    type: 'redis' | 'memory';
    connected: boolean;
    totalEntries?: number;
  };
  static: {
    type: 'redis' | 'memory';
    connected: boolean;
    totalEntries?: number;
  };
  suggestions: string[];
}

/**
 * Development-only cache management dashboard
 * Shows cache statistics, hit rates, and provides cache management tools
 */
export default function DevCacheDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Fetch cache statistics
  const {
    data: cacheStats,
    isLoading,
    error,
    refetch
  } = useQuery<CacheStats>({
    queryKey: ['/api/cache/stats'],
    queryFn: async () => {
      const response = await fetch('/api/cache/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      return response.json().then(data => data.data);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isVisible
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cache/clear', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Cache Cleared',
        description: 'Development cache has been cleared successfully.'
      });
      refetch();
      queryClient.invalidateQueries(); // Refresh all queries
    },
    onError: (error: Error) => {
      toast({
        title: 'Cache Clear Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Cache warming mutation
  const warmCacheMutation = useMutation({
    mutationFn: async (routes: Array<{ start: string; end: string }>) => {
      const response = await fetch('/api/cache/warm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes })
      });
      if (!response.ok) {
        throw new Error('Failed to warm cache');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Cache Warming Started',
        description: `Warming cache for ${data.results.length} routes.`
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Cache Warming Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleWarmCommonRoutes = () => {
    const commonRoutes = [
      { start: 'Austin, TX', end: 'Dallas, TX' },
      { start: 'Houston, TX', end: 'San Antonio, TX' },
      { start: 'Los Angeles, CA', end: 'San Francisco, CA' },
      { start: 'Seattle, WA', end: 'Portland, OR' }
    ];
    warmCacheMutation.mutate(commonRoutes);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dev Cache Dashboard
            <span className="ml-auto text-xs bg-blue-100 px-2 py-1 rounded-full">
              DEV
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Cache Status Overview */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-fg">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading cache stats...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Failed to load cache stats
            </div>
          )}

          {cacheStats && (
            <>
              {/* Cache Type and Status */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-surface rounded border">
                  <div className="font-medium text-fg">Places</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {cacheStats.places.connected ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-muted-fg">
                      {cacheStats.places.type}
                    </span>
                  </div>
                  {cacheStats.places.totalEntries && (
                    <div className="text-muted-fg mt-1">
                      {cacheStats.places.totalEntries} entries
                    </div>
                  )}
                </div>

                <div className="text-center p-2 bg-surface rounded border">
                  <div className="font-medium text-fg">Routes</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {cacheStats.directions.connected ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-muted-fg">
                      {cacheStats.directions.type}
                    </span>
                  </div>
                  {cacheStats.directions.totalEntries && (
                    <div className="text-muted-fg mt-1">
                      {cacheStats.directions.totalEntries} entries
                    </div>
                  )}
                </div>

                <div className="text-center p-2 bg-surface rounded border">
                  <div className="font-medium text-fg">Static</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {cacheStats.static.connected ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-muted-fg">
                      {cacheStats.static.type}
                    </span>
                  </div>
                  {cacheStats.static.totalEntries && (
                    <div className="text-muted-fg mt-1">
                      {cacheStats.static.totalEntries} entries
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              {cacheStats.suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-fg flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Cache Info
                  </div>
                  {cacheStats.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-xs text-muted-fg pl-4">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWarmCommonRoutes}
                  disabled={warmCacheMutation.isPending}
                  className="flex-1 text-xs"
                >
                  <Thermometer className="h-3 w-3 mr-1" />
                  Warm
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearCacheMutation.mutate()}
                  disabled={clearCacheMutation.isPending}
                  className="flex-1 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Development Indicators */}
              <div className="text-xs text-center text-muted-fg border-t border-border pt-2">
                🚀 Extended TTLs active • Cache-first development mode
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}