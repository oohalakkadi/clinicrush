import React, { useState, useRef, useEffect } from 'react';
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
  // Animation states
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationClass, setAnimationClass] = useState<string>('');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element
  useEffect(() => {
    audioRef.current = new Audio('/swipe-sound.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle left swipe with animation
  const handleSwipeLeft = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationClass('swipe-left');
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationClass('');
      onSwipeLeft();
    }, 700);
  };

  // Handle right swipe with animation
  const handleSwipeRight = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationClass('swipe-right');
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Trigger confetti animation
    window.dispatchEvent(new CustomEvent('showConfetti'));
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationClass('');
      onSwipeRight();
    }, 700);
  };
  
  // Format match score percentage
  const matchPercentage = Math.round((trial.matchScore || 0) * 100);
  
  // Find the closest location with a valid distance
  const closestLocation = trial.locations && trial.locations.length > 0 
    ? trial.locations.reduce((closest: any, current: any) => {
        // Skip locations with undefined or non-numeric distances
        if (current.distance === undefined || current.distance === null || isNaN(current.distance)) {
          return closest;
        }
        
        // If no closest yet, or this one is closer than current closest
        if (!closest || 
            closest.distance === undefined || 
            closest.distance === null || 
            isNaN(closest.distance) || 
            current.distance < closest.distance) {
          return current;
        }
        return closest;
      }, null)
    : null;
  
  // Format distance with consistent handling of numeric values
  const formatDistance = (distance: any): string => {
    // Only format if it's a valid number
    if (typeof distance === 'number' && !isNaN(distance)) {
      return `${distance} ${distance === 1 ? 'mile' : 'miles'} away`;
    }
    return '';
  };
  
  // Format location string with proper distance display
  const locationText = closestLocation 
    ? `${closestLocation.city || ''}, ${closestLocation.state || ''}${
        typeof closestLocation.distance === 'number' && !isNaN(closestLocation.distance)
          ? ` - ${formatDistance(closestLocation.distance)}`
          : ''
      }`.trim()
    : 'Location information not available';
  
  // Format compensation data
  const compensationBadge = trial.compensation?.has_compensation ? (
    <Badge bg="success" className="ms-2">
      {trial.compensation.amount ? `$${trial.compensation.amount}` : 'Paid'}
    </Badge>
  ) : (
    <Badge bg="secondary" className="ms-2">No Payment</Badge>
  );
  
  // Format gender badge
  const formatGender = () => {
    if (!trial.gender) return null;
    
    // Clean up the gender display
    const normalizedGender = trial.gender.toLowerCase();
    
    if (normalizedGender === 'all' || normalizedGender.includes('both')) {
      return <Badge bg="info" className="me-1">All Genders</Badge>;
    } else if (normalizedGender.includes('male') && normalizedGender.includes('female')) {
      return <Badge bg="info" className="me-1">All Genders</Badge>;
    } else if (normalizedGender.includes('male')) {
      return <Badge bg="info" className="me-1">Male</Badge>;
    } else if (normalizedGender.includes('female')) {
      return <Badge bg="info" className="me-1">Female</Badge>;
    }
    
    return null;
  };

  return (
    <div className={`trial-card-container ${animationClass}`} ref={cardRef}>
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
            {trial.conditions && trial.conditions.slice(0, 3).map((condition: string, index: number) => (
              <Badge bg="primary" className="me-1" key={index}>{condition}</Badge>
            ))}
            {formatGender()}
          </div>
          
          <Card.Text className="trial-summary">
            {trial.summary && trial.summary.length > 200 
              ? trial.summary.substring(0, 200) + '...' 
              : trial.summary || 'No summary available'}
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
      </Card>

      {/* New circular action buttons */}
      <div className="action-buttons">
        <Button 
          variant="outline-danger" 
          className="circle-button reject-button"
          onClick={handleSwipeLeft}
          disabled={isAnimating}
        >
          <span className="icon-wrapper">✕</span>
        </Button>
        
        <Button 
          variant="outline-secondary" 
          className="circle-button details-button"
          onClick={onShowDetails}
          disabled={isAnimating}
        >
          <span className="icon-wrapper">⋯</span>
        </Button>
        
        <Button 
          variant="outline-success" 
          className="circle-button accept-button"
          onClick={handleSwipeRight}
          disabled={isAnimating}
        >
          <span className="icon-wrapper">✓</span>
        </Button>
      </div>
      
      {/* Hidden audio element */}
      <audio src="/swipe-sound.mp3" preload="auto" style={{ display: 'none' }} />
    </div>
  );
};

export default TrialCard;