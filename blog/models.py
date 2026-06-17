from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
import uuid


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Post(models.Model):
    STATUS_CHOICES = [('draft', 'Draft'), ('published', 'Published')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True, blank=True)
    content = models.TextField()
    excerpt = models.TextField(max_length=500, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    # Cover image kept for backwards compatibility — users can also add extra images
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='published')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views = models.PositiveIntegerField(default=0)
    likes = models.ManyToManyField(User, blank=True, related_name='liked_posts')
    # Reading time (minutes) — calculated on save
    reading_time = models.PositiveSmallIntegerField(default=1)
    

    class Meta:
        ordering = ['-created_at']
       

    def _calc_reading_time(self):
        """Average adult reads ~200 words per minute."""
        import re
        # Strip HTML tags for word count
        plain = re.sub(r'<[^>]+>', ' ', self.content)
        words = len(plain.split())
        return max(1, round(words / 200))

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)
            slug = base
            counter = 1
            while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        if not self.excerpt and self.content:
            import re
            plain = re.sub(r'<[^>]+>', ' ', self.content)
            self.excerpt = plain[:250].strip()
        self.reading_time = self._calc_reading_time()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def comment_count(self):
        return self.comments.filter(parent=None).count()


class PostImage(models.Model):
    """
    Additional images attached to a post.
    Users can upload multiple images; the first one becomes the cover if no
    dedicated cover (post.image) is set.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='post_images/')
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'uploaded_at']

    def __str__(self):
        return f"Image {self.order} for {self.post.title[:40]}"


class PostDailyView(models.Model):
    """
    Stores per-day view counts for a post — powers the analytics chart.
    One row per (post, date) pair; incremented on each unique retrieval.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='daily_views')
    date = models.DateField()
    count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('post', 'date')
        ordering = ['date']

    def __str__(self):
        return f"{self.post.slug} — {self.date}: {self.count}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title[:40]}"
