import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TabControlledRouteMap } from "@/components/maps/TabControlledRouteMap";
import { getDayColor } from "@/utils/MultiRouteRenderer";
import { 
  Route, 
  MapPin, 
  Clock, 
  Navigation, 
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";
import type { MultiDayRouteData, ItineraryDay } from "@/types/schema";

interface TripPlannerWithTabsProps {
  routeData: MultiDayRouteData;
  className?: string;
  mapHeight?: string;
}

interface DayStatsProps {
  day: ItineraryDay;
  color: string;
}

// Component to display day statistics
const DayStats: React.FC<DayStatsProps> = ({ day, color }) => {
  const route = day.route;
  const waypointCount = day.waypoints.length;
  const poiCount = day.pois?.length || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-semibold">{day.title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {route && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Route className="h-4 w-4 text-muted-foreground" />
              <span>{route.totalDistance}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{route.totalDuration}</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{waypointCount} stops</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <span>{poiCount} POIs</span>
        </div>
      </div>

      {day.waypoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Route</h4>
          <div className="space-y-1">
            {day.waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{waypoint.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for the summary of all days
const AllDaysSummary: React.FC<{ routeData: MultiDayRouteData }> = ({ routeData }) => {
  const totalDistance = useMemo(() => {
    return routeData.itinerary.itinerary.reduce((total, day) => {
      if (day.route?.totalDistance) {
        // Extract numeric value from distance string (e.g., "150.5 km" -> 150.5)
        const match = day.route.totalDistance.match(/([0-9.]+)/);
        if (match) {
          return total + parseFloat(match[1]);
        }
      }
      return total;
    }, 0);
  }, [routeData]);

  const totalWaypoints = routeData.itinerary.itinerary.reduce(
    (total, day) => total + day.waypoints.length, 0
  );

  const totalPois = routeData.allPois.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Trip Overview</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{routeData.itinerary.totalDays}</div>
          <div className="text-sm text-muted-foreground">Days</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{totalDistance.toFixed(0)} km</div>
          <div className="text-sm text-muted-foreground">Total Distance</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{totalWaypoints}</div>
          <div className="text-sm text-muted-foreground">Total Stops</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{totalPois}</div>
          <div className="text-sm text-muted-foreground">POIs Found</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Days at a Glance</h4>
        {routeData.itinerary.itinerary.map((day) => {
          const color = getDayColor(day.day);
          
          return (
            <div key={day.day} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <div className="font-medium text-sm">Day {day.day}</div>
                  <div className="text-xs text-muted-foreground">{day.title}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{day.route?.totalDistance || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">{day.waypoints.length} stops</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TripPlannerWithTabs: React.FC<TripPlannerWithTabsProps> = ({
  routeData,
  className = "",
  mapHeight = "500px",
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Determine which days to show on the map
  const activeDays = useMemo(() => {
    if (activeTab === "all") {
      return "all" as const;
    }
    const dayNumber = parseInt(activeTab.replace("day-", ""), 10);
    return isNaN(dayNumber) ? [] : [dayNumber];
  }, [activeTab]);

  // Color utility is imported as getDayColor function

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map Section */}
          <div className="flex-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Multi-Day Route
                  <Badge variant="secondary">
                    {activeTab === "all" ? "All Days" : `Day ${activeTab.replace("day-", "")}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TabControlledRouteMap
                  routeData={routeData}
                  activeDays={activeDays}
                  height={mapHeight}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Tabs and Details */}
          <div className="w-full lg:w-80">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tab Navigation */}
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 gap-1 h-auto p-2">
                  <TabsTrigger value="all" className="flex items-center gap-2 h-12 px-4 justify-start">
                    <Eye className="h-4 w-4" />
                    <span>All Days</span>
                  </TabsTrigger>
                  {routeData.itinerary.itinerary.map((day) => (
                    <TabsTrigger
                      key={day.day}
                      value={`day-${day.day}`}
                      className="flex items-center gap-2 h-12 px-4 justify-start"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getDayColor(day.day) }}
                      />
                      <span>Day {day.day}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <Separator />

                {/* Tab Content */}
                <TabsContent value="all" className="mt-0">
                  <AllDaysSummary routeData={routeData} />
                </TabsContent>

                {routeData.itinerary.itinerary.map((day) => (
                  <TabsContent key={day.day} value={`day-${day.day}`} className="mt-0">
                    <DayStats 
                      day={day} 
                      color={getDayColor(day.day)} 
                    />
                  </TabsContent>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};