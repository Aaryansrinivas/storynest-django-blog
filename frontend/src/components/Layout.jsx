import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  // Toggle: true = PostgreSQL full-text search, false = keyword filter
  const [fullText, setFullText] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSearch = e => {
    e.preventDefault()
    if (!searchVal.trim()) return
    const param = fullText ? 'q' : 'search'
    navigate(`/?${param}=${encodeURIComponent(searchVal.trim())}`)
    setSearchVal('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-ink-50/95 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl leading-none font-display font-medium text-ink-900
                group-hover:text-amber-600 transition-colors">StoryNest</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1"></span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-sm mx-8 gap-1">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                </svg>
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder={fullText ? 'Full-text search…' : 'Keyword search…'}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-ink-100 border border-transparent
                    focus:outline-none focus:bg-white focus:border-ink-200 transition-all"
                />
              </div>
              {/* Full-text toggle */}
              <button
                type="button"
                onClick={() => setFullText(v => !v)}
                title={fullText ? 'Switch to keyword search' : 'Switch to full-text search'}
                className={`flex-shrink-0 text-xs px-2 py-1.5 rounded-lg border transition-colors
                  ${fullText
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-ink-100 border-ink-200 text-ink-500'
                  }`}
              >
                {fullText ? 'FTS' : 'KW'}
              </button>
            </form>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/write" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Write
                  </Link>
                  <Link to="/my-posts" className="btn-ghost">My Posts</Link>
                  <Link to={`/profile/${user.username}`} className="btn-ghost">Profile </Link>


                  <button onClick={handleLogout} className="btn-ghost text-ink-500">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Sign in</Link>
                  <Link to="/register" className="btn-primary">Get started</Link>
                </>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-ink-700 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-ink-700 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-ink-700 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 border-t border-ink-100 pt-4 space-y-2">
              <form onSubmit={handleSearch} className="mb-3 flex gap-1">
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder={fullText ? 'Full-text search…' : 'Keyword search…'}
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => setFullText(v => !v)}
                  className={`text-xs px-2 rounded-lg border ${fullText ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-ink-100 border-ink-200 text-ink-500'}`}
                >
                  {fullText ? 'FTS' : 'KW'}
                </button>
              </form>
              {user ? (
                <>
                  <Link to="/write" onClick={() => setMenuOpen(false)} className="btn-primary block text-center">Write</Link>
                  <Link to="/my-posts" onClick={() => setMenuOpen(false)} className="btn-ghost block">My Posts</Link>
                  <button onClick={handleLogout} className="btn-ghost w-full text-left">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost block">Sign in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary block text-center">Get started</Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg text-ink-400">StoryNest</span>
          <p className="text-xs text-ink-400">Built with Django + React. Stories that matter.</p>
        </div>
      </footer>
    </div>
  )
}

function Avatar({ user, size = 8 }) {
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || user?.username?.[0] || '')).toUpperCase()
  if (user?.profile?.avatar) {
    return <img src={user.profile.avatar} alt="" className={`w-${size} h-${size} rounded-full object-cover ring-1 ring-ink-200`} />
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-amber-100 flex items-center justify-center
      text-amber-700 font-medium text-xs ring-1 ring-ink-200`}>
      {initials || '?'}
    </div>
  )
}
