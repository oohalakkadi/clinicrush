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
                # Format the query with location correctly for the API
                params["query.term"] = f"{condition} AND AREA[LocationCity]{location}"
            
            logger.debug(f"API request URL: {TrialAPI.BASE_URL}")
            logger.debug(f"API request params: {params}")
            
            # Make request to ClinicalTrials.gov API
            response = requests.get(TrialAPI.BASE_URL, params=params)
            
            logger.debug(f"API response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"API error: {response.text}")
                return {"error": "Failed to fetch clinical trials", "details": response.text}
            
            # Process and format the response
            data = response.json()
            
            # Extract studies from the response structure
            studies = data.get('studies', [])
            logger.debug(f"Found {len(studies)} studies")
            
            if not studies:
                logger.warning("No studies found")
                return []
            
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
                    # Using hash of NCT ID for consistency
                    'matchScore': 0.7 + (hash(identification.get('nctId', '')) % 30) / 100
                }
                
                # Process location data
                # Process location data (starting at line 75 in your trials.py file)
                locations = contacts.get('locations', [])
                for location in locations:
                    try:
                        # Handle facility which could be a string or an object
                        facility_name = ''
                        facility_data = location.get('facility', {})
                        if isinstance(facility_data, dict):
                            facility_name = facility_data.get('name', '')
                        else:
                            # If it's already a string
                            facility_name = str(facility_data)
                        
                        location_data = {
                            'facility': facility_name,
                            'city': location.get('city', ''),
                            'state': location.get('state', ''),
                            'country': location.get('country', ''),
                            'zip': location.get('zip', '')
                        }
                        trial['locations'].append(location_data)
                    except Exception as e:
                        logger.warning(f"Error processing location data: {str(e)}")
                        # Add a simple location entry in case of error
                        trial['locations'].append({
                            'facility': 'Unknown',
                            'city': '',
                            'state': '',
                            'country': '',
                            'zip': ''
                        })
                
                formatted_trials.append(trial)
            
            return formatted_trials
            
        except Exception as e:
            logger.exception("Error in search_trials:")
            return {"error": f"An error occurred: {str(e)}"}