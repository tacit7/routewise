import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search } from "lucide-react";

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const categoryHierarchy = [
  {
    id: "food_drink",
    name: "Food & Drink",
    subcategories: [
      { id: "restaurant", name: "Restaurants" },
      { id: "cafe", name: "Cafes" },
      { id: "bar", name: "Bars & Breweries" },
    ],
  },
  {
    id: "lodging",
    name: "Lodging",
    subcategories: [
      { id: "lodging", name: "Hotels" },
      { id: "campground", name: "Campgrounds" },
    ],
  },
  {
    id: "culture_entertainment",
    name: "Culture & Entertainment",
    subcategories: [
      { id: "museum", name: "Museums" },
      { id: "theater", name: "Theaters" },
      { id: "tourist_attraction", name: "Attractions" },
      { id: "amusement_park", name: "Entertainment" },
    ],
  },
  {
    id: "nature_outdoors",
    name: "Nature & Outdoors",
    subcategories: [
      { id: "park", name: "Parks" },
      { id: "natural_feature", name: "Natural Features" },
    ],
  },
];

export default function CategoryFilterModal({
  isOpen,
  onClose,
  selectedCategories,
  onCategoriesChange,
}: CategoryFilterModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(selectedCategories);

  const handleCategoryToggle = (categoryId: string) => {
    setLocalSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleClearAll = () => {
    setLocalSelectedCategories([]);
  };

  const handleApplyFilters = () => {
    onCategoriesChange(localSelectedCategories);
    onClose();
  };

  const filteredCategories = categoryHierarchy.map(category => ({
    ...category,
    subcategories: category.subcategories.filter(sub =>
      searchQuery === "" || 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.subcategories.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Filter by Category
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-50)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border focus-ring"
              style={{ 
                backgroundColor: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Category Accordion */}
          <Accordion type="multiple" className="space-y-2">
            {filteredCategories.map((category) => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="rounded-lg"
                style={{ 
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)' 
                }}
              >
                <AccordionTrigger 
                  className="px-4 py-3 hover:no-underline transition-all"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="font-medium">{category.name}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-3">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={subcategory.id}
                          checked={localSelectedCategories.includes(subcategory.id)}
                          onCheckedChange={() => handleCategoryToggle(subcategory.id)}
                          className="focus-ring"
                        />
                        <label
                          htmlFor={subcategory.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          style={{ color: 'var(--text)' }}
                        >
                          {subcategory.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1 transition-all"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--text-muted)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1"
              style={{ 
                backgroundColor: 'var(--primary)', 
                color: 'var(--primary-foreground)' 
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}