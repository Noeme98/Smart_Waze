from rest_framework import serializers
from api.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    
    Read-only serializer for predefined categories.
    """
    
    subcategories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'report_type', 'subcategories_count']
        read_only_fields = ['id', 'report_type']
    
    def get_subcategories_count(self, obj):
        """Return the count of subcategories for this category"""
        return obj.subcategories.count()
