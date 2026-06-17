"""
Updated blog/views.py — throttling applied per action.
Replace your existing blog/views.py with this file.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.authentication import JWTAuthentication

from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import F
from django.utils import timezone

from .models import Post, Comment, Tag, PostImage, PostDailyView
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    CommentSerializer,
    TagSerializer,
    PostImageSerializer,
)
from .permissions import IsAuthorOrReadOnly

from blog_project.throttles import (
    PostCreateThrottle,
    PostReadThrottle,
    LikeThrottle,
    CommentThrottle,
)


class PostViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    queryset = Post.objects.filter(
        status='published'
    ).select_related(
        'author',
        'author__profile'
    ).prefetch_related(
        'tags',
        'likes',
        'images'
    ).order_by('-created_at')

    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['author__username', 'tags__slug', 'status']
    search_fields = ['title', 'content', 'excerpt', 'tags__name']
    ordering_fields = ['created_at', 'views', 'likes']
    lookup_field = 'slug'

    def get_throttles(self):
        """
        Apply different throttle rates depending on the action:
          - list / retrieve  → PostReadThrottle  (200/hour anon)
          - create           → PostCreateThrottle (20/day authenticated)
          - like             → LikeThrottle      (60/minute)
          - comments (POST)  → CommentThrottle   (30/hour)
          - everything else  → default (anon/user from settings)
        """
        throttle_map = {
            'list':     [PostReadThrottle],
            'retrieve': [PostReadThrottle],
            'create':   [PostCreateThrottle],
            'like':     [LikeThrottle],
        }
        throttles = throttle_map.get(self.action)
        if throttles is not None:
            return [t() for t in throttles]
        return super().get_throttles()

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        return PostDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q', '').strip()

        if q:
            search_query = SearchQuery(q, config='english')
            vector = (
                SearchVector('title', weight='A', config='english')
                + SearchVector('excerpt', weight='B', config='english')
                + SearchVector('content', weight='C', config='english')
            )
            qs = qs.annotate(
                rank=SearchRank(vector, search_query)
            ).filter(rank__gte=0.01).order_by('-rank')

        if self.request.user.is_authenticated:
            drafts = Post.objects.filter(
                author=self.request.user,
                status='draft'
            ).select_related(
                'author', 'author__profile'
            ).prefetch_related('tags', 'likes', 'images')
            qs = (qs | drafts).distinct()

        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        Post.objects.filter(pk=instance.pk).update(views=F('views') + 1)

        today = timezone.now().date()
        PostDailyView.objects.update_or_create(post=instance, date=today, defaults={})
        PostDailyView.objects.filter(post=instance, date=today).update(count=F('count') + 1)

        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, slug=None):
        post = self.get_object()
        user = request.user

        if post.likes.filter(pk=user.pk).exists():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True

        return Response({'liked': liked, 'like_count': post.like_count})

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticatedOrReadOnly])
    def comments(self, request, slug=None):
        post = self.get_object()

        # Apply comment throttle on POST
        if request.method == 'POST':
            throttle = CommentThrottle()
            if not throttle.allow_request(request, self):
                self.throttled(request, throttle.wait())

        if request.method == 'GET':
            comments = post.comments.filter(
                parent=None
            ).select_related(
                'author', 'author__profile'
            ).prefetch_related('replies__author__profile')

            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)

        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        posts = Post.objects.filter(
            author=request.user
        ).select_related(
            'author', 'author__profile'
        ).prefetch_related('tags', 'likes', 'images').order_by('-created_at')

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
        url_path='images'
    )
    def upload_images(self, request, slug=None):
        post = self.get_object()
        files = request.FILES.getlist('images')

        if not files:
            return Response({'detail': 'No images provided.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for i, file in enumerate(files):
            image = PostImage.objects.create(
                post=post,
                image=file,
                caption=request.data.get('caption', ''),
                order=PostImage.objects.filter(post=post).count() + i
            )
            created.append(PostImageSerializer(image, context={'request': request}).data)

        return Response(created, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['delete'],
        permission_classes=[IsAuthenticated],
        url_path=r'images/(?P<image_pk>[0-9]+)'
    )
    def delete_image(self, request, slug=None, image_pk=None):
        post = self.get_object()
        try:
            image = post.images.get(pk=image_pk)
            image.image.delete(save=False)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PostImage.DoesNotExist:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request, slug=None):
        post = self.get_object()

        if post.author != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        from datetime import timedelta
        today = timezone.now().date()
        start = today - timedelta(days=29)

        daily = {
            item.date.isoformat(): item.count
            for item in PostDailyView.objects.filter(post=post, date__gte=start)
        }

        chart = [
            {'date': (start + timezone.timedelta(days=i)).isoformat(), 'views': daily.get((start + timezone.timedelta(days=i)).isoformat(), 0)}
            for i in range(30)
        ]

        return Response({
            'total_views': post.views,
            'total_likes': post.like_count,
            'total_comments': post.comment_count,
            'chart': chart,
        })


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
