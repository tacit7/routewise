import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Poi } from '@shared/schema';
import { useTripPlaces, type TripPlace } from './use-trip-places';

// User interests interface (to be expanded based on actual user system)
export interface UserInterests {
  categories: string[];
  preferences: {
    budget: 'low' | 'medium' | 'high';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
    groupSize: 'solo' | 'couple' | 'family' | 'friends';
    interests: string[];
  };
  visitHistory: string[];
}

export interface PersonalizedRecommendation {
  poi: Poi;
  relevanceScore: number;
  reason: string;
  category: 'highly_recommended' | 'similar_interests' | 'popular_nearby' | 'budget_friendly';
}

export interface TripInsights {
  categoryBalance: {
    category: string;
    count: number;
    percentage: number;
    recommendation: 'good' | 'lacking' | 'excessive';
  }[];
  budgetAnalysis: {
    estimatedCost: number;
    budgetRange: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  timeDistribution: {
    estimatedDuration: number;
    suggestedTimeOfDay: string[];
    timeManagementTips: string[];
  };
  missingInterests: string[];
  overallScore: number;
}

// Hook for personalized trip management and recommendations
export function usePersonalizedTrips() {
  const { tripPlaces, tripStats } = useTripPlaces();

  // Mock user interests - in real implementation, this would come from auth context or user profile
  const { data: userInterests, isLoading: interestsLoading } = useQuery<UserInterests>({
    queryKey: ['userInterests'],
    queryFn: async (): Promise<UserInterests> => {
      // Mock implementation - replace with actual API call
      const savedInterests = localStorage.getItem('userInterests');
      if (savedInterests) {
        return JSON.parse(savedInterests);
      }
      
      // Default interests
      return {
        categories: ['restaurant', 'attraction', 'park'],
        preferences: {
          budget: 'medium',
          timeOfDay: 'any',
          groupSize: 'couple',
          interests: ['food', 'nature', 'culture', 'photography']
        },
        visitHistory: []
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate relevance score for a POI based on user interests
  const calculateRelevanceScore = (poi: Poi, interests: UserInterests): number => {
    let score = 0;

    // Category preference (40% weight)
    if (interests?.categories?.includes(poi.category)) {
      score += 0.4;
    }

    // Rating influence (30% weight)
    const rating = parseFloat(poi.rating);
    if (rating >= 4.5) score += 0.3;
    else if (rating >= 4.0) score += 0.2;
    else if (rating >= 3.5) score += 0.1;

    // Price level preference (20% weight)
    if (poi.priceLevel) {
      const budgetMatch = {
        low: [1, 2],
        medium: [2, 3],
        high: [3, 4]
      };
      
      if (budgetMatch[interests.preferences.budget]?.includes(poi.priceLevel)) {
        score += 0.2;
      }
    }

    // Interest keywords in description (10% weight)
    if (poi.description && interests.preferences?.interests) {
      const descriptionLower = poi.description.toLowerCase();
      const matchingInterests = interests.preferences.interests.filter(interest =>
        descriptionLower.includes(interest.toLowerCase())
      );
      score += (matchingInterests.length / interests.preferences.interests.length) * 0.1;
    }

    return Math.min(score, 1); // Cap at 1.0
  };

  // Generate trip insights based on user interests and current trip
  const tripInsights = useMemo((): TripInsights => {
    if (!userInterests || !tripPlaces.length) {
      return {
        categoryBalance: [],
        budgetAnalysis: { estimatedCost: 0, budgetRange: 'low', recommendation: '' },
        timeDistribution: { estimatedDuration: 0, suggestedTimeOfDay: [], timeManagementTips: [] },
        missingInterests: userInterests?.preferences?.interests || [],
        overallScore: 0
      };
    }

    // Category balance analysis
    const categoryBalance = Object.entries(tripStats.categories).map(([category, count]) => {
      const percentage = (count / tripPlaces.length) * 100;
      const isPreferred = userInterests.categories.includes(category);
      
      let recommendation: 'good' | 'lacking' | 'excessive' = 'good';
      if (isPreferred && percentage < 20) recommendation = 'lacking';
      if (!isPreferred && percentage > 50) recommendation = 'excessive';

      return { category, count, percentage, recommendation };
    });

    // Budget analysis
    const avgPriceLevel = tripPlaces.reduce((sum, place) => 
      sum + (place.priceLevel || 2), 0) / tripPlaces.length;
    
    const budgetRange: 'low' | 'medium' | 'high' = 
      avgPriceLevel <= 1.5 ? 'low' : avgPriceLevel <= 2.5 ? 'medium' : 'high';

    const budgetMatch = budgetRange === userInterests.preferences.budget;
    const budgetRecommendation = budgetMatch 
      ? 'Your trip aligns well with your budget preferences'
      : `Consider ${userInterests.preferences.budget === 'low' ? 'more budget-friendly' : 
          userInterests.preferences.budget === 'high' ? 'more premium' : 'moderately-priced'} options`;

    // Time distribution
    const estimatedDuration = tripPlaces.length * 1.5; // 1.5 hours per place on average
    const suggestedTimeOfDay = estimatedDuration > 6 ? ['morning', 'afternoon'] : ['afternoon'];
    const timeManagementTips = [
      `Plan for approximately ${estimatedDuration.toFixed(1)} hours`,
      'Consider travel time between locations',
      tripPlaces.length > 5 ? 'Break into multiple days for better experience' : 'Perfect for a day trip'
    ];

    // Missing interests
    const tripCategories = new Set(tripPlaces.map(p => p.category));
    const missingInterests = userInterests.preferences?.interests?.filter(interest => {
      // Simple keyword matching - could be enhanced with better categorization
      const relatedCategories = {
        food: ['restaurant'],
        nature: ['park'],
        culture: ['attraction', 'museum'],
        photography: ['attraction', 'park'],
        shopping: ['shopping'],
        entertainment: ['entertainment']
      };
      
      const related = relatedCategories[interest as keyof typeof relatedCategories] || [];
      return !related.some(cat => tripCategories.has(cat));
    }) || [];

    // Overall score (0-100)
    const categoryScore = categoryBalance.filter(c => c.recommendation === 'good').length / categoryBalance.length;
    const budgetScore = budgetMatch ? 1 : 0.5;
    const interestScore = userInterests.preferences?.interests?.length 
      ? 1 - (missingInterests.length / userInterests.preferences.interests.length)
      : 0;
    const ratingScore = tripStats.averageRating / 5;
    
    const overallScore = Math.round((categoryScore * 0.3 + budgetScore * 0.2 + interestScore * 0.3 + ratingScore * 0.2) * 100);

    return {
      categoryBalance,
      budgetAnalysis: {
        estimatedCost: avgPriceLevel * tripPlaces.length * 25, // rough estimate
        budgetRange,
        recommendation: budgetRecommendation
      },
      timeDistribution: {
        estimatedDuration,
        suggestedTimeOfDay,
        timeManagementTips
      },
      missingInterests,
      overallScore
    };
  }, [tripPlaces, tripStats, userInterests]);

  // Generate personalized recommendations for POIs
  const generateRecommendations = (
    availablePois: Poi[],
    limit: number = 5
  ): PersonalizedRecommendation[] => {
    if (!userInterests || !availablePois.length) return [];

    const recommendations = availablePois
      .filter(poi => {
        // Exclude POIs already in trip
        const poiIdentifier = poi.placeId || poi.id;
        return !tripPlaces.some(tp => (tp.placeId || tp.id) === poiIdentifier);
      })
      .map(poi => {
        const relevanceScore = calculateRelevanceScore(poi, userInterests);
        
        // Determine recommendation category and reason
        let category: PersonalizedRecommendation['category'] = 'popular_nearby';
        let reason = 'Popular in this area';

        if (relevanceScore >= 0.8) {
          category = 'highly_recommended';
          reason = 'Perfect match for your interests';
        } else if (userInterests.categories.includes(poi.category)) {
          category = 'similar_interests';
          reason = `Matches your interest in ${poi.category}`;
        } else if (poi.priceLevel && poi.priceLevel <= 2) {
          category = 'budget_friendly';
          reason = 'Great value option';
        }

        return {
          poi,
          relevanceScore,
          reason,
          category
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return recommendations;
  };

  // Update user interests
  const updateUserInterests = (newInterests: Partial<UserInterests>) => {
    if (!userInterests) return;
    
    const updated = { ...userInterests, ...newInterests };
    localStorage.setItem('userInterests', JSON.stringify(updated));
    
    // Invalidate queries to refresh recommendations
    // queryClient.invalidateQueries({ queryKey: ['userInterests'] });
  };

  return {
    // Data
    userInterests,
    tripInsights,
    isLoading: interestsLoading,

    // Actions
    generateRecommendations,
    updateUserInterests,
    calculateRelevanceScore: userInterests ? 
      (poi: Poi) => calculateRelevanceScore(poi, userInterests) : 
      () => 0,

    // Utilities
    isPersonalized: !!userInterests,
    recommendationCategories: ['highly_recommended', 'similar_interests', 'popular_nearby', 'budget_friendly'] as const
  };
}