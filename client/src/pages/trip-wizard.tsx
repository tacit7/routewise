import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { createDraftTrip, updateTrip, selectCurrentTripId } from "@/store/slices/tripSlice";
import Header from "@/components/header";
import { TripPlannerWizard } from "@/components/trip-wizard/TripPlannerWizard";
import { TripWizardData } from "@/types/trip-wizard";
import {
  transformWizardToRouteParams,
  createTripFromWizard,
  validateWizardForRouteCalculation,
  createRouteResultsUrl,
} from "@/lib/trip-wizard/wizard-integration";

export default function TripWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  // Debug auth state
  console.log('Trip Wizard Auth State:', { isAuthenticated, user });
  console.log('JWT Token:', localStorage.getItem('auth_token'));
  const dispatch = useDispatch<AppDispatch>();
  const currentTripId = useSelector(selectCurrentTripId);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  
  // Get trip type from localStorage (set by dashboard buttons)
  const tripType = localStorage.getItem("tripType") || "route";

  // Create draft trip when wizard starts (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(createDraftTrip(tripType))
        .unwrap()
        .then((trip: any) => {
          console.log('Draft trip created successfully:', trip);
        })
        .catch((error: any) => {
          console.error('Failed to create draft trip:', error);
        });
    } else {
      console.log('User not authenticated - skipping draft trip creation');
    }
  }, [dispatch, isAuthenticated, tripType]);

  const handleWizardComplete = async (wizardData: TripWizardData) => {
    // Handle explore mode - just show places around start location, no routing
    if (tripType === "explore") {
      setIsCalculating(true);
      
      try {
        const startLocationName = wizardData.startLocation?.main_text || "";
        
        // Store explore data for explore results page
        localStorage.setItem(
          "exploreData",
          JSON.stringify({
            startLocation: startLocationName,
            wizardPreferences: {
              tripType: wizardData.tripType,
              transportation: wizardData.transportation,
              lodging: wizardData.lodging,
              budgetRange: wizardData.budgetRange,
              intentions: wizardData.intentions,
              specialNeeds: wizardData.specialNeeds,
              accessibility: wizardData.accessibility,
            },
            fromWizard: true,
          })
        );
        
        // Navigate to explore results
        const exploreParams = new URLSearchParams({
          location: startLocationName,
        });
        
        setLocation(`/explore-results?${exploreParams.toString()}`);
        
        toast({
          title: "Ready to Explore!",
          description: `Finding interesting places around ${startLocationName}`,
        });
      } catch (error) {
        console.error("Error completing explore wizard:", error);
        toast({
          title: "Error",
          description: "Failed to start exploration. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
      return;
    }
    
    // Check if this is a flexible location trip with only starting location
    const isFlexibleSingleLocation =
      wizardData.flexibleLocations && wizardData.startLocation && !wizardData.endLocation;

    if (isFlexibleSingleLocation) {
      // Navigate to place results for flexible single location trips
      setIsCalculating(true);

      try {
        const startLocationName = wizardData.startLocation?.main_text || "";

        // Store place data for place results page
        localStorage.setItem(
          "placeData",
          JSON.stringify({
            placeName: startLocationName,
            placeId: wizardData.startLocation?.place_id,
            location: wizardData.startLocation?.geometry?.location,
            wizardPreferences: {
              tripType: wizardData.tripType,
              transportation: wizardData.transportation,
              lodging: wizardData.lodging,
              budgetRange: wizardData.budgetRange,
              intentions: wizardData.intentions,
              specialNeeds: wizardData.specialNeeds,
              accessibility: wizardData.accessibility,
            },
            fromWizard: true,
          })
        );

        // Navigate to place results with URL parameters
        const placeParams = new URLSearchParams({
          place: startLocationName,
        });

        if (wizardData.startLocation?.place_id) {
          placeParams.append("placeId", wizardData.startLocation.place_id);
        }

        if (wizardData.startLocation?.geometry?.location) {
          placeParams.append("lat", wizardData.startLocation.geometry.location.lat.toString());
          placeParams.append("lng", wizardData.startLocation.geometry.location.lng.toString());
        }

        setLocation(`/place-results?${placeParams.toString()}`);

        toast({
          title: "Trip Plan Complete!",
          description: `Exploring places around ${startLocationName}`,
        });
      } catch (error) {
        console.error("Error completing wizard:", error);
        toast({
          title: "Error",
          description: "Failed to load place information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Validate wizard data for route calculation
    const validation = validateWizardForRouteCalculation(wizardData);
    if (!validation.isValid) {
      toast({
        title: "Incomplete Information",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setLoadingStage("Calculating your route...");

    try {
      // Transform wizard data to route parameters
      const routeParams = transformWizardToRouteParams(wizardData);

      // Store basic route info immediately for optimistic display
      const immediateRouteData = {
        startCity: wizardData.startLocation?.main_text || "",
        endCity: wizardData.endLocation?.main_text || "",
        startLocation: routeParams.startLocation,
        endLocation: routeParams.endLocation,
        stops: routeParams.stops,
        routeData: {
          startCity: routeParams.startLocation,
          endCity: routeParams.endLocation,
          distance: "Calculating...",
          duration: "Calculating...",
          stops: routeParams.stops || [],
        },
        // No poisData - route-results will fetch fresh
        wizardPreferences: {
          tripType: wizardData.tripType,
          transportation: wizardData.transportation,
          lodging: wizardData.lodging,
          budgetRange: wizardData.budgetRange,
          intentions: wizardData.intentions,
          specialNeeds: wizardData.specialNeeds,
          accessibility: wizardData.accessibility,
        },
        fromWizard: true,
      };

      // Store immediate data for optimistic UI
      localStorage.setItem("routeData", JSON.stringify(immediateRouteData));

      // Update the draft trip with wizard data
      if (currentTripId) {
        const startLocationName = wizardData.startLocation?.main_text || "";
        const endLocationName = wizardData.endLocation?.main_text || "";
        
        const tripUpdateData = {
          route_data: {
            status: 'in_progress',
            wizard_data: wizardData,
            route_data: immediateRouteData,
            updated_at: new Date().toISOString()
          },
          start_city: startLocationName,
          end_city: endLocationName
        };
        dispatch(updateTrip({ tripId: currentTripId, updates: tripUpdateData }));
      }

      // Navigate immediately to show the basic route while data loads
      setLocation("/route-results");

      toast({
        title: "Loading Your Trip...",
        description: "Route displayed! We're still finding the best places for you.",
      });

      // Calculate route only - POIs will be fetched fresh by route-results page
      setLoadingStage("Calculating your route...");

      const routeResponse = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startLocation: routeParams.startLocation,
          endLocation: routeParams.endLocation,
          stops: routeParams.stops,
        }),
      });

      // Handle route data
      let routeData = null;
      if (routeResponse.ok) {
        routeData = await routeResponse.json();
        setLoadingStage("Route calculated! Preparing your trip...");
      } else {
        console.warn("Route calculation failed, using fallback data");
        // Provide basic route structure as fallback
        routeData = {
          startCity: routeParams.startLocation,
          endCity: routeParams.endLocation,
          distance: "unknown",
          duration: "unknown",
          stops: routeParams.stops || [],
          coordinates: [], // Empty coordinates for fallback
        };
      }

      // Create trip data with route information only - POIs will be fetched by route-results
      const tripData = createTripFromWizard(wizardData, {
        ...routeData,
        pois: [], // No POI data stored - route-results will fetch fresh
      });

      // Store only route configuration - no POI data to avoid stale cache
      const completeRouteData = {
        startCity: wizardData.startLocation?.main_text || "",
        endCity: wizardData.endLocation?.main_text || "",
        startLocation: routeParams.startLocation,
        endLocation: routeParams.endLocation,
        stops: routeParams.stops,
        routeData: routeData,
        // poisData removed - route-results will fetch fresh POI data
        wizardPreferences: {
          tripType: wizardData.tripType,
          transportation: wizardData.transportation,
          lodging: wizardData.lodging,
          budgetRange: wizardData.budgetRange,
          intentions: wizardData.intentions,
          specialNeeds: wizardData.specialNeeds,
          accessibility: wizardData.accessibility,
        },
        fromWizard: true,
        loadingComplete: true, // Flag to indicate route data is complete
      };

      localStorage.setItem("routeData", JSON.stringify(completeRouteData));

      // Trigger a storage event to notify the route results page of updates
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "routeData",
          newValue: JSON.stringify(completeRouteData),
        })
      );

      // Show success message - POIs will be loaded on route-results page
      if (routeData) {
        toast({
          title: "Trip Plan Complete!",
          description: "Your route is ready. Finding amazing places along the way...",
        });
      } else {
        toast({
          title: "Trip Created!",
          description: "Your trip has been saved with basic information.",
        });
      }
    } catch (error) {
      console.error("Error completing wizard:", error);
      toast({
        title: "Connection Issue",
        description: "Having trouble connecting to our services. Your trip may have limited data.",
        variant: "destructive",
      });

      // Even on error, try to provide basic functionality
      const routeParams = transformWizardToRouteParams(wizardData);
      localStorage.setItem(
        "routeData",
        JSON.stringify({
          startCity: wizardData.startLocation?.main_text || "",
          endCity: wizardData.endLocation?.main_text || "",
          startLocation: routeParams.startLocation,
          endLocation: routeParams.endLocation,
          stops: routeParams.stops,
          routeData: {
            startCity: routeParams.startLocation,
            endCity: routeParams.endLocation,
            distance: "unknown",
            duration: "unknown",
            stops: routeParams.stops || [],
          },
          // No poisData - route-results will fetch fresh
          wizardPreferences: {
            tripType: wizardData.tripType,
            transportation: wizardData.transportation,
            lodging: wizardData.lodging,
            budgetRange: wizardData.budgetRange,
            intentions: wizardData.intentions,
            specialNeeds: wizardData.specialNeeds,
            accessibility: wizardData.accessibility,
          },
          fromWizard: true,
        })
      );

      // Still navigate to results page so user isn't stuck
      setLocation("/route-results");
    } finally {
      setIsCalculating(false);
      setLoadingStage("");
    }
  };

  const handleWizardCancel = () => {
    // Return to previous page or dashboard
    setLocation("/dashboard");
  };

  if (isCalculating) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <Header
          leftContent={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWizardCancel}
              className="hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              style={{ color: 'var(--text)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          }
          centerContent={
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                Planning Your Trip
              </h1>
            </div>
          }
        />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <div className="bg-surface p-8 rounded-lg shadow-sm border border-border max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">{loadingStage || "Calculating Your Route"}</h3>
            <p className="text-slate-600">
              We're working on multiple things at once to get you the best results faster!
            </p>

            {/* Progressive loading indicators */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Route calculation</span>
                <div className="w-4 h-4">
                  {loadingStage.includes("Route found") || loadingStage.includes("amazing places") ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Finding places</span>
                <div className="w-4 h-4">
                  {loadingStage.includes("amazing places") ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : loadingStage.includes("Route found") || loadingStage.includes("discovering places") ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Preparing your trip</span>
                <div className="w-4 h-4">
                  {loadingStage.includes("amazing places") ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">This usually takes 5-15 seconds</div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return <TripPlannerWizard onComplete={handleWizardComplete} onCancel={handleWizardCancel} />;
}
