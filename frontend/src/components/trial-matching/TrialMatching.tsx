// src/components/trial-matching/TrialMatching.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { searchTrials } from '../../services/api';
import TrialCard from './TrialCard';
import './TrialMatching.css';

const TrialMatching: React.FC = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  const [rejectedTrials, setRejectedTrials] = useState<any[]>([]);

  useEffect(() => {
    // Load trials when component mounts
    const loadTrials = async () => {
      try {
        setLoading(true);
        // Default search for diabetes in Boston
        const trialsData = await searchTrials('diabetes', 'Boston');
        setTrials(trialsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load clinical trials. Please try again later.');
        setLoading(false);
      }
    };

    loadTrials();
  }, []);

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
    }
  };

  const handleShowDetails = () => {
    // For hackathon purposes, just show details in an alert
    if (currentIndex < trials.length) {
      alert(`Details for ${trials[currentIndex].title}\n\nID: ${trials[currentIndex].id}\n\nSummary: ${trials[currentIndex].summary}`);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Show a message if all trials have been swiped through
  if (currentIndex >= trials.length) {
    return (
      <Container>
        <div className="text-center my-5">
          <h2>You've viewed all available trials!</h2>
          <p>You matched with {matchedTrials.length} trials.</p>
          <p>Check your matches in the "My Matches" tab.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2 className="text-center mb-4">Find Your Clinical Trial Match</h2>
          <div className="trial-swipe-container">
            {trials[currentIndex] && (
              <TrialCard
                trial={trials[currentIndex]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onShowDetails={handleShowDetails}
              />
            )}
          </div>
          <div className="stats-container text-center mt-3">
            <p>Viewed: {currentIndex} | Matched: {matchedTrials.length} | Passed: {rejectedTrials.length}</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default TrialMatching;