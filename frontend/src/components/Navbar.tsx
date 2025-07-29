import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Waves, User, ShoppingBag, Calendar, LayoutDashboard, LogOut, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Waves className="w-8 h-8 text-teal-600 group-hover:text-teal-700 transition-colors" />
              <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 scale-0 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
              Float Nirvana
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-teal-600 bg-teal-50' 
                  : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/booking" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/booking') 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Session</span>
                </Link>
                
                <Link 
                  to="/shop" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/shop') 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop</span>
                </Link>

                <Link 
                  to="/dashboard" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <h3 className="px-4 py-2 text-sm font-medium text-gray-900 border-b">Notifications</h3>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map(notification => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? 'bg-teal-50' : ''}`}
                            >
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}

            {!user && (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-2 pt-2 pb-4">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-teal-600 bg-teal-50' 
                    : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                Home
              </Link>
              
              {user && (
                <>
                  <Link 
                    to="/booking" 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/booking') 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Session</span>
                  </Link>
                  
                  <Link 
                    to="/shop" 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/shop') 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shop</span>
                  </Link>

                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin') 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}

              {!user && (
                <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;