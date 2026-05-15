from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from api.models import Citizen, Authority, SystemAdmin


def get_tokens_for_user(user_id, user_type, email, name=None):
    """
    Generate JWT tokens with custom claims for a user.

    Args:
        user_id: The ID of the user (citizen or authority)
        user_type: 'citizen', 'authority', or 'admin'
        email: User's email
        name: User's name (optional)

    Returns:
        dict: Dictionary containing 'access' and 'refresh' tokens
    """
    # Create refresh token with custom claims
    refresh = RefreshToken()
    refresh['user_id'] = user_id
    refresh['user_type'] = user_type
    refresh['email'] = email
    if name:
        refresh['name'] = name

    # Manually create access token with the same custom claims
    access = AccessToken()
    access['user_id'] = user_id
    access['user_type'] = user_type
    access['email'] = email
    if name:
        access['name'] = name

    return {
        'access': str(access),
        'refresh': str(refresh)
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_citizen(request):
    """
    Login endpoint for citizens.
    
    POST /api/auth/login/citizen/
    Body: {"email": "user@example.com", "password": "password123"}
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find citizen by email (case-insensitive)
        citizen = Citizen.objects.get(email=email.lower())
        
        # Check password
        if not citizen.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens with custom claims
        tokens = get_tokens_for_user(
            user_id=citizen.id,
            user_type='citizen',
            email=citizen.email,
            name=citizen.name
        )

        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': {
                    'id': citizen.id,
                    'name': citizen.name,
                    'email': citizen.email,
                    'user_type': 'citizen'
                },
                'tokens': tokens
            }
        }, status=status.HTTP_200_OK)
        
    except Citizen.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid email or password citizen exist test'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_authority(request):
    """
    Login endpoint for authorities.
    
    POST /api/auth/login/authority/
    Body: {"email": "authority@example.com", "password": "password123"}
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email and password are required email or password test'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find authority by email (case-insensitive)
        authority = Authority.objects.get(email=email.lower())
        
        # Check password
        if not authority.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid email or password password ni test'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens with custom claims
        tokens = get_tokens_for_user(
            user_id=authority.id,
            user_type='authority',
            email=authority.email,
            name=authority.authority_name
        )

        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': {
                    'id': authority.id,
                    'authority_name': authority.authority_name,
                    'email': authority.email,
                    'user_type': 'authority'
                },
                'tokens': tokens
            }
        }, status=status.HTTP_200_OK)
        
    except Authority.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_system_admin(request):
    """
    Login for LGU system administrators (global visibility).

    POST /api/auth/login/admin/
    Body: {"email": "admin@smartwayz.local", "password": "..."}
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        admin_user = SystemAdmin.objects.get(email=email.lower())

        if not admin_user.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        tokens = get_tokens_for_user(
            user_id=admin_user.id,
            user_type='admin',
            email=admin_user.email,
            name=admin_user.display_name
        )

        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': {
                    'id': admin_user.id,
                    'name': admin_user.display_name,
                    'email': admin_user.email,
                    'user_type': 'admin'
                },
                'tokens': tokens
            }
        }, status=status.HTTP_200_OK)

    except SystemAdmin.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh access token using refresh token.
    
    POST /api/auth/refresh/
    Body: {"refresh": "refresh_token_here"}
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({
            'success': False,
            'message': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Validate the refresh token
        refresh = RefreshToken(refresh_token)

        # Extract custom claims from refresh token
        user_id = refresh.get('user_id')
        user_type = refresh.get('user_type')
        email = refresh.get('email')
        name = refresh.get('name')

        # Create a new access token with the same custom claims
        access = AccessToken()
        access['user_id'] = user_id
        access['user_type'] = user_type
        access['email'] = email
        if name:
            access['name'] = name

        return Response({
            'success': True,
            'data': {
                'access': str(access)
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': 'Invalid or expired refresh token',
            'error': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Logout endpoint (blacklist refresh token).
    
    POST /api/auth/logout/
    Body: {"refresh": "refresh_token_here"}
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({
            'success': False,
            'message': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception:
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
