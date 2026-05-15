// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Try backend proxy for geocoding (handles Nominatim and fallbacks)
 */
const tryBackendProxy = async (lat, lng) => {
  const response = await fetch(
    `${API_BASE_URL}/geocoding/reverse/?lat=${lat}&lon=${lng}`
  );
  
  if (!response.ok) {
    throw new Error(`Backend proxy HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.address) {
    return data.address;
  }
  
  throw new Error('No address found');
};

/**
 * Try OpenCage Geocoding API (free tier: 2500 requests/day)
 * Note: Requires API key - user needs to sign up at opencagedata.com
 */
const tryOpenCage = async (lat, lng) => {
  const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenCage API key not configured');
  }
  
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`OpenCage HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    return data.results[0].formatted;
  }
  
  throw new Error('No address found');
};

/**
 * Try BigDataCloud reverse geocoding (free, no API key required)
 */
const tryBigDataCloud = async (lat, lng) => {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );
  
  if (!response.ok) {
    throw new Error(`BigDataCloud HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  // Build detailed address from all available components
  const parts = [
    data.localityInfo?.administrative?.[6]?.name, // Street/Road
    data.localityInfo?.administrative?.[5]?.name, // Barangay/District
    data.locality || data.city,                    // City/Municipality
    data.principalSubdivision,                     // Province/State
    data.countryName                               // Country
  ].filter(Boolean);
  
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  throw new Error('No address found');
};

/**
 * Fallback: Generate simple coordinate-based address
 */
const generateCoordinateAddress = (lat, lng) => {
  return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * Main geocoding function with multiple fallbacks
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Address string
 */
export const reverseGeocode = async (lat, lng) => {
  const providers = [
    { name: 'Backend Proxy', fn: tryBackendProxy },
    { name: 'BigDataCloud', fn: tryBigDataCloud },
    { name: 'OpenCage', fn: tryOpenCage }
  ];
  
  // Try each provider in order
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} geocoding...`);
      const address = await provider.fn(lat, lng);
      console.log(`✓ ${provider.name} succeeded:`, address);
      return address;
    } catch (error) {
      console.warn(`✗ ${provider.name} failed:`, error.message);
      // Continue to next provider
    }
  }
  
  // All providers failed, use coordinate fallback
  console.log('All geocoding providers failed, using coordinates');
  return generateCoordinateAddress(lat, lng);
};

export default reverseGeocode;
