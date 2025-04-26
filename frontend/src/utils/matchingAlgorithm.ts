// src/utils/matchingAlgorithm.ts
import { UserProfile } from '../types/UserProfile';
import { calculateDistance as haversineDistance } from '../services/geocoding';

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
    latitude?: number;
    longitude?: number;
    distance?: number;
  }[];
  summary: string;
  compensation?: {
    has_compensation: boolean;
    amount?: number;
    currency?: string;
    details?: string;
  };
  eligibilityCriteria?: string;
  substancesUsed?: {
    type: string;
    name: string;
  }[];
  distance?: number; // Overall distance to nearest location
  matchScore?: number;
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
  if (trial.distance !== undefined && trial.distance <= profile.maxTravelDistance) {
    // Award full points if within 10 miles, partial points otherwise
    if (trial.distance <= 10) {
      score += 20;
    } else {
      // Linearly decrease points as distance increases
      const distanceScore = 20 * (1 - (trial.distance / profile.maxTravelDistance));
      score += Math.max(0, distanceScore);
    }
  }
  maxScore += 20;

  // Check compensation preference if specified
  if (profile.preferredCompensation && profile.preferredCompensation > 0) {
    if (trial.compensation?.has_compensation && trial.compensation.amount) {
      if (trial.compensation.amount >= profile.preferredCompensation) {
        score += 10;
      } else {
        // Partial score based on how close the compensation is to preference
        const compensationScore = 10 * (trial.compensation.amount / profile.preferredCompensation);
        score += Math.min(10, compensationScore);
      }
    }
    maxScore += 10;
  }

  // Calculate final score as percentage
  return maxScore > 0 ? score / maxScore : 0;
};

/**
 * Filter out trials that contain substances a user is allergic to
 * @param trials List of trials
 * @param allergies User allergies
 * @returns Filtered trials
 */
export const filterTrialsByAllergies = (trials: Trial[], allergies: string[]): Trial[] => {
  if (!allergies.length) return trials;
  
  // Normalize allergies for comparison
  const normalizedAllergies = allergies.map(a => a.toLowerCase().trim());
  
  return trials.filter(trial => {
    // Check substances used in the trial
    if (trial.substancesUsed && trial.substancesUsed.length) {
      for (const substance of trial.substancesUsed) {
        if (normalizedAllergies.some(allergy => 
          substance.name.toLowerCase().includes(allergy)
        )) {
          return false; // Skip trials with substances user is allergic to
        }
      }
    }
    
    // Also check eligibility criteria text for allergy mentions
    if (trial.eligibilityCriteria) {
      const lowerCriteria = trial.eligibilityCriteria.toLowerCase();
      
      // Check for allergy exclusions
      for (const allergy of normalizedAllergies) {
        // Look for phrases like "allergy to [allergen]" in exclusion criteria
        if (lowerCriteria.includes(`allergy to ${allergy}`) ||
            lowerCriteria.includes(`allergic to ${allergy}`)) {
          return false;
        }
      }
    }
    
    return true;
  });
};

/**
 * Sort trials by match score and distance
 * @param trials List of trials
 * @param profile User profile
 * @returns Sorted trials with calculated match scores
 */
export const rankTrialsByMatchScore = (trials: Trial[], profile: UserProfile): Trial[] => {
  const scoredTrials = trials.map(trial => {
    const matchScore = calculateMatchScore(profile, trial);
    return { ...trial, matchScore };
  });

  // First sort by match score (descending)
  let sortedTrials = scoredTrials.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  
  // For trials with similar match scores (within 10%), prioritize by distance
  sortedTrials = sortedTrials.map((trial, i, arr) => {
    const nextTrial = arr[i + 1];
    if (nextTrial && Math.abs((trial.matchScore || 0) - (nextTrial.matchScore || 0)) <= 0.1) {
      // Trials have similar scores, sort this subset by distance
      const subset = arr.filter((t, idx) => 
        idx >= i && Math.abs((t.matchScore || 0) - (trial.matchScore || 0)) <= 0.1
      );
      
      const sortedSubset = subset.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      
      // Replace this section in the array
      arr.splice(i, subset.length, ...sortedSubset);
      return sortedSubset[0]; // Return the first item for this iteration
    }
    return trial;
  });
  
  return sortedTrials;
};