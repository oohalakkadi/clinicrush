// src/components/trial-matching/TrialCard.tsx
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { UserProfile } from '../../types/UserProfile';
import './TrialCard.css';

interface TrialCardProps {
  trial: any;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onShowDetails: () => void;
  userProfile: UserProfile;
}

const TrialCard: React.FC<TrialCardProps> = ({
  trial,
  onSwipeLeft,
  onSwipeRight,
  onShowDetails,
  userProfile
}) => {
  // Format match score percentage
  const matchPercentage = Math.round((trial.matchScore || 0) * 100);
  
  // Find the closest location with a valid distance
  const closestLocation = trial.locations.reduce((closest: any, current: any) => {
    // If current doesn't have a valid distance, keep the closest we've found
    if (typeof current.distance !== 'number') {
      return closest;
    }
    
    // If this is the first valid location or it's closer than the current closest
    if (!closest || typeof closest.distance !== 'number' || current.distance < closest.distance) {
      return current;
    }
    return closest;
  }, null);

  // Simple distance formatter
  const formatDistance = (distance: any): string => {
    return (typeof distance === 'number') 
      ? `${distance} ${distance === 1 ? 'mile' : 'miles'} away`
      : '';
  };
  
  // Cleaner location display
  const locationText = closestLocation 
    ? `${closestLocation.city || ''}, ${closestLocation.state || ''}${
        Number.isFinite(closestLocation.distance) 
          ? ` - ${formatDistance(closestLocation.distance)}`
          : ''
      }`
    : 'Location information not available';
  
  // Format compensation data
  const compensationBadge = trial.compensation?.has_compensation ? (
    <Badge bg="success" className="ms-2">
      {trial.compensation.amount ? `$${trial.compensation.amount}` : 'Paid'}
    </Badge>
  ) : (
    <Badge bg="secondary" className="ms-2">No Payment</Badge>
  );

  return (
    <Card className="trial-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="match-score">
          <Badge bg={matchPercentage > 80 ? "success" : matchPercentage > 60 ? "warning" : "danger"}>
            {matchPercentage}% Match
          </Badge>
          {compensationBadge}
        </div>
      </Card.Header>
      <Card.Body>
        <Card.Title>{trial.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {locationText}
        </Card.Subtitle>
        
        <div className="trial-tags mb-3">
          {trial.conditions.slice(0, 3).map((condition: string, index: number) => (
            <Badge bg="info" className="me-1" key={index}>{condition}</Badge>
          ))}
          {trial.gender && <Badge bg="dark" className="me-1">{trial.gender}</Badge>}
        </div>
        
        <Card.Text className="trial-summary">
          {trial.summary && trial.summary.length > 200 
            ? trial.summary.substring(0, 200) + '...' 
            : trial.summary}
        </Card.Text>
        
        {trial.compensation?.has_compensation && (
          <div className="compensation-info mt-2 p-2 bg-light rounded">
            <strong>Compensation:</strong> {trial.compensation.amount ? `$${trial.compensation.amount}` : 'Available'} 
            {trial.compensation.details && (
              <p className="small mt-1 mb-0">{trial.compensation.details}</p>
            )}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="text-center">
        <div className="d-flex justify-content-between">
          <Button 
            variant="outline-danger" 
            onClick={onSwipeLeft}
            className="swipe-button"
          >
            Not Interested
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={onShowDetails}
            className="swipe-button mx-2"
          >
            Details
          </Button>
          <Button 
            variant="outline-success" 
            onClick={onSwipeRight}
            className="swipe-button"
          >
            Interested
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default TrialCard;