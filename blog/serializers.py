from rest_framework import serializers
from django.contrib.auth.models import User

from account.models import Profile
from .models import Post, Comment, Tag, PostImage


class AuthorSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar']

    def get_avatar(self, obj):
        try:
            if obj.profile.avatar:
                request = self.context.get('request')
                url = obj.profile.avatar.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class PostImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ['id', 'url', 'caption', 'order']

    def get_url(self, obj):
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class CommentSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'parent', 'replies', 'created_at']
        read_only_fields = ['author', 'created_at']

    def get_replies(self, obj):
        if obj.parent is None:
            return CommentSerializer(
                obj.replies.all(),
                many=True,
                context=self.context
            ).data
        return []



class PostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    reading_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'excerpt',
            'author',
            'image',
            'tags',
            'status',
            'created_at',
            'views',
            'reading_time',
            'like_count',
            'comment_count',
            'is_liked',
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(pk=request.user.pk).exists()
        return False

    def get_image(self, obj):
        request = self.context.get('request')

        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url

        first = obj.images.first()
        if first:
            url = first.image.url
            return request.build_absolute_uri(url) if request else url

        return None


class PostDetailSerializer(PostListSerializer):
    image = serializers.ImageField(
        required=False,
        allow_null=True
    )

    comments = serializers.SerializerMethodField()
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    images = PostImageSerializer(
        many=True,
        read_only=True
    )

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            'content',
            'comments',
            'updated_at',
            'tag_names',
            'images',
        ]

    def get_comments(self, obj):
        top_level = obj.comments.filter(
            parent=None
        ).select_related(
            'author',
            'author__profile'
        ).prefetch_related(
            'replies__author__profile'
        )

        return CommentSerializer(
            top_level,
            many=True,
            context=self.context
        ).data

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        post = Post.objects.create(**validated_data)

        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(
                name=name.strip().lower()
            )
            post.tags.add(tag)

        return post

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tag_names is not None:
            instance.tags.clear()

            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(
                    name=name.strip().lower()
                )
                instance.tags.add(tag)

        return instance