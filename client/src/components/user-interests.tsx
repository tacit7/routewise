import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import InterestTile from "./interest-tile";
import CustomizeInterestsModal from "./customize-interests-modal";
import SuggestedTrips from "./suggested-trips";
import { 
  DEFAULT_INTEREST_CATEGORIES, 
  SuggestedTrip,
  InterestCategory 
} from "@/types/interests";
import { 
  MOCK_SUGGESTED_TRIPS,
  getPersonalizedTrips 
} from "@/mocks/interests-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserInterestsProps {
  onRouteRequest?: (startLocation: string, endLocation: string) => void;
}

export default function UserInterests({ onRouteRequest }: UserInterestsProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [personalizedTrips, setPersonalizedTrips] = useState<SuggestedTrip[]>([]);
  const { toast } = useToast();

  // Initialize user interests
  useEffect(() => {
    const savedInterests = localStorage.getItem('userInterests');
    const firstVisit = localStorage.getItem('firstVisit');
    
    if (savedInterests) {
      const interests = JSON.parse(savedInterests);
      setSelectedInterests(interests);
      setPersonalizedTrips(getPersonalizedTrips(interests));
      setShowFloatingCTA(true);
    } else {
      // All categories enabled by default for new users
      const allCategories = DEFAULT_INTEREST_CATEGORIES.map(cat => cat.id);
      setSelectedInterests(allCategories);
      setPersonalizedTrips(getPersonalizedTrips(allCategories));
      setIsFirstVisit(!firstVisit);
      if (!firstVisit) {
        localStorage.setItem('firstVisit', 'true');
      }
    }
  }, []);

  // Update personalized trips when interests change
  useEffect(() => {
    setPersonalizedTrips(getPersonalizedTrips(selectedInterests));
  }, [selectedInterests]);

  const handleSaveInterests = (interests: string[]) => {
    setSelectedInterests(interests);
    localStorage.setItem('userInterests', JSON.stringify(interests));
    setShowFloatingCTA(true);
    
    toast({
      title: "Preferences saved!",
      description: `Updated your interests to personalize future route suggestions.`,
    });
  };

  const handlePlanTrip = (trip: SuggestedTrip) => {
    toast({
      title: "Planning your adventure!",
      description: `Starting route planning for ${trip.title}`,
    });
    
    if (onRouteRequest) {
      onRouteRequest(trip.startLocation, trip.endLocation);
    }
  };

  const selectedCategories = DEFAULT_INTEREST_CATEGORIES.filter(
    cat => selectedInterests.includes(cat.id)
  );

  return (
    <div className="space-y-16">
      {/* Quick Interests Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Your Travel <span className="text-blue-600">Interests</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We'll recommend routes and places based on what you love most about traveling.
            </p>
          </motion.div>

          {/* Interest Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {selectedCategories.slice(0, 8).map((category, index) => (
              <motion.div
                key={category.id}
                initial={isFirstVisit ? { opacity: 0, scale: 0.8 } : false}
                animate={isFirstVisit ? { opacity: 1, scale: 1 } : {}}
                transition={isFirstVisit ? { 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                } : {}}
              >
                <InterestTile
                  category={category}
                  isSelected={true}
                  onToggle={() => {}} // Read-only in preview
                  disabled={true}
                />
              </motion.div>
            ))}
          </div>

          {/* Customize Button */}
          <div className="text-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="lg"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Settings size={20} className="mr-2" />
              Customize Your Interests
            </Button>
          </div>
        </div>
      </section>

      {/* Suggested Trips */}
      <SuggestedTrips
        trips={personalizedTrips}
        onPlanTrip={handlePlanTrip}
      />

      {/* Floating Customize CTA */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className={cn(
                "rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white",
                "px-6 py-3 font-medium transition-all duration-300",
                "hover:scale-105 hover:shadow-xl"
              )}
            >
              <Settings size={20} className="mr-2" />
              Customize
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customize Modal */}
      <CustomizeInterestsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedInterests={selectedInterests}
        onSave={handleSaveInterests}
        availableCategories={DEFAULT_INTEREST_CATEGORIES}
      />
    </div>
  );
}