import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

const Feed = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState({})
  const [comments, setComments] = useState({})
  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [replyingTo, setReplyingTo] = useState({})
  const [replyContent, setReplyContent] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Post/feed', {
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

  const fetchComments = async (postId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Comment/post/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setComments(prev => ({ ...prev, [postId]: data }))
    } catch (error) {
      toast.error('Failed to load comments')
    }
  }

  const handleAddComment = async (postId, parentCommentId = null) => {
    const content = parentCommentId ? replyContent[parentCommentId] : newComment[postId]
    if (!content?.trim()) return

    setSubmitting(prev => ({ ...prev, [parentCommentId || postId]: true }))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Comment/post/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: content,
          parentCommentId: parentCommentId
        })
      })
      
      if (response.ok) {
        if (parentCommentId) {
          setReplyContent(prev => ({ ...prev, [parentCommentId]: '' }))
          setReplyingTo(prev => ({ ...prev, [parentCommentId]: false }))
        } else {
          setNewComment(prev => ({ ...prev, [postId]: '' }))
        }
        fetchComments(postId)
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        ))
        toast.success(parentCommentId ? 'Reply added' : 'Comment added')
      } else {
        toast.error('Failed to add')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(prev => ({ ...prev, [parentCommentId || postId]: false }))
    }
  }

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Delete this comment?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchComments(postId)
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - 1) }
            : post
        ))
        toast.success('Comment deleted')
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const toggleComments = (postId) => {
    if (!showComments[postId]) {
      fetchComments(postId)
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

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
        toast.success(data.liked ? 'Interested! ❤️' : 'Removed interest')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLiking(prev => ({ ...prev, [postId]: false }))
    }
  }

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading vibes...</p>
      </div>
    </div>
  )

  const renderComment = (comment, postId, depth = 0) => {
    const isReply = depth > 0
    const maxDepth = 3
    
    if (depth >= maxDepth) return null

    return (
      <div key={comment.id} className={`flex gap-2 ${isReply ? 'ml-6 mt-2' : 'mt-3'}`}>
        <div 
          onClick={() => navigate(`/profile/${comment.user?.id}`)}
          className="cursor-pointer"
        >
          {comment.user?.profilePhoto ? (
            <img 
              src={`http://localhost:3000${comment.user.profilePhoto}`} 
              alt={comment.user.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-lg p-2">
            <span 
              onClick={() => navigate(`/profile/${comment.user?.id}`)}
              className="font-semibold text-sm cursor-pointer hover:text-pink-500 transition"
            >
              {comment.user?.name}
            </span>
            <p className="text-sm text-gray-700">{comment.content}</p>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
              <button 
                onClick={() => setReplyingTo(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                className="text-pink-500 hover:text-pink-600 text-xs"
              >
                Reply
              </button>
            </div>
          </div>
          
          {/* Reply input */}
          {replyingTo[comment.id] && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyContent[comment.id] || ''}
                onChange={(e) => setReplyContent(prev => ({ ...prev, [comment.id]: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(postId, comment.id)}
                placeholder={`Reply to ${comment.user?.name}...`}
                className="flex-1 p-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
                disabled={submitting[comment.id]}
              />
              <button
                onClick={() => handleAddComment(postId, comment.id)}
                disabled={submitting[comment.id] || !replyContent[comment.id]?.trim()}
                className="bg-pink-500 text-white px-2 py-1 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition text-xs"
              >
                {submitting[comment.id] ? '...' : 'Reply'}
              </button>
            </div>
          )}
          
          {/* Render replies */}
          {comment.replies?.map(reply => renderComment(reply, postId, depth + 1))}
        </div>
        {(comment.user?.id === currentUserId) && (
          <button
            onClick={() => handleDeleteComment(postId, comment.id)}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Discover
          </h2>
          <p className="text-gray-500 mt-1">Find someone who vibes with you</p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-gray-500">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Post header - Clickable profile */}
                <div className="p-4 flex items-center gap-3">
                  <div 
                    onClick={() => navigate(`/profile/${post.user?.id}`)}
                    className="cursor-pointer"
                  >
                    {post.user?.profilePhoto ? (
                      <img 
                        src={`http://localhost:3000${post.user.profilePhoto}`} 
                        alt={post.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div 
                      onClick={() => navigate(`/profile/${post.user?.id}`)}
                      className="font-semibold text-gray-900 cursor-pointer hover:text-pink-500 transition"
                    >
                      {post.user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <p className="px-4 pb-3 text-gray-700">{post.content}</p>
                
                {/* Clickable Image */}
                {post.imageUrl && (
                  <div className="bg-gray-100 cursor-pointer" onClick={() => setSelectedImage(`http://localhost:3000${post.imageUrl}`)}>
                    <img 
                      src={`http://localhost:3000${post.imageUrl}`} 
                      alt="Post" 
                      className="w-full object-cover max-h-96 hover:opacity-90 transition"
                    />
                  </div>
                )}
                
                <div className="p-4 border-t flex items-center gap-4">
                  <button
                    onClick={() => handleInterested(post.id)}
                    disabled={liking[post.id]}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                      post.userLiked 
                        ? 'bg-pink-500 text-white shadow-md scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:scale-105'
                    }`}
                  >
                    <span className="text-xl">{post.userLiked ? '❤️' : '♡'}</span>
                    <span className="font-medium">{post.likesCount || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
                  >
                    <span className="text-xl">💬</span>
                    <span className="font-medium">{post.commentsCount || 0}</span>
                  </button>
                </div>

                {showComments[post.id] && (
                  <div className="border-t p-4 bg-gray-50">
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {comments[post.id]?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No comments yet</p>
                      ) : (
                        comments[post.id]?.map(comment => renderComment(comment, post.id))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        disabled={submitting[post.id]}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submitting[post.id] || !newComment[post.id]?.trim()}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition text-sm"
                      >
                        {submitting[post.id] ? '...' : 'Post'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

export default Feed