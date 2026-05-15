from rest_framework import serializers
from api.models import SubCategory


class SubCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for SubCategory model.
    
    Read-only serializer for predefined subcategories.
    Includes the parent category name for convenience.
    """
    
    category_id = serializers.IntegerField(source='report_type.id', read_only=True)
    category_name = serializers.CharField(source='report_type.report_type', read_only=True)
    sub_category_display = serializers.CharField(source='get_sub_category_display', read_only=True)
    
    class Meta:
        model = SubCategory
        fields = [
            'id',
            'report_type',
            'category_id',
            'category_name',
            'sub_category',
            'sub_category_display'
        ]
        read_only_fields = ['id', 'report_type', 'sub_category']
