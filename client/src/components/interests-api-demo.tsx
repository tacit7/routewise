import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import {
  useUserInterests,
  useSuggestedTrips,
  useFirstTimeUser,
  userPreferences,
} from "@/hooks/use-interests";

/**
 * Demo component to test and validate the interests API integration
 * This component showcases all the functionality we've built
 */
export function InterestsAPIDemo() {
  const [demoStep, setDemoStep] = useState<'overview' | 'interests' | 'trips' | 'preferences'>('overview');
  
  const {
    availableCategories,
    enabledInterestNames,
    isLoading: isLoadingInterests,
    hasError: hasInterestsError,
    updateInterests,
    toggleInterest,
    enableAllInterests,
    isUpdatingInterests,
  } = useUserInterests();

  const {
    trips,
    isLoading: isLoadingTrips,
    isError: hasTripsError,
    backgroundRefresh,
    forceRefresh,
  } = useSuggestedTrips();

  const {
    isFirstVisit,
    shouldShowFirstTimeExperience,
    completeOnboarding,
    resetFirstTimeUser,
  } = useFirstTimeUser();

  const handleToggleInterest = async (interestName: string) => {
    try {
      await toggleInterest(interestName);
    } catch (error) {
      console.error("Failed to toggle interest:", error);
    }
  };

  const handleEnableAll = async () => {
    try {
      await enableAllInterests();
    } catch (error) {
      console.error("Failed to enable all interests:", error);
    }
  };

  const cacheStats = userPreferences.getCacheStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interests API Integration Demo</CardTitle>
          <CardDescription>
            Test and validate the complete interests data integration layer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={demoStep === 'overview' ? 'default' : 'outline'}
              onClick={() => setDemoStep('overview')}
            >
              Overview
            </Button>
            <Button
              variant={demoStep === 'interests' ? 'default' : 'outline'}
              onClick={() => setDemoStep('interests')}
            >
              User Interests
            </Button>
            <Button
              variant={demoStep === 'trips' ? 'default' : 'outline'}
              onClick={() => setDemoStep('trips')}
            >
              Suggested Trips
            </Button>
            <Button
              variant={demoStep === 'preferences' ? 'default' : 'outline'}
              onClick={() => setDemoStep('preferences')}
            >
              Preferences
            </Button>
          </div>

          <Separator className="mb-6" />

          {demoStep === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Integration Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">API Client</p>
                    <p className="text-xs text-muted-foreground">Ready</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">React Hooks</p>
                    <p className="text-xs text-muted-foreground">Implemented</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Data Transform</p>
                    <p className="text-xs text-muted-foreground">Working</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">LocalStorage</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <p><strong>Available Categories:</strong> {availableCategories.length}</p>
                <p><strong>User Interests:</strong> {enabledInterestNames.length}</p>
                <p><strong>Suggested Trips:</strong> {trips.length}</p>
                <p><strong>First Visit:</strong> {isFirstVisit ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {demoStep === 'interests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">User Interests Management</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnableAll}
                    disabled={isUpdatingInterests}
                    variant="outline"
                    size="sm"
                  >
                    Enable All
                  </Button>
                </div>
              </div>

              {hasInterestsError && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Failed to load interests data. Please check your connection.
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingInterests ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="w-full h-24 mb-2" />
                        <Skeleton className="w-3/4 h-4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableCategories.map((category) => {
                    const isSelected = enabledInterestNames.includes(category.name);
                    return (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleToggleInterest(category.name)}
                      >
                        <CardContent className="p-4">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <p className="text-sm font-medium">{category.name}</p>
                          {isSelected && (
                            <Badge size="sm" className="mt-1">Selected</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Selected: {enabledInterestNames.join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}

          {demoStep === 'trips' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Suggested Trips</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={backgroundRefresh}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={forceRefresh}
                    variant="outline"
                    size="sm"
                  >
                    Force Refresh
                  </Button>
                </div>
              </div>

              {hasTripsError && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Failed to load suggested trips. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingTrips ? (
                <div className="grid gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="w-full h-32 mb-4" />
                        <Skeleton className="w-3/4 h-6 mb-2" />
                        <Skeleton className="w-full h-4 mb-2" />
                        <Skeleton className="w-1/2 h-4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {trips.map((trip) => (
                    <Card key={trip.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={trip.imageUrl}
                            alt={trip.title}
                            className="w-32 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{trip.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {trip.startLocation} → {trip.endLocation}
                            </p>
                            <p className="text-sm mb-2">{trip.description}</p>
                            <div className="flex gap-2">
                              <Badge>{trip.duration}</Badge>
                              <Badge variant="outline">{trip.difficulty}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {demoStep === 'preferences' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Preferences & Cache</h3>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">First-Time User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Is First Visit:</strong> {isFirstVisit ? 'Yes' : 'No'}</p>
                      <p><strong>Show Experience:</strong> {shouldShowFirstTimeExperience ? 'Yes' : 'No'}</p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={completeOnboarding}
                          size="sm"
                          variant="outline"
                        >
                          Complete Onboarding
                        </Button>
                        <Button
                          onClick={resetFirstTimeUser}
                          size="sm"
                          variant="outline"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cache Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Has Cached Trips:</strong> {cacheStats.hasCachedTrips ? 'Yes' : 'No'}</p>
                      {cacheStats.hasCachedTrips && (
                        <>
                          <p><strong>Trip Count:</strong> {cacheStats.tripCount}</p>
                          <p><strong>Cache Age:</strong> {Math.round(cacheStats.cacheAge / 1000)}s</p>
                          <p><strong>Is Expired:</strong> {cacheStats.isExpired ? 'Yes' : 'No'}</p>
                        </>
                      )}
                      <Button
                        onClick={() => userPreferences.clearCache()}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        Clear Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}