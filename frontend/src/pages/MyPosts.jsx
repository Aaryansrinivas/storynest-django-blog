import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

// ─── Analytics panel ──────────────────────────────────────────────────────────
function AnalyticsPanel({ post, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/posts/${post.slug}/analytics/`)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [post.slug])

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-700 text-xl leading-none"
        >×</button>

        <h2 className="font-display text-xl font-medium text-ink-900 mb-1">Analytics</h2>
        <p className="text-ink-500 text-sm mb-6 truncate">{post.title}</p>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <p className="text-ink-400 text-sm text-center py-12">Could not load analytics.</p>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Views" value={data.total_views} icon="👁" />
              <StatCard label="Total Likes" value={data.total_likes} icon="❤️" />
              <StatCard label="Comments" value={data.total_comments} icon="💬" />
            </div>

            {/* Daily views chart */}
            <div>
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-3">
                Views — last 30 days
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => {
                      const [, m, day] = d.split('-')
                      return `${parseInt(day)} ${['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)]}`
                    }}
                    tick={{ fontSize: 10, fill: '#9e9589' }}
                    interval={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#9e9589' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e8e4de',
                      fontSize: '12px',
                      padding: '6px 12px',
                    }}
                    formatter={v => [v, 'Views']}
                    labelFormatter={d => {
                      const date = new Date(d)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <Bar dataKey="views" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-ink-50 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-display font-medium text-ink-900">{value.toLocaleString()}</div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  )
}

// ─── MyPosts ──────────────────────────────────────────────────────────────────
export default function MyPosts() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyticsPost, setAnalyticsPost] = useState(null)

  useEffect(() => {
    api.get('/posts/my_posts/').then(({ data }) => {
      setPosts(data.results || data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (slug) => {
    if (!confirm('Delete this post?')) return
    await api.delete(`/posts/${slug}/`)
    setPosts(p => p.filter(post => post.slug !== slug))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-medium text-ink-900">My stories</h1>
        <Link to="/write" className="btn-primary">+ Write new</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">✍️</p>
          <h3 className="font-display text-xl text-ink-700 mb-2">No stories yet</h3>
          <p className="text-ink-400 text-sm mb-6">Start writing — your first story is waiting.</p>
          <Link to="/write" className="btn-primary">Write now</Link>
        </div>
      ) : (
        <div className="divide-y divide-ink-100">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 py-4 group">
              {post.image && (
                <img src={post.image} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-ink-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                <h3 className="font-medium text-ink-800 truncate">{post.title}</h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  {post.like_count} likes · {post.comment_count} comments · {post.views} views
                  {post.reading_time ? ` · ${post.reading_time} min read` : ''}
                </p>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/post/${post.slug}`} className="btn-ghost text-xs py-1.5">View</Link>
                <button
                  onClick={() => setAnalyticsPost(post)}
                  className="btn-outline text-xs py-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  📊 Analytics
                </button>
                <Link to={`/edit/${post.slug}`} className="btn-outline text-xs py-1.5">Edit</Link>
                <button
                  onClick={() => handleDelete(post.slug)}
                  className="btn-outline text-xs py-1.5 text-red-500 border-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyticsPost && (
        <AnalyticsPanel post={analyticsPost} onClose={() => setAnalyticsPost(null)} />
      )}
    </div>
  )
}
