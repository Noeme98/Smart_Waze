#!/bin/bash

echo "=========================================="
echo "Smartwayz Backend Diagnostics"
echo "=========================================="
echo ""

# Check if container is running
echo "1. Checking if backend container is running..."
if docker ps | grep -q smartwayz-backend; then
    echo "   ✅ Backend container is running"
else
    echo "   ❌ Backend container is NOT running"
    echo "   Run: docker compose up -d"
    exit 1
fi
echo ""

# Check if port 8000 is accessible
echo "2. Checking if backend is accessible on port 8000..."
if curl -s http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "   ✅ Backend is accessible"
else
    echo "   ❌ Backend is NOT accessible"
    echo "   Check: docker compose logs django-web"
fi
echo ""

# Test categories endpoint (should be public)
echo "3. Testing categories endpoint (should work without auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/categories/)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Categories endpoint is public (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo "   ❌ Categories endpoint requires auth (401)"
    echo "   Fix: Restart backend to apply permission changes"
else
    echo "   ⚠️  Categories endpoint returned: $RESPONSE"
fi
echo ""

# Test subcategories endpoint (should be public)
echo "4. Testing subcategories endpoint (should work without auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/subcategories/)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Subcategories endpoint is public (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo "   ❌ Subcategories endpoint requires auth (401)"
    echo "   Fix: Restart backend to apply permission changes"
else
    echo "   ⚠️  Subcategories endpoint returned: $RESPONSE"
fi
echo ""

# Check if Status objects exist
echo "5. Checking if Status objects exist in database..."
STATUS_COUNT=$(docker exec smartwayz-backend python manage.py shell -c "from api.models import Status; print(Status.objects.count())" 2>/dev/null)
if [ "$STATUS_COUNT" -gt "0" ]; then
    echo "   ✅ Status objects exist ($STATUS_COUNT found)"
else
    echo "   ❌ No Status objects found"
    echo "   Fix: docker exec smartwayz-backend python manage.py seed_status"
fi
echo ""

# Check recent errors in logs
echo "6. Checking recent errors in logs..."
ERROR_COUNT=$(docker logs smartwayz-backend --tail=50 2>&1 | grep -c "Error\|Traceback\|Unauthorized")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No recent errors in logs"
else
    echo "   ⚠️  Found $ERROR_COUNT error entries in recent logs"
    echo "   Run: docker compose logs django-web --tail=50"
fi
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
echo ""
echo "If any issues found above, run:"
echo "  docker compose restart django-web"
echo ""
echo "To view full logs:"
echo "  docker compose logs -f django-web"
