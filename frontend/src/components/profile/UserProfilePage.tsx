// src/components/profile/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import ProfileForm from './ProfileForm';
import { UserProfile, defaultUserProfile } from '../../types/UserProfile';

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load profile from localStorage or backend API
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }
    }
  }, []);

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // For the hackathon, we'll just save to localStorage
      // In a real app, you'd make an API call here
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      setProfile(updatedProfile);
      setSaveStatus({
        success: true,
        message: 'Profile saved successfully!'
      });
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