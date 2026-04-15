import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const Chat = () => {
  const [conversations, setConversations] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch.matchId)
      const interval = setInterval(() => fetchMessages(selectedMatch.matchId), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedMatch])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/Message/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (matchId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Message/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/Message/${selectedMatch.matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      })
      
      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedMatch.matchId)
        fetchConversations()
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations sidebar */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {conversations.length === 0 ? (
            <p className="p-4 text-gray-500">No conversations yet. Make a match to start chatting!</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.matchId}
                onClick={() => setSelectedMatch(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                  selectedMatch?.matchId === conv.matchId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {conv.otherUser.profilePhoto ? (
                    <img 
                      src={`http://localhost:3000${conv.otherUser.profilePhoto}`} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{conv.otherUser.name}</div>
                    {conv.lastMessage && (
                      <div className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center gap-3">
              {selectedMatch.otherUser.profilePhoto ? (
                <img 
                  src={`http://localhost:3000${selectedMatch.otherUser.profilePhoto}`} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedMatch.otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-xl font-bold">{selectedMatch.otherUser.name}</h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div className={`text-xs mt-1 ${
                    msg.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  )
}

export default Chat