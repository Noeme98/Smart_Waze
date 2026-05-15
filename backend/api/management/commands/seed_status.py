from django.core.management.base import BaseCommand
from django.db import transaction, connection
from api.models import Status


class Command(BaseCommand):
    help = 'Seeds the Status table with predefined status values'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing statuses and reset ID sequence before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Status table...'))

        statuses = [
            'pending',
            'approved',
            'in_progress',
            'rejected',
            'resolved',
        ]

        created_count = 0
        existing_count = 0

        with transaction.atomic():
            # Reset if flag is provided
            if options['reset']:
                self.stdout.write(self.style.WARNING('Resetting Status table...'))
                Status.objects.all().delete()
                
                # Reset the sequence - get the actual sequence name from the table
                table_name = Status._meta.db_table
                with connection.cursor() as cursor:
                    # Get the sequence name for the id column
                    cursor.execute(f"""
                        SELECT pg_get_serial_sequence('{table_name}', 'id');
                    """)
                    sequence_name = cursor.fetchone()[0]
                    
                    if sequence_name:
                        cursor.execute(f"ALTER SEQUENCE {sequence_name} RESTART WITH 1;")
                        self.stdout.write(self.style.SUCCESS(f'✓ Table reset and sequence {sequence_name} restarted'))
                    else:
                        self.stdout.write(self.style.WARNING('⚠ Could not find sequence to reset'))

            for status_code in statuses:
                status_obj, created = Status.objects.get_or_create(
                    code=status_code
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created status: {status_obj.get_code_display()}')
                    )
                else:
                    existing_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'- Status already exists: {status_obj.get_code_display()}')
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Seeding complete! Created: {created_count}, Already existed: {existing_count}'
            )
        )
