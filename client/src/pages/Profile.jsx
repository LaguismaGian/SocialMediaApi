import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import toast from 'react-hot-toast'

const Profile = () => {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', bio: '' })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [liking, setLiking] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [editContent, setEditContent] = useState('')

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id
  const isOwnProfile = !userId || userId === 'me' || userId == currentUserId

  useEffect(() => {
    fetchProfile()
    fetchUserPosts()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const id = isOwnProfile ? currentUserId : userId
      const response = await fetch(`http://localhost:3000/api/User/profile/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProfile(data)
      setEditForm({ name: data.name, bio: data.bio || '' })
    } catch (error) {
      toast.error('Failed to load profile')
    }
  }

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      const id = isOwnProfile ? currentUserId : userId
      const response = await fetch(`http://localhost:3000/api/User/${id}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Post/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Post deleted');
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleUpdatePost = async (postId) => {
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Post/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      
      if (response.ok) {
        toast.success('Post updated');
        setEditingPost(null);
        fetchUserPosts();
      } else {
        toast.error('Failed to update post');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleInterested = async (postId) => {
    setLiking(prev => ({ ...prev, [postId]: true }))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Post/${postId}/interested`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              userLiked: data.liked,
              likesCount: data.liked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
            }
          : post
      ))
      
      if (data.isMatch) {
        toast.success('It\'s a match! 🎉')
      } else {
        toast.success(data.liked ? 'Interested ❤️' : 'Removed interest')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLiking(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/User/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })
      if (response.ok) {
        toast.success('Profile updated!')
        setIsEditing(false)
        fetchProfile()
      } else {
        toast.error('Update failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/User/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Profile photo updated!')
        localStorage.setItem('profilePhoto', data.url)
        fetchProfile()
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
  
  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-gray-400">User not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-10">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            {profile.profilePhoto ? (
              <img 
                src={`http://localhost:3000${profile.profilePhoto}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1.5 cursor-pointer shadow-md hover:from-blue-600 hover:to-purple-600 transition">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-400">@{profile.email?.split('@')[0]}</p>
          <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">{profile.bio || 'No bio yet'}</p>
          
          {isOwnProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition shadow-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Edit Form Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-400"
                    rows="3"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition">
                    Save
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
            <span className="text-xs text-gray-400">{posts.length} posts</span>
          </div>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-gray-400 text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {editingPost === post.id ? (
                    <div className="p-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdatePost(post.id)} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition">
                          Save
                        </button>
                        <button onClick={() => setEditingPost(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                        {post.imageUrl && (
                          <img src={`http://localhost:3000${post.imageUrl}`} alt="Post" className="mt-3 rounded-xl w-full" />
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => handleInterested(post.id)}
                            disabled={liking[post.id]}
                            className={`flex items-center gap-1.5 text-sm transition ${
                              post.userLiked ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'
                            }`}
                          >
                            <span className="text-lg">{post.userLiked ? '❤️' : '♡'}</span>
                            <span>{post.likesCount || 0}</span>
                          </button>
                          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {isOwnProfile && (
                        <div className="border-t border-gray-50 flex">
                          <button
                            onClick={() => {
                              setEditingPost(post.id)
                              setEditContent(post.content)
                            }}
                            className="flex-1 py-2 text-center text-sm text-gray-500 hover:text-purple-500 transition"
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDeletePost(post.id)} className="flex-1 py-2 text-center text-sm text-gray-500 hover:text-red-500 transition">
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile