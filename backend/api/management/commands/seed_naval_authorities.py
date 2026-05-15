"""
Seed LGU Naval-style authorities and link each report subcategory to its office.

Infrastructure and Hazard categories/subcategories match the app model choices
(migration 0002). This command assigns the `authority` FK on SubCategory.

Run (from `backend/`):
  python manage.py seed_naval_authorities
  docker compose exec django-web python manage.py seed_naval_authorities

Use --reset-passwords to re-apply the documented passwords to existing rows
(matched by email).
"""

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Authority, Category, SubCategory


# One login per distinct office; passwords are rotated only with --reset-passwords
OFFICES = [
    {
        "key": "dpwh",
        "authority_name": "DPWH",
        "email": "dpwh@lgu-naval.test",
        "password": "NavalAuth-DPWH-2026!",
    },
    {
        "key": "mayor",
        "authority_name": "Municipal Mayor's Office",
        "email": "mayor@lgu-naval.test",
        "password": "NavalAuth-Mayor-2026!",
    },
    {
        "key": "meo",
        "authority_name": "Municipal Engineering Office (MEO)",
        "email": "meo@lgu-naval.test",
        "password": "NavalAuth-MEO-2026!",
    },
    {
        "key": "pnp",
        "authority_name": "PNP",
        "email": "pnp@lgu-naval.test",
        "password": "NavalAuth-PNP-2026!",
    },
    {
        "key": "mdrrmo",
        "authority_name": "MDRRMO",
        "email": "mdrrmo@lgu-naval.test",
        "password": "NavalAuth-MDRRMO-2026!",
    },
    {
        "key": "bfp",
        "authority_name": "BFP",
        "email": "bfp@lgu-naval.test",
        "password": "NavalAuth-BFP-2026!",
    },
    {
        "key": "mho",
        "authority_name": "Municipal Health Office (MHO)",
        "email": "mho@lgu-naval.test",
        "password": "NavalAuth-MHO-2026!",
    },
]

INFRA_SUBCODES = [
    "ROAD_DAMAGE",
    "STREETLIGHTS",
    "SIDEWALKS",
    "BUILDING",
    "BRIDGE",
    "STRUCTURAL_COLLAPSE",
    "SAFETY_SECURITY",
    "INFRA_OTHER",
]

HAZARD_SUBCODES = [
    "FLOODING",
    "LANDSLIDE",
    "FIRE_HAZARD",
    "ELECTRICAL_HAZARD",
    "FALLEN_TREES",
    "ROAD_ACCIDENT",
    "BLOCKED_DRAINAGE",
    "EARTHQUAKE",
    "SINKHOLE",
    "PUBLIC_HEALTH",
    "HAZARD_OTHER",
]

# (category report_type, sub_category code, office key)
SUBCATEGORY_OFFICE = [
    # Infrastructure — LGU Naval routing
    ("Infrastructure", "ROAD_DAMAGE", "dpwh"),
    ("Infrastructure", "STREETLIGHTS", "mayor"),
    ("Infrastructure", "SIDEWALKS", "dpwh"),
    ("Infrastructure", "BUILDING", "meo"),
    ("Infrastructure", "BRIDGE", "dpwh"),
    ("Infrastructure", "STRUCTURAL_COLLAPSE", "meo"),
    ("Infrastructure", "SAFETY_SECURITY", "pnp"),
    ("Infrastructure", "INFRA_OTHER", "mayor"),
    # Hazard
    ("Hazard", "FLOODING", "mdrrmo"),
    ("Hazard", "LANDSLIDE", "mdrrmo"),
    ("Hazard", "FIRE_HAZARD", "bfp"),
    ("Hazard", "ELECTRICAL_HAZARD", "mayor"),
    ("Hazard", "FALLEN_TREES", "dpwh"),
    ("Hazard", "ROAD_ACCIDENT", "pnp"),
    ("Hazard", "BLOCKED_DRAINAGE", "meo"),
    ("Hazard", "EARTHQUAKE", "mdrrmo"),
    ("Hazard", "SINKHOLE", "mdrrmo"),
    ("Hazard", "PUBLIC_HEALTH", "mho"),
    ("Hazard", "HAZARD_OTHER", "mdrrmo"),
]


class Command(BaseCommand):
    help = (
        "Ensure Hazard/Infrastructure categories and subcategories exist, "
        "create LGU office authorities, and assign each subcategory to its office."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="Update passwords for seeded office emails to the documented defaults.",
        )

    def handle(self, *args, **options):
        reset_passwords = options["reset_passwords"]

        with transaction.atomic():
            infra_cat, _ = Category.objects.get_or_create(report_type="Infrastructure")
            hazard_cat, _ = Category.objects.get_or_create(report_type="Hazard")

            for code in INFRA_SUBCODES:
                SubCategory.objects.get_or_create(
                    report_type=infra_cat, sub_category=code
                )
            for code in HAZARD_SUBCODES:
                SubCategory.objects.get_or_create(
                    report_type=hazard_cat, sub_category=code
                )

            by_key = {}
            for office in OFFICES:
                email = office["email"].lower()
                auth, created = Authority.objects.get_or_create(
                    email=email,
                    defaults={
                        "authority_name": office["authority_name"],
                        "password": make_password(office["password"]),
                    },
                )
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created authority: {auth.authority_name} <{auth.email}>"
                        )
                    )
                else:
                    if auth.authority_name != office["authority_name"]:
                        auth.authority_name = office["authority_name"]
                        auth.save(update_fields=["authority_name"])
                    if reset_passwords:
                        auth.password = make_password(office["password"])
                        auth.save(update_fields=["password"])
                        self.stdout.write(
                            self.style.WARNING(
                                f"Reset password for: {auth.authority_name} <{auth.email}>"
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Authority already exists (password unchanged): "
                                f"{auth.authority_name} <{auth.email}> "
                                f"(use --reset-passwords to set listed password)"
                            )
                        )
                by_key[office["key"]] = auth

            updated = 0
            for report_type, sub_code, office_key in SUBCATEGORY_OFFICE:
                cat = Category.objects.get(report_type=report_type)
                sc = SubCategory.objects.get(report_type=cat, sub_category=sub_code)
                target = by_key[office_key]
                if sc.authority_id != target.id:
                    sc.authority = target
                    sc.save(update_fields=["authority"])
                    updated += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"Linked subcategories to offices ({updated} rows updated)."
                )
            )

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("=== Login credentials (plain text) ==="))
        self.stdout.write(
            "Use these with POST /api/auth/login/authority/ (email + password).\n"
        )
        for office in OFFICES:
            self.stdout.write(
                f"  {office['authority_name']}\n"
                f"    Email:    {office['email']}\n"
                f"    Password: {office['password']}\n"
            )
        if not reset_passwords:
            self.stdout.write(
                self.style.WARNING(
                    "\nIf an account already existed, its password was NOT changed "
                    "unless you passed --reset-passwords."
                )
            )
