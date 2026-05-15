from django.db import models
from .category import Category
# from api.models import Authority  # adjust path

class SubCategory(models.Model):
    class SubCategoryType(models.TextChoices):
        
        ROAD_DAMAGE = 'ROAD_DAMAGE', 'Road damage/Potholes'
        STREETLIGHTS = 'STREETLIGHTS', 'Streetlights/Electrical Issues'
        SIDEWALKS = 'SIDEWALKS', 'Sidewalks/Pedestrian Paths'
        BUILDING = 'BUILDING', 'Building/Structural Concerns'
        BRIDGE = 'BRIDGE', 'Bridge/Overpass Issues'
        STRUCTURAL_COLLAPSE = 'STRUCTURAL_COLLAPSE', 'Structural Collapses/Weak infrastructure'
        SAFETY_SECURITY = 'SAFETY_SECURITY', 'Safety and Security Concerns'
        INFRA_OTHER = 'INFRA_OTHER', 'Other (specify)'
        
        FLOODING = 'FLOODING', 'Flooding/Water Overflow'
        LANDSLIDE = 'LANDSLIDE', 'Landslide/Soil Erosion'
        FIRE_HAZARD = 'FIRE_HAZARD', 'Fire Hazard'
        ELECTRICAL_HAZARD = 'ELECTRICAL_HAZARD', 'Electrical Hazard'
        FALLEN_TREES = 'FALLEN_TREES', 'Fallen Trees/Debris Blocking Road'
        ROAD_ACCIDENT = 'ROAD_ACCIDENT', 'Road accident'
        BLOCKED_DRAINAGE = 'BLOCKED_DRAINAGE', 'Blocked Drainage/Clogged Gutter'
        EARTHQUAKE = 'EARTHQUAKE', 'Earthquake Damage'
        SINKHOLE = 'SINKHOLE', 'Sinkhole'
        PUBLIC_HEALTH = 'PUBLIC_HEALTH', 'Public Health Hazard'
        HAZARD_OTHER = 'HAZARD_OTHER', 'Other Hazard (specify)'

    report_type = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories'
    )

    sub_category = models.CharField(
        max_length=64,
        choices=SubCategoryType.choices
    )

    authority = models.ForeignKey(
        "api.Authority",   # 👈 string reference instead of import,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_constraint=False,
        related_name="subcategories"
    )

    class Meta:
        db_table = "sub_categories"
        verbose_name = "Sub Category"
        verbose_name_plural = "Sub Categories"
        ordering = ['report_type', 'sub_category']

    def __str__(self):
        return f"{self.get_sub_category_display()} ({self.report_type.report_type})"
