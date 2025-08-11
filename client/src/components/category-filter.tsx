import React, { useState } from "react";
import { 
  UtensilsCrossed, 
  TreePine, 
  Bed, 
  Building, 
  Gamepad2,
  MapPin,
  ShoppingBag,
  Car,
  Heart,
  MoreHorizontal 
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

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-card border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs font-medium mr-2" style={{ color: 'var(--text-muted)' }}>RouteWise</div>
        
        {/* Category Icons */}
        <div className="flex items-center gap-1">
          {categories.map(({ id, label, description, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange(id === selectedCategory ? "all" : id)}
              className={cn(
                "w-10 h-10 rounded-full p-0 flex items-center justify-center transition-all",
                selectedCategory === id
                  ? "text-white"
                  : ""
              )}
              style={selectedCategory === id 
                ? { 
                    backgroundColor: 'var(--primary)', 
                    color: 'var(--primary-foreground)'
                  }
                : { 
                    color: 'var(--text-muted)'
                  }
              }
              onMouseEnter={(e) => {
                if (selectedCategory !== id) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
              title={`${label}: ${description}`}
              aria-label={`Filter by ${label}. ${description}. ${selectedCategory === id ? 'Currently selected' : 'Click to select'}`}
              aria-pressed={selectedCategory === id}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          
          {/* More Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 text-xs ml-1 transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-50)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Open category filter modal for more options"
            aria-expanded={isModalOpen}
          >
            More
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