from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from api.models import SubCategory
from api.serializers import SubCategorySerializer


class SubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for SubCategory operations (Read-only).
    
    Subcategories are predefined and seeded via migrations.
    Public endpoint - no authentication required.
    
    Endpoints:
    - list: GET /api/subcategories/
    - retrieve: GET /api/subcategories/{id}/
    - by_category: GET /api/subcategories/by_category/?category={id}
    """
    
    queryset = SubCategory.objects.select_related('report_type').all()
    serializer_class = SubCategorySerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def get_queryset(self):
        """
        Optionally filter subcategories by category.
        Usage: /api/subcategories/?category={id}
        """
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        
        if category_id:
            queryset = queryset.filter(report_type_id=category_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Get subcategories filtered by category ID.
        
        Usage: GET /api/subcategories/by_category/?category={id}
        Returns: List of subcategories for the specified category
        """
        category_id = request.query_params.get('category', None)
        
        if not category_id:
            return Response(
                {
                    'success': False,
                    'error': 'category parameter is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subcategories = self.queryset.filter(report_type_id=category_id)
        serializer = self.get_serializer(subcategories, many=True)
        
        return Response({
            'success': True,
            'count': subcategories.count(),
            'data': serializer.data
        })
