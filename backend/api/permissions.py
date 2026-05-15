from rest_framework import permissions


class IsSystemAdmin(permissions.BasePermission):
    """JWT user_type must be 'admin' (LGU system administrator)."""

    message = "System administrator access only."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            getattr(user, "is_authenticated", False)
            and getattr(user, "user_type", None) == "admin"
        )
