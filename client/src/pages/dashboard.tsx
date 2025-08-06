import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Header from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Route, CheckCircle, Settings } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Use the consolidated dashboard data hook
  const { data: dashboardData, isLoading, error } = useDashboardData();
  
  // Extract data from consolidated response
  const userTrips = dashboardData?.trips.user_trips || [];
  const suggestedTrips = dashboardData?.trips.suggested_trips || [];
  const enabledInterestNames = dashboardData?.suggested_interests || [];
  const stats = dashboardData?.stats;
  const categories = dashboardData?.categories;
  
  const hasUserTrips = userTrips.length > 0;
  const hasTripsError = !!error;
  const isLoadingSuggested = isLoading;
  const isLoadingInterests = isLoading;
  const isLoadingUserTrips = isLoading;

  // Simple first-time user logic based on dashboard data
  const hasInterestsConfigured = enabledInterestNames.length > 0;
  const shouldShowFirstTimeExperience = !hasInterestsConfigured && !isLoading;

  const handlePlanRoadTrip = () => {
    setLocation("/trip-wizard");
  };

  const handleHelpMePlan = () => {
    setLocation("/interests");
  };

  const handleCustomizeInterests = () => {
    setLocation("/interests");
  };

  const handleStartTrip = (trip: any) => {
    // Store route data and navigate to planning
    localStorage.setItem(
      "routeRequest",
      JSON.stringify({
        startLocation: trip.start_city,
        endLocation: trip.end_city,
        timestamp: Date.now(),
      })
    );

    setLocation("/");
  };

  // Show loading while checking data
  if (isLoadingSuggested || isLoadingInterests || isLoadingUserTrips) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show empty state for users with no trips
  if (!hasUserTrips) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-120px)] flex flex-col">
          {/* Empty State Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-16 flex-shrink-0">
            {/* Heading */}
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Let's get your next adventure started!
            </h1>

            {/* Subtext */}
            <p className="text-xl text-gray-600 mb-12">
              You haven't planned any trips yet. Start your first adventure
              below.
            </p>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={handlePlanRoadTrip}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-lg font-medium text-xl flex items-center justify-center"
              >
                <Route className="w-6 h-6 mr-3" />
                Start Planning
              </Button>
            </div>

            {/* Trip Planning Icon */}
            <div className="w-64 flex justify-center mx-auto">
              <img
                src="/planning.png"
                alt="Route planning illustration with road sign and map"
                className="w-sm h-auto drop-shadow-lg"
              />
            </div>

            {/* Personalize Section - Only show for first-time users or users without interests */}
            {(shouldShowFirstTimeExperience || !hasInterestsConfigured) && (
              <section className="mt-16">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Personalize Your Trip Suggestions
                  </h2>
                </div>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Tell us what you're into to get tailored recommendations.
                </p>

                <Button
                  onClick={handleCustomizeInterests}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Customize Interests
                </Button>
              </section>
            )}
          </div>

          {/* Spacer to push Suggested Trips to bottom */}
          <div className="flex-grow"></div>

          {/* Suggested Trips Section */}
          <section className="text-center flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Suggested Trips
            </h2>

            {hasTripsError ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Route className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Failed to load suggestions
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't load your personalized trip suggestions. Please
                    try again later.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mr-2"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleCustomizeInterests}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Interests
                  </Button>
                </div>
              </div>
            ) : isLoadingSuggested ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suggestedTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    <div className="relative h-48">
                      <img
                        src={trip.image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {trip.start_city} to {trip.end_city}
                      </p>
                      <p
                        className="text-sm text-gray-700 mb-4 overflow-hidden flex-grow"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {trip.description}
                      </p>
                      <Button
                        onClick={() => handleStartTrip(trip)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                      >
                        Start This Trip
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No trips available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Customize your interests to get personalized trip
                    suggestions.
                  </p>
                  <Button
                    onClick={handleCustomizeInterests}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Set Your Interests
                  </Button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-120px)] flex flex-col">
        <div className="text-center flex-shrink-0">
          {/* Top Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
            <Button
              onClick={handlePlanRoadTrip}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
            >
              <Route className="w-5 h-5 mr-2" />
              Plan a Road Trip
            </Button>
            <Button
              onClick={handleHelpMePlan}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Help Me Plan a Trip
            </Button>
          </div>

          {/* Personalize Section - Only show for first-time users or users without interests */}
          {(shouldShowFirstTimeExperience || !hasInterestsConfigured) && (
            <section className="mb-12">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Personalize Your Trip Suggestions
                </h2>
              </div>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Tell us what you're into to get tailored recommendations.
              </p>

              <Button
                onClick={handleCustomizeInterests}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Customize Interests
              </Button>
            </section>
          )}
        </div>

        {/* Spacer to push Suggested Trips to bottom */}
        <div className="flex-grow"></div>

        {/* Suggested Trips Section */}
        <section className="text-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Suggested Trips
          </h2>

          {hasTripsError ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Route className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to load suggestions
                </h3>
                <p className="text-gray-600 mb-6">
                  We couldn't load your personalized trip suggestions. Please
                  try again later.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mr-2"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleCustomizeInterests}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update Interests
                </Button>
              </div>
            </div>
          ) : isLoadingSuggested ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suggestedTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="relative h-48">
                    <img
                      src={trip.image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {trip.start_city} to {trip.end_city}
                    </p>
                    <p
                      className="text-sm text-gray-700 mb-4 overflow-hidden flex-grow"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {trip.description}
                    </p>
                    <Button
                      onClick={() => handleStartTrip(trip)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                    >
                      Start This Trip
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No trips available
                </h3>
                <p className="text-gray-600 mb-6">
                  Customize your interests to get personalized trip suggestions.
                </p>
                <Button
                  onClick={handleCustomizeInterests}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Set Your Interests
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
