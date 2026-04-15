import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

const Matches = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Post/matches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      console.log('Matches data:', data) // Check if profilePhoto is in the response
      setMatches(data)
    } catch (error) {
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading matches...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Your Matches
        </h2>
        <p className="text-gray-500 mt-1">People who vibe with you</p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">💔</div>
          <p className="text-gray-500">No matches yet. Heart someone's post and they might heart yours back!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(match => (
            <div 
              key={match.id} 
              onClick={() => goToProfile(match.matchedUser.id)}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              {match.matchedUser.profilePhoto ? (
                <img 
                  src={`http://localhost:3000${match.matchedUser.profilePhoto}`} 
                  alt={match.matchedUser.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {match.matchedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-lg text-gray-900">{match.matchedUser.name}</div>
                <div className="text-sm text-gray-500">
                  Matched on {new Date(match.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Matches