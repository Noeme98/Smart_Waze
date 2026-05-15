from django.test import TestCase
from api.models import Category, SubCategory, Citizen, Authority, Report


class CategoryModelTestCase(TestCase):
    """Test cases for Category model"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(report_type='Hazard')
    
    def test_category_creation(self):
        """Test category is created correctly"""
        self.assertEqual(self.category.report_type, 'Hazard')
        self.assertEqual(str(self.category), 'Hazard')


class CitizenModelTestCase(TestCase):
    """Test cases for Citizen model"""
    
    def test_citizen_creation(self):
        """Test citizen is created correctly"""
        citizen = Citizen.objects.create(
            name='Jane Doe',
            email='jane@example.com',
            password='password123'
        )
        self.assertEqual(citizen.name, 'Jane Doe')
        self.assertEqual(citizen.email, 'jane@example.com')
