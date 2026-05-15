from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    CitizenViewSet,
    AuthorityViewSet,
    CategoryViewSet,
    SubCategoryViewSet,
    ReportViewSet,
    reverse_geocode
)
from api.views.auth import (
    login_citizen,
    login_authority,
    login_system_admin,
    refresh_token,
    logout
)

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'citizens', CitizenViewSet, basename='citizen')
router.register(r'authorities', AuthorityViewSet, basename='authority')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subcategories', SubCategoryViewSet, basename='subcategory')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/citizen/', login_citizen, name='login-citizen'),
    path('auth/login/authority/', login_authority, name='login-authority'),
    path('auth/login/admin/', login_system_admin, name='login-admin'),
    path('auth/refresh/', refresh_token, name='refresh-token'),
    path('auth/logout/', logout, name='logout'),
    
    # Geocoding endpoint
    path('geocoding/reverse/', reverse_geocode, name='reverse-geocode'),
    
]
