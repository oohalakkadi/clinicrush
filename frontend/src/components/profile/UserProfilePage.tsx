// src/components/profile/UserProfilePage.tsx
import React, { useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import ProfileForm from './ProfileForm';
import { UserProfile } from '../../types/UserProfile';

interface UserProfilePageProps {
  initialProfile: UserProfile;
  onProfileUpdate?: (profile: UserProfile) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ initialProfile, onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      setProfile(updatedProfile);
      
      // Check if profile is complete
      const isComplete = Boolean(
        updatedProfile.firstName && 
        updatedProfile.lastName && 
        updatedProfile.age > 0 &&
        updatedProfile.location && 
        updatedProfile.medicalConditions.length > 0
      );
      
      // Set success message based on completeness
      setSaveStatus({
        success: true,
        message: isComplete 
          ? 'Profile saved successfully! You can now view matching trials.' 
          : 'Profile saved, but some required information is missing.'
      });
      
      // Call the parent component's update function
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: 'Failed to save profile. Please try again.'
      });
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
      
      // Clear success message after 3 seconds
      if (saveStatus?.success) {
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      }
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Health Profile</h2>
      
      {saveStatus && (
        <Alert 
          variant={saveStatus.success ? 'success' : 'danger'} 
          dismissible 
          onClose={() => setSaveStatus(null)}
        >
          {saveStatus.message}
        </Alert>
      )}
      
      <ProfileForm 
        initialProfile={profile} 
        onSave={handleSaveProfile} 
        isSaving={isSaving} 
      />
    </Container>
  );
};

export default UserProfilePage;