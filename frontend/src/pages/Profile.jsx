import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import PostCard from '../components/PostCard'

export default function Profile() {
  const { username } = useParams()
  const { user: me } = useAuthStore()
  const profileUsername =username
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ bio: '', website: '', location: '', first_name: '', last_name: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  

  const isMe = me?.username === profileUsername

  useEffect(() => {
  if (!profileUsername) return

  Promise.all([
    api.get(`/auth/users/${profileUsername}/`),
    api.get('/posts/', {
      params: { 'author__username': profileUsername }
    }),
  ])
    .then(([p, ps]) => {
      setProfile(p.data)
      setPosts(ps.data.results || ps.data)
      setForm({
        bio: p.data.profile?.bio || '',
        website: p.data.profile?.website || '',
        location: p.data.profile?.location || '',
        first_name: p.data.first_name || '',
        last_name: p.data.last_name || '',
      })
      setLoading(false)
    })
    .catch(() => setLoading(false))
}, [profileUsername])

  const handleSave = async e => {
  e.preventDefault()
  setSaving(true)

  try {
    const fd = new FormData()

    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    if (avatarFile) {
      fd.append('avatar', avatarFile)
    }

    console.log("Avatar File:", avatarFile)

    for (let pair of fd.entries()) {
      console.log(pair[0], pair[1])
    }

    await api.patch('/auth/profile/update/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })


      const { data } = await api.get(`/auth/users/${profileUsername}/`)
      setProfile(data)
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex gap-6 mb-10">
        <div className="skeleton w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-60 rounded" />
        </div>
      </div>
    </div>
  )
  if (!profile) return <div className="text-center py-20 text-ink-400">User not found.</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
        <div className="relative">
          <Avatar user={profile} size="xl" />
          {isMe && editing && (
            <label className="absolute inset-0 rounded-full cursor-pointer bg-ink-950/40 flex items-center justify-center">
              <span className="text-white text-xs">Change</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files[0])} />
            </label>
          )}
        </div>

        <div className="flex-1">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="First name" className="input-field text-sm" />
                <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last name" className="input-field text-sm" />
              </div>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell your story…" rows={3} className="input-field text-sm resize-none" />
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="Website URL" className="input-field text-sm" />
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Location" className="input-field text-sm" />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-medium text-ink-900">
                    {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.username}
                  </h1>
                  <p className="text-ink-400 text-sm">@{profile.username}</p>
                </div>
                {isMe && (
                  <button onClick={() => setEditing(true)} className="btn-outline text-sm">Edit profile</button>
                )}
              </div>
              {profile.profile?.bio && <p className="text-ink-600 mt-3 text-sm leading-relaxed">{profile.profile.bio}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-400">
                {profile.profile?.location && <span>📍 {profile.profile.location}</span>}
                {profile.profile?.website && (
                  <a href={profile.profile.website} target="_blank" rel="noreferrer" className="text-amber-600 hover:underline">
                    🔗 Website
                  </a>
                )}
                <span>Joined {format(new Date(profile.date_joined), 'MMMM yyyy')}</span>
                <span>{profile.post_count} {profile.post_count === 1 ? 'story' : 'stories'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="font-display text-xl font-medium text-ink-900 mb-6">
          {isMe ? 'Your stories' : `Stories by ${profile.first_name || profile.username}`}
        </h2>
        {posts.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <p className="text-4xl mb-3">✍️</p>
            <p>{isMe ? 'You haven\'t written anything yet.' : 'No published stories yet.'}</p>
            {isMe && <Link to="/write" className="btn-primary inline-block mt-4">Write your first story</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ user, size = 'md' }) {
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || user?.username?.[0] || '')).toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', xl: 'w-20 h-20 text-xl' }
  const cls = sizes[size]
  if (user?.profile?.avatar) {
    return <img src={user.profile.avatar} alt="" className={`${cls} rounded-full object-cover ring-2 ring-ink-100`} />
  }
  return (
    <div className={`${cls} rounded-full bg-amber-100 text-amber-700 font-medium font-display flex items-center justify-center ring-2 ring-ink-100`}>
      {initials}
    </div>
  )
}
