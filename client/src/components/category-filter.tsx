import React, { useState, useEffect, useRef } from "react";
import { 
  UtensilsCrossed, 
  Bed, 
  Building, 
  Gamepad2,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CategoryFilterModal from "./category-filter-modal";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { 
    id: "restaurant", 
    label: "Food", 
    description: "Restaurants, cafes, and dining experiences",
    icon: UtensilsCrossed 
  },
  { 
    id: "tourist_attraction", 
    label: "Attractions", 
    description: "Tourist attractions, landmarks, and points of interest",
    icon: MapPin 
  },
  { 
    id: "lodging", 
    label: "Lodging", 
    description: "Hotels, motels, and accommodation options",
    icon: Bed 
  },
  { 
    id: "museum", 
    label: "Culture", 
    description: "Museums, galleries, and cultural sites",
    icon: Building 
  },
  { 
    id: "amusement_park", 
    label: "Entertainment", 
    description: "Amusement parks, entertainment venues, and attractions",
    icon: Gamepad2 
  },
];

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange 
}: CategoryFilterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    selectedCategory === "all" ? [] : [selectedCategory]
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCategories, setVisibleCategories] = useState(categories.length);

  // Responsive category visibility based on container width and screen size
  useEffect(() => {
    const updateVisibleCategories = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const screenWidth = window.innerWidth;
      
      // Calculate how many categories can fit based on container width and screen size
      let maxVisible = categories.length;
      
      if (screenWidth < 640) {
        // Mobile: Show fewer categories, prioritize important ones
        maxVisible = containerWidth < 200 ? 2 : 3;
      } else if (screenWidth < 1024) {
        // Tablet: Show more categories
        maxVisible = containerWidth < 300 ? 3 : 4;
      } else {
        // Desktop: Show all categories if there's space
        maxVisible = containerWidth < 400 ? 4 : categories.length;
      }
      
      setVisibleCategories(Math.min(maxVisible, categories.length));
      setContainerWidth(containerWidth);
    };

    // Initial calculation
    updateVisibleCategories();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateVisibleCategories);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateVisibleCategories);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateVisibleCategories);
    };
  }, []);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    // For now, just use the first selected category for the existing single-category filter
    // In the future, this could be enhanced to support multiple categories
    if (categories.length > 0) {
      onCategoryChange(categories[0]);
    } else {
      onCategoryChange("all");
    }
  };

  // Prioritize categories - show most important ones first when space is limited
  const prioritizedCategories = [
    categories[0], // restaurant (most common)
    categories[1], // tourist_attraction
    categories[2], // lodging
    categories[3], // museum
    categories[4], // amusement_park
  ].filter(Boolean);

  const displayCategories = prioritizedCategories.slice(0, visibleCategories);
  const hasHiddenCategories = visibleCategories < categories.length;

  return (
    <>
      <div className="flex items-center gap-2 p-2 sm:p-3 bg-card border-b border-border" ref={containerRef}>
        {/* Category Icons */}
        <div className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide w-full">
          {/* Fade indicators for scroll overflow */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none opacity-0 transition-opacity" 
               style={{ opacity: containerRef.current?.scrollLeft ? 0.7 : 0 }} />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none opacity-0 transition-opacity" 
               style={{ opacity: hasHiddenCategories || (containerRef.current && containerRef.current.scrollLeft < containerRef.current.scrollWidth - containerRef.current.clientWidth) ? 0.7 : 0 }} />
          
          {displayCategories.map(({ id, label, description, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange(id === selectedCategory ? "all" : id)}
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0 flex items-center justify-center transition-all flex-shrink-0",
                "touch-manipulation", // Better touch targets
                selectedCategory === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
              title={`${label}: ${description}`}
              aria-label={`Filter by ${label}. ${description}. ${selectedCategory === id ? 'Currently selected' : 'Click to select'}`}
              aria-pressed={selectedCategory === id}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          ))}
          
          {/* More Button - Show count when categories are hidden */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="px-2 sm:px-3 py-1 text-xs ml-1 transition-all flex-shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary touch-manipulation"
            aria-label={`Open category filter modal for more options${hasHiddenCategories ? ` (${categories.length - visibleCategories} more categories)` : ''}`}
            aria-expanded={isModalOpen}
          >
            {hasHiddenCategories ? `+${categories.length - visibleCategories}` : 'More'}
          </Button>
        </div>
      </div>

      <CategoryFilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
      />
    </>
  );
}