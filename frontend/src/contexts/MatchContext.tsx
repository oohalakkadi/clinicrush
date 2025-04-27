import React, { createContext, useState, useContext, useEffect } from 'react';

interface MatchContextType {
  matchedTrials: any[];
  addMatch: (trial: any) => void;
  clearMatches: () => void;
  removeMatch: (trialId: string) => void;
}

const MatchContext = createContext<MatchContextType>({
  matchedTrials: [],
  addMatch: () => {},
  clearMatches: () => {},
  removeMatch: () => {}
});

export const MatchProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [matchedTrials, setMatchedTrials] = useState<any[]>([]);
  
  // Load initial matches from localStorage
  useEffect(() => {
    try {
      const savedMatches = JSON.parse(localStorage.getItem('matchedTrials') || '[]');
      setMatchedTrials(savedMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  }, []);
  
  const addMatch = (trial: any) => {
    try {
      // Check for duplicates
      const isDuplicate = matchedTrials.some(t => t.id === trial.id);
      if (!isDuplicate) {
        const newMatches = [...matchedTrials, trial];
        setMatchedTrials(newMatches);
        localStorage.setItem('matchedTrials', JSON.stringify(newMatches));
      }
    } catch (err) {
      console.error('Error adding match:', err);
    }
  };
  
  const clearMatches = () => {
    setMatchedTrials([]);
    localStorage.removeItem('matchedTrials');
  };
  
  const removeMatch = (trialId: string) => {
    const updatedMatches = matchedTrials.filter(trial => trial.id !== trialId);
    setMatchedTrials(updatedMatches);
    localStorage.setItem('matchedTrials', JSON.stringify(updatedMatches));
  };
  
  return (
    <MatchContext.Provider value={{ matchedTrials, addMatch, clearMatches, removeMatch }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatches = () => useContext(MatchContext);