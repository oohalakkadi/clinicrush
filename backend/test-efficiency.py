#!/usr/bin/env python
# A focused script to debug trial formatting issues

import logging
import json
from api.trials import TrialAPI

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def debug_trial_format():
    """Debug trial distance formatting issues"""
    # Search for trials with a known location
    location = "San Ramon, CA"
    condition = "Diabetes"
    
    logger.info(f"Testing trial search with {condition} in {location}")
    trials = TrialAPI.search_trials(condition, location, max_results=5)
    
    # Check trial format
    if isinstance(trials, list) and trials:
        logger.info(f"Found {len(trials)} trials")
        
        # Examine the first trial
        trial = trials[0]
        logger.info(f"First trial ID: {trial['id']}")
        logger.info(f"Distance property: {trial.get('distance')}")
        
        # Check each location's distance
        logger.info("Locations and distances:")
        for i, loc in enumerate(trial['locations']):
            city = loc.get('city', 'Unknown')
            state = loc.get('state', '')
            distance = loc.get('distance')
            logger.info(f"  Location {i+1}: {city}, {state} - Distance: {distance}")
            
            # Check what type the distance is
            if distance is not None:
                logger.info(f"    Distance type: {type(distance)}")
            else:
                logger.info("    Distance is None")
                
            # Check if coordinates exist
            if loc.get('latitude') is not None and loc.get('longitude') is not None:
                logger.info(f"    Has coordinates: ({loc.get('latitude')}, {loc.get('longitude')})")
            else:
                logger.info("    Missing coordinates")
                
        # Write trial to file for inspection
        with open('trial_debug.json', 'w') as f:
            json.dump(trial, f, indent=2)
            logger.info("Wrote trial data to trial_debug.json for inspection")
    else:
        logger.error(f"Error or no trials found: {trials}")

if __name__ == "__main__":
    debug_trial_format()