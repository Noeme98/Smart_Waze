"""
Geocoding proxy view to handle reverse geocoding requests
Avoids CORS and 403 issues by proxying through backend
"""
import requests
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
import time

# Pool of user agents
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

def get_random_user_agent():
    """Get a random user agent from the pool"""
    return random.choice(USER_AGENTS)

def respect_rate_limit():
    """Ensure we don't exceed 1 request per second to Nominatim"""
    last_request_key = 'nominatim_last_request'
    last_request_time = cache.get(last_request_key, 0)
    current_time = time.time()
    
    time_since_last = current_time - last_request_time
    if time_since_last < 1.0:
        time.sleep(1.0 - time_since_last)
    
    cache.set(last_request_key, time.time(), timeout=10)

@api_view(['GET'])
@permission_classes([AllowAny])
def reverse_geocode(request):
    """
    Proxy endpoint for reverse geocoding
    GET /api/geocoding/reverse/?lat=<latitude>&lon=<longitude>
    """
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    
    if not lat or not lon:
        return Response(
            {'error': 'Missing required parameters: lat and lon'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Validate coordinates
        lat_float = float(lat)
        lon_float = float(lon)
        
        if not (-90 <= lat_float <= 90) or not (-180 <= lon_float <= 180):
            return Response(
                {'error': 'Invalid coordinates'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except ValueError:
        return Response(
            {'error': 'Invalid coordinate format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check cache first (cache for 1 hour)
    cache_key = f'geocode_{lat}_{lon}'
    cached_result = cache.get(cache_key)
    if cached_result:
        return Response(cached_result)
    
    # Try Nominatim first
    try:
        respect_rate_limit()
        
        nominatim_url = f'https://nominatim.openstreetmap.org/reverse'
        params = {
            'format': 'json',
            'lat': lat,
            'lon': lon,
            'zoom': 18,
            'addressdetails': 1
        }
        headers = {
            'User-Agent': get_random_user_agent(),
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'Referer': 'https://smartwayz.app'
        }
        
        response = requests.get(nominatim_url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Build detailed address from components
            if data.get('address'):
                addr = data['address']
                parts = [
                    addr.get('road') or addr.get('street'),
                    addr.get('suburb') or addr.get('neighbourhood'),
                    addr.get('city') or addr.get('town') or addr.get('municipality') or addr.get('village'),
                    addr.get('state') or addr.get('province'),
                    addr.get('country')
                ]
                address = ', '.join([p for p in parts if p])
            else:
                address = data.get('display_name', '')
            
            result = {
                'address': address,
                'provider': 'nominatim',
                'raw': data
            }
            
            # Cache the result
            cache.set(cache_key, result, timeout=3600)
            
            return Response(result)
    
    except Exception as e:
        print(f"Nominatim failed: {str(e)}")
    
    # Fallback to BigDataCloud
    try:
        bdc_url = f'https://api.bigdatacloud.net/data/reverse-geocode-client'
        params = {
            'latitude': lat,
            'longitude': lon,
            'localityLanguage': 'en'
        }
        
        response = requests.get(bdc_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Build address from components
            parts = []
            if data.get('localityInfo', {}).get('administrative'):
                admin = data['localityInfo']['administrative']
                if len(admin) > 6:
                    parts.append(admin[6].get('name'))
                if len(admin) > 5:
                    parts.append(admin[5].get('name'))
            
            parts.extend([
                data.get('locality') or data.get('city'),
                data.get('principalSubdivision'),
                data.get('countryName')
            ])
            
            address = ', '.join([p for p in parts if p])
            
            result = {
                'address': address,
                'provider': 'bigdatacloud',
                'raw': data
            }
            
            # Cache the result
            cache.set(cache_key, result, timeout=3600)
            
            return Response(result)
    
    except Exception as e:
        print(f"BigDataCloud failed: {str(e)}")
    
    # Last resort: return coordinates
    result = {
        'address': f'Location: {lat}, {lon}',
        'provider': 'coordinates',
        'raw': None
    }
    
    return Response(result)
