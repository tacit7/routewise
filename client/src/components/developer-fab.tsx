import React, { useState, useEffect } from 'react';
import { Bug, X, Monitor, Map, Database, Network, Settings, Clock, Zap, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
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

interface ApiRequest {
  endpoint: string;
  method: string;
  body: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  response?: any;
}

interface DeveloperFabProps {
  className?: string;
  cacheInfo?: CacheInfo;
  apiRequest?: ApiRequest;
}

export const DeveloperFab: React.FC<DeveloperFabProps> = ({ className = "", cacheInfo, apiRequest }) => {
  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugData[]>([]);
  const queryClient = useQueryClient();
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
      <div className="fixed bottom-6 right-6 z-[99999]">
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
        <DialogPortal>
          <DialogOverlay className="z-[99998]" />
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-hidden z-[99999]" 
          >
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
            <TabsList className={`grid w-full h-10 ${apiRequest ? (cacheInfo ? 'grid-cols-6' : 'grid-cols-5') : (cacheInfo ? 'grid-cols-5' : 'grid-cols-4')}`}>
              <TabsTrigger value="logs" className="text-sm">
                <Database className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              {apiRequest && (
                <TabsTrigger value="api" className="text-sm">
                  <Network className="h-4 w-4 mr-2" />
                  API
                </TabsTrigger>
              )}
              <TabsTrigger value="system" className="text-sm">
                <Monitor className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="maps" className="text-sm">
                <Map className="h-4 w-4 mr-2" />
                Maps
              </TabsTrigger>
              <TabsTrigger value="gmaps" className="text-sm">
                <Zap className="h-4 w-4 mr-2" />
                G-Maps
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

            {apiRequest && (
              <TabsContent value="api" className="mt-3 h-[calc(100%-50px)]">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Last API Request
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge
                            variant={
                              apiRequest.status === 'success' ? 'default' :
                              apiRequest.status === 'error' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {apiRequest.status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Method:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {apiRequest.method}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Endpoint:</span>
                          <div className="mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                              {apiRequest.endpoint}
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Timestamp:</span>
                          <div className="font-mono text-sm mt-1">
                            {apiRequest.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3">Request Body</h4>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 z-10"
                          onClick={() => {
                            navigator.clipboard.writeText(apiRequest.body);
                            if ((window as any).__devLog) {
                              (window as any).__devLog('Developer Tools', 'Request Body Copied', {
                                bodySize: apiRequest.body.length
                              });
                            }
                          }}
                        >
                          Copy
                        </Button>
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-48 font-mono">
                          {JSON.stringify(JSON.parse(apiRequest.body), null, 2)}
                        </pre>
                      </div>
                    </Card>

                    {apiRequest.response && (
                      <Card className="p-4">
                        <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                          {apiRequest.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          Response {apiRequest.status === 'success' ? 'Data' : 'Error'}
                        </h4>
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => {
                              const responseText = JSON.stringify(apiRequest.response, null, 2);
                              navigator.clipboard.writeText(responseText);
                              if ((window as any).__devLog) {
                                (window as any).__devLog('Developer Tools', 'Response Copied', {
                                  responseSize: responseText.length
                                });
                              }
                            }}
                          >
                            Copy
                          </Button>
                          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-48 font-mono">
                            {JSON.stringify(apiRequest.response, null, 2)}
                          </pre>
                        </div>
                      </Card>
                    )}

                    <Card className="p-4">
                      <h4 className="font-medium text-base mb-3">Debug Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            console.log('🌐 API Request Details:', {
                              endpoint: apiRequest.endpoint,
                              method: apiRequest.method,
                              timestamp: apiRequest.timestamp,
                              status: apiRequest.status,
                              body: JSON.parse(apiRequest.body),
                              response: apiRequest.response
                            });
                          }}
                        >
                          Log Full Request to Console
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const curlCommand = `curl -X ${apiRequest.method} \\
  '${window.location.origin}${apiRequest.endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <your-token>' \\
  -d '${apiRequest.body}'`;
                            
                            navigator.clipboard.writeText(curlCommand);
                            console.log('📋 cURL command copied to clipboard:', curlCommand);
                            
                            if ((window as any).__devLog) {
                              (window as any).__devLog('Developer Tools', 'cURL Command Generated', {
                                endpoint: apiRequest.endpoint,
                                method: apiRequest.method
                              });
                            }
                          }}
                        >
                          Copy as cURL
                        </Button>
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="system" className="mt-3 h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Environment Variables
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span>VITE_GOOGLE_CLIENT_ID:</span>
                        <Badge variant={import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'default' : 'destructive'}>
                          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Present ✅' : 'Missing ❌'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>VITE_API_URL:</span>
                        <span className="font-mono text-xs">
                          {import.meta.env.VITE_API_URL || 'Not set (using default)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>VITE_MSW_DISABLED:</span>
                        <Badge variant={import.meta.env.VITE_MSW_DISABLED === 'true' ? 'default' : 'secondary'}>
                          {import.meta.env.VITE_MSW_DISABLED || 'false'}
                        </Badge>
                      </div>
                      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                          <div className="text-muted-foreground mb-1">Client ID Preview:</div>
                          {`${import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(0, 12)}...${import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(import.meta.env.VITE_GOOGLE_CLIENT_ID.length - 12)}`}
                        </div>
                      )}
                    </div>
                  </Card>

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


                  {/* Selected POIs Tracking */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Selected POIs
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">In Trip:</span>
                        <Badge variant="outline" id="selected-pois-count">
                          0
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Hovered:</span>
                        <span className="font-mono text-xs" id="hovered-poi-name">None</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Added:</span>
                        <span className="font-mono text-xs" id="last-added-poi">None</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          // Get trip places from localStorage or global state
                          const tripPlaces = JSON.parse(localStorage.getItem('tripPlaces') || '[]');
                          const selectedPoiIds = JSON.parse(localStorage.getItem('selectedPoiIds') || '[]');

                          console.log('🎯 Selected POIs Debug:', {
                            tripPlacesCount: tripPlaces.length,
                            selectedPoiIds: selectedPoiIds,
                            tripPlaces: tripPlaces
                          });

                          if (tripPlaces.length > 0) {
                            console.log('📍 Trip Places Details:');
                            tripPlaces.forEach((poi, index) => {
                              console.log(`${index + 1}. ${poi.name} (${poi.category}) - ${poi.address}`);
                            });
                          } else {
                            console.log('ℹ️ No POIs currently selected for trip');
                          }

                          // Check for hovered POI
                          if ((window as any).__routewise_hovered_poi) {
                            console.log('👆 Currently Hovered POI:', (window as any).__routewise_hovered_poi);
                          }

                          if ((window as any).__devLog) {
                            (window as any).__devLog('Selected POIs', 'Trip Selection State', {
                              tripCount: tripPlaces.length,
                              selectedIds: selectedPoiIds,
                              lastAction: localStorage.getItem('lastPoiAction') || 'none'
                            });
                          }
                        }}
                      >
                        Show Selected POIs
                      </Button>

                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Selection State:</strong><br/>
                        • Trip POIs stored in localStorage<br/>
                        • Real-time selection tracking<br/>
                        • Hover state monitoring<br/>
                        • Trip planning persistence
                      </div>
                    </div>
                  </Card>

                  {/* POI API Response Data */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      POI API Response Data
                    </h4>
                    <div className="space-y-3">
                      {/* POI Count and Status */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Available POIs:</span>
                          <Badge variant="outline" id="poi-count-badge">
                            {(window as any).__routewise_pois?.length || 0}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Page Type:</span>
                          <Badge variant="secondary" className="text-xs">
                            {window.location.pathname.includes('explore-results') ? 'EXPLORE' : 
                             window.location.pathname.includes('route-results') ? 'ROUTE' : 'OTHER'}
                          </Badge>
                        </div>

                        {(window as any).__routewise_explore_data && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Location:</span>
                            <span className="font-mono text-xs">
                              {(window as any).__routewise_explore_data.startLocation || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          // Get POI data from the global window object
                          const poisData = (window as any).__routewise_pois;
                          const exploreData = (window as any).__routewise_explore_data;

                          if (poisData && poisData.length > 0) {
                            console.log('🗺️ LIVE POI API Response Data:');
                            console.log(`📊 Total POIs: ${poisData.length}`);
                            
                            if (exploreData) {
                              console.log('🌍 Explore Context:', exploreData);
                            }

                            // Show first 3 POIs with full structure
                            const samplePois = poisData.slice(0, 3);
                            console.log('📋 Sample POIs (first 3):');
                            samplePois.forEach((poi: any, index: number) => {
                              console.log(`\n${index + 1}. ${poi.name || 'Unknown'}`);
                              console.log('   Category:', poi.category || 'N/A');
                              console.log('   Rating:', poi.rating || 'N/A');
                              console.log('   Address:', poi.address || poi.formatted_address || 'N/A');
                              console.log('   Coordinates:', `${poi.latitude || poi.lat}, ${poi.longitude || poi.lng}`);
                              console.log('   Full Object:', poi);
                            });

                            // Show categories breakdown
                            const categories = poisData.reduce((acc: any, poi: any) => {
                              const cat = poi.category || 'uncategorized';
                              acc[cat] = (acc[cat] || 0) + 1;
                              return acc;
                            }, {});
                            console.log('📊 POI Categories:', categories);

                            // Log to debug system
                            if ((window as any).__devLog) {
                              (window as any).__devLog('POI API Response', 'Live POI Data Analysis', {
                                totalCount: poisData.length,
                                categories: Object.keys(categories),
                                samplePoi: samplePois[0],
                                exploreContext: exploreData
                              });
                            }

                            // Update UI badge
                            const badge = document.getElementById('poi-count-badge');
                            if (badge) badge.textContent = poisData.length.toString();

                          } else {
                            console.log('ℹ️ No POI data available');
                            console.log('💡 To see POI data:');
                            console.log('   1. Navigate to /explore-results?location=YourCity');
                            console.log('   2. Or go to /route-results with route data');
                            console.log('   3. POI data will be automatically exposed to debug tools');
                          }
                        }}
                      >
                        Analyze POI Data
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          const poisData = (window as any).__routewise_pois;
                          if (poisData && poisData.length > 0) {
                            // Copy full POI array to clipboard
                            const jsonData = JSON.stringify(poisData, null, 2);
                            navigator.clipboard.writeText(jsonData);
                            console.log('📋 Copied all POI data to clipboard');
                            console.log(`📊 Data size: ${jsonData.length} characters, ${poisData.length} POIs`);
                            
                            if ((window as any).__devLog) {
                              (window as any).__devLog('POI API Response', 'Data Copied to Clipboard', {
                                dataSize: jsonData.length,
                                poiCount: poisData.length
                              });
                            }
                          } else {
                            console.log('❌ No POI data available to copy');
                          }
                        }}
                      >
                        Copy POI JSON
                      </Button>

                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Complete Places Table Schema:</strong><br/>
                        📋 <strong>Identifiers:</strong> id, google_place_id, location_iq_place_id<br/>
                        📍 <strong>Location:</strong> name, formatted_address, latitude, longitude, location (PostGIS)<br/>
                        📊 <strong>Details:</strong> place_types, rating, price_level, reviews_count<br/>
                        📞 <strong>Contact:</strong> phone_number, website, opening_hours<br/>
                        🖼️ <strong>Media:</strong> photos, wiki_image<br/>
                        🔍 <strong>Search:</strong> description, search_vector, popularity_score<br/>
                        📦 <strong>Raw Data:</strong> google_data, location_iq_data<br/>
                        ⏰ <strong>Timestamps:</strong> cached_at, last_updated, inserted_at, updated_at<br/>
                        <br/>
                        <strong>Live Data:</strong> Shows actual API response from /api/explore-results<br/>
                        <strong>Puerto Rico:</strong> 30+ POIs with rich descriptions and coordinates
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
                        variant="destructive"
                        size="default"
                        className="w-full text-sm"
                        onClick={() => {
                          // Clear autocomplete cache
                          queryClient.removeQueries({ queryKey: ['city-autocomplete'] });
                          queryClient.removeQueries({ queryKey: ['places-autocomplete'] });
                          
                          console.log('🗑️ Cache Cleared: Autocomplete cache has been cleared');
                          
                          if ((window as any).__devLog) {
                            (window as any).__devLog('Developer Tools', 'Cache Cleared', {
                              message: 'Autocomplete cache cleared successfully',
                              timestamp: Date.now(),
                              clearedKeys: ['city-autocomplete', 'places-autocomplete']
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Autocomplete Cache
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

            <TabsContent value="gmaps" className="mt-3 h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* API Key Status */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      API Key Status
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge
                          variant={systemInfo.googleMaps?.available ? "default" : "destructive"}
                          id="gmaps-key-status"
                        >
                          {systemInfo.googleMaps?.available ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Source:</span>
                        <span className="font-mono text-sm" id="gmaps-key-source">
                          /api/maps-key
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={async () => {
                          try {
                            console.log('🔑 Testing Google Maps API key...');
                            const response = await fetch('/api/maps-key');
                            const data = await response.json();

                            console.log('📋 API Key Response:', {
                              status: response.status,
                              hasKey: !!data.api_key,
                              keyPreview: data.api_key ? `${data.api_key.substring(0, 8)}...` : 'none'
                            });

                            if ((window as any).__devLog) {
                              (window as any).__devLog('Google Maps API', 'API Key Test', {
                                status: response.status,
                                hasKey: !!data.api_key,
                                timestamp: Date.now()
                              });
                            }

                            // Update status indicators
                            const statusEl = document.getElementById('gmaps-key-status');
                            if (statusEl) {
                              statusEl.textContent = data.api_key ? 'Valid' : 'Missing';
                              statusEl.className = data.api_key ?
                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/80' :
                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-destructive/50 text-destructive';
                            }
                          } catch (error) {
                            console.error('❌ API Key test failed:', error);
                          }
                        }}
                      >
                        Test API Key
                      </Button>
                    </div>
                  </Card>

                  {/* Session Usage Tracking */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Session Usage
                    </h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span>Map Loads:</span>
                        <span id="gmaps-map-loads">1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Marker Updates:</span>
                        <span id="gmaps-marker-updates">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geocoding Calls:</span>
                        <span id="gmaps-geocoding">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Places API:</span>
                        <span id="gmaps-places">0</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Est. Cost:</span>
                        <span id="gmaps-estimated-cost" className="font-mono text-sm">$0.00</span>
                      </div>
                    </div>
                  </Card>

                  {/* API Pricing Reference */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      💰 API Pricing (2024)
                    </h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Maps JavaScript API:</span>
                        <span className="font-mono">$7.00/1K loads</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geocoding API:</span>
                        <span className="font-mono">$5.00/1K requests</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Places API (Find Place):</span>
                        <span className="font-mono">$17.00/1K requests</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Places API (Nearby):</span>
                        <span className="font-mono">$32.00/1K requests</span>
                      </div>
                      <div className="flex justify-between font-medium text-red-600 pt-2 border-t border-border">
                        <span>Custom POI Search:</span>
                        <span className="font-mono">$0.42-0.56/request</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <strong>💡 Cost Optimization Tip:</strong><br/>
                      Google Maps shows FREE POI pins when users zoom in. Consider using Google's free POI layer for exploration vs. expensive POI API calls.
                    </div>
                  </Card>

                  {/* Usage Analytics */}
                  <Card className="p-4">
                    <h4 className="font-medium text-base mb-3">Usage Analytics</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          // Track map usage analytics
                          const analytics = {
                            sessionStart: sessionStorage.getItem('gmaps-session-start') || new Date().toISOString(),
                            mapLoads: parseInt(sessionStorage.getItem('gmaps-map-loads') || '1'),
                            apiCalls: parseInt(sessionStorage.getItem('gmaps-api-calls') || '0'),
                            estimatedCost: parseFloat(sessionStorage.getItem('gmaps-estimated-cost') || '0.007') // Default 1 map load
                          };

                          console.log('📊 Google Maps Usage Analytics:', analytics);

                          if ((window as any).__devLog) {
                            (window as any).__devLog('Google Maps Analytics', 'Session Usage Summary', analytics);
                          }
                        }}
                      >
                        Export Usage Data
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          // Reset session counters
                          sessionStorage.removeItem('gmaps-session-start');
                          sessionStorage.removeItem('gmaps-map-loads');
                          sessionStorage.removeItem('gmaps-api-calls');
                          sessionStorage.removeItem('gmaps-estimated-cost');

                          // Reset UI counters
                          document.getElementById('gmaps-map-loads')!.textContent = '0';
                          document.getElementById('gmaps-marker-updates')!.textContent = '0';
                          document.getElementById('gmaps-geocoding')!.textContent = '0';
                          document.getElementById('gmaps-places')!.textContent = '0';
                          document.getElementById('gmaps-estimated-cost')!.textContent = '$0.00';

                          console.log('🔄 Google Maps usage counters reset');
                        }}
                      >
                        Reset Counters
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
        </DialogPortal>
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