import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  ShoppingBag,
  Star,
  TrendingUp,
  Gift,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import MembershipPlans from '../components/MembershipPlans';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token, user?.id]);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, ordersRes, recommendationsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/recommendations/${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [bookingsData, ordersData, recommendationsData] = await Promise.all([
        bookingsRes.json(),
        ordersRes.json(),
        recommendationsRes.json()
      ]);

      setBookings(bookingsData);
      setOrders(ordersData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b => 
    new Date(`${b.date} ${b.time}`) > new Date() && b.status === 'confirmed'
  );

  const recentBookings = bookings
    .filter(b => b.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const stats = [
    {
      title: 'Total Sessions',
      value: bookings.filter(b => b.status === 'completed').length,
      icon: Calendar,
      color: 'bg-teal-500'
    },
    {
      title: 'Hours Floated',
      value: Math.round(bookings.filter(b => b.status === 'completed').length * 60 / 60),
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      title: 'Orders Placed',
      value: orders.length,
      icon: ShoppingBag,
      color: 'bg-green-500'
    },
    {
      title: 'Wellness Points',
      value: bookings.filter(b => b.status === 'completed').length * 10,
      icon: Star,
      color: 'bg-yellow-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 text-lg">
            Here's your wellness journey overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Sessions</h2>
            
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking, index) => (
                  <div key={index} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">Float Session</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(booking.date), 'MMMM d, yyyy')} at {booking.time}
                        </p>
                        <p className="text-sm text-teal-600 mt-1">
                          Booking Code: {booking.bookingCode}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming sessions</p>
                <button
                  onClick={() => navigate('/booking')}
                  className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Book a Session
                </button>
              </div>
            )}
          </motion.div>

          {/* Personalized Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
            
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 2).map((session, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <img
                        src={session.image}
                        alt={session.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {session.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-teal-600 font-bold">₹{session.price}</span>
                          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations yet</p>
                <p className="text-sm text-gray-400 mt-2">Book more sessions to get personalized suggestions</p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Completed float session</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </motion.div>

          {/* Membership Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gold-400 to-yellow-500 text-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Membership Status</h2>
            
            {user?.membership ? (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Gift className="w-6 h-6" />
                  <span className="text-xl font-semibold capitalize">{user.membership} Member</span>
                </div>
                <p className="opacity-90 mb-4">
                  Enjoy exclusive benefits and priority booking as a valued member.
                </p>
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="font-medium mb-2">Member Benefits:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 20% discount on all sessions</li>
                    <li>• Priority booking access</li>
                    <li>• Free wellness products</li>
                    <li>• Guest passes included</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">Become a Member</h3>
                <p className="opacity-90 mb-4">
                  Unlock exclusive benefits and save on your wellness journey.
                </p>
                <button
                  onClick={() => setShowMembershipPlans(true)}
                  className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  View Membership Plans
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Membership Plans Modal */}
      {showMembershipPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Membership Plans</h2>
              <button
                onClick={() => setShowMembershipPlans(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <MembershipPlans />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;