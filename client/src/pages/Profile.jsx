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
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        toast.success(data.liked ? 'Interested! ❤️' : 'Removed interest')
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
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

  if (loading) return <div className="p-6">Loading...</div>
  if (!profile) return <div className="p-6">User not found</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {profile.profilePhoto ? (
            <img 
              src={`http://localhost:3000${profile.profilePhoto}`} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-gray-500">@{profile.email?.split('@')[0]}</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{profile.bio || 'No bio yet'}</p>
        
        {isOwnProfile && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Edit Profile
            </button>
            <label className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 cursor-pointer">
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
            </label>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Posts */}
      <div>
        <h3 className="text-xl font-bold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="border rounded-lg p-4 mb-4 shadow-sm relative">
              {isOwnProfile && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => {
                      setEditingPost(post.id)
                      setEditContent(post.content)
                    }}
                    className="text-gray-400 hover:text-blue-500 transition p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              
              {editingPost === post.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-2"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdatePost(post.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-2">{post.content}</p>
                  {post.imageUrl && (
                    <img src={`http://localhost:3000${post.imageUrl}`} alt="Post" className="mt-2 max-h-96 rounded-lg" />
                  )}
                  
                  {/* Heart Button */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleInterested(post.id)}
                      disabled={liking[post.id]}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full transition ${
                        post.userLiked 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-pink-100'
                      }`}
                    >
                      <span className="text-xl">{post.userLiked ? '❤️' : '♡'}</span>
                      <span>{post.likesCount || 0}</span>
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Profile