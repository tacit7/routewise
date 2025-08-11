import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Database, Clock, Zap, AlertCircle } from 'lucide-react';

interface CacheInfo {
  // Backend cache from API response
  backendStatus: 'hit' | 'miss' | 'disabled' | 'unknown';
  backendType: 'Memory' | 'Redis' | 'Hybrid' | 'Disabled' | string;
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

interface DeveloperCacheFABProps {
  cacheInfo: CacheInfo;
}

export default function DeveloperCacheFAB({ cacheInfo }: DeveloperCacheFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show in development
  if (!import.meta.env.DEV) return null;
  
  // Determine FAB color based on cache status
  const isCacheHit = cacheInfo.backendStatus === 'hit';
  const fabColor = isCacheHit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full w-14 h-14 shadow-lg ${fabColor} text-white`}
          size="sm"
        >
          <Database className="h-6 w-6" />
        </Button>
      </div>

      {/* Debug Info Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Developer Cache Debug - {cacheInfo.pageType}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Backend Cache Status */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Backend Cache Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge 
                    variant={isCacheHit ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {cacheInfo.backendStatus.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Backend:</span>
                  <span className="ml-2 font-mono text-sm">{cacheInfo.backendType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Endpoint:</span>
                  <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{cacheInfo.apiEndpoint}</code>
                </div>
                {cacheInfo.timestamp && (
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">Cache Time:</span>
                    <span className="ml-2 font-mono text-sm">{new Date(cacheInfo.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* TanStack Query Info */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                TanStack Query Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Query Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {cacheInfo.queryStatus.toUpperCase()}
                  </Badge>
                </div>
                {cacheInfo.lastFetch && (
                  <div>
                    <span className="text-sm text-muted-foreground">Last Fetch:</span>
                    <span className="ml-2 font-mono text-sm">{formatTime(cacheInfo.lastFetch)}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Data Count:</span>
                  <span className="ml-2 font-semibold">{cacheInfo.dataCount} items</span>
                </div>
              </div>
            </div>

            {/* LocalStorage Info */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Local Storage
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Has Local Data:</span>
                  <Badge 
                    variant={cacheInfo.hasLocalData ? 'default' : 'outline'}
                    className="ml-2"
                  >
                    {cacheInfo.hasLocalData ? 'YES' : 'NO'}
                  </Badge>
                </div>
                {cacheInfo.localStorageKeys.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Storage Keys:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {cacheInfo.localStorageKeys.map((key) => (
                        <code key={key} className="text-xs bg-muted px-2 py-1 rounded">
                          {key}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Impact */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💰 Cost Impact</h3>
              <p className="text-sm">
                {isCacheHit ? (
                  <span className="text-green-600">✅ Cache Hit - No API cost</span>
                ) : (
                  <span className="text-red-600">💸 Cache Miss - API cost incurred</span>
                )}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}