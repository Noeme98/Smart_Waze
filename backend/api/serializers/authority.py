from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db import transaction
from api.models import Authority, SubCategory

_ROUTING_SKIP = object()


class AuthoritySerializer(serializers.ModelSerializer):
    """
    Serializer for Authority model.
    
    Handles serialization and deserialization of Authority instances.
    Password is write-only for security and automatically hashed.
    Requires password confirmation on registration.
    """
    
    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={'input_type': 'password'},
    )
    mapped_subcategory_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="Subcategory IDs this office receives by default (citizen reports route here automatically).",
    )
    mapped_subcategories = serializers.SerializerMethodField(read_only=True)

    def get_mapped_subcategories(self, obj):
        if not obj or not getattr(obj, "pk", None):
            return []
        qs = (
            SubCategory.objects.filter(authority_id=obj.pk)
            .select_related("report_type")
            .order_by("report_type_id", "sub_category")
        )
        return [
            {
                "id": s.id,
                "sub_category": s.sub_category,
                "sub_category_display": s.get_sub_category_display(),
                "category_name": s.report_type.report_type,
            }
            for s in qs
        ]

    @staticmethod
    def _sync_subcategory_routing(authority, id_list):
        """Assign listed subcategories to this office; clear other subcategories still pointing here."""
        id_set = {int(x) for x in (id_list or [])}
        if not id_set:
            SubCategory.objects.filter(authority_id=authority.id).update(authority=None)
            return
        existing = set(SubCategory.objects.filter(id__in=id_set).values_list("id", flat=True))
        if existing != id_set:
            missing = sorted(id_set - existing)
            raise serializers.ValidationError(
                {"mapped_subcategory_ids": f"Invalid subcategory id(s): {missing}"}
            )
        SubCategory.objects.filter(authority_id=authority.id).exclude(id__in=id_set).update(authority=None)
        SubCategory.objects.filter(id__in=id_set).update(authority_id=authority.id)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None:
            self.fields['password'].required = False
    
    class Meta:
        model = Authority
        fields = [
            "id",
            "authority_name",
            "email",
            "password",
            "confirm_password",
            "mapped_subcategory_ids",
            "mapped_subcategories",
        ]
        extra_kwargs = {
            'password': {
                'write_only': True,
                'min_length': 8,
                'style': {'input_type': 'password'}
            },
            'email': {
                'required': True
            },
            'authority_name': {
                'required': True
            }
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if self.instance is None:  # Creating new instance
            if Authority.objects.filter(email=value).exists():
                raise serializers.ValidationError("An authority with this email already exists.")
        else:  # Updating existing instance
            if Authority.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("An authority with this email already exists.")
        return value.lower()
    
    def validate(self, data):
        """Validate password + confirm on create; on update only when password is sent."""
        pwd = data.get('password')
        confirm = data.get('confirm_password')
        if self.instance is None:
            if not pwd:
                raise serializers.ValidationError({'password': 'Password is required.'})
            if pwd != confirm:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        elif pwd:
            if pwd != confirm:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
    
    def create(self, validated_data):
        """
        Create a new authority with hashed password.
        
        Uses Django's make_password to securely hash the password.
        """
        validated_data.pop("confirm_password", None)
        mapped_ids = validated_data.pop("mapped_subcategory_ids", _ROUTING_SKIP)

        validated_data["password"] = make_password(validated_data["password"])
        with transaction.atomic():
            authority = Authority.objects.create(**validated_data)
            if mapped_ids is not _ROUTING_SKIP:
                self._sync_subcategory_routing(authority, mapped_ids)

        return authority
    
    def update(self, instance, validated_data):
        """Update authority; hash password only when a new password is provided."""
        validated_data.pop("confirm_password", None)
        mapped_ids = validated_data.pop("mapped_subcategory_ids", _ROUTING_SKIP)
        pwd = validated_data.pop("password", None)
        if pwd:
            validated_data["password"] = make_password(pwd)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if mapped_ids is not _ROUTING_SKIP:
                self._sync_subcategory_routing(instance, mapped_ids)

        return instance
