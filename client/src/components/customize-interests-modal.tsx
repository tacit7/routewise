import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InterestTile from "./interest-tile";
import { CustomizeInterestsModalProps } from "@/types/interests";
import { Loader2, Settings } from "lucide-react";

/**
 * CustomizeInterestsModal - A pure, controlled modal component for interest customization
 * 
 * @description Modal dialog with grid layout for selecting travel interests with accessibility support
 * @example
 * ```tsx
 * <CustomizeInterestsModal
 *   isOpen={true}
 *   onClose={() => {}}
 *   selectedInterests={['restaurants', 'museums']}
 *   onSave={(interests) => console.log('Saved:', interests)}
 *   availableCategories={categories}
 * />
 * ```
 */
const CustomizeInterestsModal = React.memo<CustomizeInterestsModalProps>(({
  isOpen,
  onClose,
  selectedInterests,
  onSave,
  availableCategories
}) => {
  const [localSelectedInterests, setLocalSelectedInterests] = useState<string[]>(selectedInterests);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSelectedInterests(selectedInterests);
    setHasChanges(false);
  }, [selectedInterests, isOpen]);

  useEffect(() => {
    const hasChanges = JSON.stringify(localSelectedInterests.sort()) !== JSON.stringify(selectedInterests.sort());
    setHasChanges(hasChanges);
  }, [localSelectedInterests, selectedInterests]);

  const handleToggleInterest = useCallback((categoryId: string) => {
    setLocalSelectedInterests(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(localSelectedInterests);
      onClose();
    } catch (error) {
      console.error('Failed to save interests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setLocalSelectedInterests(selectedInterests);
    setHasChanges(false);
    onClose();
  };

  const selectedCount = localSelectedInterests.length;
  const totalCount = availableCategories.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        aria-describedby="interests-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings size={24} className="text-blue-600" aria-hidden="true" />
            Customize Your Interests
          </DialogTitle>
          <DialogDescription id="interests-modal-description" className="text-base">
            Select the types of places you'd like to discover on your routes. 
            You can change these preferences anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Selection Summary */}
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {selectedCount} of {totalCount} selected
            </Badge>
            {selectedCount === 0 && (
              <span className="text-amber-600 text-sm font-medium">
                Select at least one interest to personalize your routes
              </span>
            )}
          </div>
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalSelectedInterests([])}
              className="text-slate-600 hover:text-slate-800"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Interest Grid */}
        <div className="flex-1 overflow-y-auto" role="group" aria-label="Interest categories">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
            <AnimatePresence>
              {availableCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <InterestTile
                    category={category}
                    isSelected={localSelectedInterests.includes(category.id)}
                    onToggle={handleToggleInterest}
                    isFirstVisit={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <div className="flex-1 text-sm text-slate-600">
            {hasChanges && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-600 font-medium"
              >
                You have unsaved changes
              </motion.span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || selectedCount === 0 || !hasChanges}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CustomizeInterestsModal.displayName = 'CustomizeInterestsModal';

export default CustomizeInterestsModal;