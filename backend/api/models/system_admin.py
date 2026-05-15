from django.db import models
from django.contrib.auth.hashers import check_password


class SystemAdmin(models.Model):
    """LGU / system administrator (global report visibility, not an office authority)."""

    display_name = models.CharField(max_length=64)
    email = models.EmailField(max_length=64, unique=True)
    password = models.TextField(max_length=128)

    class Meta:
        db_table = "system_admins"
        verbose_name = "System admin"
        verbose_name_plural = "System admins"

    def __str__(self):
        return f"{self.display_name} ({self.email})"

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
