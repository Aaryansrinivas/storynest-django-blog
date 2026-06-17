import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import MDEditor from '@uiw/react-md-editor'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [lightboxImg, setLightboxImg] = useState(null)

  useEffect(() => {
    loadPost()
  }, [slug])

  const loadPost = async () => {
    try {
      const { data } = await api.get(`/posts/${slug}/`)
      setPost(data)
      setLiked(data.is_liked)
      setLikeCount(data.like_count)
    } catch (err) {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const prev = liked

    setLiked(!prev)
    setLikeCount(c => (prev ? c - 1 : c + 1))

    try {
      const { data } = await api.post(`/posts/${slug}/like/`)
      setLiked(data.liked)
      setLikeCount(data.like_count)
    } catch {
      setLiked(prev)
      setLikeCount(c => (prev ? c + 1 : c - 1))
    }
  }

  const handleComment = async e => {
    e.preventDefault()

    if (!comment.trim() || !user) return

    setSubmitting(true)

    try {
      await api.post(`/posts/${slug}/comments/`, {
        content: comment,
      })

      const { data } = await api.get(`/posts/${slug}/`)
      setPost(data)
      setComment('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return

    try {
      await api.delete(`/posts/${slug}/`)
      navigate('/')
    } catch (err) {
      console.error(err)
    }
  }

  const openLightbox = image => {
    setLightboxImg(image)
  }

  const closeLightbox = () => {
    setLightboxImg(null)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4">
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton aspect-[16/9] w-full rounded-2xl" />
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="skeleton h-4 rounded" />
            ))}
        </div>
      </div>
    )
  }

  if (!post) return null

  const isAuthor = user?.username === post.author?.username
    return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex flex-wrap gap-2 mb-5">
          {post.tags?.map(tag => (
            <Link
              key={tag.id}
              to={`/?tags__slug=${tag.slug}`}
              className="tag-chip"
            >
              {tag.name}
            </Link>
          ))}
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-medium text-ink-900 leading-tight mb-5">
          {post.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-y border-ink-100">

          <Link
            to={`/profile/${post.author?.username}`}
            className="flex items-center gap-3 group"
          >
            <AuthorAvatar author={post.author} />

            <div>
              <p className="font-medium text-ink-800 text-sm group-hover:text-amber-600 transition-colors">
                {post.author?.first_name
                  ? `${post.author.first_name} ${post.author.last_name || ''}`.trim()
                  : post.author?.username}
              </p>

              <p className="text-ink-400 text-xs">
                {format(new Date(post.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">

            {/* Reading Time */}
            {post.reading_time && (
              <span className="text-ink-400 text-xs">
                {post.reading_time} min read
              </span>
            )}

            {/* Views */}
            <span className="text-ink-400 text-xs flex items-center gap-1">
              👁 {post.views}
            </span>

            {/* Likes */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all
              ${
                liked
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'bg-ink-100 text-ink-500 hover:bg-red-50 hover:text-red-400'
              }`}
            >
              <HeartIcon className="w-4 h-4" filled={liked} />
              {likeCount}
            </button>

            {/* Author Actions */}
            {isAuthor && (
              <div className="flex gap-2">
                <Link
                  to={`/edit/${post.slug}`}
                  className="btn-outline text-xs py-1.5"
                >
                  Edit
                </Link>

                <Link
                  to="/my-posts"
                  className="btn-outline text-xs py-1.5"
                >
                  📊 Analytics
                </Link>

                <button
                  onClick={handleDelete}
                  className="btn-outline text-xs py-1.5 text-red-500 border-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {post.image && (
        <div className="mb-8 rounded-2xl overflow-hidden aspect-[16/9]">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Markdown Content */}
      <div
        className="prose prose-lg max-w-none prose-headings:font-display"
        data-color-mode="light"
      >
        <MDEditor.Markdown source={post.content || ''} />
      </div>

      {/* Additional Images */}
      {post.images && post.images.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl mb-4">
            Gallery
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {post.images.map(img => (
              <button
                key={img.id}
                onClick={() => openLightbox(img)}
                className="overflow-hidden rounded-xl"
              >
                <img
                  src={img.url}
                  alt={img.caption || ''}
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-6xl w-full"
          >
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white text-3xl"
            >
              ×
            </button>

            <img
              src={lightboxImg.url}
              alt=""
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />

            {lightboxImg.caption && (
              <p className="text-center text-white mt-3">
                {lightboxImg.caption}
              </p>
            )}
          </div>
        </div>
      )}
            {/* Comments */}
      <div className="mt-16 pt-8 border-t border-ink-100">
        <h2 className="font-display text-2xl font-medium text-ink-900 mb-6">
          {post.comments?.length || 0}{' '}
          {post.comments?.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="input-field resize-none mb-3"
            />

            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div className="bg-ink-50 border border-ink-100 rounded-xl p-4 mb-8 text-sm text-ink-500">
            <Link
              to="/login"
              className="text-amber-600 font-medium"
            >
              Sign in
            </Link>{' '}
            to leave a comment.
          </div>
        )}

        <div className="space-y-5">
          {post.comments?.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment, depth = 0 }) {
  return (
    <div
      className={`${
        depth > 0
          ? 'ml-8 border-l-2 border-ink-100 pl-5'
          : ''
      }`}
    >
      <div className="flex gap-3">
        <AuthorAvatar
          author={comment.author}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-ink-800">
              {comment.author?.username}
            </span>

            <span className="text-xs text-ink-400">
              {formatDistanceToNow(
                new Date(comment.created_at),
                { addSuffix: true }
              )}
            </span>
          </div>

          <p className="text-ink-700 text-sm leading-relaxed">
            {comment.content}
          </p>
        </div>
      </div>

      {comment.replies?.map(reply => (
        <div key={reply.id} className="mt-4">
          <CommentItem
            comment={reply}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  )
}

function AuthorAvatar({ author, size = 'md' }) {
  const initials =
    (
      (author?.first_name?.[0] || '') +
      (author?.username?.[0] || '')
    ).toUpperCase()

  const cls =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : 'w-10 h-10 text-sm'

  if (author?.avatar) {
    return (
      <img
        src={author.avatar}
        alt=""
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${cls} rounded-full bg-amber-100 text-amber-700 font-medium flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

function HeartIcon({ className, filled }) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z"
      />
    </svg>
  )
}