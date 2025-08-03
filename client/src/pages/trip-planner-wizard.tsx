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

export default function TripPlannerWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  const handleWizardComplete = async (wizardData: TripWizardData) => {
    // Validate wizard data
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

    try {
      // Transform wizard data to route parameters
      const routeParams = transformWizardToRouteParams(wizardData);

      // Calculate route using existing API
      const response = await fetch("/api/route", {
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

      if (!response.ok) {
        throw new Error("Route calculation failed");
      }

      const routeData = await response.json();

      // Fetch POIs for the route
      const poisResponse = await fetch(
        `/api/pois?startLocation=${encodeURIComponent(routeParams.startLocation)}&endLocation=${encodeURIComponent(routeParams.endLocation)}`
      );

      let poisData = [];
      if (poisResponse.ok) {
        poisData = await poisResponse.json();
      }

      // Create trip data with route and POI information
      const tripData = createTripFromWizard(wizardData, {
        ...routeData,
        pois: poisData,
      });

      // Store trip data for route results page (using the expected key)
      localStorage.setItem("routeData", JSON.stringify({
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
      }));

      // Navigate to route results
      setLocation("/route-results");

      toast({
        title: "Trip Plan Complete!",
        description: `Found ${poisData.length} places along your route`,
      });

    } catch (error) {
      console.error("Error completing wizard:", error);
      toast({
        title: "Error",
        description: "Failed to calculate route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleWizardCancel = () => {
    // Return to previous page or dashboard
    setLocation("/dashboard");
  };

  if (isCalculating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Calculating Your Route</h3>
            <p className="text-slate-600">
              We're finding the best route and discovering amazing places along the way...
            </p>
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