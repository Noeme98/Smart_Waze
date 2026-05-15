from django.contrib import admin
from api.models import Citizen, Authority, Category, SubCategory, Report, SystemAdmin


@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    """Admin interface for Citizen model"""
    list_display = ['id', 'name', 'email']
    search_fields = ['name', 'email']
    list_filter = ['id']
    ordering = ['-id']
    readonly_fields = ['id']


@admin.register(SystemAdmin)
class SystemAdminAdmin(admin.ModelAdmin):
    list_display = ["id", "display_name", "email"]
    search_fields = ["display_name", "email"]
    ordering = ["-id"]
    readonly_fields = ["id"]


@admin.register(Authority)
class AuthorityAdmin(admin.ModelAdmin):
    """Admin interface for Authority model"""
    list_display = ['id', 'authority_name', 'email']
    search_fields = ['authority_name', 'email']
    list_filter = ['id']
    ordering = ['-id']
    readonly_fields = ['id']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model"""
    list_display = ['id', 'report_type', 'get_subcategories_count']
    search_fields = ['report_type']
    readonly_fields = ['id']
    
    def get_subcategories_count(self, obj):
        return obj.subcategories.count()
    get_subcategories_count.short_description = 'Subcategories'


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    """Admin interface for SubCategory model"""
    list_display = ['id', 'sub_category', 'report_type']
    list_filter = ['report_type']
    search_fields = ['sub_category']
    readonly_fields = ['id']
    ordering = ['report_type', 'sub_category']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin interface for Report model"""
    list_display = ['id', 'report_type']
    list_filter = ['report_type']
    readonly_fields = ['id']
    ordering = ['-id']
