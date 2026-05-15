from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_subcategory_authority'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReportImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='reports/%Y/%m/%d/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='api.report')),
            ],
            options={
                'verbose_name': 'Report Image',
                'verbose_name_plural': 'Report Images',
                'db_table': 'report_images',
                'ordering': ['created_at'],
            },
        ),
    ]
