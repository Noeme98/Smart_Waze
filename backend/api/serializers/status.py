from rest_framework import serializers
from api.models import Status


class StatusSerializer(serializers.ModelSerializer):
    """
    Serializer for Status model.

    Read-only serializer for predefined categories.
    """

    status_count = serializers.SerializerMethodField()

    class Meta:
        model = Status
        fields = ['id', 'code']
        read_only_fields = ['id', 'code']

    def get_status_count(self, obj):
        """Return the count of status for this Status"""
        return obj.code.count()
