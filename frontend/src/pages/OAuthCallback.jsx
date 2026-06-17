/**
 * OAuthCallback — handles the redirect after a successful OAuth2 login.
 *
 * Flow:
 *  1. User clicks "Continue with Google/GitHub" → redirected to Django's
 *     /auth/social/login/<backend>/ → provider → /auth/social/complete/<backend>/
 *  2. Django social-auth logs the user in via session and redirects to
 *     SOCIAL_AUTH_LOGIN_REDIRECT_URL which is FRONTEND_URL + /oauth/callback
 *  3. This page POSTs to /api/auth/oauth/token/ (with session cookie) to get JWT tokens.
 *  4. Stores tokens and navigates home.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function OAuthCallback() {
  const loginWithOAuth = useAuthStore(s => s.loginWithOAuth)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    loginWithOAuth()
      .then(() => navigate('/', { replace: true }))
      .catch(() => {
        setError('OAuth login failed. Please try again.')
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      })
  }, []) // eslint-disable-line

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-ink-500 text-sm mt-1">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink-600">Completing sign in…</p>
      </div>
    </div>
  )
}
