import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Fuel, 
  Cloud, 
  Plus, 
  Calculator, 
  Thermometer, 
  MapPin,
  Search,
  ArrowRight,
  DollarSign
} from "lucide-react";

// Mock gas price data
const GAS_PRICES = {
  national_avg: 3.45,
  state_avg: 3.67,
  trend: '+0.05'
};

// Mock weather data
const WEATHER_DATA = {
  city: 'San Francisco',
  temp: 68,
  condition: 'Sunny',
  icon: '☀️'
};

export default function QuickTools() {
  const [, setLocation] = useLocation();
  const [gasCalculatorOpen, setGasCalculatorOpen] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState(WEATHER_DATA.city);
  const [quickAddLocation, setQuickAddLocation] = useState('');
  
  // Gas calculator state
  const [distance, setDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [gasPrice, setGasPrice] = useState(GAS_PRICES.national_avg.toString());

  const calculateGasCost = () => {
    if (distance && mpg && gasPrice) {
      const gallons = parseFloat(distance) / parseFloat(mpg);
      const cost = gallons * parseFloat(gasPrice);
      return cost.toFixed(2);
    }
    return '0.00';
  };

  const handleQuickAdd = () => {
    if (quickAddLocation.trim()) {
      // Store the quick add location and navigate to explorer
      localStorage.setItem('exploreContext', JSON.stringify({
        type: 'quick-add',
        location: quickAddLocation.trim(),
        timestamp: Date.now()
      }));
      setLocation('/places-explorer');
    }
  };

  const handleWeatherCheck = () => {
    if (weatherLocation.trim()) {
      // In real app, would fetch weather data
      // For now, navigate to places explorer with weather context
      localStorage.setItem('exploreContext', JSON.stringify({
        type: 'weather-check',
        location: weatherLocation.trim(),
        timestamp: Date.now()
      }));
      setLocation('/places-explorer');
    }
  };

  return (
    <section className="py-8 section-background-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2">Quick Tools</h3>
          <p className="text-sm text-muted-foreground">Handy utilities for your trip planning</p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          
          {/* Gas Cost Estimator */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Fuel className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Gas Cost Estimator</h4>
                  <p className="text-xs text-muted-foreground">National avg: ${GAS_PRICES.national_avg}</p>
                </div>
              </div>
              
              {!gasCalculatorOpen ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Price:</span>
                    <Badge className="bg-green-100 text-green-700">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {GAS_PRICES.national_avg} {GAS_PRICES.trend}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => setGasCalculatorOpen(true)}
                    size="sm" 
                    className="w-full h-11"
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Calculate Trip Cost
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Miles"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="h-11 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="MPG"
                    value={mpg}
                    onChange={(e) => setMpg(e.target.value)}
                    className="h-11 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="$/gallon"
                    value={gasPrice}
                    onChange={(e) => setGasPrice(e.target.value)}
                    className="h-11 text-sm"
                  />
                  <div className="text-center py-2">
                    <span className="text-lg font-bold text-primary">
                      ${calculateGasCost()}
                    </span>
                  </div>
                  <Button 
                    onClick={() => setGasCalculatorOpen(false)}
                    variant="outline"
                    size="sm" 
                    className="w-full h-11"
                  >
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Forecast */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Cloud className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Weather Forecast</h4>
                  <p className="text-xs text-muted-foreground">Check destination weather</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{WEATHER_DATA.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{WEATHER_DATA.city}</div>
                      <div className="text-xs text-muted-foreground">{WEATHER_DATA.condition}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{WEATHER_DATA.temp}°F</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city..."
                    value={weatherLocation}
                    onChange={(e) => setWeatherLocation(e.target.value)}
                    className="h-11 text-sm flex-1"
                  />
                  <Button 
                    onClick={handleWeatherCheck}
                    size="sm"
                    className="px-3"
                  >
                    <Thermometer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Add Stop */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Plus className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Quick Add Stop</h4>
                  <p className="text-xs text-muted-foreground">Add a place to explore</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="City or landmark..."
                    value={quickAddLocation}
                    onChange={(e) => setQuickAddLocation(e.target.value)}
                    className="h-11 text-sm flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleQuickAdd();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleQuickAdd}
                    size="sm"
                    className="px-3"
                    disabled={!quickAddLocation.trim()}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={() => setLocation('/places-explorer')}
                  variant="outline"
                  size="sm" 
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Full Trip Planner
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground mb-2">Need more planning tools?</p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/trip-wizard')}
              className="text-primary hover:text-primary/80"
            >
              Full Trip Wizard
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/places-explorer')}
              className="text-primary hover:text-primary/80"
            >
              Places Explorer
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}