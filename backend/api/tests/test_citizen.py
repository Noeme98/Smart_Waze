from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Citizen


class CitizenAPITestCase(TestCase):
    """Test cases for Citizen API endpoints"""
    
    def setUp(self):
        """Set up test client and sample data"""
        self.client = APIClient()
        self.citizen_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword123'
        }
    
    def test_create_citizen(self):
        """Test creating a new citizen"""
        response = self.client.post('/api/citizens/', self.citizen_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Citizen.objects.count(), 1)
        self.assertEqual(Citizen.objects.get().email, 'john@example.com')
    
    def test_list_citizens(self):
        """Test listing all citizens"""
        Citizen.objects.create(**self.citizen_data)
        response = self.client.get('/api/citizens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_duplicate_email(self):
        """Test that duplicate emails are rejected"""
        Citizen.objects.create(**self.citizen_data)
        response = self.client.post('/api/citizens/', self.citizen_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
