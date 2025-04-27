import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Accordion, Button, Badge } from 'react-bootstrap';
import { UserProfile } from '../../types/UserProfile';
import './MyMatches.css';

interface MyMatchesProps {
  userProfile: UserProfile;
}

const MyMatches: React.FC<MyMatchesProps> = ({ userProfile }) => {
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load matched trials from localStorage
  useEffect(() => {
    try {
      const savedMatches = JSON.parse(localStorage.getItem('matchedTrials') || '[]');
      setMatchedTrials(savedMatches);
    } catch (err) {
      console.error('Error loading matched trials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2 className="text-center mb-4">My Matched Trials</h2>
          
          {loading ? (
            <p className="text-center">Loading your matches...</p>
          ) : matchedTrials.length === 0 ? (
            <div className="text-center">
              <p>You haven't matched with any trials yet.</p>
              <Button variant="primary" href="#trials">Go to Trial Matching</Button>
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
                    </Card.Body>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MyMatches;