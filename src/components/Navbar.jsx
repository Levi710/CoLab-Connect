import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [inboxCount, setInboxCount] = React.useState(0);

    React.useEffect(() => {
        if (currentUser) {
            const fetchData = async () => {
                try {
                    const { api } = await import('../api');
                    const [rooms, requests, notifications] = await Promise.all([
                        api.chat.getRooms(),
                        api.requests.getMyProjectRequests(),
                        api.notifications.getAll()
                    ]);

                    const totalUnread = rooms.reduce((acc, room) => acc + parseInt(room.unread_count || 0), 0);
                    setUnreadCount(totalUnread);

                    const pendingRequests = requests.filter(r => r.status === 'pending');
                    const unreadNotifications = notifications.filter(n => !n.is_read);
                    setInboxCount(pendingRequests.length + unreadNotifications.length);
                } catch (err) {
                    console.error('Failed to fetch navbar data', err);
                }
            };
            fetchData();
            const interval = setInterval(fetchData, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const location = useLocation();
    const pathname = location?.pathname || '/';

    const getMobileLinkClass = (path) => {
        const isActive = pathname === path;
        return isActive
            ? "bg-primary/10 border-primary text-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            : "border-transparent text-gray-300 hover:bg-white/5 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium";
    };

    return (
        <nav className="bg-dark/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-[100]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">CoLab Connect</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/" className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors rounded-md my-2 ${pathname === '/' ? 'border-primary text-white' : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Discovery
                            </Link>
                            <Link to="/dashboard" className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors rounded-md my-2 ${pathname === '/dashboard' ? 'border-primary text-white' : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Dashboard
                            </Link>
                            <Link to="/inbox" className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors rounded-md my-2 ${pathname === '/inbox' ? 'border-primary text-white' : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Inbox
                                {inboxCount > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {inboxCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/chat/all" className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors rounded-md my-2 ${pathname.startsWith('/chat') ? 'border-primary text-white' : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Messages
                                {unreadCount > 0 && (
                                    <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/about" className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors rounded-md my-2 ${pathname === '/about' ? 'border-primary text-white' : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                About
                            </Link>
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        <Link to="/create-project" className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <PlusCircle className="h-6 w-6" />
                        </Link>
                        <Link to={`/profile/${currentUser?.public_id || currentUser?.id}`} className="ml-3 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            {currentUser && currentUser.photo_url ? (
                                <img
                                    className="h-8 w-8 rounded-full object-cover border-2 border-transparent hover:border-primary transition-colors"
                                    src={currentUser.photo_url}
                                    alt={currentUser.username}
                                />
                            ) : (
                                <User className="h-6 w-6" />
                            )}
                        </Link>
                        {currentUser ? (
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover flex items-center shadow-lg shadow-primary/20 transition-all"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        ) : (
                            <Link to="/login" className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {
                isOpen && (
                    <div className="sm:hidden bg-dark border-b border-white/10">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link to="/" className={getMobileLinkClass('/')}>
                                Discovery
                            </Link>
                            <Link to="/dashboard" className={getMobileLinkClass('/dashboard')}>
                                Dashboard
                            </Link>
                            <Link to="/inbox" className={getMobileLinkClass('/inbox')}>
                                Inbox
                                {inboxCount > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {inboxCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/chat/all" className={getMobileLinkClass('/chat/all')}>
                                Messages
                                {unreadCount > 0 && (
                                    <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/about" className={getMobileLinkClass('/about')}>
                                About
                            </Link>
                            <Link to="/create-project" className={getMobileLinkClass('/create-project')}>
                                Create Project
                            </Link>
                        </div>
                        <div className="pt-4 pb-4 border-t border-white/10">
                            {currentUser ? (
                                <>
                                    <div className="flex items-center px-4">
                                        <div className="flex-shrink-0">
                                            {currentUser.photo_url ? (
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover border-2 border-white/10"
                                                    src={currentUser.photo_url}
                                                    alt={currentUser.username}
                                                />
                                            ) : (
                                                <User className="h-10 w-10 rounded-full bg-white/10 p-2 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-white">{currentUser.username}</div>
                                            <div className="text-sm font-medium text-gray-400">{currentUser.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <Link to="/profile" className="block px-4 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5">
                                            Your Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-3 space-y-1">
                                    <Link to="/login" className="block px-4 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5">
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
