// src/components/trial-matching/TrialMatching.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { searchTrials } from '../../services/api';
import TrialCard from './TrialCard';
import { UserProfile, defaultUserProfile } from '../../types/UserProfile';
import { rankTrialsByMatchScore } from '../../utils/matchingAlgorithm';
import './TrialMatching.css';

const TrialMatching: React.FC = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  const [rejectedTrials, setRejectedTrials] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);

  // Load user profile and trials on component mount
  useEffect(() => {
    const loadProfile = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
          setProfileLoaded(true);
          return profile;
        } catch (e) {
          console.error('Failed to parse saved profile:', e);
        }
      }
      return null;
    };

    const profile = loadProfile();
    
    if (profile && profile.medicalConditions.length > 0) {
      // If profile exists and has medical conditions, search for those
      const condition = profile.medicalConditions[0];
      const location = profile.location.split(',')[0].trim();
      loadTrials(condition, location, profile);
    } else {
      // Default search
      loadTrials('diabetes', 'Boston', profile || defaultUserProfile);
    }
  }, []);

  const loadTrials = async (condition: string, location: string, profile: UserProfile) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      
      const trialsData = await searchTrials(condition, location);
      
      if (Array.isArray(trialsData) && trialsData.length > 0) {
        // Rank trials by match score
        const rankedTrials = rankTrialsByMatchScore(trialsData, profile);
        setTrials(rankedTrials);
      } else {
        setError('No clinical trials found matching your criteria.');
        setTrials([]);
      }
    } catch (err) {
      setError('Failed to load clinical trials. Please try again later.');
      setTrials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < trials.length) {
      setRejectedTrials([...rejectedTrials, trials[currentIndex]]);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex < trials.length) {
      setMatchedTrials([...matchedTrials, trials[currentIndex]]);
      setCurrentIndex(currentIndex + 1);
      
      // Save matched trials to localStorage
      const savedMatches = JSON.parse(localStorage.getItem('matchedTrials') || '[]');
      localStorage.setItem('matchedTrials', JSON.stringify([...savedMatches, trials[currentIndex]]));
    }
  };

  const handleShowDetails = () => {
    if (currentIndex < trials.length) {
      const trial = trials[currentIndex];
      
      // Display more comprehensive information
      const locations = trial.locations.map((loc: any) => 
        `${loc.facility}, ${loc.city}, ${loc.state}, ${loc.country}`
      ).join('\n');
      
      alert(
        `${trial.title}\n\n` +
        `ID: ${trial.id}\n\n` +
        `Match Score: ${Math.round(trial.matchScore * 100)}%\n\n` +
        `Conditions: ${trial.conditions.join(', ')}\n\n` +
        `Gender: ${trial.gender}\n` +
        `Age Range: ${trial.age_range.min} - ${trial.age_range.max}\n\n` +
        `Locations:\n${locations}\n\n` +
        `Summary:\n${trial.summary}`
      );
    }
  };

  const goToProfile = () => {
    // In a real app, this would navigate to the profile page
    window.location.href = '/profile';
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2 className="text-center mb-4">Find Your Clinical Trial Match</h2>
          
          {!profileLoaded && (
            <Alert variant="warning">
              <p>You haven't set up your health profile yet. Personalized matching works better with your profile information.</p>
              <div className="d-flex justify-content-end">
                <Button variant="outline-primary" onClick={goToProfile}>
                  Set Up Profile
                </Button>
              </div>
            </Alert>
          )}
          
          {loading && (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
          
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          {!loading && !error && trials.length > 0 && currentIndex < trials.length && (
            <div className="trial-swipe-container">
              <TrialCard
                trial={trials[currentIndex]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onShowDetails={handleShowDetails}
              />
            </div>
          )}
          
          {!loading && !error && trials.length > 0 && currentIndex >= trials.length && (
            <div className="text-center my-5">
              <h3>You've viewed all available trials!</h3>
              <p>You matched with {matchedTrials.length} trials.</p>
              <Button variant="primary" onClick={() => window.location.href = '/matches'}>
                View My Matches
              </Button>
            </div>
          )}
          
          {!loading && (
            <div className="stats-container text-center mt-3">
              <p>Viewed: {currentIndex} | Matched: {matchedTrials.length} | Passed: {rejectedTrials.length}</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default TrialMatching;