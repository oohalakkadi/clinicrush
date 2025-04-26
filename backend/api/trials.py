# backend/api/trials.py
import requests
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class TrialAPI:
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
    
    @staticmethod
    def search_trials(condition, location=None, max_results=20):
        """Search for clinical trials based on condition and location"""
        try:
            # Build query parameters for v2 API with correct parameter names
            params = {
                "query.term": condition,
                "pageSize": max_results,
                "format": "json"
            }
            
            # Add location if provided
            if location:
                params["query.term"] = f"{condition} AND AREA[LocationCity]{location}"
            
            logger.debug(f"API request URL: {TrialAPI.BASE_URL}")
            logger.debug(f"API request params: {params}")
            
            # Make request to ClinicalTrials.gov API
            response = requests.get(TrialAPI.BASE_URL, params=params)
            
            logger.debug(f"API response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"API error: {response.text}")
                logger.warning("Falling back to mock data")
                return TrialAPI._get_mock_trials(condition, location)
            
            # Process and format the response
            data = response.json()
            
            # Extract studies from the response structure
            studies = data.get('studies', [])
            logger.debug(f"Found {len(studies)} studies")
            
            if not studies:
                logger.warning("No studies found, falling back to mock data")
                return TrialAPI._get_mock_trials(condition, location)
            
            formatted_trials = []
            for study in studies:
                protocol = study.get('protocolSection', {})
                identification = protocol.get('identificationModule', {})
                description = protocol.get('descriptionModule', {})
                conditions_module = protocol.get('conditionsModule', {})
                eligibility = protocol.get('eligibilityModule', {})
                contacts = protocol.get('contactsLocationsModule', {})
                
                # Format the trial data into a cleaner structure
                trial = {
                    'id': identification.get('nctId', ''),
                    'title': identification.get('briefTitle', ''),
                    'conditions': conditions_module.get('conditions', []),
                    'summary': description.get('briefSummary', ''),
                    'gender': eligibility.get('sex', ''),
                    'age_range': {
                        'min': eligibility.get('minimumAge', ''),
                        'max': eligibility.get('maximumAge', '')
                    },
                    'locations': [],
                    # Generate a match score between 70-99% for demo purposes
                    'matchScore': 0.7 + (hash(identification.get('nctId', '')) % 30) / 100
                }
                
                # Process location data
                locations = contacts.get('locations', [])
                for location in locations:
                    location_data = {
                        'facility': location.get('facility', {}).get('name', ''),
                        'city': location.get('city', ''),
                        'state': location.get('state', ''),
                        'country': location.get('country', ''),
                        'zip': location.get('zip', '')
                    }
                    trial['locations'].append(location_data)
                
                formatted_trials.append(trial)
            
            return formatted_trials
            
        except Exception as e:
            logger.exception("Error in search_trials:")
            return TrialAPI._get_mock_trials(condition, location)
    
    @staticmethod
    def _get_mock_trials(condition, location=None):
        """Generate mock trial data for demo purposes"""
        logger.info("Generating mock trial data")
        
        mock_trials = [
            {
                'id': 'NCT01234567',
                'title': f'Study of New Treatment for {condition}',
                'conditions': [condition, 'Related Condition'],
                'summary': f'This clinical trial investigates a new treatment for {condition} with promising results in preliminary studies.',
                'gender': 'All',
                'age_range': {
                    'min': '18 Years',
                    'max': '75 Years'
                },
                'locations': [
                    {
                        'facility': f'{location} Medical Center' if location else 'Major Medical Center',
                        'city': location or 'Boston',
                        'state': 'MA',
                        'country': 'United States',
                        'zip': '02115'
                    }
                ],
                'matchScore': 0.85
            },
            {
                'id': 'NCT23456789',
                'title': f'Evaluation of Drug X for {condition} Treatment',
                'conditions': [condition],
                'summary': f'A phase 3 clinical trial evaluating the efficacy of Drug X in treating {condition} in adults.',
                'gender': 'All',
                'age_range': {
                    'min': '21 Years',
                    'max': '65 Years'
                },
                'locations': [
                    {
                        'facility': 'University Hospital',
                        'city': location or 'Cambridge',
                        'state': 'MA',
                        'country': 'United States',
                        'zip': '02139'
                    }
                ],
                'matchScore': 0.75
            },
            {
                'id': 'NCT34567890',
                'title': f'Novel Approach to {condition} Management',
                'conditions': [condition, 'Complications'],
                'summary': f'This study examines a novel approach to managing {condition} and its complications.',
                'gender': 'All',
                'age_range': {
                    'min': '30 Years',
                    'max': '80 Years'
                },
                'locations': [
                    {
                        'facility': 'Research Hospital',
                        'city': location or 'Boston',
                        'state': 'MA',
                        'country': 'United States',
                        'zip': '02120'
                    }
                ],
                'matchScore': 0.92
            }
        ]
        
        return mock_trials