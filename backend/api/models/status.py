from django.db import models


class Status(models.Model):
    CODES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('rejected', 'Rejected'),
        ('resolved', 'Resolved'),
    )

    code = models.CharField(
        max_length=15,
        choices=CODES,
        default='pending',
        unique=True,
        db_column='code'
    )

    class Meta:
        db_table = 'status'
        verbose_name_plural = 'Statuses'
        ordering = ['code']

    def __str__(self):
        return self.get_code_display()
