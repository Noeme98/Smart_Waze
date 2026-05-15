import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_systemadmin"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="assigned_authority",
            field=models.ForeignKey(
                blank=True,
                help_text="When set by an admin, this office handles the report regardless of subcategory default routing.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_reports",
                to="api.authority",
            ),
        ),
    ]
