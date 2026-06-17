import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import PostCard from '../components/PostCard'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState(null)
  const [searchParams] = useSearchParams()
  // ?search= goes through DRF SearchFilter (icontains)
  // ?q= goes through PostgreSQL full-text search (ranked)
  const searchQuery = searchParams.get('search') || ''
  const ftQuery = searchParams.get('q') || ''
  const activeSearch = ftQuery || searchQuery

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (searchQuery) params.search = searchQuery
      if (ftQuery) params.q = ftQuery          // full-text search param
      if (activeTag) params['tags__slug'] = activeTag
      const { data } = await api.get('/posts/', { params })
      setPosts(data.results || data)
      if (data.count) setTotalPages(Math.ceil(data.count / 9))
      else setTotalPages(1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, ftQuery, activeTag])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => {
    api.get('/tags/').then(r => setTags(r.data.results || r.data)).catch(() => {})
  }, [])
  useEffect(() => { setPage(1) }, [searchQuery, ftQuery, activeTag])

  const featured = posts[0]
  const rest = posts.slice(1)
  const isFiltered = activeSearch || activeTag || page > 1

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero */}
      {!isFiltered && (
        <div className="mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-ink-900 mb-2">
            Stories worth<br /><em className="text-amber-600">reading.</em>
          </h1>
          <p className="text-ink-500 mt-3">Thoughts, ideas, and perspectives — written by people who care.</p>
        </div>
      )}

      {/* Search result header */}
      {activeSearch && (
        <div className="mb-8">
          <p className="text-ink-500 text-sm">
            {ftQuery ? 'Full-text search results for' : 'Search results for'}
          </p>
          <h2 className="font-display text-2xl text-ink-900">"{activeSearch}"</h2>
          {ftQuery && (
            <p className="text-xs text-ink-400 mt-1">Results ranked by relevance using PostgreSQL full-text search</p>
          )}
        </div>
      )}

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`tag-chip ${!activeTag ? '!bg-ink-900 !text-white' : ''}`}
          >
            All
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(tag.slug)}
              className={`tag-chip ${activeTag === tag.slug ? '!bg-ink-900 !text-white' : ''}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="font-display text-xl text-ink-700 mb-2">No stories found</h3>
          <p className="text-ink-400 text-sm">Try a different search or tag</p>
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && !isFiltered && (
            <div className="mb-10">
              <PostCard post={featured} featured />
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isFiltered ? posts : rest).map((post, i) => (
              <div key={post.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline disabled:opacity-40">
                ← Prev
              </button>
              <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="card">
          <div className="aspect-[16/10] skeleton" />
          <div className="p-5 space-y-3">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
