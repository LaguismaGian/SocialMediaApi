import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from "react-router";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [userName, setUserName] = useState('');
    const location = useLocation();

    useEffect(() => {
        const loggedIn = !!localStorage.getItem('token');
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(user.name || '');
            
            const storedPhoto = localStorage.getItem('profilePhoto');
            if (storedPhoto) {
                setProfilePhoto(storedPhoto);
            } else {
                const fetchProfile = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:3000/api/User/profile/${user.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        if (data.profilePhoto) {
                            setProfilePhoto(data.profilePhoto);
                            localStorage.setItem('profilePhoto', data.profilePhoto);
                        }
                    } catch (error) {
                        console.error('Failed to fetch profile photo');
                    }
                };
                if (user.id) fetchProfile();
            }
        }
    }, [location]);

    return (
        <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand Logo */}
                    <div className="flex-shrink-0">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300 cursor-pointer">
                            VibeZone
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-8">
                            <NavLink
                                to='/'
                                className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                Feed
                            </NavLink>

                            <NavLink
                                to='/matches'
                                className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                Matches
                            </NavLink>

                            <NavLink
                                to='/chat'
                                className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                Chat
                            </NavLink>

                            {isLoggedIn ? (
                                <>
                                    <NavLink
                                        to='/create-post'
                                        className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        Create Post
                                    </NavLink>

                                    <NavLink to='/profile/me' className="flex items-center">
                                        {profilePhoto ? (
                                            <img 
                                                src={`http://localhost:3000${profilePhoto}`} 
                                                alt="Profile" 
                                                className="w-9 h-9 rounded-full object-cover border-2 border-transparent hover:border-pink-500 transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold hover:scale-105 transition-all duration-300">
                                                {userName?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </NavLink>

                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            localStorage.removeItem('profilePhoto');
                                            setIsLoggedIn(false);
                                            window.location.href = '/login';
                                        }}
                                        className="px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink
                                        to='/login'
                                        className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        Login
                                    </NavLink>

                                    <NavLink
                                        to='/signup'
                                        className={({ isActive }) => `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        Signup
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen
                    ? 'max-h-96 opacity-100 visible'
                    : 'max-h-0 opacity-0 invisible overflow-hidden'
                    }`}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        Feed
                    </NavLink>

                    <NavLink
                        to="/matches"
                        className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        Matches
                    </NavLink>

                    <NavLink
                        to="/chat"
                        className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        Chat
                    </NavLink>

                    {isLoggedIn ? (
                        <>
                            <NavLink
                                to="/create-post"
                                className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                Create Post
                            </NavLink>

                            <NavLink
                                to="/profile/me"
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                {profilePhoto ? (
                                    <img 
                                        src={`http://localhost:3000${profilePhoto}`} 
                                        alt="Profile" 
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        {userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <span>Profile</span>
                            </NavLink>

                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('profilePhoto');
                                    setIsLoggedIn(false);
                                    window.location.href = '/login';
                                }}
                                className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-white hover:shadow-sm transition-all duration-200"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                Login
                            </NavLink>

                            <NavLink
                                to="/signup"
                                className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                Signup
                            </NavLink>
                        </>
                    )}
                </div>
            </div>

            {/* Decorative gradient line */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        </header>
    );
};

export default Navbar;