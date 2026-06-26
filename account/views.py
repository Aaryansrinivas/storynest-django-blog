"""
Updated account/views.py — throttling applied to auth endpoints.
Replace your existing account/views.py with this file.
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from django.contrib.auth import get_user
from rest_framework.authentication import SessionAuthentication

from .serializers import RegisterSerializer, UserSerializer, UpdateProfileSerializer
from .models import Profile
from blog_project.throttles import (
    RegisterThrottle,
    LoginThrottle,
    OAuthTokenThrottle,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterThrottle]          # ← 5 per hour per IP

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Thin subclass of SimpleJWT's view — just adds throttling."""
    throttle_classes = [LoginThrottle]             # ← 10 per hour per IP


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def get_parsers(self):
        from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
        return [MultiPartParser(), FormParser(), JSONParser()]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    permission_classes = [permissions.AllowAny]


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


class OAuthTokenView(APIView):
    """
    Exchange a social-auth session (after OAuth2 callback) for JWT tokens.
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OAuthTokenThrottle]        # ← 20 per hour per IP

    def post(self, request):
        print("request.user:", request.user)
        print("is_authenticated:", request.user.is_authenticated)
        print("session_key:", request.session.session_key)
        print("_auth_user_id:", request.session.get("_auth_user_id"))
        print("_auth_user_backend:", request.session.get("_auth_user_backend"))

        user = get_user(request)
        print("get_user():", user)

        if not user.is_authenticated:
            return Response(
                {'detail': 'Not authenticated via OAuth. Complete the OAuth flow first.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class OAuthProvidersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        base = request.build_absolute_uri('/').rstrip('/')
        providers = []

        if settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
            providers.append({
                'name': 'google',
                'label': 'Continue with Google',
                'url': f'{base}/auth/social/login/google-oauth2/',
                'icon': 'google',
            })

        if settings.SOCIAL_AUTH_GITHUB_KEY:
            providers.append({
                'name': 'github',
                'label': 'Continue with GitHub',
                'url': f'{base}/auth/social/login/github/',
                'icon': 'github',
            })

        return Response({'providers': providers})
