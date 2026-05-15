import django.contrib.auth.hashers
from django.db import migrations, models


def seed_default_system_admin(apps, schema_editor):
    SystemAdmin = apps.get_model("api", "SystemAdmin")
    pwd = django.contrib.auth.hashers.make_password("Smartwayz-Admin-2026!")
    SystemAdmin.objects.get_or_create(
        email="admin@smartwayz.local",
        defaults={
            "display_name": "System Administrator",
            "password": pwd,
        },
    )


def unseed_system_admin(apps, schema_editor):
    SystemAdmin = apps.get_model("api", "SystemAdmin")
    SystemAdmin.objects.filter(email="admin@smartwayz.local").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_reportimage"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemAdmin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("display_name", models.CharField(max_length=64)),
                ("email", models.EmailField(max_length=64, unique=True)),
                ("password", models.TextField(max_length=128)),
            ],
            options={
                "verbose_name": "System admin",
                "verbose_name_plural": "System admins",
                "db_table": "system_admins",
            },
        ),
        migrations.RunPython(seed_default_system_admin, unseed_system_admin),
    ]
