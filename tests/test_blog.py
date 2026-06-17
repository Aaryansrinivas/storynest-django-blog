"""
Tests for the blog app.
Covers: posts CRUD, permissions, likes, comments, tags, analytics, search.
Run: python manage.py test tests.test_blog
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from blog.models import Post, Tag, Comment


# ─── Helpers ─────────────────────────────────────────────────────────────────

def create_user(username="author", password="StrongPass123!"):
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password=password,
    )


def auth_headers(user):
    refresh = RefreshToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}


def create_post(author, title="Test Post", status_val="published", content="Hello world content"):
    return Post.objects.create(
        title=title,
        content=content,
        author=author,
        status=status_val,
    )


# ─── Post List / Create ───────────────────────────────────────────────────────

class PostListCreateTests(APITestCase):
    url = "/api/posts/"

    def setUp(self):
        self.author = create_user("author1")
        self.other = create_user("other1")
        self.published = create_post(self.author, "Published Post")
        self.draft = create_post(self.author, "Draft Post", status_val="draft")

    def test_list_only_published_for_anonymous(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in res.data["results"]]
        self.assertIn("Published Post", titles)
        self.assertNotIn("Draft Post", titles)

    def test_list_includes_own_draft_when_authenticated(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.get(self.url)
        titles = [p["title"] for p in res.data["results"]]
        self.assertIn("Draft Post", titles)

    def test_list_does_not_include_others_draft(self):
        self.client.credentials(**auth_headers(self.other))
        res = self.client.get(self.url)
        titles = [p["title"] for p in res.data["results"]]
        self.assertNotIn("Draft Post", titles)

    def test_create_post_authenticated(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.post(
            self.url,
            {"title": "New Post", "content": "Some content here"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "New Post")
        self.assertEqual(res.data["author"]["username"], "author1")

    def test_create_post_unauthenticated(self):
        res = self.client.post(
            self.url,
            {"title": "Anon Post", "content": "content"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_post_with_tags(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.post(
            self.url,
            {"title": "Tagged Post", "content": "content", "tag_names": ["python", "django"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        slugs = [t["slug"] for t in res.data["tags"]]
        self.assertIn("python", slugs)
        self.assertIn("django", slugs)

    def test_pagination_returns_count(self):
        res = self.client.get(self.url)
        self.assertIn("count", res.data)
        self.assertIn("results", res.data)


# ─── Post Detail / Update / Delete ───────────────────────────────────────────

class PostDetailTests(APITestCase):
    def setUp(self):
        self.author = create_user("det_author")
        self.other = create_user("det_other")
        self.post = create_post(self.author, "Detail Post")
        self.url = f"/api/posts/{self.post.slug}/"

    def test_retrieve_published_post(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Detail Post")

    def test_retrieve_increments_views(self):
        before = self.post.views
        self.client.get(self.url)
        self.post.refresh_from_db()
        self.assertEqual(self.post.views, before + 1)

    def test_update_by_author(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.patch(self.url, {"title": "Updated Title"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Updated Title")

    def test_update_by_non_author_forbidden(self):
        self.client.credentials(**auth_headers(self.other))
        res = self.client.patch(self.url, {"title": "Hacked"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_by_author(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(slug=self.post.slug).exists())

    def test_delete_by_non_author_forbidden(self):
        self.client.credentials(**auth_headers(self.other))
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_nonexistent_returns_404(self):
        res = self.client.get("/api/posts/does-not-exist/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ─── Post Auto-fields ─────────────────────────────────────────────────────────

class PostAutoFieldTests(APITestCase):
    def setUp(self):
        self.author = create_user("auto_author")
        self.client.credentials(**auth_headers(self.author))

    def test_slug_auto_generated(self):
        res = self.client.post(
            "/api/posts/",
            {"title": "Auto Slug Post", "content": "content"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["slug"], "auto-slug-post")

    def test_duplicate_slug_gets_suffix(self):
        self.client.post(
            "/api/posts/",
            {"title": "Same Title", "content": "content"},
            format="json",
        )
        res = self.client.post(
            "/api/posts/",
            {"title": "Same Title", "content": "content"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(res.data["slug"], "same-title")

    def test_reading_time_calculated(self):
        long_content = "word " * 400  # 400 words → ~2 min
        res = self.client.post(
            "/api/posts/",
            {"title": "Long Post", "content": long_content},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertGreaterEqual(res.data["reading_time"], 2)

    def test_excerpt_auto_generated(self):
        res = self.client.post(
            "/api/posts/",
            {"title": "Excerpt Test", "content": "This is a really long content. " * 20},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(len(res.data["excerpt"]) > 0)


# ─── Likes ────────────────────────────────────────────────────────────────────

class LikeTests(APITestCase):
    def setUp(self):
        self.author = create_user("like_author")
        self.liker = create_user("liker")
        self.post = create_post(self.author)
        self.url = f"/api/posts/{self.post.slug}/like/"

    def test_like_post(self):
        self.client.credentials(**auth_headers(self.liker))
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["liked"])
        self.assertEqual(res.data["like_count"], 1)

    def test_unlike_post(self):
        self.client.credentials(**auth_headers(self.liker))
        self.client.post(self.url)  # like
        res = self.client.post(self.url)  # unlike
        self.assertFalse(res.data["liked"])
        self.assertEqual(res.data["like_count"], 0)

    def test_like_unauthenticated(self):
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_is_liked_in_list(self):
        self.client.credentials(**auth_headers(self.liker))
        self.client.post(self.url)
        res = self.client.get("/api/posts/")
        post_data = next(p for p in res.data["results"] if p["slug"] == self.post.slug)
        self.assertTrue(post_data["is_liked"])


# ─── Comments ─────────────────────────────────────────────────────────────────

class CommentTests(APITestCase):
    def setUp(self):
        self.author = create_user("com_author")
        self.commenter = create_user("commenter")
        self.post = create_post(self.author)
        self.url = f"/api/posts/{self.post.slug}/comments/"

    def test_list_comments_anonymous(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_comment_authenticated(self):
        self.client.credentials(**auth_headers(self.commenter))
        res = self.client.post(self.url, {"content": "Great post!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["content"], "Great post!")
        self.assertEqual(res.data["author"]["username"], "commenter")

    def test_create_comment_unauthenticated(self):
        res = self.client.post(self.url, {"content": "Spam"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reply_to_comment(self):
        self.client.credentials(**auth_headers(self.commenter))
        parent_res = self.client.post(self.url, {"content": "Parent comment"}, format="json")
        parent_id = parent_res.data["id"]
        reply_res = self.client.post(
            self.url,
            {"content": "Reply", "parent": parent_id},
            format="json",
        )
        self.assertEqual(reply_res.status_code, status.HTTP_201_CREATED)

    def test_delete_comment_by_author(self):
        self.client.credentials(**auth_headers(self.commenter))
        create_res = self.client.post(self.url, {"content": "Delete me"}, format="json")
        comment_id = create_res.data["id"]
        del_res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_comment_by_non_author_forbidden(self):
        self.client.credentials(**auth_headers(self.commenter))
        create_res = self.client.post(self.url, {"content": "Mine"}, format="json")
        comment_id = create_res.data["id"]

        other = create_user("del_other")
        self.client.credentials(**auth_headers(other))
        del_res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)


# ─── My Posts ─────────────────────────────────────────────────────────────────

class MyPostsTests(APITestCase):
    url = "/api/posts/my_posts/"

    def setUp(self):
        self.user = create_user("my_author")
        self.other = create_user("not_my_author")
        create_post(self.user, "My Published Post")
        create_post(self.user, "My Draft", status_val="draft")
        create_post(self.other, "Other Post")

    def test_my_posts_only_returns_own(self):
        self.client.credentials(**auth_headers(self.user))
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in res.data["results"]]
        self.assertIn("My Published Post", titles)
        self.assertIn("My Draft", titles)
        self.assertNotIn("Other Post", titles)

    def test_my_posts_unauthenticated(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Analytics ────────────────────────────────────────────────────────────────

class AnalyticsTests(APITestCase):
    def setUp(self):
        self.author = create_user("analytics_author")
        self.other = create_user("analytics_other")
        self.post = create_post(self.author, "Analytics Post")
        self.url = f"/api/posts/{self.post.slug}/analytics/"

    def test_analytics_accessible_by_author(self):
        self.client.credentials(**auth_headers(self.author))
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("total_views", res.data)
        self.assertIn("total_likes", res.data)
        self.assertIn("total_comments", res.data)
        self.assertIn("chart", res.data)
        self.assertEqual(len(res.data["chart"]), 30)

    def test_analytics_forbidden_for_non_author(self):
        self.client.credentials(**auth_headers(self.other))
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_analytics_unauthenticated(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Tags ─────────────────────────────────────────────────────────────────────

class TagTests(APITestCase):
    def setUp(self):
        Tag.objects.create(name="python")
        Tag.objects.create(name="django")

    def test_list_tags(self):
        res = self.client.get("/api/tags/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = [t["name"] for t in res.data["results"]]
        self.assertIn("python", names)
        self.assertIn("django", names)

    def test_filter_posts_by_tag(self):
        author = create_user("tag_filter_author")
        post = create_post(author, "Tagged")
        tag = Tag.objects.get(name="python")
        post.tags.add(tag)

        res = self.client.get("/api/posts/", {"tags__slug": "python"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in res.data["results"]]
        self.assertIn("Tagged", titles)


# ─── Permissions ─────────────────────────────────────────────────────────────

class PermissionTests(APITestCase):
    """Verify IsAuthorOrReadOnly works correctly."""

    def setUp(self):
        self.owner = create_user("perm_owner")
        self.intruder = create_user("perm_intruder")
        self.post = create_post(self.owner, "Owner Post")

    def test_read_allowed_anonymous(self):
        res = self.client.get(f"/api/posts/{self.post.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_write_blocked_anonymous(self):
        res = self.client.patch(
            f"/api/posts/{self.post.slug}/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_write_blocked_non_owner(self):
        self.client.credentials(**auth_headers(self.intruder))
        res = self.client.patch(
            f"/api/posts/{self.post.slug}/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
