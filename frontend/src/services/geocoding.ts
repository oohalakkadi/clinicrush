import axios from 'axios';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          address,
          key: API_KEY
        }
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  // Implementation of Haversine formula to calculate distance between two points
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(1));
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};