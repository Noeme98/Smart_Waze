import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Map } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../../services/geocoding';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Step2Location = ({ formData, onInputChange }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [addressName, setAddressName] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const getAddressFromCoordinates = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setAddressName(address);
      onInputChange('locationAddress', address);
    } catch (error) {
      console.error('Error fetching address:', error);
      const fallbackAddress = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddressName(fallbackAddress);
      onInputChange('locationAddress', fallbackAddress);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      const defaultLat = formData.latitude || 11.5594;
      const defaultLng = formData.longitude || 124.3950;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        const lat = parseFloat(position.lat.toFixed(6));
        const lng = parseFloat(position.lng.toFixed(6));
        onInputChange('latitude', lat);
        onInputChange('longitude', lng);
        onInputChange('location', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        getAddressFromCoordinates(lat, lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));
        marker.setLatLng([roundedLat, roundedLng]);
        onInputChange('latitude', roundedLat);
        onInputChange('longitude', roundedLng);
        onInputChange('location', `${roundedLat.toFixed(6)}, ${roundedLng.toFixed(6)}`);
        getAddressFromCoordinates(roundedLat, roundedLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  useEffect(() => {
    if (markerRef.current && formData.latitude && formData.longitude) {
      markerRef.current.setLatLng([formData.latitude, formData.longitude]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([formData.latitude, formData.longitude], 13);
      }
    }
  }, [formData.latitude, formData.longitude]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturing(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        
        onInputChange('latitude', lat);
        onInputChange('longitude', lng);
        onInputChange('location', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        getAddressFromCoordinates(lat, lng);
        
        setIsCapturing(false);
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
        }
        setLocationError(errorMessage);
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button 
            type="button"
            onClick={captureLocation}
            disabled={isCapturing}
            className="bg-[#3b3bff] text-white text-xs sm:text-sm font-semibold py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 hover:bg-[#4d4dff] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">CAPTURING...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <MapPin size={14} />
                <span className="hidden sm:inline">AUTO DETECT</span>
                <span className="sm:hidden">DETECT</span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="bg-gray-700 text-white text-xs sm:text-sm font-semibold py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 hover:bg-gray-600 transition"
          >
            <Map size={14} />
            {showMap ? 'HIDE MAP' : <span><span className="hidden sm:inline">PICK ON</span> MAP</span>}
          </button>
        </div>
        
        {locationError && (
          <p className="mt-2 text-xs text-red-400">{locationError}</p>
        )}
        
        {formData.latitude && formData.longitude && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-green-400">
              ✓ {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
            {loadingAddress && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Fetching address...
              </p>
            )}
            {addressName && !loadingAddress && (
              <p className="text-xs text-gray-300 break-words">
                📍 {addressName}
              </p>
            )}
          </div>
        )}
        
        {formData.errors?.location && (
          <p className="mt-2 text-xs text-red-400">{formData.errors.location}</p>
        )}
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="border border-gray-600 rounded-md overflow-hidden">
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-80"
            style={{ zIndex: 1 }}
          />
          <div className="bg-gray-800 p-2 sm:p-3 text-xs text-gray-400">
            <p>💡 <strong>Tip:</strong> Click on the map or drag the marker</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2Location;