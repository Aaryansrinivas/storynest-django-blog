import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import PostEditor from './pages/PostEditor'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyPosts from './pages/MyPosts'
import OAuthCallback from './pages/OAuthCallback'

function PrivateRoute({ children }) {
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/write" element={<PrivateRoute><PostEditor /></PrivateRoute>} />
          <Route path="/edit/:slug" element={<PrivateRoute><PostEditor /></PrivateRoute>} />
          <Route path="/my-posts" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
          <Route path="/profile/:username" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
