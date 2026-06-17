from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('account.urls')),
    path('api/', include('blog.urls')),
    # OAuth2 social auth endpoints (provided by social-auth-app-django)
    # Handles /auth/social/login/<backend>/ and /auth/social/complete/<backend>/
    path('auth/social/', include('social_django.urls', namespace='social')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
