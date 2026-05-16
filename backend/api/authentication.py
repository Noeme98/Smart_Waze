"""
Authenticate API requests using the same Bearer JWT issued by /api/auth/login/*.
This makes DRF's IsAuthenticated work alongside manual token checks in some views.
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


class JWTAccessUser:
    """Minimal user-like object for DRF permissions."""

    is_authenticated = True

    def __init__(self, user_id, user_type, email, name=None):
        self.pk = user_id
        self.id = user_id
        self.user_type = user_type
        self.email = email
        self.name = name


class JWTAccessAuthentication(BaseAuthentication):
    """
    Expect: Authorization: Bearer <access_token>
    Token must include user_id and user_type (same claims as login endpoints).
    """

    keyword = b"Bearer"

    def authenticate(self, request):
        # CORS preflight must not run JWT validation.
        if request.method == "OPTIONS":
            return None

        auth = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth or not auth.startswith("Bearer "):
            return None

        raw = auth.split(" ", 1)[1].strip()
        if not raw:
            return None

        try:
            token = AccessToken(raw)
        except (InvalidToken, TokenError):
            return None

        user_id = token.get("user_id")
        user_type = token.get("user_type")
        email = token.get("email")
        name = token.get("name")

        if user_id is None or not user_type:
            return None

        user = JWTAccessUser(user_id, user_type, email, name)
        return (user, raw)
