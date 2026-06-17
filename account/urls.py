# account/urls.py  — updated to use throttled LoginView
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,          # ← throttled subclass (replaces TokenObtainPairView directly)
    MeView,
    UpdateProfileView,
    LogoutView,
    PublicProfileView,
    OAuthTokenView,
    OAuthProvidersView,
)

urlpatterns = [
    path('register/',        RegisterView.as_view(),      name='register'),
    path('login/',           LoginView.as_view(),         name='login'),
    path('token/refresh/',   TokenRefreshView.as_view(),  name='token_refresh'),
    path('logout/',          LogoutView.as_view(),        name='logout'),
    path('me/',              MeView.as_view(),            name='me'),
    path('profile/update/',  UpdateProfileView.as_view(), name='profile_update'),
    path('users/<str:username>/', PublicProfileView.as_view(), name='public_profile'),
    path('oauth/token/',     OAuthTokenView.as_view(),   name='oauth_token'),
    path('oauth/providers/', OAuthProvidersView.as_view(), name='oauth_providers'),
]
