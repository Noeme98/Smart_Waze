from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from api.models import Citizen


class CitizenSerializer(serializers.ModelSerializer):
    """
    Serializer for Citizen model.
    
    Handles serialization and deserialization of Citizen instances.
    Password is write-only for security and automatically hashed.
    Requires password confirmation on registration.
    """
    
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = Citizen
        fields = ['id', 'name', 'email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {
                'write_only': True,
                'min_length': 8,
                'style': {'input_type': 'password'}
            },
            'email': {
                'required': True
            }
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if self.instance is None:  # Creating new instance
            if Citizen.objects.filter(email=value).exists():
                raise serializers.ValidationError("A citizen with this email already exists.")
        else:  # Updating existing instance
            if Citizen.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("A citizen with this email already exists.")
        return value.lower()
    
    def validate(self, data):
        """Validate that password and confirm_password match"""
        if 'password' in data and 'confirm_password' in data:
            if data['password'] != data['confirm_password']:
                raise serializers.ValidationError({
                    'confirm_password': 'Passwords do not match.'
                })
        return data
    
    def create(self, validated_data):
        """
        Create a new citizen with hashed password.
        
        Uses Django's make_password to securely hash the password.
        """
        # Remove confirm_password from validated_data
        validated_data.pop('confirm_password', None)
        
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])
        citizen = Citizen.objects.create(**validated_data)
        
        return citizen
    
    def update(self, instance, validated_data):
        """Update citizen instance with password hashing if password is changed"""
        # If password is being updated, hash it
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
