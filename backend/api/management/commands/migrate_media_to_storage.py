from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from api.models import ReportImage


class Command(BaseCommand):
    help = "Upload existing local media files to the configured default storage backend."

    def add_arguments(self, parser):
        parser.add_argument(
            "--local-root",
            default=str(settings.MEDIA_ROOT),
            help="Local media root path to read files from (default: settings.MEDIA_ROOT).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be uploaded without writing files.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Upload even if destination key already exists.",
        )

    def handle(self, *args, **options):
        local_root = Path(options["local_root"]).expanduser().resolve()
        dry_run = options["dry_run"]
        force = options["force"]

        self.stdout.write(self.style.WARNING(f"Using local root: {local_root}"))
        migrated = 0
        skipped = 0
        missing = 0

        for img in ReportImage.objects.all().iterator():
            key = img.image.name
            local_file = local_root / key

            if not local_file.exists():
                missing += 1
                self.stdout.write(self.style.WARNING(f"Missing local file: {local_file}"))
                continue

            if default_storage.exists(key) and not force:
                skipped += 1
                continue

            if dry_run:
                migrated += 1
                self.stdout.write(f"[DRY RUN] Upload {local_file} -> {key}")
                continue

            with local_file.open("rb") as fh:
                default_storage.save(key, ContentFile(fh.read()))
            migrated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Uploaded: {migrated}, Skipped: {skipped}, Missing: {missing}"
            )
        )
