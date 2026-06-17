import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import api from '../lib/api'

export default function PostEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isEdit = !!slug

  const imgRef = useRef()
  const galleryRef = useRef()

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'published',
    tag_names: [],
  })

  const [tagInput, setTagInput] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [savedSlug, setSavedSlug] = useState(slug || null)

  const [galleryImages, setGalleryImages] = useState([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return

    api.get(`/posts/${slug}/`)
      .then(({ data }) => {
        setForm({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || '',
          status: data.status,
          tag_names: data.tags?.map(t => t.name) || [],
        })

        if (data.image) {
          setImagePreview(data.image)
        }

        setGalleryImages(data.images || [])
        setSavedSlug(data.slug)
      })
      .catch(console.error)
  }, [slug, isEdit])

  const addTag = e => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()

      const tag = tagInput
        .trim()
        .toLowerCase()
        .replace(/,/g, '')

      if (tag && !form.tag_names.includes(tag)) {
        setForm(prev => ({
          ...prev,
          tag_names: [...prev.tag_names, tag],
        }))
      }

      setTagInput('')
    }
  }

  const removeTag = tag => {
    setForm(prev => ({
      ...prev,
      tag_names: prev.tag_names.filter(t => t !== tag),
    }))
  }

  const handleCoverImage = e => {
    const file = e.target.files[0]

    if (!file) return

    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e, statusOverride) => {
    e.preventDefault()

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const fd = new FormData()

      const payload = {
        ...form,
        status: statusOverride || form.status,
      }

      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => fd.append(key, item))
        } else {
          fd.append(key, value)
        }
      })

      if (image) {
        fd.append('image', image)
      }

      let response

      if (isEdit) {
        response = await api.patch(
          `/posts/${slug}/`,
          fd,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
      } else {
        response = await api.post(
          '/posts/',
          fd,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
      }

      const createdSlug = response.data.slug

      setSavedSlug(createdSlug)

      navigate(`/post/${createdSlug}`)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
        'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  const uploadGalleryImages = async e => {
    const files = Array.from(e.target.files || [])

    if (!files.length || !savedSlug) return

    setUploadingGallery(true)

    try {
      const fd = new FormData()

      files.forEach(file => {
        fd.append('images', file)
      })

      const { data } = await api.post(
        `/posts/${savedSlug}/images/`,
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setGalleryImages(prev => [...prev, ...data])
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingGallery(false)
    }
  }

  const deleteGalleryImage = async imageId => {
    if (!window.confirm('Delete image?')) return

    try {
      await api.delete(
        `/posts/${savedSlug}/images/${imageId}/`
      )

      setGalleryImages(prev =>
        prev.filter(img => img.id !== imageId)
      )
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-medium">
          {isEdit ? 'Edit Story' : 'Write a New Story'}
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
        >
          ← Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        {/* Cover Image */}

        <div
          onClick={() => imgRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden"
        >
          {imagePreview ? (
            <div className="relative aspect-[16/7]">
              <img
                src={imagePreview}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/7] flex items-center justify-center text-gray-400">
              Add Cover Image
            </div>
          )}

          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleCoverImage}
          />
        </div>

        {/* Title */}

        <input
          value={form.title}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              title: e.target.value,
            }))
          }
          placeholder="Your story title..."
          className="w-full text-4xl font-display bg-transparent outline-none"
        />

        {/* Excerpt */}

        <textarea
          rows={3}
          value={form.excerpt}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              excerpt: e.target.value,
            }))
          }
          placeholder="Short excerpt..."
          className="input-field"
        />

        {/* Markdown Editor */}

        <div data-color-mode="light">
          <label className="block text-sm font-medium mb-2">
            Content
          </label>

          <MDEditor
            value={form.content}
            onChange={value =>
              setForm(prev => ({
                ...prev,
                content: value || '',
              }))
            }
            preview="live"
            height={500}
          />
        </div>

        {/* Tags */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Tags
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {form.tag_names.map(tag => (
              <span
                key={tag}
                className="tag-chip flex items-center gap-1"
              >
                {tag}

                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Press Enter after each tag"
            className="input-field"
          />
        </div>

        {/* Additional Images */}

        {savedSlug && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Additional Images
              </h3>

              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="btn-outline"
              >
                Upload Images
              </button>
            </div>

            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={uploadGalleryImages}
            />

            {uploadingGallery && (
              <p className="text-sm text-gray-500 mb-4">
                Uploading...
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.map(img => (
                <div
                  key={img.id}
                  className="relative rounded-xl overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-40 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => deleteGalleryImage(img.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}

        <div className="flex gap-5">
          {['published', 'draft'].map(status => (
            <label
              key={status}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                checked={form.status === status}
                onChange={() =>
                  setForm(prev => ({
                    ...prev,
                    status,
                  }))
                }
              />

              <span className="capitalize">
                {status}
              </span>
            </label>
          ))}
        </div>

        {/* Buttons */}

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving
              ? 'Saving...'
              : isEdit
              ? 'Update Story'
              : 'Publish Story'}
          </button>

          {!isEdit && (
            <button
              type="button"
              disabled={saving}
              onClick={e =>
                handleSubmit(e, 'draft')
              }
              className="btn-outline"
            >
              Save Draft
            </button>
          )}
        </div>
      </form>
    </div>
  )
}