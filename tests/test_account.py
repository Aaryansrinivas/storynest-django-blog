"""
Tests for the account app.
Covers: register, login, logout, me, profile update, public profile.
Run: python manage.py test tests.test_account
"""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from account.models import Profile


# ─── Helpers ─────────────────────────────────────────────────────────────────

def create_user(username="testuser", password="StrongPass123!", email="test@example.com"):
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="Test",
        last_name="User",
    )
    return user


def auth_headers(user):
    """Return Authorization header dict for a given user."""
    refresh = RefreshToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}


# ─── Register ─────────────────────────────────────────────────────────────────

class RegisterTests(APITestCase):
    url = "/api/auth/register/"

    def _valid_payload(self, username="newuser"):
        return {
            "username": username,
            "email": f"{username}@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }

    def test_register_success(self):
        res = self.client.post(self.url, self._valid_payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertIn("user", res.data)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_creates_profile(self):
        self.client.post(self.url, self._valid_payload(), format="json")
        user = User.objects.get(username="newuser")
        self.assertTrue(hasattr(user, "profile"))

    def test_register_passwords_mismatch(self):
        payload = self._valid_payload()
        payload["password2"] = "DifferentPass!"
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        create_user(username="duplicate")
        payload = self._valid_payload(username="duplicate")
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        payload = self._valid_payload()
        payload["password"] = "123"
        payload["password2"] = "123"
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields(self):
        res = self.client.post(self.url, {"username": "only"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginTests(APITestCase):
    url = "/api/auth/login/"

    def setUp(self):
        self.user = create_user()

    def test_login_success(self):
        res = self.client.post(
            self.url,
            {"username": "testuser", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_login_wrong_password(self):
        res = self.client.post(
            self.url,
            {"username": "testuser", "password": "WrongPass!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        res = self.client.post(
            self.url,
            {"username": "nobody", "password": "anything"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Logout ───────────────────────────────────────────────────────────────────

class LogoutTests(APITestCase):
    url = "/api/auth/logout/"

    def setUp(self):
        self.user = create_user()

    def test_logout_success(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        res = self.client.post(self.url, {"refresh": str(refresh)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_logout_unauthenticated(self):
        res = self.client.post(self.url, {"refresh": "fake"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalid_token(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        res = self.client.post(self.url, {"refresh": "not-a-real-token"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─── Me ───────────────────────────────────────────────────────────────────────

class MeTests(APITestCase):
    url = "/api/auth/me/"

    def setUp(self):
        self.user = create_user()

    def test_me_authenticated(self):
        self.client.credentials(**auth_headers(self.user))
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "testuser")

    def test_me_unauthenticated(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Update Profile ───────────────────────────────────────────────────────────

class UpdateProfileTests(APITestCase):
    url = "/api/auth/profile/update/"

    def setUp(self):
        self.user = create_user()
        self.client.credentials(**auth_headers(self.user))

    def test_update_bio(self):
        res = self.client.patch(self.url, {"bio": "Hello world"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, "Hello world")

    def test_update_name(self):
        res = self.client.patch(
            self.url,
            {"first_name": "Updated", "last_name": "Name"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")

    def test_update_unauthenticated(self):
        self.client.credentials()
        res = self.client.patch(self.url, {"bio": "No auth"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Public Profile ───────────────────────────────────────────────────────────

class PublicProfileTests(APITestCase):
    def setUp(self):
        self.user = create_user(username="public_user")

    def test_public_profile_exists(self):
        res = self.client.get(f"/api/auth/users/public_user/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "public_user")

    def test_public_profile_not_found(self):
        res = self.client.get("/api/auth/users/doesnotexist/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
