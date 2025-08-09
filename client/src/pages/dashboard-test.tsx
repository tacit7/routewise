import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";
import { 
  useSuggestedTrips, 
  useUserInterests,
  userPreferences
} from "@/hooks/use-interests";
import Header from "@/components/header";
import ReduxTest from "@/components/redux-test";
import { Route, MapPin, CheckCircle, Settings, AlertTriangle } from "lucide-react";

/**
 * Test page to validate dashboard integration before deploying
 */
const DashboardTest = () => {
  const { user, isAuthenticated } = useAuth();
  const { trips: suggestedTrips, isLoading: isLoadingSuggested, isError: hasTripsError } = useSuggestedTrips(4);
  const { 
    availableCategories, 
    enabledInterestNames, 
    isLoading: isLoadingInterests,
    hasError: hasInterestsError 
  } = useUserInterests();

  const cacheStats = userPreferences.getCacheStats();

  return (
    <div className="bg-bg min-h-screen">
      <Header
        leftContent={
          <div className="flex items-center">
            <h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              RouteWise Test
            </h1>
          </div>
        }
        centerContent={
          <div className="flex items-center justify-center">
            <h2 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
              Dashboard Integration Test
            </h2>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Test Mode
            </span>
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-fg mb-4">Dashboard Integration Test</h1>
          <p className="text-muted-fg">Testing the complete interests data integration layer</p>
        </div>

        {/* Redux Integration Test */}
        <div className="mb-8">
          <ReduxTest />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                )}
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>User:</strong> {user?.username || 'None'}</p>
                <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Interests Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {hasInterestsError ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                ) : isLoadingInterests ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                User Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Available Categories:</strong> {availableCategories.length}</p>
                <p><strong>Enabled Interests:</strong> {enabledInterestNames.length}</p>
                <p><strong>Loading:</strong> {isLoadingInterests ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {hasInterestsError ? 'Yes' : 'No'}</p>
                {enabledInterestNames.length > 0 && (
                  <div>
                    <p><strong>Selected:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {enabledInterestNames.slice(0, 5).map(name => (
                        <span key={name} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {name}
                        </span>
                      ))}
                      {enabledInterestNames.length > 5 && (
                        <span className="px-2 py-1 bg-surface-alt text-muted-fg text-xs rounded">
                          +{enabledInterestNames.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Trips Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {hasTripsError ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                ) : isLoadingSuggested ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                Suggested Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Trip Count:</strong> {suggestedTrips.length}</p>
                <p><strong>Loading:</strong> {isLoadingSuggested ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {hasTripsError ? 'Yes' : 'No'}</p>
                {suggestedTrips.length > 0 && (
                  <div>
                    <p><strong>Available Trips:</strong></p>
                    <div className="space-y-1 mt-2">
                      {suggestedTrips.map(trip => (
                        <div key={trip.id} className="text-sm">
                          • {trip.title} ({trip.startLocation} → {trip.endLocation})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cache Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 text-blue-500 mr-2" />
                Cache Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Has Cached Trips:</strong> {cacheStats.hasCachedTrips ? 'Yes' : 'No'}</p>
                {cacheStats.hasCachedTrips && (
                  <>
                    <p><strong>Cache Age:</strong> {Math.round(cacheStats.cacheAge / 1000)}s</p>
                    <p><strong>Is Expired:</strong> {cacheStats.isExpired ? 'Yes' : 'No'}</p>
                    <p><strong>Trip Count:</strong> {cacheStats.tripCount}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => userPreferences.clearCache()}
              >
                Clear Cache
              </Button>
              <Button 
                variant="outline"
                onClick={() => userPreferences.clearAllPreferences()}
              >
                Reset All Data
              </Button>
              <Button 
                onClick={() => window.location.href = '/interests'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Interests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visual Test of Dashboard Components */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dashboard Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Top Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center">
                  <Route className="w-5 h-5 mr-2" />
                  Plan a Road Trip
                </Button>
                <Button 
                  variant="outline"
                  className="bg-primary hover:bg-primary/90 text-primary-fg border-green-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Help Me Plan a Trip
                </Button>
              </div>

              {/* Personalize Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-fg">Personalize Your Trip Suggestions</h2>
                </div>
                <p className="text-muted-fg mb-6">Tell us what you're into to get tailored recommendations.</p>
                
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                  Customize Interests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardTest;