from django.contrib import admin
from .models import Post, Comment, Tag

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'status', 'created_at', 'views']
    list_filter = ['status', 'created_at', 'tags']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['author']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'created_at']
    list_filter = ['created_at']

admin.site.register(Tag)
