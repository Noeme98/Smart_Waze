from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
import logging
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db.models import Q
from api.models import Report, ReportImage, Citizen, Status, Authority
from api.serializers import ReportSerializer

logger = logging.getLogger(__name__)


class ReportViewSet(viewsets.ModelViewSet):
    """
    CRUD interface for report records.

    Citizens may create reports and view their own submissions.
    Authorities may view reports assigned to their area of responsibility.
    Update and delete operations are intentionally restricted here.
    """
    
    queryset = Report.objects.select_related(
        'report_type', 'citizen', 'sub_category', 'sub_category__authority',
        'assigned_authority', 'status',
    ).prefetch_related('images').all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]  # Authentication is enforced manually in create().
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_queryset(self):
        """
        Limit report visibility based on the authenticated token and filters.
        """
        queryset = super().get_queryset()

        # Django exposes request headers through META using the HTTP_ prefix.
        auth_header = self.request.META.get('HTTP_AUTHORIZATION', '')

        if auth_header.startswith('Bearer '):
            token_string = auth_header.split(' ')[1]
            try:
                token = AccessToken(token_string)
                user_id = token.get('user_id')
                user_type = token.get('user_type')

                if user_type == 'citizen' and user_id:
                    queryset = queryset.filter(citizen_id=user_id)

                elif user_type == 'authority' and user_id:
                    queryset = queryset.filter(
                        Q(assigned_authority_id=user_id)
                        | (
                            Q(assigned_authority__isnull=True)
                            & Q(sub_category__authority_id=user_id)
                        )
                    )

                elif user_type == 'admin' and user_id:
                    pass

            except (InvalidToken, TokenError):
                pass

        # Support an explicit citizen filter for non-authenticated test flows.
        citizen_id = self.request.query_params.get('citizen_id', None)
        if citizen_id:
            queryset = queryset.filter(citizen_id=citizen_id)

        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(report_type_id=category_id)

        sub_category_id = self.request.query_params.get('sub_category', None)
        if sub_category_id:
            queryset = queryset.filter(sub_category_id=sub_category_id)

        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create a report and associate it with the authenticated citizen.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return Response(
                {
                    'success': False,
                    'message': 'Authentication required. Please log in.'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        token_string = auth_header.split(' ')[1]

        try:
            token = AccessToken(token_string)
            user_id = token.get('user_id')
            user_type = token.get('user_type')
        except (InvalidToken, TokenError) as e:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid or expired token. Please log in again.',
                    'detail': str(e)
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user_id or user_type != 'citizen':
            return Response(
                {
                    'success': False,
                    'message': 'Only citizens can create reports.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            citizen = Citizen.objects.get(id=user_id)
        except Citizen.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'User not found. Please log in again.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Apply the authenticated citizen and default status server-side.
        report_data = request.data.copy()
        report_data['citizen'] = citizen.id

        if 'status' not in report_data:
            try:
                pending_status = Status.objects.get(code='pending')
                report_data['status'] = pending_status.id
            except Status.DoesNotExist:
                return Response(
                    {
                        'success': False,
                        'message': 'System error: Status configuration is missing.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        uploaded_images = request.FILES.getlist('images')
        if len(uploaded_images) > 5:
            return Response(
                {
                    'success': False,
                    'message': 'You can upload up to 5 images per report.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=report_data)
        serializer.is_valid(raise_exception=True)
        try:
            report = serializer.save()
            for image_file in uploaded_images:
                ReportImage.objects.create(report=report, image=image_file)
        except Exception as exc:
            logger.exception("Report creation/upload failed")
            return Response(
                {
                    'success': False,
                    'message': 'Report upload failed. Please check storage configuration.',
                    'detail': str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        response_serializer = self.get_serializer(report)
        headers = self.get_success_headers(response_serializer.data)

        return Response(
            {
                'success': True,
                'message': 'Report created successfully. Your report has been submitted.',
                'data': response_serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """
        Report records are read-only after submission through this endpoint.
        """
        return Response(
            {
                'success': False,
                'message': 'Citizens cannot update reports. Reports are read-only once submitted.'
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partial updates are not supported through this endpoint.
        """
        return Response(
            {
                'success': False,
                'message': 'Citizens cannot update reports. Reports are read-only once submitted.'
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Deletion is intentionally disabled for submitted reports.
        """
        return Response(
            {
                'success': False,
                'message': 'Citizens cannot delete reports. Please contact authorities if you need to remove a report.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    @action(detail=False, methods=['get'], url_path='admin-overview')
    def admin_overview(self, request):
        """Aggregates for system admins only."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {'success': False, 'message': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = AccessToken(auth_header.split(' ', 1)[1])
        except (InvalidToken, TokenError, IndexError):
            return Response(
                {'success': False, 'message': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if token.get('user_type') != 'admin':
            return Response(
                {'success': False, 'message': 'Admin access only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.db.models import Count, Value, CharField
        from django.db.models.functions import Coalesce

        qs = Report.objects.select_related(
            "sub_category",
            "sub_category__authority",
            "assigned_authority",
        ).all()
        total = qs.count()
        by_status = list(qs.values('status__code').annotate(count=Count('id')))
        by_category = list(qs.values('report_type__report_type').annotate(count=Count('id')))
        annot = qs.annotate(
            eff_auth_id=Coalesce("assigned_authority_id", "sub_category__authority_id"),
            eff_auth_name=Coalesce(
                "assigned_authority__authority_name",
                "sub_category__authority__authority_name",
                Value(""),
                output_field=CharField(),
            ),
        )
        unassigned = annot.filter(eff_auth_id__isnull=True).count()
        raw_auth = (
            annot.exclude(eff_auth_id__isnull=True)
            .values("eff_auth_id", "eff_auth_name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        by_authority = [
            {
                "authority_id": row["eff_auth_id"],
                "authority_name": row["eff_auth_name"] or "—",
                "count": row["count"],
            }
            for row in raw_auth
        ]

        return Response({
            'total_reports': total,
            'by_status': by_status,
            'by_category': by_category,
            'by_authority': by_authority,
            'unassigned_reports': unassigned,
        })

    @action(detail=True, methods=["patch"], url_path="status", permission_classes=[AllowAny])
    def update_status(self, request, pk=None):
        """
        Update the status of a report.
        Only the office authority assigned to the report's subcategory may change status.
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"success": False, "message": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = AccessToken(auth_header.split(" ", 1)[1])
        except (InvalidToken, TokenError, IndexError):
            return Response(
                {"success": False, "message": "Invalid or expired token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = token.get("user_id")
        user_type = token.get("user_type")
        if user_type != "authority" or not user_id:
            return Response(
                {
                    "success": False,
                    "message": "Only assigned office authority accounts can update report status.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        report = self.get_object()
        effective_auth_id = report.get_effective_authority_id()
        if not effective_auth_id:
            return Response(
                {
                    "success": False,
                    "message": "This report has no assigned office; status cannot be updated via this action.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        if int(user_id) != int(effective_auth_id):
            return Response(
                {"success": False, "message": "You are not the assigned office for this report."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status_id = request.data.get("status_id")

        if not new_status_id:
            return Response(
                {"success": False, "message": "status_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate status exists
        try:
            new_status = Status.objects.get(id=new_status_id)
        except Status.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional: enforce allowed transitions
        ALLOWED_TRANSITIONS = {
            1: [2, 4],  # pending → approved or rejected
            2: [3],     # approved → in_progress
            3: [5],     # in_progress → resolved
        }

        current_status_id = report.status_id

        if current_status_id in ALLOWED_TRANSITIONS:
            if int(new_status_id) not in ALLOWED_TRANSITIONS[current_status_id]:
                return Response(
                    {"success": False, "message": "Invalid status transition"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Save new status
        report.status = new_status
        report.save(update_fields=["status"])

        return Response(
            {
                "success": True,
                "message": "Status updated successfully",
                "new_status": new_status.code
            }
        )

    @action(detail=True, methods=["patch"], url_path="assign-authority")
    def assign_authority(self, request, pk=None):
        """
        System admin only: set or clear an explicit receiving office for a report.
        When cleared, routing falls back to the subcategory's default authority (if any).
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"success": False, "message": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = AccessToken(auth_header.split(" ", 1)[1])
        except (InvalidToken, TokenError, IndexError):
            return Response(
                {"success": False, "message": "Invalid or expired token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if token.get("user_type") != "admin":
            return Response(
                {"success": False, "message": "Admin access only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        report = self.get_object()
        raw = request.data.get("authority_id", None)

        if raw in (None, "", "null"):
            report.assigned_authority = None
        else:
            try:
                aid = int(raw)
            except (TypeError, ValueError):
                return Response(
                    {"success": False, "message": "authority_id must be an integer or null."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                report.assigned_authority = Authority.objects.get(pk=aid)
            except Authority.DoesNotExist:
                return Response(
                    {"success": False, "message": "Authority not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        report.save(update_fields=["assigned_authority"])
        report.refresh_from_db()
        serializer = self.get_serializer(report)
        return Response(
            {
                "success": True,
                "message": "Report office assignment updated.",
                "data": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db.models import Count

        by_status = Report.objects.values("status__code").annotate(count=Count("id"))
        by_category = Report.objects.values("report_type__report_type").annotate(count=Count("id"))

        return Response({
            "total_reports": Report.objects.count(),
            "by_status": list(by_status),
            "by_category": list(by_category),
        })
