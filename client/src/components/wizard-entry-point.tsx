import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MapPin, Clock, Users, Settings, ArrowRight } from "lucide-react";

interface WizardEntryPointProps {
  variant?: "hero" | "card" | "button";
  className?: string;
}

export function WizardEntryPoint({ variant = "card", className = "" }: WizardEntryPointProps) {
  const [, setLocation] = useLocation();

  const handleStartWizard = () => {
    setLocation("/trip-planner");
  };

  if (variant === "button") {
    return (
      <Button
        onClick={handleStartWizard}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${className}`}
      >
        <Settings className="w-4 h-4 mr-2" />
        Advanced Trip Planner
      </Button>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`text-center ${className}`}>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            Want a More Detailed Trip Plan?
          </h3>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Use our advanced Trip Planner Wizard for personalized recommendations, 
            budget planning, and accessibility options.
          </p>
        </div>
        
        <Button
          onClick={handleStartWizard}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
        >
          <Settings className="w-5 h-5 mr-2" />
          Launch Trip Wizard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Advanced Trip Planner
          </h3>
          
          <p className="text-slate-600 mb-6">
            Get personalized recommendations with our step-by-step wizard
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="w-4 h-4 mr-3 text-blue-500" />
              <span>Multiple stops and waypoints</span>
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <Clock className="w-4 h-4 mr-3 text-green-500" />
              <span>Flexible dates and timing</span>
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <Users className="w-4 h-4 mr-3 text-purple-500" />
              <span>Accessibility and special needs</span>
            </div>
          </div>
          
          <Button
            onClick={handleStartWizard}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Start Planning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default WizardEntryPoint;