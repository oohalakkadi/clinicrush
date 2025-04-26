// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tab, Tabs } from 'react-bootstrap';
import './App.css';
import TrialMatching from './components/trial-matching/TrialMatching';
import UserProfilePage from './components/profile/UserProfilePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import { UserProfile, defaultUserProfile } from './types/UserProfile';

function App() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);

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
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">ClinCrush</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#matches" disabled={!profileComplete}>My Matches</Nav.Link>
              <Nav.Link href="#profile">Profile</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="mt-4">
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
            <div className="p-4 text-center">
              <h3>My Matched Trials</h3>
              <p>This tab will show trials you've matched with.</p>
            </div>
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
  );
}

export default App;