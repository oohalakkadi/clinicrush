// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tab, Tabs, Alert } from 'react-bootstrap';
import './App.css';
import TrialMatching from './components/trial-matching/TrialMatching';
import UserProfilePage from './components/profile/UserProfilePage';
import MyMatches from './components/matched-trials/MyMatches';
import 'bootstrap/dist/css/bootstrap.min.css';
import { UserProfile, defaultUserProfile } from './types/UserProfile';
import { checkApiHealth } from './services/api';
import { MatchProvider } from './contexts/MatchContext';

function App() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Check API health on component mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        await checkApiHealth();
        setApiConnected(true);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiConnected(false);
      }
    };
    
    checkBackendConnection();
  }, []);

  // Load profile on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
        
        // Check if profile is complete (has required fields)
        const isComplete = Boolean(
          profile.firstName && 
          profile.lastName && 
          profile.age > 0 &&
          profile.location && 
          profile.medicalConditions.length > 0
        );
        
        setProfileComplete(isComplete);
        
        // If profile is complete, allow access to the trial matching tab
        if (isComplete) {
          setActiveTab('match');
        }
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }
    }
  }, []);

  // Handle profile saving
  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
    
    // Check if profile is complete
    const isComplete = Boolean(
      profile.firstName && 
      profile.lastName && 
      profile.age > 0 &&
      profile.location && 
      profile.medicalConditions.length > 0
    );
    
    setProfileComplete(isComplete);
    
    // If profile is now complete, navigate to matching tab
    if (isComplete) {
      setActiveTab('match');
    }
  };

  return (
    <MatchProvider>
      <div className="App">
      <div className="App">
        <Navbar bg='white' variant="dark" expand="lg">
          <Container>
          <Navbar.Brand>
            <div className="d-flex flex-column align-items-center">
              <img src="/logo.png" alt="Logo" height="100" className="mb-1" />
            </div>
          </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              {apiConnected === false && (
                <span className="text-danger">⚠️ Backend disconnected</span>
              )}
              {apiConnected === true && (
                <span className="text-success">✓ Connected</span>
              )}
            </Navbar.Collapse>
          </Container>
        </Navbar>
        
        <Container className="mt-4">
          {!profileComplete && (
            <Alert variant="info" className="mb-4">
              <Alert.Heading>Welcome to CliniCrush!</Alert.Heading>
              <p>
                Please complete your health profile to find clinical trials that match your needs.
                Once your profile is complete, we'll show you personalized trial recommendations.
              </p>
            </Alert>
          )}
          
          <Tabs 
            activeKey={activeTab} 
            onSelect={(k) => k && setActiveTab(k)}
            id="main-tabs" 
            className="mb-4"
          >
            <Tab eventKey="match" title="Trial Matching" disabled={!profileComplete}>
              {profileComplete ? (
                <TrialMatching userProfile={userProfile!} />
              ) : (
                <div className="p-5 text-center">
                  <h3>Profile Required</h3>
                  <p>You need to complete your profile before viewing matching trials.</p>
                </div>
              )}
            </Tab>
            <Tab eventKey="matches" title="My Matches" disabled={!profileComplete}>
              {profileComplete && <MyMatches userProfile={userProfile!} />}
              {!profileComplete && (
                <div className="p-4 text-center">
                  <h3>Complete your profile to see matched trials</h3>
                  <p>Please fill out your profile information before matching with trials.</p>
                </div>
              )}
            </Tab>
            <Tab eventKey="profile" title="My Profile">
              <UserProfilePage 
                initialProfile={userProfile || defaultUserProfile} 
                onProfileUpdate={handleProfileUpdate}
              />
            </Tab>
          </Tabs>
        </Container>
      </div>
    </div>
    </MatchProvider>
  );
}

export default App;