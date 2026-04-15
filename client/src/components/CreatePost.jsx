import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'

const CreatePost = () => {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !image) {
      toast.error('Please write something or add an image')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let imageUrl = ''

      // Upload image first if exists
      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        
        const uploadResponse = await fetch('http://localhost:3000/api/Upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        const uploadData = await uploadResponse.json()
        if (uploadResponse.ok) {
          imageUrl = uploadData.url
        } else {
          toast.error('Image upload failed')
          setLoading(false)
          return
        }
      }

      // Create post
      const response = await fetch('http://localhost:3000/api/Post/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, imageUrl })
      })

      if (response.ok) {
        toast.success('Post created!')
        setContent('')
        setImage(null)
        setImagePreview(null)
        navigate('/')
      } else {
        toast.error('Failed to create post')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg mb-4"
          rows="4"
          disabled={loading}
        />
        
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            className="mb-2"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded-lg" />
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  )
}

export default CreatePost