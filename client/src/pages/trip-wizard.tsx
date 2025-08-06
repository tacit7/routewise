import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { TripPlannerWizard } from "@/components/trip-wizard/TripPlannerWizard";
import { TripWizardData } from "@/types/trip-wizard";
import { 
  transformWizardToRouteParams, 
  createTripFromWizard, 
  validateWizardForRouteCalculation,
  createRouteResultsUrl 
} from "@/lib/trip-wizard/wizard-integration";

export default function TripWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");

  const handleWizardComplete = async (wizardData: TripWizardData) => {
    // Check if this is a flexible location trip with only starting location
    const isFlexibleSingleLocation = wizardData.flexibleLocations && 
      wizardData.startLocation && 
      !wizardData.endLocation;

    if (isFlexibleSingleLocation) {
      // Navigate to place results for flexible single location trips
      setIsCalculating(true);
      
      try {
        const startLocationName = wizardData.startLocation?.main_text || "";
        
        // Store place data for place results page
        localStorage.setItem("placeData", JSON.stringify({
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
        }));

        // Navigate to place results with URL parameters
        const placeParams = new URLSearchParams({
          place: startLocationName,
        });
        
        if (wizardData.startLocation?.place_id) {
          placeParams.append('placeId', wizardData.startLocation.place_id);
        }
        
        if (wizardData.startLocation?.geometry?.location) {
          placeParams.append('lat', wizardData.startLocation.geometry.location.lat.toString());
          placeParams.append('lng', wizardData.startLocation.geometry.location.lng.toString());
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
        poisData: [], // Will be populated as data arrives
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
      
      // Navigate immediately to show the basic route while data loads
      setLocation("/route-results");
      
      toast({
        title: "Loading Your Trip...",
        description: "Route displayed! We're still finding the best places for you.",
      });

      // Start both API calls simultaneously for better performance
      setLoadingStage("Finding the best route and discovering places...");
      
      const [routeResponse, poisResponse] = await Promise.allSettled([
        // Calculate route using existing API
        fetch("/api/route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startLocation: routeParams.startLocation,
            endLocation: routeParams.endLocation,
            stops: routeParams.stops,
          }),
        }),
        // Fetch POIs for the route in parallel
        fetch(
          `/api/pois?startLocation=${encodeURIComponent(routeParams.startLocation)}&endLocation=${encodeURIComponent(routeParams.endLocation)}`
        )
      ]);

      // Handle route data
      let routeData = null;
      if (routeResponse.status === 'fulfilled' && routeResponse.value.ok) {
        routeData = await routeResponse.value.json();
        setLoadingStage("Route found! Loading points of interest...");
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

      // Handle POI data with graceful degradation
      let poisData = [];
      if (poisResponse.status === 'fulfilled' && poisResponse.value.ok) {
        poisData = await poisResponse.value.json();
        setLoadingStage(`Found ${poisData.length} amazing places along your route!`);
      } else {
        console.warn("POI fetch failed, proceeding with route only");
        setLoadingStage("Route ready! Places data will load in the background.");
        // Continue with empty POI data - user can still see the route
      }

      // Create trip data with route and POI information
      const tripData = createTripFromWizard(wizardData, {
        ...routeData,
        pois: poisData,
      });

      // Update stored data with complete information (user is already on route results page)
      const completeRouteData = {
        startCity: wizardData.startLocation?.main_text || "",
        endCity: wizardData.endLocation?.main_text || "",
        startLocation: routeParams.startLocation,
        endLocation: routeParams.endLocation,
        stops: routeParams.stops,
        routeData: routeData,
        poisData: poisData,
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
        loadingComplete: true, // Flag to indicate data is complete
      };

      localStorage.setItem("routeData", JSON.stringify(completeRouteData));
      
      // Trigger a storage event to notify the route results page of updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'routeData',
        newValue: JSON.stringify(completeRouteData)
      }));

      // Show success message based on what data we have
      if (poisData.length > 0) {
        toast({
          title: "Trip Plan Complete!",
          description: `Found ${poisData.length} amazing places along your route`,
        });
      } else if (routeData) {
        toast({
          title: "Route Ready!",
          description: "Your route is ready. Places will continue loading in the background.",
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
      localStorage.setItem("routeData", JSON.stringify({
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
        poisData: [],
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
      }));
      
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">
              {loadingStage || "Calculating Your Route"}
            </h3>
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
            
            <div className="mt-4 text-xs text-slate-400">
              This usually takes 5-15 seconds
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TripPlannerWizard
      onComplete={handleWizardComplete}
      onCancel={handleWizardCancel}
    />
  );
}