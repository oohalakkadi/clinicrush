// src/components/trial-matching/TrialCard.tsx
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import './TrialCard.css';

interface TrialCardProps {
  trial: any; 
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onShowDetails: () => void;
}

const TrialCard: React.FC<TrialCardProps> = ({ trial, onSwipeLeft, onSwipeRight, onShowDetails }) => {
  // Helper function to safely get location display text
  const getLocationText = (location: any) => {
    if (!location) return 'Unknown location';
    
    const facility = location.facility || 'Unknown facility';
    
    // Handle city which might be a string or an object
    let cityText = '';
    if (typeof location.city === 'string') {
      cityText = location.city;
    } else if (location.city && typeof location.city === 'object') {
      // If it's an object, try to get the city name from it
      cityText = location.city.city || '';
    }
    
    return `${facility}, ${cityText}`;
  };

  return (
    <Card className="trial-card">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5>{trial.title}</h5>
          <Badge bg="success">Match: {Math.round(trial.matchScore * 100)}%</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="conditions-list">
          {trial.conditions && trial.conditions.map((condition: string, index: number) => (
            <Badge key={index} bg="info" className="me-1 mb-1">{condition}</Badge>
          ))}
        </div>
        <Card.Text className="summary-text">
          {trial.summary ? 
            (trial.summary.length > 300 ? `${trial.summary.substring(0, 300)}...` : trial.summary)
            : 'No summary available'}
        </Card.Text>
        <div className="trial-details">
          <p><strong>Gender:</strong> {trial.gender || 'Not specified'}</p>
          <p><strong>Age Range:</strong> {trial.age_range?.min || 'N/A'} - {trial.age_range?.max || 'N/A'}</p>
          {trial.locations && trial.locations.length > 0 && (
            <p><strong>Location:</strong> {getLocationText(trial.locations[0])}</p>
          )}
        </div>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-between">
          <Button variant="outline-danger" onClick={onSwipeLeft}>
            <i className="fas fa-times"></i> Not Interested
          </Button>
          <Button variant="outline-info" onClick={onShowDetails}>
            More Info
          </Button>
          <Button variant="outline-success" onClick={onSwipeRight}>
            <i className="fas fa-heart"></i> Interested
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default TrialCard;