import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await api.get('/auth/me/')
      set({ user: data, loading: false })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, loading: false })
    }
  },

  login: async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const me = await api.get('/auth/me/')
    set({ user: me.data })
    return me.data
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register/', formData)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    set({ user: data.user })
    return data.user
  },

  /** Called after OAuth2 redirect — exchanges session cookie for JWT */
  loginWithOAuth: async () => {
    const { data } = await api.post('/auth/oauth/token/', {}, { withCredentials: true })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    set({ user: data.user })
    return data.user
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await api.post('/auth/logout/', { refresh }) } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null })
  },

  updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
}))

export default useAuthStore
