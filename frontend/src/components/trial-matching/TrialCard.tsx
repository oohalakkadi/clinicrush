// src/components/trial-matching/TrialCard.tsx
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import './TrialCard.css';

interface TrialCardProps {
  trial: any; // For hackathon purposes, using 'any' is acceptable. In production, define a proper interface
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onShowDetails: () => void;
}

const TrialCard: React.FC<TrialCardProps> = ({ trial, onSwipeLeft, onSwipeRight, onShowDetails }) => {
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
          {trial.summary}
        </Card.Text>
        <div className="trial-details">
          <p><strong>Gender:</strong> {trial.gender}</p>
          <p><strong>Age Range:</strong> {trial.age_range.min} - {trial.age_range.max}</p>
          {trial.locations && trial.locations.length > 0 && (
            <p><strong>Location:</strong> {trial.locations[0].facility}, {trial.locations[0].city.city || trial.locations[0].city}</p>
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