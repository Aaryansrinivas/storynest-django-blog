import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export default function PostCard({ post, featured = false }) {
  if (featured) return <FeaturedCard post={post} />
  return <RegularCard post={post} />
}

function FeaturedCard({ post }) {
  return (
    <Link to={`/post/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl aspect-[16/9] bg-ink-200">
        {post.image ? (
          <img src={post.image} alt={post.title} className="w-full h-full object-cover
            group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <GradientPlaceholder title={post.title} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags?.slice(0, 3).map(t => (
              <span key={t.id} className="px-2.5 py-0.5 text-xs rounded-full bg-white/20 text-white backdrop-blur-sm">{t.name}</span>
            ))}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-white mb-2 leading-tight
            group-hover:text-amber-200 transition-colors line-clamp-2">{post.title}</h2>
          <p className="text-white/70 text-sm line-clamp-2 mb-4 hidden sm:block">{post.excerpt}</p>
          <div className="flex items-center gap-3">
            <AuthorAvatar author={post.author} />
            <div>
              <p className="text-white text-sm font-medium">{post.author?.first_name || post.author?.username}</p>
              <p className="text-white/60 text-xs">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 text-white/60 text-xs">
              <span className="flex items-center gap-1">
                <HeartIcon className="w-3.5 h-3.5" /> {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <ChatIcon className="w-3.5 h-3.5" /> {post.comment_count}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

function RegularCard({ post }) {
  return (
    <Link to={`/post/${post.slug}`} className="group block">
      <article className="card h-full flex flex-col">
        {post.image ? (
          <div className="aspect-[16/10] overflow-hidden bg-ink-100">
            <img src={post.image} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="aspect-[16/10] overflow-hidden">
            <GradientPlaceholder title={post.title} />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags?.slice(0, 2).map(t => (
              <span key={t.id} className="tag-chip">{t.name}</span>
            ))}
          </div>
          <h3 className="font-display text-lg font-medium text-ink-900 mb-2 leading-snug
            group-hover:text-amber-600 transition-colors line-clamp-2">{post.title}</h3>
          <p className="text-ink-500 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100">
            <div className="flex items-center gap-2">
              <AuthorAvatar author={post.author} size="sm" />
              <div>
                <p className="text-ink-700 text-xs font-medium">{post.author?.first_name || post.author?.username}</p>
                <p className="text-ink-400 text-xs">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-ink-400 text-xs">
              <span className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                <HeartIcon className="w-3.5 h-3.5" /> {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <ChatIcon className="w-3.5 h-3.5" /> {post.comment_count}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

function AuthorAvatar({ author, size = 'md' }) {
  const initials = ((author?.first_name?.[0] || '') + (author?.username?.[0] || '')).toUpperCase()
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  if (author?.profile?.avatar) {
    return <img src={author.profile.avatar} alt="" className={`${cls} rounded-full object-cover ring-2 ring-white`} />
  }
  return (
    <div className={`${cls} rounded-full bg-amber-100 text-amber-700 font-medium flex items-center justify-center ring-2 ring-white`}>
      {initials}
    </div>
  )
}

function GradientPlaceholder({ title }) {
  const colors = [
    'from-amber-200 to-orange-100',
    'from-sky-200 to-blue-100',
    'from-emerald-200 to-teal-100',
    'from-purple-200 to-violet-100',
    'from-rose-200 to-pink-100',
  ]
  const color = colors[title?.charCodeAt(0) % colors.length] || colors[0]
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-end p-4`}>
      <span className="font-display text-ink-600/40 text-lg leading-tight line-clamp-2 select-none">{title}</span>
    </div>
  )
}

function HeartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z"/>
    </svg>
  )
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  )
}
