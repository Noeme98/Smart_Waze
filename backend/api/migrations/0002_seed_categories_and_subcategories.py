# Generated migration for seeding categories and subcategories

from django.db import migrations


def seed_categories_and_subcategories(apps, schema_editor):
    """Seed initial categories and their subcategories"""
    Category = apps.get_model('api', 'Category')
    SubCategory = apps.get_model('api', 'SubCategory')
    
    # Create categories
    hazard_cat, _ = Category.objects.get_or_create(report_type='Hazard')
    infra_cat, _ = Category.objects.get_or_create(report_type='Infrastructure')
    
    # Infrastructure subcategories
    infrastructure_subcategories = [
        'ROAD_DAMAGE',
        'STREETLIGHTS',
        'SIDEWALKS',
        'BUILDING',
        'BRIDGE',
        'STRUCTURAL_COLLAPSE',
        'SAFETY_SECURITY',
        'INFRA_OTHER',
    ]
    
    # Hazard subcategories
    hazard_subcategories = [
        'FLOODING',
        'LANDSLIDE',
        'FIRE_HAZARD',
        'ELECTRICAL_HAZARD',
        'FALLEN_TREES',
        'ROAD_ACCIDENT',
        'BLOCKED_DRAINAGE',
        'EARTHQUAKE',
        'SINKHOLE',
        'PUBLIC_HEALTH',
        'HAZARD_OTHER',
    ]
    
    # Create Infrastructure subcategories
    for sub_cat in infrastructure_subcategories:
        SubCategory.objects.get_or_create(
            report_type=infra_cat,
            sub_category=sub_cat
        )
    
    # Create Hazard subcategories
    for sub_cat in hazard_subcategories:
        SubCategory.objects.get_or_create(
            report_type=hazard_cat,
            sub_category=sub_cat
        )
    
    print(f"✓ Seeded {len(infrastructure_subcategories)} Infrastructure subcategories")
    print(f"✓ Seeded {len(hazard_subcategories)} Hazard subcategories")


def reverse_seed(apps, schema_editor):
    """Remove seeded data if migration is reversed"""
    Category = apps.get_model('api', 'Category')
    SubCategory = apps.get_model('api', 'SubCategory')
    
    SubCategory.objects.all().delete()
    Category.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories_and_subcategories, reverse_seed),
    ]
