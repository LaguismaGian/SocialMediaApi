import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const Admin = () => {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Failed to load stats')
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId, action, successMsg) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Admin/${action}/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success(successMsg)
        fetchUsers()
        fetchStats()
      } else {
        toast.error('Action failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? All their posts, comments, and matches will be deleted.')) return
    setActionLoading(prev => ({ ...prev, [userId]: true }))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success('User deleted')
        fetchUsers()
        fetchStats()
      } else {
        toast.error('Delete failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading admin panel...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage users and monitor activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">{stats?.totalPosts || 0}</div>
            <div className="text-sm text-gray-500">Total Posts</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-pink-600">{stats?.totalMatches || 0}</div>
            <div className="text-sm text-gray-500">Total Matches</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-orange-600">{stats?.totalComments || 0}</div>
            <div className="text-sm text-gray-500">Total Comments</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">{stats?.bannedUsers || 0}</div>
            <div className="text-sm text-gray-500">Banned Users</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Posts</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Matches</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{user.postCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{user.matchCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {user.id !== currentUserId && (
                          <>
                            {!user.isBanned ? (
                              <button
                                onClick={() => handleAction(user.id, 'ban', 'User banned')}
                                disabled={actionLoading[user.id]}
                                className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                              >
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(user.id, 'unban', 'User unbanned')}
                                disabled={actionLoading[user.id]}
                                className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"
                              >
                                Unban
                              </button>
                            )}
                            {user.role !== 'Admin' ? (
                              <button
                                onClick={() => handleAction(user.id, 'make-admin', 'User is now admin')}
                                disabled={actionLoading[user.id]}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(user.id, 'remove-admin', 'Admin role removed')}
                                disabled={actionLoading[user.id]}
                                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
                              >
                                Remove Admin
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={actionLoading[user.id]}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin