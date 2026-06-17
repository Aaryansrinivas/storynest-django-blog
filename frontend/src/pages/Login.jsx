import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import OAuthButtons from '../components/OAuthButtons'

export default function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.username, form.password)
      navigate(from, { replace: true })
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-medium text-ink-900 mb-2">Welcome back</h1>
          <p className="text-ink-500 text-sm">Sign in to your StoryNest account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600 uppercase tracking-wide block mb-1.5">
              Username
            </label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="your_username"
              className="input-field"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600 uppercase tracking-wide block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input-field"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* OAuth2 social login */}
        <OAuthButtons label="Or sign in with" />

        <p className="text-center text-sm text-ink-500 mt-6">
          New to StoryNest?{' '}
          <Link to="/register" className="text-amber-600 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
