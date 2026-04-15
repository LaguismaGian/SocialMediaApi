import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const Feed = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Post/feed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      console.log('Posts data:', data) // Check what imageUrl looks like
      setPosts(data)
    } catch (error) {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Feed</h2>
      {posts.length === 0 ? (
        <p>No posts yet. Create one!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="border rounded-lg p-4 mb-4 shadow-sm">
            <div className="font-bold mb-2">{post.user?.name || 'User'}</div>
            <p className="mb-2">{post.content}</p>
            {post.imageUrl && post.imageUrl !== '' && (
              <img 
                src={`http://localhost:3000${post.imageUrl}`} 
                alt="Post" 
                className="mt-2 max-h-96 rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', `http://localhost:3000${post.imageUrl}`)
                  e.target.style.display = 'none'
                }}
              />
            )}
            <div className="text-sm text-gray-500 mt-2">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default Feed