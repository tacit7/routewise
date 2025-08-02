import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { InterestTileProps } from "@/types/interests";
import { cn } from "@/lib/utils";

/**
 * InterestTile - A pure, controlled component for displaying interest categories
 * 
 * @description Photographic tile with toggle functionality, smooth animations, and full accessibility
 * @example
 * ```tsx
 * <InterestTile
 *   category={{ id: 'restaurants', name: 'Restaurants', imageUrl: '...', description: '...' }}
 *   isSelected={true}
 *   onToggle={(categoryId) => console.log('Toggled:', categoryId)}
 *   isFirstVisit={false}
 *   disabled={false}
 * />
 * ```
 */
const InterestTile = React.memo<InterestTileProps>(({
  category,
  isSelected,
  onToggle,
  isFirstVisit = false,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled) {
      onToggle(category.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onToggle(category.id);
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${category.name} interest category`}
      aria-describedby={category.description ? `${category.id}-description` : undefined}
      initial={isFirstVisit ? { scale: 0.8, opacity: 0 } : false}
      animate={isFirstVisit ? { scale: 1, opacity: 1 } : {}}
      transition={isFirstVisit ? { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: Math.random() * 0.5 // Stagger animation
      } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={cn(
        "group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300",
        "aspect-square w-full",
        // Focus indicators for accessibility
        "focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        isSelected && "ring-4 ring-blue-500 ring-offset-2",
        !disabled && "hover:shadow-lg hover:scale-105"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url(${category.imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Selection Indicator */}
        <div className="flex justify-end">
          <motion.div
            initial={false}
            animate={{
              scale: isSelected ? 1 : 0,
              opacity: isSelected ? 1 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Check size={16} className="text-white" />
          </motion.div>
        </div>
        
        {/* Category Name */}
        <div className="space-y-1">
          <h3 className="text-white font-semibold text-lg leading-tight">
            {category.name}
          </h3>
          {category.description && (
            <p 
              id={`${category.id}-description`}
              className="text-white/80 text-sm leading-tight line-clamp-2"
            >
              {category.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Hover Effect Overlay */}
      {!disabled && (
        <div className={cn(
          "absolute inset-0 bg-blue-500/20 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100"
        )} />
      )}
    </motion.div>
  );
});

InterestTile.displayName = 'InterestTile';

export default InterestTile;