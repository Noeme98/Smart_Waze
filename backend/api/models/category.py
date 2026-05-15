from django.db import models

class Category(models.Model):
    class ReportType(models.TextChoices):
        Hazard = 'Hazard', 'Hazard type'
        Infrastructure =  'Infrastructure', 'Infrastructure Type'
        
    report_type = models.CharField(max_length=64, choices=ReportType.choices, unique=True)
    
    class Meta:
        db_table = "categories"
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['report_type']
    
    def __str__(self):
        return self.report_type