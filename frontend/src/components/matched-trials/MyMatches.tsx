import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Accordion, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { UserProfile } from '../../types/UserProfile';
import './MyMatches.css';

interface MyMatchesProps {
  userProfile: UserProfile | null;
}

const MyMatches: React.FC<MyMatchesProps> = ({ userProfile }) => {
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pollIntervalRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Load matched trials from localStorage with multiple update strategies
  useEffect(() => {
    // Initial load
    loadMatchedTrials();
    
    // Strategy 1: Poll for changes
    const startPolling = () => {
      if (pollIntervalRef.current) return;
      
      pollIntervalRef.current = window.setInterval(() => {
        // Check if global timestamp has changed
        if (window._lastMatchedTrialTimestamp && 
            window._lastMatchedTrialTimestamp > lastUpdateTimeRef.current) {
          loadMatchedTrials();
          lastUpdateTimeRef.current = window._lastMatchedTrialTimestamp;
        }
        
        // Check localStorage signal
        const signalTime = localStorage.getItem('_matchUpdateSignal');
        if (signalTime && parseInt(signalTime) > lastUpdateTimeRef.current) {
          loadMatchedTrials();
          lastUpdateTimeRef.current = parseInt(signalTime);
        }
      }, 500); // Check every 500ms
    };
    
    startPolling();
    
    // Strategy 2: Listen for custom events
    const handleMatchesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.matches) {
        setMatchedTrials(customEvent.detail.matches);
        setLoading(false);
      } else {
        loadMatchedTrials();
      }
    };
    
    window.addEventListener('matchesUpdated', handleMatchesUpdated);
    
    // Strategy 3: Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadMatchedTrials();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Strategy 4: Check for force refresh flag
    const checkForceRefresh = () => {
      if (localStorage.getItem('_forceMatchesRefresh') === 'true') {
        loadMatchedTrials();
        localStorage.removeItem('_forceMatchesRefresh');
      }
    };
    
    checkForceRefresh();
    
    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
      window.removeEventListener('matchesUpdated', handleMatchesUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to load matched trials
  const loadMatchedTrials = () => {
    try {
      const savedMatches = JSON.parse(localStorage.getItem('matchedTrials') || '[]');
      setMatchedTrials(savedMatches);
      setRefreshing(false);
      console.log(`Loaded ${savedMatches.length} matches from localStorage`);
    } catch (err) {
      console.error('Error loading matched trials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh matches
  const refreshMatches = () => {
    setRefreshing(true);
    loadMatchedTrials();
  };

  // Function to clear all matches
  const clearAllMatches = () => {
    localStorage.removeItem('matchedTrials');
    setMatchedTrials([]);
    setShowConfirmModal(false);
    
    // Dispatch event to notify other components
    try {
      window.dispatchEvent(new CustomEvent('matchesUpdated', { 
        detail: { matches: [] }
      }));
    } catch (e) {
      console.error('Error dispatching event:', e);
    }
  };

  // Function to remove a specific match
  const removeMatch = (trialId: string) => {
    try {
      const updatedMatches = matchedTrials.filter(trial => trial.id !== trialId);
      localStorage.setItem('matchedTrials', JSON.stringify(updatedMatches));
      setMatchedTrials(updatedMatches);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('matchesUpdated', { 
        detail: { matches: updatedMatches }
      }));
      
      // Update signal
      localStorage.setItem('_matchUpdateSignal', Date.now().toString());
    } catch (err) {
      console.error('Error removing match:', err);
    }
  };

  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return 'Unknown distance';
    return distance < 1 ? 'Less than 1 mile' : `${Math.round(distance)} miles`;
  };

  // Find the closest location for a trial
  const getClosestLocation = (trial: any) => {
    if (!trial.locations || trial.locations.length === 0) return null;
    
    return trial.locations.reduce((closest: any, current: any) => {
      if (!closest || (current.distance !== undefined && current.distance < closest.distance)) {
        return current;
      }
      return closest;
    }, null);
  };

  // Format location text
  const getLocationText = (trial: any) => {
    const closestLocation = getClosestLocation(trial);
    if (!closestLocation) return 'No location information';
    
    const { facility, city, state, distance } = closestLocation;
    return `${facility || 'Unknown facility'}, ${city || ''}, ${state || ''} ${distance !== undefined ? `(${formatDistance(distance)})` : ''}`;
  };
  
  // Handle navigation to trial matching
  const navigateToTrialMatching = () => {
    // Try multiple tab selection methods
    const tabSelectors = [
      'a[data-rr-ui-event-key="match"]',
      'button[data-bs-target="#match"]',
      '.nav-link[href="#match"]',
      '[role="tab"][aria-controls="match"]'
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
    window.location.hash = 'match';
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">My Matched Trials</h2>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm"
                className="me-2"
                onClick={refreshMatches}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Refreshing...
                  </>
                ) : 'Refresh Matches'}
              </Button>
              
              {matchedTrials.length > 0 && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => setShowConfirmModal(true)}
                >
                  Clear All Matches
                </Button>
              )}
            </div>
          </div>
          
          {loading ? (
            <p className="text-center">Loading your matches...</p>
          ) : matchedTrials.length === 0 ? (
            <div className="text-center">
              <p>You haven't matched with any trials yet.</p>
              <Button variant="primary" onClick={navigateToTrialMatching}>Go to Trial Matching</Button>
            </div>
          ) : (
            <Accordion defaultActiveKey="0">
              {matchedTrials.map((trial, index) => (
                <Accordion.Item key={trial.id || index} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between w-100 me-3">
                      <span>{trial.title}</span>
                      {trial.matchScore && (
                        <Badge bg="success" className="match-score-badge">
                          {Math.round((trial.matchScore) * 100)}% Match
                        </Badge>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Card.Body>
                      <Card.Subtitle className="mb-2 text-muted">
                        {getLocationText(trial)}
                      </Card.Subtitle>
                      
                      <div className="trial-tags mb-3">
                        {trial.conditions && trial.conditions.map((condition: string, idx: number) => (
                          <Badge bg="primary" className="me-1" key={idx}>{condition}</Badge>
                        ))}
                        <Badge bg={trial.gender === 'Female' ? 'info' : trial.gender === 'Male' ? 'secondary' : 'dark'} className="me-1">
                          {trial.gender || 'Any gender'}
                        </Badge>
                      </div>
                      
                      <Card.Text>
                        <strong>Age Range:</strong> {trial.age_range?.min || 'Any'} - {trial.age_range?.max || 'Any'}
                      </Card.Text>
                      
                      <Card.Text>
                        <strong>Summary:</strong><br />
                        {trial.summary || 'No summary available'}
                      </Card.Text>
                      
                      {trial.compensation?.has_compensation && (
                        <div className="compensation-info mt-2 p-2 bg-light rounded">
                          <strong>Compensation:</strong> {trial.compensation.amount ? `$${trial.compensation.amount}` : 'Available'} 
                          {trial.compensation.details && (
                            <p className="small mt-1 mb-0">{trial.compensation.details}</p>
                          )}
                        </div>
                      )}
                      
                      {trial.locations && trial.locations.length > 0 && (
                        <div className="locations-info mt-3">
                          <h6>All Locations:</h6>
                          <ul className="location-list">
                            {trial.locations.map((loc: any, locIndex: number) => (
                              <li key={locIndex}>
                                {loc.facility || 'Unknown facility'}, {loc.city || ''}, {loc.state || ''}, {loc.country || ''}
                                {loc.distance !== undefined && ` (${formatDistance(loc.distance)})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Add Remove button */}
                      <div className="text-end mt-3">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => removeMatch(trial.id)}
                        >
                          Remove from Matches
                        </Button>
                      </div>
                    </Card.Body>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
          
          {/* Confirmation Modal */}
          <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to clear all your matched trials? This action cannot be undone.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={clearAllMatches}>
                Clear All Matches
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default MyMatches;