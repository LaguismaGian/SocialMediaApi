import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import NotFound from './pages/NotFound'
import Person from './components/person/Person'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CreatePost from './components/CreatePost'
import { Routes, Route } from "react-router";
import { Toaster } from 'react-hot-toast';
import Matches from './pages/Matches' 
import Chat from './pages/Chat'

const App = () => {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="home" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="person" element={<Person />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="*" element={<NotFound />} />
        <Route path="matches" element={<Matches />} />
        <Route path="chat" element={<Chat />} />
        
      </Routes>

      <Toaster />
    </>
  )
}

export default App