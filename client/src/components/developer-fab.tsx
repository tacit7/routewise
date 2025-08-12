import React, { useState, useEffect } from 'react';
import { Bug, X, Monitor, Map, Database, Network, Settings, Clock, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DebugData {
  timestamp: string;
  component: string;
  event: string;
  data: any;
}

interface CacheInfo {
  // Backend cache from API response
  backendStatus: 'hit' | 'miss' | 'disabled' | 'unknown';
  backendType: 'Memory' | 'Redis' | 'Hybrid' | 'Disabled' | string;
  environment?: 'dev' | 'prod' | 'staging' | string;
  timestamp?: string;

  // TanStack Query info
  queryStatus: 'fresh' | 'stale' | 'loading' | 'error';
  lastFetch?: Date;

  // Page-specific data
  pageType: 'explore-results' | 'route-results';
  apiEndpoint: string;
  dataCount: number;

  // LocalStorage info
  hasLocalData: boolean;
  localStorageKeys: string[];
}

interface DeveloperFabProps {
  className?: string;
  cacheInfo?: CacheInfo;
}

export const DeveloperFab: React.FC<DeveloperFabProps> = ({ className = "", cacheInfo }) => {
  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugData[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [hasConsoleErrors, setHasConsoleErrors] = useState(false);

  useEffect(() => {
    // Collect system information
    const collectSystemInfo = () => {
      setSystemInfo({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        memory: (performance as any).memory ? {
          usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
        } : 'Not available',
        localStorage: {
          itemCount: localStorage.length,
          approximateSize: new Blob(Object.values(localStorage)).size + ' bytes',
        },
        googleMaps: {
          available: typeof window.google !== 'undefined' && window.google.maps,
          version: typeof window.google !== 'undefined' ? 'Available' : 'Not loaded',
        }
      });
    };

    collectSystemInfo();

    // Update system info on resize
    const handleResize = () => {
      collectSystemInfo();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global debug function that components can use
  useEffect(() => {
    const addDebugLog = (component: string, event: string, data: any) => {
      const newLog: DebugData = {
        timestamp: new Date().toLocaleTimeString(),
        component,
        event,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      };

      setDebugLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 entries
    };

    // Expose global debug function
    (window as any).__devLog = addDebugLog;

    return () => {
      delete (window as any).__devLog;
    };
  }, []);

  // Console error detection
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      setHasConsoleErrors(true);
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      setHasConsoleErrors(true);
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);


  const clearLogs = () => {
    setDebugLogs([]);
    setHasConsoleErrors(false); // Also clear console error status
  };

  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      debugLogs,
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routewise-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-xl text-white border-2 transition-all bg-purple-600 hover:bg-purple-700 border-purple-400 hover:border-purple-300 hover:scale-110"
          title={`Developer Debug Tools${
            cacheInfo
              ? ` | Cache: ${cacheInfo.backendStatus.toUpperCase()}`
              : ''
          }${hasConsoleErrors ? ' | Console Errors Detected' : ''}`}
        >
          <Bug className="h-6 w-6" />
        </Button>

        {/* Status Indicators */}
        <div className="absolute -top-1 -right-1 flex gap-1">
          {/* Cache Status Bubble */}
          {cacheInfo && cacheInfo.backendStatus !== 'hit' && (
            <div
              className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-md animate-pulse"
              title="Cache Miss - API cost incurred"
            />
          )}

          {/* Console Error Bubble */}
          {hasConsoleErrors && (
            <div
              className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-md animate-pulse"
              title="Console errors detected"
            />
          )}
        </div>
      </div>

      {/* Debug Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-purple-700 flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Developer Tools
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="h-8 px-2 text-xs"
                  title="Clear logs"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportLogs}
                  className="h-8 px-2 text-xs"
                  title="Export debug data"
                >
                  Export
                </Button>
              </div>
            </DialogTitle>
            <Badge variant="secondary" className="w-fit text-sm">
              {debugLogs.length} debug entries
            </Badge>
          </DialogHeader>

          <div className="h-[70vh] overflow-hidden">
          <Tabs defaultValue="logs" className="h-full">
            <TabsList className={`grid w-full h-10 ${cacheInfo ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="logs" className="text-sm">
                <Database className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="system" className="text-sm">
                <Monitor className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="maps" className="text-sm">
                <Map className="h-4 w-4 mr-2" />
                Maps
              </TabsTrigger>
              {cacheInfo && (
                <TabsTrigger value="cache" className="text-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Cache
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="logs" className="mt-3 h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {debugLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-base">No debug logs yet</p>
                      <p className="text-sm">Debug logs will appear here</p>
                    </div>
                  ) : (
                    debugLogs.map((log, index) => (
                      <Card key={index} className="p-3 border-l-4 border-l-purple-400">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-sm font-mono">
                            {log.component}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="text-base font-medium mb-2">{log.event}</div>
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {log.data}
                        </pre>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="system" className="mt-3 h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Viewport
                    </h4>
                    <div className="text-sm space-y-1 font-mono">
                      <div>Size: {systemInfo.viewport?.width} × {systemInfo.viewport?.height}</div>
                      <div>DPR: {systemInfo.viewport?.devicePixelRatio}</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Browser
                    </h4>
                    <div className="text-sm space-y-2">
                      <div><strong>Platform:</strong> {systemInfo.platform}</div>
                      <div><strong>User Agent:</strong></div>
                      <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                        {systemInfo.userAgent}
                      </div>
                    </div>
                  </Card>

                  {systemInfo.memory && (
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Memory
                      </h4>
                      <div className="text-sm space-y-1 font-mono">
                        <div>Used: {systemInfo.memory.usedJSHeapSize}</div>
                        <div>Total: {systemInfo.memory.totalJSHeapSize}</div>
                        <div>Limit: {systemInfo.memory.jsHeapSizeLimit}</div>
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Storage
                    </h4>
                    <div className="text-sm space-y-1 font-mono">
                      <div>Items: {systemInfo.localStorage?.itemCount}</div>
                      <div>Size: {systemInfo.localStorage?.approximateSize}</div>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="maps" className="mt-3 h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Google Maps Status
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={systemInfo.googleMaps?.available ? "default" : "destructive"}>
                          {systemInfo.googleMaps?.available ? "Available" : "Not Available"}
                        </Badge>
                      </div>
                      {systemInfo.googleMaps?.available && (
                        <div className="font-mono text-sm bg-muted p-3 rounded">
                          Maps API loaded successfully
                        </div>
                      )}
                    </div>
                  </Card>

                  {(window as any).__routewise_map && (
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3">Map Instance</h4>
                      <div className="text-sm space-y-1 font-mono">
                        <div>Center: {(window as any).__routewise_map.getCenter?.()?.toString()}</div>
                        <div>Zoom: {(window as any).__routewise_map.getZoom?.()}</div>
                      </div>
                    </Card>
                  )}

                  {/* Client-Side Clustering Debug */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Client-Side Clustering
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" id="clustering-status-dot" />
                        <span className="text-sm font-medium text-green-600" id="clustering-status-text">Client Clustering Ready</span>
                      </div>
                      
                      <div className="text-sm space-y-1 font-mono" id="clustering-stats">
                        <div>Clusters: <span id="cluster-count" className="text-green-600">0</span></div>
                        <div>Single POIs: <span id="single-poi-count" className="text-green-600">0</span></div>
                        <div>Total: <span id="total-cluster-count" className="text-green-600">0</span></div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          onClick={() => {
                            // Test client clustering functionality
                            console.log('🔍 Testing Client-Side Clustering');
                            console.log('✅ Client clustering is always available - no external dependencies');
                            
                            if ((window as any).__devLog) {
                              (window as any).__devLog('Client Clustering Test', 'Testing clustering functionality', {
                                clusteringType: 'client-side',
                                status: 'always available',
                                timestamp: Date.now()
                              });
                            }
                            
                            // Show current clustering stats if available
                            if ((window as any).__clientClustering) {
                              const stats = (window as any).__clientClustering;
                              console.log('📊 Current clustering stats:', {
                                connected: stats.isConnected,
                                totalClusters: stats.totalClusters,
                                multiPOIClusters: stats.multiPOIClusters,
                                singlePOIs: stats.singlePOIs
                              });
                            } else {
                              console.log('ℹ️ Clustering will be available when enabled on a map page');
                            }
                          }}
                        >
                          Test Client Clustering
                        </Button>

                        <Button
                          variant="outline" 
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            // Enable clustering on map pages
                            const currentPath = window.location.pathname;
                            const isMapPage = currentPath.includes('route-results') || currentPath.includes('explore-results');
                            
                            if (isMapPage) {
                              // Store clustering preference
                              localStorage.setItem('enableClustering', 'true');
                              window.location.reload();
                              
                              if ((window as any).__devLog) {
                                (window as any).__devLog('Clustering Toggle', 'Clustering Enabled', {
                                  currentPath,
                                  action: 'enabled'
                                });
                              }
                            } else {
                              if ((window as any).__devLog) {
                                (window as any).__devLog('Clustering Toggle', 'Not on map page', {
                                  currentPath,
                                  message: 'Navigate to route-results or explore-results page to test clustering'
                                });
                              }
                              alert('Navigate to a route-results or explore-results page to enable clustering');
                            }
                          }}
                        >
                          Enable Clustering
                        </Button>

                        <Button
                          variant="outline"
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            // Client clustering refreshes automatically on zoom/pan
                            if ((window as any).__clientClustering) {
                              (window as any).__clientClustering.refreshClusters();
                              console.log('🔄 Client clustering refresh (automatic on zoom/pan)');
                            } else {
                              console.log('ℹ️ Client clustering refreshes automatically when viewport changes');
                            }
                          }}
                        >
                          Clustering Info
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            // Disable clustering
                            const currentPath = window.location.pathname;
                            const isMapPage = currentPath.includes('route-results') || currentPath.includes('explore-results');
                            
                            if (isMapPage) {
                              localStorage.removeItem('enableClustering');
                              window.location.reload();
                              
                              if ((window as any).__devLog) {
                                (window as any).__devLog('Clustering Toggle', 'Clustering Disabled', {
                                  currentPath,
                                  action: 'disabled'
                                });
                              }
                            } else {
                              localStorage.removeItem('enableClustering');
                              alert('Clustering preference cleared');
                            }
                          }}
                        >
                          Disable Clustering
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground bg-green-50 border border-green-200 p-2 rounded">
                        <strong>✅ Client-Side Clustering: ACTIVE</strong><br/>
                        <br/>
                        <strong>Features:</strong><br/>
                        • Grid-based clustering algorithm<br/>
                        • Zoom-responsive clustering (stops at zoom 15+)<br/>
                        • Viewport-aware performance optimization<br/>
                        • No backend dependencies required<br/>
                        <br/>
                        <strong>Performance:</strong><br/>
                        • Handles 1000+ POIs efficiently<br/>
                        • Real-time clustering on zoom/pan<br/>
                        • 60px grid size for optimal visual density<br/>
                        <br/>
                        <strong>Configuration:</strong><br/>
                        • Grid Size: 60px<br/>
                        • Max Zoom: 15 (individual POIs above)<br/>
                        • Min Cluster Size: 2 POIs
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3">Debug Actions</h4>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full text-sm"
                        onClick={() => {
                          if ((window as any).__devLog) {
                            (window as any).__devLog('Developer Tools', 'Test Log', {
                              message: 'This is a test debug log entry',
                              timestamp: Date.now(),
                              random: Math.random()
                            });
                          }
                        }}
                      >
                        Add Test Log
                      </Button>

                      <Button
                        variant="outline"
                        size="default"
                        className="w-full text-sm"
                        onClick={() => {
                          console.log('RouteWise Debug Info:', {
                            systemInfo,
                            debugLogs: debugLogs.slice(0, 5),
                            url: window.location.href
                          });
                        }}
                      >
                        Log to Console
                      </Button>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {cacheInfo && (
              <TabsContent value="cache" className="mt-3 h-[calc(100%-50px)]">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Backend Cache Status */}
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Backend Cache Status
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge
                            variant={cacheInfo.backendStatus === 'hit' ? 'default' : 'destructive'}
                          >
                            {cacheInfo.backendStatus.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Backend:</span>
                          <span className="font-mono text-sm">{cacheInfo.backendType}</span>
                        </div>
                        {cacheInfo.environment && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Environment:</span>
                            <Badge
                              variant={cacheInfo.environment === 'dev' ? 'secondary' : 'default'}
                              className="font-mono text-xs"
                            >
                              {cacheInfo.environment.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-muted-foreground">Endpoint:</span>
                          <div className="mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                              {cacheInfo.apiEndpoint}
                            </code>
                          </div>
                        </div>
                        {cacheInfo.timestamp && (
                          <div>
                            <span className="text-sm text-muted-foreground">Cache Time:</span>
                            <div className="font-mono text-sm mt-1">
                              {new Date(cacheInfo.timestamp).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* TanStack Query Info */}
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        TanStack Query Status
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Query Status:</span>
                          <Badge variant="outline">
                            {cacheInfo.queryStatus.toUpperCase()}
                          </Badge>
                        </div>
                        {cacheInfo.lastFetch && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Fetch:</span>
                            <span className="font-mono text-sm">
                              {cacheInfo.lastFetch.toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Data Count:</span>
                          <span className="font-semibold">{cacheInfo.dataCount} items</span>
                        </div>
                      </div>
                    </Card>

                    {/* LocalStorage Info */}
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Local Storage
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Has Local Data:</span>
                          <Badge
                            variant={cacheInfo.hasLocalData ? 'default' : 'outline'}
                          >
                            {cacheInfo.hasLocalData ? 'YES' : 'NO'}
                          </Badge>
                        </div>
                        {cacheInfo.localStorageKeys.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Storage Keys:</span>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {cacheInfo.localStorageKeys.map((key) => (
                                <code key={key} className="text-xs bg-muted px-2 py-1 rounded">
                                  {key}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Cost Impact */}
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3">💰 Cost Impact</h4>
                      <p className="text-sm">
                        {cacheInfo.backendStatus === 'hit' ? (
                          <span className="text-green-600 font-medium">✅ Cache Hit - No API cost incurred</span>
                        ) : (
                          <span className="text-red-600 font-medium">💸 Cache Miss - API cost incurred</span>
                        )}
                      </p>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper function to extract cache info from API response
export const extractCacheInfo = (apiResponse: any, pageInfo: {
  pageType: 'explore-results' | 'route-results';
  apiEndpoint: string;
  queryStatus: 'fresh' | 'stale' | 'loading' | 'error';
  lastFetch?: Date;
}): CacheInfo => {
  const _cache = apiResponse?._cache;
  const data = apiResponse?.data || apiResponse;

  return {
    // Backend cache from _cache key
    backendStatus: _cache?.status || 'unknown',
    backendType: _cache?.backend || 'Unknown',
    environment: _cache?.environment,
    timestamp: _cache?.timestamp,

    // TanStack Query info
    queryStatus: pageInfo.queryStatus,
    lastFetch: pageInfo.lastFetch,

    // Page-specific data
    pageType: pageInfo.pageType,
    apiEndpoint: pageInfo.apiEndpoint,
    dataCount: Array.isArray(data) ? data.length : (data ? 1 : 0),

    // LocalStorage info
    hasLocalData: localStorage.length > 0,
    localStorageKeys: Object.keys(localStorage),
  };
};

// Helper hook for components to easily add debug logs
export const useDevLog = () => {
  const addLog = (component: string, event: string, data: any) => {
    if (import.meta.env.DEV && (window as any).__devLog) {
      (window as any).__devLog(component, event, data);
    }
  };

  return addLog;
};

// Export the cache-specific interface for backward compatibility
export interface CacheInfo {
  backendStatus: 'hit' | 'miss' | 'disabled' | 'unknown';
  backendType: 'Memory' | 'Redis' | 'Hybrid' | 'Disabled' | string;
  environment?: 'dev' | 'prod' | 'staging' | string;
  timestamp?: string;
  queryStatus: 'fresh' | 'stale' | 'loading' | 'error';
  lastFetch?: Date;
  pageType: 'explore-results' | 'route-results';
  apiEndpoint: string;
  dataCount: number;
  hasLocalData: boolean;
  localStorageKeys: string[];
}

// Backward compatibility wrapper for DeveloperCacheFAB
export const DeveloperCacheFAB: React.FC<{ cacheInfo: CacheInfo }> = ({ cacheInfo }) => {
  return <DeveloperFab cacheInfo={cacheInfo} />;
};

// Export as default for existing imports
export default DeveloperCacheFAB;