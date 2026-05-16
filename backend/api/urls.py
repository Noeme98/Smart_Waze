from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def cors_test(request):
    return JsonResponse({
        "method": request.method,
        "ok": True
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("cors-test/", cors_test),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)