from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from api.models import Citizen
from api.serializers import CitizenSerializer
from api.permissions import IsSystemAdmin


class CitizenViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Citizen CRUD operations.
    
    Provides standard CRUD endpoints:
    - list: GET /api/citizens/
    - create: POST /api/citizens/
    - retrieve: GET /api/citizens/{id}/
    - update: PUT /api/citizens/{id}/
    - partial_update: PATCH /api/citizens/{id}/
    - destroy: DELETE /api/citizens/{id}/
    """
    
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    
    def get_permissions(self):
        """
        Public self-registration for citizens.
        Listing and account maintenance: system admins only.
        """
        if self.action in ['create', 'options']:
            return [AllowAny()]
        return [IsAuthenticated(), IsSystemAdmin()]
    
    def get_queryset(self):
        """
        Optionally filter citizens by email.
        Usage: /api/citizens/?email=example@email.com
        """
        queryset = super().get_queryset()
        email = self.request.query_params.get('email', None)
        
        if email:
            queryset = queryset.filter(email__icontains=email)
        
        return queryset.order_by('-id')
    
    def create(self, request, *args, **kwargs):
        """Create a new citizen with custom response format"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(
            {
                'success': True,
                'message': 'Citizen registered successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update citizen with custom response format"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'Citizen updated successfully',
            'data': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete citizen with custom response format"""
        instance = self.get_object()
        self.perform_destroy(instance)
        
        return Response(
            {
                'success': True,
                'message': 'Citizen deleted successfully'
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get total count of citizens"""
        count = self.get_queryset().count()
        return Response({
            'count': count
        })
