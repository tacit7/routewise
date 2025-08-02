import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import InterestTile from "./interest-tile";
import CustomizeInterestsModal from "./customize-interests-modal";
import SuggestedTrips from "./suggested-trips";
import { 
  FrontendInterestCategory, 
  FrontendSuggestedTrip
} from "@/types/interests";
import { 
  useUserInterests,
  useSuggestedTrips,
  userPreferences
} from "@/hooks/use-interests";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserInterestsProps {
  onRouteRequest?: (startLocation: string, endLocation: string) => void;
}

export default function UserInterests({ onRouteRequest }: UserInterestsProps) {
  // Local state for UI interactions
  const [localSelectedInterests, setLocalSelectedInterests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Use our data integration hooks
  const {
    availableCategories,
    enabledInterestNames,
    isLoading: isLoadingInterests,
    updateInterests,
    isUpdatingInterests
  } = useUserInterests();

  const {
    trips: personalizedTrips,
    isLoading: isLoadingTrips
  } = useSuggestedTrips(8);

  // Initialize local state - show all as unmarked initially
  useEffect(() => {
    // Always start with empty selection to show all as unmarked
    setLocalSelectedInterests([]);
    setHasUnsavedChanges(false);
  }, []);

  // Handle interest toggle in the UI (before saving)
  const handleInterestToggle = (categoryId: string) => {
    setLocalSelectedInterests(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Mark as having unsaved changes if different from server state
      setHasUnsavedChanges(true);
      return newSelection;
    });
  };

  // Save interests to server and update global state
  const handleSaveInterests = async () => {
    try {
      await updateInterests(localSelectedInterests);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Preferences saved!",
        description: `Updated your interests. Trip suggestions will be personalized accordingly.`,
      });
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle modal save (from customize modal)
  const handleModalSave = async (interests: string[]) => {
    try {
      await updateInterests(interests);
      setLocalSelectedInterests(interests);
      setHasUnsavedChanges(false);
      setIsModalOpen(false);
      
      toast({
        title: "Preferences saved!",
        description: `Updated your interests to personalize future route suggestions.`,
      });
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handlePlanTrip = (trip: FrontendSuggestedTrip) => {
    toast({
      title: "Planning your adventure!",
      description: `Starting route planning for ${trip.title}`,
    });
    
    if (onRouteRequest) {
      onRouteRequest(trip.startLocation, trip.endLocation);
    }
  };

  // Show loading state
  if (isLoadingInterests) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Interest Selection Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Choose Your Travel <span className="text-blue-600">Interests</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select what you love most about traveling. We'll recommend routes and places based on your preferences.
            </p>
          </motion.div>

          {/* Interest Categories Grid - All shown as unmarked initially */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {availableCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              >
                <InterestTile
                  category={category}
                  isSelected={localSelectedInterests.includes(category.id)}
                  onToggle={handleInterestToggle}
                  disabled={isUpdatingInterests}
                />
              </motion.div>
            ))}
          </div>

          {/* Selection Summary and Save Button */}
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              {localSelectedInterests.length > 0 
                ? `${localSelectedInterests.length} interest${localSelectedInterests.length !== 1 ? 's' : ''} selected`
                : 'No interests selected yet'
              }
            </p>
            
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center"
              >
                <Button
                  onClick={handleSaveInterests}
                  disabled={isUpdatingInterests || localSelectedInterests.length === 0}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isUpdatingInterests ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setIsModalOpen(true)}
                  variant="outline"
                  size="lg"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Settings size={20} className="mr-2" />
                  Advanced Options
                </Button>
              </motion.div>
            )}

            {!hasUnsavedChanges && localSelectedInterests.length === 0 && (
              <p className="text-slate-500 text-sm">
                Click on the categories above to select your interests, then save your preferences.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Current Saved Interests (if any) */}
      {enabledInterestNames.length > 0 && (
        <section className="py-8 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Your Current Saved Interests
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {enabledInterestNames.map(interest => (
                  <span 
                    key={interest}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Suggested Trips - Only show if user has saved interests */}
      {enabledInterestNames.length > 0 && (
        <SuggestedTrips
          trips={personalizedTrips}
          onPlanTrip={handlePlanTrip}
          isLoading={isLoadingTrips}
        />
      )}

      {/* Empty State for Trips */}
      {enabledInterestNames.length === 0 && (
        <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-md mx-auto">
              <Settings className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Save Your Interests First
              </h3>
              <p className="text-slate-600">
                Select and save your travel interests above to see personalized trip suggestions here.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Customize Modal */}
      <CustomizeInterestsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedInterests={localSelectedInterests}
        onSave={handleModalSave}
        availableCategories={availableCategories}
      />
    </div>
  );
}