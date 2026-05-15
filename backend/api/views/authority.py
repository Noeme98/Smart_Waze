from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from api.models import Authority
from api.serializers import AuthoritySerializer
from api.permissions import IsSystemAdmin


class AuthorityViewSet(viewsets.ModelViewSet):
    """
    Office authority accounts — list/create/update/delete is restricted to system admins.
    """

    queryset = Authority.objects.all()
    serializer_class = AuthoritySerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    
    def get_queryset(self):
        """
        Optionally filter authorities by name or email.
        Usage: /api/authorities/?search=keyword
        """
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                authority_name__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )
        
        return queryset.order_by('-id')
    
    def create(self, request, *args, **kwargs):
        """Create a new authority with custom response format"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(
            {
                'success': True,
                'message': 'Authority registered successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update authority with custom response format"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'Authority updated successfully',
            'data': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete authority with custom response format"""
        instance = self.get_object()
        self.perform_destroy(instance)
        
        return Response(
            {
                'success': True,
                'message': 'Authority deleted successfully'
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get total count of authorities"""
        count = self.get_queryset().count()
        return Response({
            'count': count
        })
