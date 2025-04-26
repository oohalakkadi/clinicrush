// src/utils/matchingAlgorithm.ts
import { UserProfile } from '../types/UserProfile';

interface Trial {
  id: string;
  title: string;
  conditions: string[];
  gender: string;
  age_range: {
    min: string;
    max: string;
  };
  locations: {
    city: string;
    state: string;
    country: string;
    zip: string;
    facility: string;
    distance?: number; // Added distance field
  }[];
  summary: string;
  matchScore?: number;
  distance?: number; // Overall distance to nearest location
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in miles
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Mock distance calculation - in a real app, replace with actual geocoding and distance calculation
  // For the prototype, we're returning a random distance between 1 and 100 miles
  return Math.floor(Math.random() * 100) + 1;
};

/**
 * Calculate a match score between a user profile and a clinical trial
 * @param profile User profile
 * @param trial Clinical trial
 * @returns Match score (0.0 to 1.0) and distance
 */
export const calculateMatchScore = (profile: UserProfile, trial: Trial): { score: number, distance: number } => {
  let score = 0;
  let maxScore = 0;

  // Check if conditions match (highest weight)
  const conditionMatch = trial.conditions.some(condition => 
    profile.medicalConditions.some(userCondition => 
      userCondition.toLowerCase().includes(condition.toLowerCase()) || 
      condition.toLowerCase().includes(userCondition.toLowerCase())
    )
  );

  if (conditionMatch) {
    score += 50;
  }
  maxScore += 50;

  // Check gender eligibility
  if (trial.gender === 'All' || trial.gender.toLowerCase().includes(profile.gender.toLowerCase())) {
    score += 15;
  }
  maxScore += 15;

  // Check age eligibility
  const minAge = parseInt(trial.age_range.min) || 0;
  const maxAge = parseInt(trial.age_range.max) || 999;
  
  if (profile.age >= minAge && profile.age <= maxAge) {
    score += 15;
  }
  maxScore += 15;

  // Calculate closest location and its distance
  let minDistance = Infinity;
  
  // Extract user's city and state
  const [userCity, userState] = profile.location.split(',').map(s => s.trim());
  
  trial.locations.forEach(location => {
    // In a real app, we'd use geocoding APIs to get lat/long and calculate actual distances
    // For this prototype, we'll use a simple formula for demo purposes
    const distance = calculateDistance(0, 0, 0, 0); // Mock calculation
    location.distance = distance;
    
    if (distance < minDistance) {
      minDistance = distance;
    }
  });
  
  // Only include locations within the user's max travel distance
  const withinTravelDistance = minDistance <= profile.maxTravelDistance;
  
  if (withinTravelDistance) {
    score += 20;
  }
  maxScore += 20;

  // Calculate final score as percentage
  return { 
    score: maxScore > 0 ? score / maxScore : 0,
    distance: minDistance
  };
};

/**
 * Sort trials by match score and distance
 * @param trials List of trials
 * @param profile User profile
 * @returns Sorted trials with calculated match scores
 */
export const rankTrialsByMatchScore = (trials: Trial[], profile: UserProfile): Trial[] => {
  const scoredTrials = trials.map(trial => {
    const { score, distance } = calculateMatchScore(profile, trial);
    return { 
      ...trial, 
      matchScore: score,
      distance: distance
    };
  });

  // Filter for minimum match threshold (40%)
  const validTrials = scoredTrials.filter(trial => 
    trial.matchScore >= 0.4 && trial.distance <= profile.maxTravelDistance
  );

  // Sort first by match score (descending), then by distance (ascending)
  return validTrials.sort((a, b) => {
    // If match scores are significantly different, sort by score
    if (Math.abs(b.matchScore! - a.matchScore!) > 0.2) {
      return b.matchScore! - a.matchScore!;
    }
    // Otherwise, sort similar matches by distance
    return a.distance! - b.distance!;
  });
};