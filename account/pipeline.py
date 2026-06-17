"""
Custom social-auth pipeline step.
Saves the provider's avatar URL to the user's Profile after OAuth login.
"""
import urllib.request
from django.core.files.base import ContentFile


def save_avatar_from_social(backend, strategy, details, response, user=None, *args, **kwargs):
    """Download and save the social provider's avatar to the user's profile."""
    if not user:
        return

    try:
        profile = user.profile
    except Exception:
        return

    if profile.avatar:
        return  # already has a custom avatar — don't overwrite

    avatar_url = None

    if backend.name == 'google-oauth2':
        avatar_url = response.get('picture')
    elif backend.name == 'github':
        avatar_url = response.get('avatar_url')

    if avatar_url:
        try:
            req = urllib.request.Request(avatar_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                content = resp.read()
            filename = f"social_{backend.name}_{user.pk}.jpg"
            profile.avatar.save(filename, ContentFile(content), save=True)
        except Exception:
            pass  # avatar download is best-effort
