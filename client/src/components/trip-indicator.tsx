import { useState } from "react";
import { Map, Sparkles } from "lucide-react";
import TripPlanner from "./trip-planner";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { usePersonalizedTrips } from "@/hooks/use-personalized-trips";

export default function TripIndicator() {
  const [isOpen, setIsOpen] = useState(false);

  // Use enhanced trip management hooks
  const { tripStats } = useTripPlaces();
  const { tripInsights, isPersonalized } = usePersonalizedTrips();

  const tripCount = tripStats.count;

  return (
    <>
      {tripCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
        >
          <div className="relative">
            <Map className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">
              {tripCount}
            </span>
            {isPersonalized && tripInsights.overallScore > 0 && (
              <span className="absolute -bottom-1 -left-1 bg-amber-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                <Sparkles className="h-2 w-2" />
              </span>
            )}
          </div>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="font-medium">
              View Trip ({tripCount} {tripCount === 1 ? 'place' : 'places'})
            </div>
            {isPersonalized && tripInsights.overallScore > 0 && (
              <div className="text-xs text-gray-300 mt-1">
                {tripInsights.overallScore}% personalized • {tripInsights.timeDistribution.estimatedDuration.toFixed(1)}h
              </div>
            )}
          </div>
        </button>
      )}

      {isOpen && <TripPlanner isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}