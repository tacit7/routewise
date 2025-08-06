// Types for Route-Wise application
// Replaces shared schema after migrating to Phoenix backend

export interface Poi {
  id: number;
  placeId: string;
  name: string;
  address: string;
  rating: string;
  category: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: number;
  name: string;
  startLocation: string;
  endLocation: string;
  tripDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterestCategory {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  iconName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserInterest {
  id: number;
  userId: number;
  categoryId: number;
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  category: InterestCategory;
}