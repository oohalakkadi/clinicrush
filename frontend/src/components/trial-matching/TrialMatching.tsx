import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { searchTrials } from '../../services/api';
import TrialCard from './TrialCard';
import { UserProfile } from '../../types/UserProfile';
import { rankTrialsByMatchScore, filterTrialsByAllergies } from '../../utils/matchingAlgorithm';
import { geocodeAddress } from '../../services/geocoding';
import Confetti from 'react-confetti';
import './TrialMatching.css';

interface TrialMatchingProps {
  userProfile: UserProfile;
}

const TrialMatching: React.FC<TrialMatchingProps> = ({ userProfile }) => {
  const [trials, setTrials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  const [rejectedTrials, setRejectedTrials] = useState<any[]>([]);
  const [geocodingStatus, setGeocodingStatus] = useState<string>('pending');
  
  // Add new state variables for confetti
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Listen for confetti trigger
    const handleShowConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000); // Hide confetti after 3 seconds
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('showConfetti', handleShowConfetti);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('showConfetti', handleShowConfetti);
    };
  }, []);

  // Load trials based on user profile
  useEffect(() => {
    const loadTrialsWithGeocoding = async () => {
      if (userProfile && userProfile.medicalConditions.length > 0) {
        setLoading(true);
        setError(null);
        setGeocodingStatus('pending');
        
        try {
          // First geocode the user's location
          const location = userProfile.location;
          setGeocodingStatus('geocoding');
          
          let userCoordinates;
          try {
            const geocodeResult = await geocodeAddress(location);
            userCoordinates = {
              lat: geocodeResult.lat,
              lng: geocodeResult.lng
            };
            
            // Update user profile with geocoded coordinates
            const updatedProfile = {
              ...userProfile,
              coordinates: userCoordinates
            };
            
            // Save updated profile to localStorage
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            setGeocodingStatus('success');
          } catch (geoError) {
            console.error('Geocoding error:', geoError);
            setGeocodingStatus('failed');
            // Continue without geocoding
          }
          
          // Search for trials based on first condition
          const condition = userProfile.medicalConditions[0];
          const city = userProfile.location.split(',')[0].trim();
          
          const trialsData = await searchTrials(condition, city);
          
          if (Array.isArray(trialsData) && trialsData.length > 0) {
            // Filter trials based on user allergies
            const filteredTrials = filterTrialsByAllergies(trialsData, userProfile.allergies);
            
            // Rank trials by match score and distance
            const rankedTrials = rankTrialsByMatchScore(filteredTrials, userProfile);
            
            setTrials(rankedTrials);
            setCurrentIndex(0);
            
            // Reset matched and rejected trials
            setMatchedTrials([]);
            setRejectedTrials([]);
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
      } else {
        setError('Your profile is missing medical conditions. Please update your profile.');
        setLoading(false);
      }
    };

    loadTrialsWithGeocoding();
  }, [userProfile]);

  const handleSwipeLeft = () => {
    if (currentIndex < trials.length) {
      setRejectedTrials([...rejectedTrials, trials[currentIndex]]);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex < trials.length) {
      const currentTrial = trials[currentIndex];
      
      // Update local state
      setMatchedTrials([...matchedTrials, currentTrial]);
      setCurrentIndex(currentIndex + 1);
      
      // Save to localStorage
      try {
        const savedMatches = JSON.parse(localStorage.getItem('matchedTrials') || '[]');
        // Check for duplicates by ID
        const isDuplicate = savedMatches.some((trial: any) => trial.id === currentTrial.id);
        
        if (!isDuplicate) {
          const updatedMatches = [...savedMatches, currentTrial];
          localStorage.setItem('matchedTrials', JSON.stringify(updatedMatches));
          
          // Set a global variable that MyMatches can check
          window._lastMatchedTrialTimestamp = Date.now();
          
          // Try multiple methods to notify other components
          // 1. Custom Event
          try {
            window.dispatchEvent(new CustomEvent('matchesUpdated', { 
              detail: { matches: updatedMatches }
            }));
          } catch (e) {
            console.error('Error dispatching custom event:', e);
          }
          
          // 2. LocalStorage event (works across tabs)
          try {
            localStorage.setItem('_matchUpdateSignal', Date.now().toString());
          } catch (e) {
            console.error('Error setting localStorage signal:', e);
          }
        }
      } catch (error) {
        console.error('Error saving match:', error);
      }
    }
  };

  const handleShowDetails = () => {
    if (currentIndex < trials.length) {
      const trial = trials[currentIndex];
      
      // Format compensation info
      const compensationInfo = trial.compensation?.has_compensation 
        ? `Compensation: ${trial.compensation.amount ? '$' + trial.compensation.amount : 'Available'}` 
        : 'No compensation offered';
      
      // Display more comprehensive information
      const locations = trial.locations.map((loc: any) => 
        `${loc.facility}, ${loc.city}, ${loc.state}, ${loc.country}${loc.distance ? ` (${loc.distance} miles)` : ''}`
      ).join('\n');
      
      alert(
        `${trial.title}\n\n` +
        `ID: ${trial.id}\n\n` +
        `Match Score: ${Math.round(trial.matchScore * 100)}%\n\n` +
        `${compensationInfo}\n\n` +
        `Conditions: ${trial.conditions.join(', ')}\n\n` +
        `Gender: ${trial.gender}\n` +
        `Age Range: ${trial.age_range.min} - ${trial.age_range.max}\n\n` +
        `Locations:\n${locations}\n\n` +
        `Summary:\n${trial.summary}`
      );
    }
  };
  
  // Handle navigation to matches tab
  const navigateToMatches = () => {
    // Set up localStorage and trigger before navigation
    localStorage.setItem('_forceMatchesRefresh', 'true');
    
    // Try multiple tab selection methods
    const tabSelectors = [
      'a[data-rr-ui-event-key="matches"]',
      'button[data-bs-target="#matches"]',
      '.nav-link[href="#matches"]',
      '[role="tab"][aria-controls="matches"]'
    ];
    
    // Try each selector
    for (const selector of tabSelectors) {
      const tabElement = document.querySelector(selector);
      if (tabElement) {
        (tabElement as HTMLElement).click();
        return;
      }
    }
    
    // Fallback to hash change
    window.location.hash = 'matches';
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2 className="text-center mb-4">Your Matching Clinical Trials</h2>
          
          {geocodingStatus === 'geocoding' && (
            <Alert variant="info" className="mb-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Geocoding your location for more accurate matches...
            </Alert>
          )}
          
          {loading && (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Finding trials that match your profile...</p>
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
                userProfile={userProfile}
              />
            </div>
          )}
          
          {!loading && !error && trials.length > 0 && currentIndex >= trials.length && (
            <div className="text-center my-5">
              <h3>You've viewed all available trials!</h3>
              <p>You matched with {matchedTrials.length} trials.</p>
              <Button 
                variant="primary" 
                className="me-3" 
                onClick={navigateToMatches}
              >
                View My Matches
              </Button>
            </div>
          )}
          
          {!loading && !error && trials.length === 0 && (
            <Alert variant="warning">
              <Alert.Heading>No Matching Trials Found</Alert.Heading>
              <p>
                We couldn't find any clinical trials that match your profile. Try updating your profile
                with different medical conditions or increasing your maximum travel distance.
              </p>
            </Alert>
          )}
          
          {!loading && !error && (
            <div className="stats-container text-center mt-3">
              <p>Viewed: {currentIndex} | Matched: {matchedTrials.length} | Passed: {rejectedTrials.length}</p>
            </div>
          )}
          
          {/* Confetti animation */}
          {showConfetti && (
            <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.5}       // Increase gravity (was 0.3) to make particles fall faster
            initialVelocityY={10}  // Add this to give particles more initial downward velocity
            tweenDuration={2000}  // Reduce this to make particles complete animations faster
            colors={['#fc545c', '#ff8a8f', '#ffb9be', '#ffffff']}
          />
          )}
        </Col>
      </Row>
    </Container>
  );
};

// Add this global type declaration at the top level
declare global {
  interface Window {
    _lastMatchedTrialTimestamp?: number;
  }
}

export default TrialMatching;