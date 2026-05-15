from rest_framework import serializers
from django.conf import settings
from api.models import Report, ReportImage, Category, SubCategory


class ReportImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ReportImage
        fields = ['id', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'image_url', 'created_at']

    def get_image_url(self, obj):
        public_base = getattr(settings, "SUPABASE_PUBLIC_MEDIA_URL", "").rstrip("/")
        if public_base:
            return f"{public_base}/{obj.image.name}"

        url = obj.image.url
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url


class ReportSerializer(serializers.ModelSerializer):
    """
    Serializer for Report model.
    
    Handles creation and retrieval of reports by citizens.
    Automatically captures location (latitude/longitude) and citizen info.
    Validates that sub_category is required for Hazard reports.
    """
    
    category_name = serializers.CharField(source='report_type.report_type', read_only=True)
    sub_category_name = serializers.CharField(source='sub_category.get_sub_category_display', read_only=True)
    authority_id = serializers.SerializerMethodField()
    authority_name = serializers.SerializerMethodField()
    subcategory_authority_id = serializers.SerializerMethodField()
    citizen_name = serializers.CharField(source='citizen.name', read_only=True)
    citizen_email = serializers.CharField(source='citizen.email', read_only=True)
    status_name = serializers.CharField(source='status.get_code_display', read_only=True)
    images = ReportImageSerializer(many=True, read_only=True)
    image_count = serializers.IntegerField(source='images.count', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'citizen',
            'citizen_name',
            'citizen_email',
            'report_type',
            'category_name',
            'sub_category',
            'sub_category_name',
            'authority_id',
            'authority_name',
            'assigned_authority_id',
            'subcategory_authority_id',
            'status',
            'status_name',
            'title',
            'latitude',
            'longitude',
            'description',
            'images',
            'image_count',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'assigned_authority_id']

    def get_authority_id(self, obj):
        if getattr(obj, "assigned_authority_id", None):
            return obj.assigned_authority_id
        if obj.sub_category_id and getattr(obj.sub_category, 'authority_id', None):
            return obj.sub_category.authority_id
        return None

    def get_authority_name(self, obj):
        if getattr(obj, "assigned_authority_id", None):
            return obj.assigned_authority.authority_name
        auth = getattr(getattr(obj, 'sub_category', None), 'authority', None)
        return auth.authority_name if auth else None

    def get_subcategory_authority_id(self, obj):
        if obj.sub_category_id and getattr(obj.sub_category, "authority_id", None):
            return obj.sub_category.authority_id
        return None
    
    def validate_report_type(self, value):
        """Validate that the category exists"""
        if not Category.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid category selected.")
        return value
    
    def validate_sub_category(self, value):
        """Validate that the sub_category exists if provided"""
        if value and not SubCategory.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid sub category selected.")
        return value
    
    def validate(self, data):
        """
        Cross-field validation to ensure:
        1. Sub category is required for Hazard reports
        2. Sub category belongs to the selected report_type
        """
        report_type = data.get('report_type')
        sub_category = data.get('sub_category')
        
        # Check if sub_category is required for Hazard category
        if report_type and report_type.report_type == 'Hazard':
            if not sub_category:
                raise serializers.ValidationError({
                    'sub_category': 'Sub category is required for Hazard reports.'
                })
        
        # Validate that sub_category belongs to the correct report_type
        if sub_category and report_type:
            if sub_category.report_type != report_type:
                raise serializers.ValidationError({
                    'sub_category': f'Sub category must belong to {report_type.report_type} category.'
                })
        
        return data
    
    def validate_latitude(self, value):
        """Validate latitude is within valid range"""
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees.")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude is within valid range"""
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees.")
        return value
