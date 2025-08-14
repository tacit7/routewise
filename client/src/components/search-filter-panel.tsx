import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  resultCount: number;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "landmarks", label: "Landmarks" },
  { value: "restaurants", label: "Restaurants" },
  { value: "shopping", label: "Shopping" },
  { value: "museums", label: "Museums" },
  { value: "religious", label: "Religious Sites" },
];

export function SearchFilterPanel({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  resultCount,
}: SearchFilterPanelProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Search & Filter</h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Results Counter */}
      <div className="text-sm text-muted-foreground">
        {resultCount} locations found
      </div>
    </div>
  );
}