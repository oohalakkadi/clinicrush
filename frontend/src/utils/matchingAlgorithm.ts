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
  }[];
  summary: string;
  // Add any other fields that might be relevant
}

/**
 * Calculate a match score between a user profile and a clinical trial
 * @param profile User profile
 * @param trial Clinical trial
 * @returns Match score (0.0 to 1.0)
 */
export const calculateMatchScore = (profile: UserProfile, trial: Trial): number => {
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

  // Check location proximity
  // For the hackathon, we'll just check if the city/state matches
  // In a real app, you'd calculate actual distances
  const locationMatch = trial.locations.some(location => {
    const [userCity, userState] = profile.location.split(',').map(s => s.trim().toLowerCase());
    return (
      location.city.toLowerCase().includes(userCity) || 
      (location.state && location.state.toLowerCase() === userState)
    );
  });

  if (locationMatch) {
    score += 20;
  }
  maxScore += 20;

  // Calculate final score as percentage
  return maxScore > 0 ? score / maxScore : 0;
};

/**
 * Sort trials by match score
 * @param trials List of trials
 * @param profile User profile
 * @returns Sorted trials with calculated match scores
 */
export const rankTrialsByMatchScore = (trials: Trial[], profile: UserProfile): Trial[] => {
  return trials.map(trial => {
    const matchScore = calculateMatchScore(profile, trial);
    return { ...trial, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
};