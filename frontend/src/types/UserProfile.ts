// src/types/UserProfile.ts
export interface UserProfile {
    id?: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    location: string;
    medicalConditions: string[];
    allergies: string[];
    medications: string[];
    maxTravelDistance: number; // in miles
    contactEmail: string;
    contactPhone?: string;
  }
  
  export const defaultUserProfile: UserProfile = {
    firstName: '',
    lastName: '',
    age: 0,
    gender: 'Other',
    location: '',
    medicalConditions: [],
    allergies: [],
    medications: [],
    maxTravelDistance: 50,
    contactEmail: '',
  };