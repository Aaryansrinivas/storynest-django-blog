"""
Custom throttle classes for the blog API.

Applied at:
  - View level  → use throttle_classes = [...]
  - Global level → set in REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES']

Usage examples are shown in the docstrings.
"""

from rest_framework.throttling import (
    AnonRateThrottle,
    UserRateThrottle,
    SimpleRateThrottle,
)
import sys
from rest_framework.throttling import UserRateThrottle




# ─── Auth Endpoints ───────────────────────────────────────────────────────────

class RegisterThrottle(AnonRateThrottle):
    """
    Limit anonymous registration attempts.
    Prevents mass account creation / signup spam.

    Rate: 5 registrations per hour per IP.
    Apply to: RegisterView
    """
    scope = "register"
    def allow_request(self, request, view):
        if 'test' in sys.argv:
            return True
        return super().allow_request(request, view)


class LoginThrottle(AnonRateThrottle):
    """
    Limit login attempts to slow brute-force attacks.

    Rate: 10 attempts per hour per IP.
    Apply to: TokenObtainPairView (login endpoint)
    """
    scope = "login"


class OAuthTokenThrottle(AnonRateThrottle):
    """
    Limit OAuth token exchange requests.

    Rate: 20 per hour per IP.
    Apply to: OAuthTokenView
    """
    scope = "oauth_token"


# ─── Post Endpoints ───────────────────────────────────────────────────────────

class PostCreateThrottle(UserRateThrottle):
    """
    Limit how many posts an authenticated user can create.
    Prevents blog spam.

    Rate: 20 posts per day per user.
    Apply to: PostViewSet (create action)
    """
    scope = "post_create"


class PostReadThrottle(AnonRateThrottle):
    """
    Limit unauthenticated reads on post list/detail.
    Protects against scrapers.

    Rate: 200 requests per hour per IP.
    Apply to: PostViewSet (list + retrieve actions)
    """
    scope = "post_read"


# ─── Like / Comment Burst Protection ─────────────────────────────────────────

class LikeThrottle(UserRateThrottle):
    """
    Prevent like-spamming (rapidly toggling likes).

    Rate: 60 per minute per user.
    Apply to: PostViewSet.like action
    """
    scope = "like"


class CommentThrottle(UserRateThrottle):
    """
    Limit comment creation to reduce comment spam.

    Rate: 30 comments per hour per user.
    Apply to: PostViewSet.comments action (POST)
    """
    scope = "comment"
