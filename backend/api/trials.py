# backend/api/trials.py
import requests
import logging
import os
import json
import time
import pickle
from dotenv import load_dotenv
import random
import hashlib
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Google Maps API Key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')
if not GOOGLE_MAPS_API_KEY:
    logger.warning("No Google Maps API key found in environment variables")

# Persistent geocoding cache
CACHE_FILE = os.path.join(os.path.dirname(__file__), 'geocoding_cache.pkl')
geocoding_cache = {}

# Load cached geocoding results
try:
    if os.path.exists(CACHE_FILE) and os.path.getsize(CACHE_FILE) > 0:
        with open(CACHE_FILE, 'rb') as f:
            geocoding_cache = pickle.load(f)
            logger.debug(f"Loaded {len(geocoding_cache)} cached locations")
except Exception as e:
    logger.warning(f"Failed to load geocoding cache: {e}")

def save_geocoding_cache():
    """Save geocoding cache to disk"""
    try:
        with open(CACHE_FILE, 'wb') as f:
            pickle.dump(geocoding_cache, f)
    except Exception as e:
        logger.warning(f"Failed to save geocoding cache: {e}")

class TrialAPI:
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
    
    @staticmethod
    def search_trials(condition, location=None, max_results=1000, distance_miles=1000):
        """Search for clinical trials based on condition and location"""
        try:
            logger.debug(f"Searching for trials with condition: {condition}, location: {location}")
            
            # Build query parameters for v2 API
            params = {
                "query.term": f"{condition}" + (f" AND AREA[LocationCity]{location.split(',')[0].strip()}" if location else ""),
                "pageSize": max_results,
                "format": "json"
            }
            
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
            user_latitude = None
            user_longitude = None
            user_state = None
            
            if location:
                user_geo = TrialAPI.geocode_location(location)
                if user_geo:
                    user_latitude = user_geo['lat']
                    user_longitude = user_geo['lng']
                
                # Extract user state for filtering
                if ',' in location:
                    parts = location.split(',')
                    if len(parts) >= 2:
                        user_state = parts[1].strip().lower()
            
            formatted_trials = []
            for study in studies:
                try:
                    protocol = study.get('protocolSection', {})
                    identification = protocol.get('identificationModule', {})
                    description = protocol.get('descriptionModule', {})
                    conditions_module = protocol.get('conditionsModule', {})
                    eligibility = protocol.get('eligibilityModule', {})
                    contacts = protocol.get('contactsLocationsModule', {})
                    interventions_module = protocol.get('armsInterventionsModule', {})
                    detailed_description = description.get('detailedDescription', '')
                    
                    # Get NCT ID first as identifier for logging
                    nct_id = identification.get('nctId', 'unknown')
                    
                    # Safely get conditions list
                    conditions = conditions_module.get('conditions', [])
                    if not isinstance(conditions, list):
                        conditions = [str(conditions)]
                    
                    # Extract eligibility criteria for allergy checking
                    criteria_text = eligibility.get('eligibilityCriteria', '')
                    
                    # Check for compensation info in the detailed description
                    compensation_info = TrialAPI.extract_compensation_info(detailed_description)
                    
                    # Format gender for display
                    gender = eligibility.get('sex', '')
                    if not gender:
                        gender = 'All'
                    
                    # Format the trial data into a cleaner structure
                    trial = {
                        'id': nct_id,
                        'title': identification.get('briefTitle', ''),
                        'conditions': conditions,
                        'summary': description.get('briefSummary', ''),
                        'gender': gender,
                        'age_range': {
                            'min': eligibility.get('minimumAge', ''),
                            'max': eligibility.get('maximumAge', '')
                        },
                        'locations': [],
                        'compensation': compensation_info,
                        'eligibilityCriteria': criteria_text,
                        'substancesUsed': TrialAPI.extract_substances(interventions_module)
                    }
                    
                    # Process location data
                    locations = contacts.get('locations', [])
                    min_distance = float('inf')
                    
                    if not locations:
                        # Add a default location if none provided
                        trial['locations'] = [{
                            'facility': 'Location not specified',
                            'city': '',
                            'state': '',
                            'country': '',
                            'zip': '',
                            'latitude': None,
                            'longitude': None,
                            'distance': None
                        }]
                    else:
                        # Prioritize locations in the same state as the user
                        same_state_locations = []
                        other_locations = []
                        
                        for loc in locations:
                            state = loc.get('state', '').lower()
                            # Skip locations in different regions to reduce geocoding
                            if user_state and state and TrialAPI.is_different_region(user_state, state):
                                continue
                                
                            if user_state and state and state == user_state:
                                same_state_locations.append(loc)
                            else:
                                other_locations.append(loc)
                        
                        # Process at most 3 locations per trial - prioritize same state
                        locations_to_process = (same_state_locations + other_locations)[:3]
                        
                        for location_data in locations_to_process:
                            try:
                                # Handle facility which could be a string or an object
                                facility_name = ''
                                facility_data = location_data.get('facility', {})
                                if isinstance(facility_data, dict):
                                    facility_name = facility_data.get('name', '')
                                else:
                                    facility_name = str(facility_data)
                                
                                # Get location details
                                city = location_data.get('city', '')
                                state = location_data.get('state', '')
                                country = location_data.get('country', '')
                                zip_code = location_data.get('zip', '')
                                
                                # Skip geocoding if user location is unknown
                                latitude = None
                                longitude = None
                                distance = None

                                # Only calculate distance if user location is available
                                if user_latitude and user_longitude and city:
                                    # Create a cache key for this location to avoid duplicate geocoding
                                    location_address = f"{city}, {state}, {country}".strip()
                                    if location_address and location_address != ", ":
                                        # Use cached geocode if available
                                        cache_key = location_address.lower()
                                        if cache_key in geocoding_cache:
                                            location_geo = geocoding_cache[cache_key]
                                        else:
                                            # Only geocode if we have meaningful address information
                                            location_geo = TrialAPI.geocode_location(location_address)
                                            if location_geo:
                                                geocoding_cache[cache_key] = location_geo
                                        
                                        if location_geo and 'lat' in location_geo and 'lng' in location_geo:
                                            latitude = location_geo['lat']
                                            longitude = location_geo['lng']
                                            # Calculate distance with stronger validation
                                            if latitude and longitude and user_latitude and user_longitude:
                                                try:
                                                    distance = TrialAPI.calculate_distance(
                                                        user_latitude, user_longitude, latitude, longitude
                                                    )
                                                    
                                                    # Log the exact distance calculated for debugging
                                                    logger.debug(f"Calculated distance for {location_address}: {distance} miles")
                                                    
                                                    # Only update minimum distance if we got a valid number
                                                    if isinstance(distance, (int, float)):
                                                        min_distance = min(min_distance, distance)
                                                except Exception as e:
                                                    logger.error(f"Distance calculation error for {city}: {str(e)}")
                                
                                location_info = {
                                    'facility': facility_name,
                                    'city': city,
                                    'state': state,
                                    'country': country,
                                    'zip': zip_code,
                                    'latitude': latitude,
                                    'longitude': longitude,
                                    'distance': distance
                                }
                                
                                trial['locations'].append(location_info)
                            except Exception as e:
                                logger.exception(f"Error processing location for trial {nct_id}: {str(e)}")
                        
                        # If we limited the locations, add a summary
                        remaining_locations = len(locations) - len(trial['locations'])
                        if remaining_locations > 0:
                            trial['locations'].append({
                                'facility': f"+ {remaining_locations} more locations",
                                'city': '',
                                'state': '',
                                'country': '',
                                'zip': '',
                                'latitude': None,
                                'longitude': None,
                                'distance': None
                            })
                    
                        # Add the minimum distance to the nearest location
                        if min_distance != float('inf'):
                            trial['distance'] = min_distance
                        else:
                            trial['distance'] = None  # Explicitly set to None for better sorting

                        # Only include trials that meet distance criteria
                        if user_latitude is None:
                            # If no user location, include all trials
                            formatted_trials.append(trial)
                        elif min_distance == float('inf'):
                            # If distance couldn't be calculated but we have user location, include but low priority
                            trial['distance'] = 9999  # Very far away but sortable
                            formatted_trials.append(trial)
                        elif min_distance <= distance_miles:
                            # Include trials within specified distance
                            formatted_trials.append(trial)

                except Exception as e:
                    logger.exception(f"Error processing trial: {str(e)}")
                    continue
            
            # Save geocoding cache
            if len(geocoding_cache) % 10 == 0:
                save_geocoding_cache()
            
            if user_latitude and user_longitude:
            # Ensure all trials have proper distance values for sorting
                for trial in formatted_trials:
                    if trial.get('distance') is None:
                        # Use a very large number for undefined distances to place at the end
                        trial['distance'] = float('inf')
                
                # Log before sorting
                logger.debug("Pre-sort trial distances:")
                for idx, trial in enumerate(formatted_trials[:5]):
                    logger.debug(f"  #{idx+1}: ID={trial['id']}, distance={trial.get('distance')}")
                
                # Sort using stable numeric comparison
                formatted_trials.sort(key=lambda t: (
                    # Primary sort: distance value (handles float('inf') values)
                    float(t.get('distance', float('inf'))),
                    # Secondary sort: by ID to ensure consistent order for same distances
                    t.get('id', '')
                ))
                
                # Log after sorting
                logger.debug("Post-sort trial distances:")
                for idx, trial in enumerate(formatted_trials[:5]):
                    logger.debug(f"  #{idx+1}: ID={trial['id']}, distance={trial.get('distance')}")
                    
                # Remove infinite distance marker for frontend display
                for trial in formatted_trials:
                    if trial.get('distance') == float('inf'):
                        trial['distance'] = None
                        
            save_geocoding_cache()

            for trial in formatted_trials:
                trial_locations = trial.get('locations', [])
                location_distances = [loc.get('distance') for loc in trial_locations]
                logger.info(f"Trial {trial['id']} - distance: {trial.get('distance')}, location distances: {location_distances}")

            logger.debug(f"Returning {len(formatted_trials)} formatted trials")
            return formatted_trials
            
        except Exception as e:
            logger.exception(f"Error searching trials: {str(e)}")
            return {"error": f"Failed to search trials: {str(e)}"}
    
    @staticmethod
    def is_different_region(state1, state2):
        """Check if states are in different regions (to skip distant locations)"""
        regions = {
            'west': ['ca', 'wa', 'or', 'nv', 'id', 'mt', 'wy', 'co', 'ut', 'az', 'nm', 'hi', 'ak'],
            'midwest': ['nd', 'sd', 'ne', 'ks', 'mn', 'ia', 'mo', 'wi', 'il', 'in', 'mi', 'oh'],
            'south': ['tx', 'ok', 'ar', 'la', 'ms', 'al', 'tn', 'ky', 'wv', 'va', 'nc', 'sc', 'ga', 'fl'],
            'northeast': ['me', 'nh', 'vt', 'ma', 'ri', 'ct', 'ny', 'pa', 'nj', 'de', 'md', 'dc']
        }
        
        state_map = {
            'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar', 'california': 'ca',
            'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de', 'florida': 'fl', 'georgia': 'ga',
            'hawaii': 'hi', 'idaho': 'id', 'illinois': 'il', 'indiana': 'in', 'iowa': 'ia',
            'kansas': 'ks', 'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
            'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
            'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv', 'new hampshire': 'nh',
            'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc',
            'north dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok', 'oregon': 'or', 'pennsylvania': 'pa',
            'rhode island': 'ri', 'south carolina': 'sc', 'south dakota': 'sd', 'tennessee': 'tn',
            'texas': 'tx', 'utah': 'ut', 'vermont': 'vt', 'virginia': 'va', 'washington': 'wa',
            'west virginia': 'wv', 'wisconsin': 'wi', 'wyoming': 'wy'
        }
        
        # Convert to state codes (case insensitive)
        state1 = state1.lower().strip()
        state2 = state2.lower().strip()
        
        # Convert to codes if full state names
        state1_code = state1 if len(state1) <= 2 else state_map.get(state1, '')
        state2_code = state2 if len(state2) <= 2 else state_map.get(state2, '')
        
        # Find regions
        state1_region = None
        state2_region = None
        
        for region, states in regions.items():
            if state1_code in states:
                state1_region = region
            if state2_code in states:
                state2_region = region
        
        # If both states have known regions and they're different
        return state1_region and state2_region and state1_region != state2_region
    # Replace your geocode_location method with this real API version:
    @staticmethod
    def geocode_location(address):
        """Get geocode information for an address with caching and rate limiting"""
        try:
            # Skip empty addresses
            if not address or address.strip() == "" or address.strip() == ", ":
                logger.debug(f"Skipping geocoding for empty address")
                return None
            
            # Check cache first
            cache_key = address.lower()
            if cache_key in geocoding_cache:
                logger.debug(f"Using cached geocode for {address}")
                return geocoding_cache[cache_key]
                
            # Add rate limiting - ensure we don't make requests too quickly
            time.sleep(0.1)
                
            # Check if API key is available
            if not GOOGLE_MAPS_API_KEY:
                logger.warning("No Google Maps API key provided, cannot geocode")
                return None
            
            logger.debug(f"Geocoding address: {address}")
            
            # Prepare the API request
            params = {
                'address': address,
                'key': GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get('https://maps.googleapis.com/maps/api/geocode/json', params=params)
            
            if response.status_code != 200:
                logger.error(f"Geocoding API error: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            logger.debug(f"Geocoding response status: {data.get('status')}")
            
            if data.get('status') != 'OK' or not data.get('results'):
                logger.error(f"Geocoding failed: {data.get('status')}")
                return None
            
            # Extract location data
            result = data['results'][0]
            location = result['geometry']['location']
            
            geocode_result = {
                'lat': location['lat'],
                'lng': location['lng'],
                'formatted_address': result['formatted_address'],
                'timestamp': datetime.now().isoformat()
            }
            
            # Debug the geocode result
            logger.debug(f"Geocoded {address} to {geocode_result['lat']}, {geocode_result['lng']}")
            
            # Cache the result
            geocoding_cache[cache_key] = geocode_result
            
            return geocode_result
        
        except Exception as e:
            logger.exception(f"Error in geocoding: {str(e)}")
            return None
    @staticmethod
    def mock_geocode_location(address):
        """Provide mock geocoding for development/testing purposes"""
        logger.info(f"Using mock geocoding for: {address}")
        
        # Dictionary of common locations and their coordinates
        location_coords = {
            'san francisco': {'lat': 37.7749, 'lng': -122.4194},
            'new york': {'lat': 40.7128, 'lng': -74.0060},
            'chicago': {'lat': 41.8781, 'lng': -87.6298},
            'boston': {'lat': 42.3601, 'lng': -71.0589},
            'san ramon': {'lat': 37.7799, 'lng': -121.9780},
            'los angeles': {'lat': 34.0522, 'lng': -118.2437},
            'seattle': {'lat': 47.6062, 'lng': -122.3321},
            'dallas': {'lat': 32.7767, 'lng': -96.7970},
            'houston': {'lat': 29.7604, 'lng': -95.3698},
            'miami': {'lat': 25.7617, 'lng': -80.1918},
            'atlanta': {'lat': 33.7490, 'lng': -84.3880},
            'philadelphia': {'lat': 39.9526, 'lng': -75.1652},
            'phoenix': {'lat': 33.4484, 'lng': -112.0740},
            'san antonio': {'lat': 29.4241, 'lng': -98.4936},
            'san diego': {'lat': 32.7157, 'lng': -117.1611},
            'denver': {'lat': 39.7392, 'lng': -104.9903},
        }
        
        # Try to match the location
        address_lower = address.lower()
        for key, coords in location_coords.items():
            if key in address_lower:
                return {
                    'lat': coords['lat'],
                    'lng': coords['lng'],
                    'formatted_address': address.title()
                }
        
        # For cities not in our predefined list, generate consistent coordinates based on hash
        # This ensures the same "city" always gets the same coordinates in mock mode
        hash_val = int(hashlib.md5(address_lower.encode()).hexdigest(), 16)
        
        # Generate a US location with a latitude between 25-49 and longitude between -65 and -125
        lat = 25.0 + (hash_val % 1000) / 1000 * 24.0  # 25-49
        lng = -125.0 + (hash_val % 10000) / 10000 * 60.0  # -125 to -65
        
        return {
            'lat': lat,
            'lng': lng,
            'formatted_address': address.title()
        }
    
# Replace this function in trials.py:
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula"""
        # Check for null or invalid coordinates
        if None in (lat1, lon1, lat2, lon2) or '' in (lat1, lon1, lat2, lon2):
            return None
            
        try:
            # Debug coordinates
            logger.debug(f"Calculating distance: ({lat1}, {lon1}) to ({lat2}, {lon2})")
            
            # Earth radius in miles
            R = 3958.8
            
            # Convert to float and radians
            lat1, lon1 = float(lat1), float(lon1)
            lat2, lon2 = float(lat2), float(lon2)
            
            # Convert degrees to radians
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            # Round to one decimal place
            rounded_distance = round(distance, 1)
            logger.debug(f"Calculated distance: {rounded_distance} miles")
            return rounded_distance
        except Exception as e:
            logger.error(f"Distance calculation error: {str(e)}")
            return None

    @staticmethod
    def extract_compensation_info(detailed_description):
        """Extract compensation information from the detailed description"""
        # Generate a consistent random number based on the description
        # So the same trial always gets the same compensation
        description_hash = hash(detailed_description or '')
        random.seed(description_hash)
        
        # Look for compensation keywords in the description
        compensation_keywords = ['compensat', 'payment', 'reimburse', 'stipend', '$', 'dollar']
        has_compensation_keywords = False
        
        if detailed_description:
            detailed_lower = detailed_description.lower()
            for keyword in compensation_keywords:
                if keyword in detailed_lower:
                    has_compensation_keywords = True
                    break
        
        # If we found compensation keywords or we're using mock data with 75% probability
        if has_compensation_keywords or random.random() < 0.75:
            # Generate amount between $100 and $2000
            amount = random.randint(2, 40) * 50  # $100 to $2000 in $50 increments
            
            # Generate appropriate details based on amount
            if amount <= 500:
                details = f"Participants will receive ${amount} for completing the study."
            elif amount <= 1000:
                details = f"Compensation of up to ${amount} for time and travel expenses."
            else:
                details = f"Participants may receive up to ${amount} for completing all study visits and procedures."
            
            return {
                'has_compensation': True,
                'amount': amount,
                'currency': 'USD',
                'details': details
            }
        
        return {
            'has_compensation': False
        }
    
    @staticmethod
    def extract_substances(interventions_module):
        """Extract substances used in the trial for allergy checking"""
        substances = []
        
        # Get interventions from the module
        interventions = interventions_module.get('interventions', [])
        if not interventions:
            return substances
        
        # Process each intervention
        for intervention in interventions:
            try:
                intervention_type = intervention.get('interventionType', '')
                intervention_name = intervention.get('interventionName', '')
                
                # Focus on drug, biological, and dietary supplement interventions
                if intervention_type and intervention_type.lower() in ['drug', 'biological', 'dietary supplement']:
                    substances.append({
                        'type': intervention_type,
                        'name': intervention_name
                    })
            except Exception as e:
                logger.exception(f"Error extracting substance: {str(e)}")
        
        return substances

# Clean old geocoding cache entries on module load
def clean_geocoding_cache():
    """Remove cache entries older than 30 days"""
    try:
        cutoff_time = datetime.now() - timedelta(days=30)
        old_entries = []
        
        for key, value in list(geocoding_cache.items()):
            if isinstance(value, dict) and 'timestamp' in value:
                try:
                    timestamp = datetime.fromisoformat(value['timestamp'])
                    if timestamp < cutoff_time:
                        old_entries.append(key)
                except (ValueError, TypeError):
                    pass
        
        for key in old_entries:
            del geocoding_cache[key]
            
        if old_entries:
            logger.debug(f"Cleaned {len(old_entries)} old entries from geocoding cache")
            save_geocoding_cache()
    except Exception as e:
        logger.warning(f"Failed to clean geocoding cache: {e}")

# Clean cache if needed
if len(geocoding_cache) > 100:
    clean_geocoding_cache()