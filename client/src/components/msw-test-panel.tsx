import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ApiTestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
}

export const MswTestPanel: React.FC = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateResult = (endpoint: string, status: ApiTestResult['status'], data?: any, error?: string) => {
    setResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint);
      if (existing) {
        existing.status = status;
        existing.data = data;
        existing.error = error;
        return [...prev];
      }
      return [...prev, { endpoint, status, data, error }];
    });
  };

  const testEndpoint = async (endpoint: string, description: string) => {
    updateResult(endpoint, 'pending');
    
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        updateResult(endpoint, 'success', data);
        console.log(`✅ ${description}:`, data);
      } else {
        updateResult(endpoint, 'error', data, `HTTP ${response.status}`);
        console.error(`❌ ${description} failed:`, data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      updateResult(endpoint, 'error', null, errorMsg);
      console.error(`❌ ${description} error:`, error);
    }
  };

  const testAllEndpoints = async () => {
    setIsTestingAll(true);
    setResults([]);
    
    const tests = [
      { endpoint: '/api/health', description: 'Health Check' },
      { endpoint: '/api/maps-key', description: 'Maps API Key' },
      { endpoint: '/api/places/autocomplete?input=austin', description: 'City Autocomplete (Free)' },
      { endpoint: '/api/places/autocomplete/google?input=austin', description: 'City Autocomplete (Premium)' },
      { endpoint: '/api/pois', description: 'General POIs' },
      { endpoint: '/api/pois?start=Austin&end=Dallas', description: 'Route POIs' },
      { endpoint: '/api/pois?checkpoint=Austin', description: 'Checkpoint POIs' },
      { endpoint: '/api/pois/1', description: 'POI by ID' },
      ...(import.meta.env.VITE_MSW_DISABLED === 'true' ? [
        { endpoint: '/api/cache-stats', description: 'Cache Statistics' }
      ] : []),
    ];

    for (const test of tests) {
      await testEndpoint(test.endpoint, test.description);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">MSW API Test Panel</h3>
        <Button 
          onClick={testAllEndpoints} 
          disabled={isTestingAll}
          size="sm"
          variant="outline"
        >
          {isTestingAll ? 'Testing...' : 'Test All APIs'}
        </Button>
      </div>
      
      {results.length === 0 && !isTestingAll && (
        <p className="text-sm text-gray-600">Click "Test All APIs" to verify MSW integration</p>
      )}
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map((result) => (
          <div key={result.endpoint} className="border-b border-gray-100 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-gray-700">{result.endpoint}</span>
              <span className={`text-lg ${getStatusColor(result.status)}`}>
                {getStatusIcon(result.status)}
              </span>
            </div>
            
            {result.status === 'success' && result.data && (
              <div className="mt-1 text-xs text-gray-600">
                {result.endpoint === '/api/health' && (
                  <span>Status: {result.data.status}, Services: {Object.keys(result.data.services || {}).length}</span>
                )}
                {result.endpoint === '/api/maps-key' && (
                  <span>API Key: {result.data.apiKey ? 'Present' : 'Missing'}</span>
                )}
                {result.endpoint.includes('/api/places/autocomplete') && (
                  <span>Predictions: {result.data.predictions?.length || 0}</span>
                )}
                {result.endpoint.includes('/api/pois') && (
                  <span>POIs: {Array.isArray(result.data) ? result.data.length : 1}</span>
                )}
                {result.endpoint === '/api/cache-stats' && (
                  <span>Entries: {result.data.totalEntries}, Valid: {result.data.validEntries}</span>
                )}
              </div>
            )}
            
            {result.status === 'error' && (
              <div className="mt-1 text-xs text-red-600">
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        MSW Status: {import.meta.env.VITE_MSW_DISABLED === 'true' ? 'Disabled (using real backend + cache)' : 'Active (mocking enabled)'}
      </div>
    </div>
  );
};

export default MswTestPanel;
