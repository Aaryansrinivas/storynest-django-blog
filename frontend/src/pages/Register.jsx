import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import OAuthButtons from '../components/OAuthButtons'

export default function Register() {
  const { register } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Registration failed.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-field"
        required={key !== 'email'}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-medium text-ink-900 mb-2">Join StoryNest</h1>
          <p className="text-ink-500 text-sm">Start sharing your stories today</p>
        </div>

        {errors.detail && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {errors.detail}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field('first_name', 'First name', 'text', 'Jane')}
            {field('last_name', 'Last name', 'text', 'Smith')}
          </div>
          {field('username', 'Username', 'text', 'janesmith')}
          {field('email', 'Email', 'email', 'jane@example.com')}
          {field('password', 'Password', 'password', '••••••••')}
          {field('password2', 'Confirm password', 'password', '••••••••')}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* OAuth2 social signup */}
        <OAuthButtons label="Or sign up with" />

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
