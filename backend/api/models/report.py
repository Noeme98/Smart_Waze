from .status import Status
from .citizen import Citizen
from .category import Category
from .sub_category import SubCategory

from django.db import models
from django.core.exceptions import ValidationError


class Report(models.Model):
    status = models.ForeignKey(Status, related_name='reports', on_delete=models.PROTECT)
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name='reports')
    report_type = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='reports')
    sub_category = models.ForeignKey(
        SubCategory, 
        on_delete=models.SET_NULL, 
        related_name='reports',
        null=True,
        blank=True,
        help_text="Sub category of the report (required for Hazard category)"
    )
    assigned_authority = models.ForeignKey(
        "api.Authority",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_reports",
        help_text="When set by an admin, this office handles the report regardless of subcategory default routing.",
    )

    title = models.TextField(blank=True, help_text='Title of report')
    description = models.TextField(blank=True, null=True, help_text="Optional description of the issue")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, help_text="Latitude of the report location")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, help_text="Longitude of the report location")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports"
        verbose_name = "Report"
        verbose_name_plural = "Reports"
        ordering = ['-created_at']

    def clean(self):
        """
        Custom validation to ensure:
        1. Sub category is required for Hazard reports
        2. Sub category matches the report_type category
        """
        super().clean()

        # Check if sub_category is required for Hazard category
        if self.report_type and self.report_type.report_type == 'Hazard':
            if not self.sub_category:
                raise ValidationError({
                    'sub_category':
                        'Sub category is required for Hazard reports.'
                })

        # Validate that sub_category belongs to the correct report_type
        if self.sub_category and self.report_type:
            if self.sub_category.report_type != self.report_type:
                raise ValidationError({
                    'sub_category': f'Sub category must belong to {self.report_type.report_type} category.'
                })

    def save(self, *args, **kwargs):
        """Override save to call clean validation"""
        self.full_clean()

        # Set default status to 'pending' if not provided
        if not self.pk and not self.status_id:
            self.status = Status.objects.get(code='pending')

        super().save(*args, **kwargs)

    def __str__(self):
        sub_cat_str = f" - {self.sub_category.get_sub_category_display()}" if self.sub_category else ""
        return f"Report #{self.id} - {self.report_type.report_type}{sub_cat_str} by {self.citizen.name}"

    def get_effective_authority_id(self):
        """Office that may act on this report: admin override, else subcategory default."""
        if self.assigned_authority_id:
            return self.assigned_authority_id
        if self.sub_category_id and getattr(self.sub_category, "authority_id", None):
            return self.sub_category.authority_id
        return None


class ReportImage(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reports/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "report_images"
        verbose_name = "Report Image"
        verbose_name_plural = "Report Images"
        ordering = ['created_at']

    def __str__(self):
        return f"ReportImage #{self.id} for Report #{self.report_id}"
