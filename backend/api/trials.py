# backend/api/trials.py
import requests
import logging
import os
import json
from dotenv import load_dotenv
import random  # For development purposes only

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Google Maps API Key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

class TrialAPI:
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
    
    @staticmethod
    def geocode_location(address):
        """Get geocode information for an address"""
        try:
            params = {
                'address': address,
                'key': GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get('https://maps.googleapis.com/maps/api/geocode/json', params=params)
            
            if response.status_code != 200:
                logger.error(f"Geocoding API error: {response.text}")
                return None
                
            data = response.json()
            
            if data['status'] != 'OK' or not data['results']:
                logger.error(f"Geocoding failed: {data['status']}")
                return None
                
            result = data['results'][0]
            return {
                'lat': result['geometry']['location']['lat'],
                'lng': result['geometry']['location']['lng'],
                'formatted_address': result['formatted_address']
            }
            
        except Exception as e:
            logger.exception(f"Error in geocoding: {str(e)}")
            return None

    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula"""
        # Implementation of Haversine formula to calculate distance in miles
        from math import radians, sin, cos, sqrt, atan2
        
        R = 3958.8  # Earth radius in miles
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return round(distance, 1)
    
    @staticmethod
    def search_trials(condition, location=None, max_results=20, user_latitude=None, user_longitude=None):
        """Search for clinical trials based on condition and location with compensation data"""
        try:
            # Build query parameters for v2 API
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
            
            # Get user location geocoding if provided
            user_geo = None
            if location and not (user_latitude and user_longitude):
                user_geo = TrialAPI.geocode_location(location)
                if user_geo:
                    user_latitude = user_geo['lat']
                    user_longitude = user_geo['lng']
            
            formatted_trials = []
            for study in studies:
                protocol = study.get('protocolSection', {})
                identification = protocol.get('identificationModule', {})
                description = protocol.get('descriptionModule', {})
                conditions_module = protocol.get('conditionsModule', {})
                eligibility = protocol.get('eligibilityModule', {})
                contacts = protocol.get('contactsLocationsModule', {})
                detailed_description = description.get('detailedDescription', '')
                
                # Extract eligibility criteria for allergy checking
                criteria_text = eligibility.get('eligibilityCriteria', '')
                
                # Check for compensation info in the detailed description
                compensation_info = TrialAPI.extract_compensation_info(detailed_description)
                
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
                    'compensation': compensation_info,
                    'eligibilityCriteria': criteria_text,
                    'substancesUsed': TrialAPI.extract_substances(protocol)
                }
                
                # Process location data
                locations = contacts.get('locations', [])
                min_distance = float('inf')
                
                for location in locations:
                    try:
                        # Handle facility which could be a string or an object
                        facility_name = ''
                        facility_data = location.get('facility', {})
                        if isinstance(facility_data, dict):
                            facility_name = facility_data.get('name', '')
                        else:
                            facility_name = str(facility_data)
                        
                        # Get location details
                        city = location.get('city', '')
                        state = location.get('state', '')
                        country = location.get('country', '')
                        zip_code = location.get('zip', '')
                        
                        # Geocode the location
                        location_address = f"{city}, {state}, {country}"
                        location_geo = None
                        latitude = None
                        longitude = None
                        distance = None
                        
                        if user_latitude and user_longitude:
                            # Try to geocode the trial location
                            location_geo = TrialAPI.geocode_location(location_address)
                            if location_geo:
                                latitude = location_geo['lat']
                                longitude = location_geo['lng']
                                # Calculate distance
                                distance = TrialAPI.calculate_distance(
                                    user_latitude, user_longitude, latitude, longitude
                                )
                                
                                # Update minimum distance
                                if distance and distance < min_distance:
                                    min_distance = distance
                        
                        location_data = {
                            'facility': facility_name,
                            'city': city,
                            'state': state,
                            'country': country,
                            'zip': zip_code,
                            'latitude': latitude,
                            'longitude': longitude,
                            'distance': distance
                        }
                        
                        trial['locations'].append(location_data)
                    except Exception as e:
                        logger.exception(f"Error processing location: {str(e)}")
                
                # Add the minimum distance to the nearest location
                if min_distance != float('inf'):
                    trial['distance'] = min_distance
                
                formatted_trials.append(trial)
            
            return formatted_trials
            
        except Exception as e:
            logger.exception(f"Error searching trials: {str(e)}")
            return {"error": f"Failed to search trials: {str(e)}"}
    
    @staticmethod
    def extract_compensation_info(detailed_description):
        """Extract compensation information from the detailed description"""
        if not detailed_description:
            # For development purposes, generate mock compensation
            # In a real app, you would do more sophisticated text analysis
            has_compensation = random.choice([True, False, True, True])  # 75% chance of having compensation
            if has_compensation:
                amount = random.randint(50, 500) * 5
                return {
                    'has_compensation': True,
                    'amount': amount,
                    'currency': 'USD',
                    'details': f"Participants will be compensated up to ${amount} for time and travel expenses."
                }
            return {
                'has_compensation': False
            }
        
        # Look for compensation-related keywords in the text
        compensation_keywords = ['compensate', 'compensation', 'payment', 'paid', 'reimbursed', 'stipend', '$']
        lower_desc = detailed_description.lower()
        
        for keyword in compensation_keywords:
            if keyword in lower_desc:
                # Find sentences containing compensation information
                sentences = detailed_description.split('.')
                compensation_sentences = [s for s in sentences if keyword in s.lower()]
                
                if compensation_sentences:
                    # Try to extract amounts from the text using regex
                    import re
                    amounts = re.findall(r'\$\s*(\d+(?:,\d+)*(?:\.\d+)?)', ' '.join(compensation_sentences))
                    
                    highest_amount = 0
                    if amounts:
                        # Convert to numeric and find highest value
                        for amount in amounts:
                            amount = float(amount.replace(',', ''))
                            highest_amount = max(highest_amount, amount)
                    
                    return {
                        'has_compensation': True,
                        'amount': highest_amount if highest_amount > 0 else None,
                        'currency': 'USD' if '$' in ' '.join(compensation_sentences) else None,
                        'details': ' '.join(compensation_sentences).strip()
                    }
        
        return {
            'has_compensation': False
        }
    
    @staticmethod
    def extract_substances(protocol):
        """Extract substances used in the trial for allergy checking"""
        # Check for intervention data
        interventions_module = protocol.get('armsInterventionsModule', {})
        interventions = interventions_module.get('interventions', [])
        
        substances = []
        
        for intervention in interventions:
            intervention_type = intervention.get('interventionType', '')
            intervention_name = intervention.get('interventionName', '')
            
            # Focus on drug, biological, and dietary supplement interventions
            if intervention_type.lower() in ['drug', 'biological', 'dietary supplement']:
                substances.append({
                    'type': intervention_type,
                    'name': intervention_name
                })
        
        return substances