from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from api.models import Category
from api.serializers import CategorySerializer, SubCategorySerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category operations (Read-only).
    
    Categories are predefined and seeded via migrations.
    Public endpoint - no authentication required.
    
    Endpoints:
    - list: GET /api/categories/
    - retrieve: GET /api/categories/{id}/
    - subcategories: GET /api/categories/{id}/subcategories/
    """
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    @action(detail=True, methods=['get'])
    def subcategories(self, request, pk=None):
        """
        Get all subcategories for a specific category.
        
        Usage: GET /api/categories/{id}/subcategories/
        """
        category = self.get_object()
        subcategories = category.subcategories.all()
        serializer = SubCategorySerializer(subcategories, many=True)
        
        return Response({
            'category': CategorySerializer(category).data,
            'subcategories': serializer.data
        })
