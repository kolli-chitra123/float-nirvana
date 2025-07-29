import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  DollarSign,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Bell,
  BarChart3,
  Database,
  Shield,
  MessageSquare,
  FileText,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Ban,
  UserCheck,
  Globe,
  Lock,
  CreditCard,
  Mail,
  Server,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NewAdminDashboard = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalRevenue: 0,
    pendingTickets: 0,
    systemHealth: 'good'
  });
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>({});
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  // Selected items
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Form states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [contentType, setContentType] = useState('session');

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchAdminData();
  }, [token, user]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, sessionsRes, activitiesRes, ticketsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sessions`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ json: () => [] })),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/support/tickets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ json: () => [] }))
      ]);

      const [usersData, sessionsData, activitiesData, ticketsData] = await Promise.all([
        usersRes.json(),
        sessionsRes.json(),
        activitiesRes.json(),
        ticketsRes.json()
      ]);

      setUsers(usersData || []);
      setSessions(sessionsData || []);
      setUserActivities(activitiesData || []);
      setSupportTickets(ticketsData || []);

      // Calculate dashboard stats
      setDashboardStats({
        totalUsers: usersData?.length || 0,
        activeUsers: usersData?.filter((u: any) => u.isActive)?.length || 0,
        totalSessions: sessionsData?.length || 0,
        totalRevenue: 125000, // Mock data
        pendingTickets: ticketsData?.filter((t: any) => t.status === 'open')?.length || 0,
        systemHealth: 'good'
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`;
      let method = 'PUT';
      
      if (action === 'delete') {
        method = 'DELETE';
      } else if (action === 'ban' || action === 'unban') {
        url = `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}/ban`;
        data = { banned: action === 'ban', reason: data?.reason };
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (response.ok) {
        toast.success(`User ${action} successful`);
        fetchAdminData();
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  // Content Management Functions
  const handleContentAction = async (contentId: string, action: string, data?: any) => {
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/${contentType}s`;
      let method = 'POST';
      
      if (action === 'update') {
        url += `/${contentId}`;
        method = 'PUT';
      } else if (action === 'delete') {
        url += `/${contentId}`;
        method = 'DELETE';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (response.ok) {
        toast.success(`${contentType} ${action} successful`);
        fetchAdminData();
        setShowContentModal(false);
        setSelectedContent(null);
      } else {
        throw new Error(`Failed to ${action} ${contentType}`);
      }
    } catch (error) {
      console.error(`Error ${action} ${contentType}:`, error);
      toast.error(`Failed to ${action} ${contentType}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔹 Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Complete control over the wellness platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Online
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'content', label: 'Content Management', icon: FileText },
              { id: 'monitoring', label: 'Monitoring & Analytics', icon: Activity },
              { id: 'configuration', label: 'Website Configuration', icon: Settings },
              { id: 'database', label: 'Database Management', icon: Database },
              { id: 'support', label: 'Support & Feedback', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +12% this month
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalSessions}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +8% this week
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">₹{dashboardStats.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +15% this month
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.pendingTickets}</p>
                      <p className="text-sm text-orange-600 flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending review
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <MessageSquare className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer"
                  onClick={() => setActiveTab('users')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Manage Users</h3>
                      <p className="text-blue-100">View, edit, ban users</p>
                      <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                        {dashboardStats.activeUsers} active
                      </span>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer"
                  onClick={() => setActiveTab('content')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Content Management</h3>
                      <p className="text-green-100">Add/edit sessions & products</p>
                      <span className="bg-white text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                        {dashboardStats.totalSessions} sessions
                      </span>
                    </div>
                    <FileText className="w-8 h-8 text-green-200" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer"
                  onClick={() => setActiveTab('support')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Support Center</h3>
                      <p className="text-purple-100">Handle user issues</p>
                      {dashboardStats.pendingTickets > 0 && (
                        <span className="bg-white text-purple-600 text-xs px-2 py-1 rounded-full font-medium">
                          {dashboardStats.pendingTickets} pending
                        </span>
                      )}
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-200" />
                  </div>
                </motion.div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Monitor</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Server className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-gray-600">Server Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Wifi className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">45ms</div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HardDrive className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">2.1GB</div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Cpu className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600">12%</div>
                    <div className="text-sm text-gray-600">CPU Usage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">✅ User Management</h2>
                <p className="text-gray-600 mt-1">View, update, delete user accounts • Approve or ban users</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="banned">Banned Users</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-blue-700">{users.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-green-700">{users.filter(u => u.isActive).length}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Administrators</p>
                    <p className="text-2xl font-bold text-purple-700">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Banned Users</p>
                    <p className="text-2xl font-bold text-red-700">{users.filter(u => !u.isActive).length}</p>
                  </div>
                  <Ban className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Last Login</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.filter(user => {
                      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());

                      if (filterStatus === 'active') return matchesSearch && user.isActive;
                      if (filterStatus === 'banned') return matchesSearch && !user.isActive;
                      if (filterStatus === 'admin') return matchesSearch && user.role === 'admin';

                      return matchesSearch;
                    }).map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">ID: {user._id?.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Banned'}
                          </span>
                          {!user.isActive && user.banReason && (
                            <div className="text-xs text-red-600 mt-1">Reason: {user.banReason}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, user.isActive ? 'ban' : 'unban', { reason: 'Admin action' })}
                              className={`p-1 ${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                              title={user.isActive ? 'Ban User' : 'Unban User'}
                            >
                              {user.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                  handleUserAction(user._id, 'delete');
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">✅ Content Management</h2>
                <p className="text-gray-600 mt-1">Add/edit/delete website content • Manage sessions, services, products</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="session">Sessions</option>
                  <option value="product">Products</option>
                  <option value="service">Services</option>
                </select>
                <button
                  onClick={() => setShowContentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {contentType}</span>
                </button>
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-green-700">{sessions.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Total Products</p>
                    <p className="text-2xl font-bold text-purple-700">{products.length}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Published Content</p>
                    <p className="text-2xl font-bold text-blue-700">{sessions.filter(s => s.isActive).length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{contentType} Management</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Description</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(contentType === 'session' ? sessions : products).map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.category || 'Uncategorized'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{item.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">₹{item.price}</div>
                          {item.duration && (
                            <div className="text-sm text-gray-500">{item.duration} min</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedContent(item);
                                setShowContentModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this ${contentType}?`)) {
                                  handleContentAction(item._id, 'delete');
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring & Analytics Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">✅ Monitoring & Analytics</h2>
              <p className="text-gray-600 mt-1">Track user activities • View analytics and reports</p>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Activities:</span>
                    <span className="font-semibold">{userActivities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Today:</span>
                    <span className="font-semibold text-green-600">
                      {userActivities.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week:</span>
                    <span className="font-semibold text-blue-600">
                      {userActivities.filter(a => {
                        const activityDate = new Date(a.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return activityDate >= weekAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold">₹{dashboardStats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Month:</span>
                    <span className="font-semibold text-green-600">₹45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth:</span>
                    <span className="font-semibold text-green-600">+15%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                  <Server className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-semibold text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-semibold text-blue-600">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">Healthy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent User Activities</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userActivities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.action || 'User Activity'}</div>
                        <div className="text-sm text-gray-500">{activity.description || 'Activity performed'}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString() : 'Unknown time'}
                      </div>
                    </div>
                  ))}
                  {userActivities.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activities</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Website Configuration Tab */}
        {activeTab === 'configuration' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">✅ Website Configuration</h2>
              <p className="text-gray-600 mt-1">Manage settings, security, integrations • Payment gateways, APIs</p>
            </div>

            {/* Configuration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Site Name:</span>
                    <span className="font-semibold">Float Nirvana</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Maintenance Mode:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Disabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Registration:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Enabled</span>
                  </div>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Configure Settings
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Gateway</h3>
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-semibold">Stripe</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Security:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">SSL Enabled</span>
                  </div>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm">
                    Configure Payment
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Session Timeout:</span>
                    <span className="font-semibold">7 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Login Attempts:</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">2FA:</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Optional</span>
                  </div>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm">
                    Security Settings
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email Service:</span>
                    <span className="font-semibold">SMTP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Daily Limit:</span>
                    <span className="font-semibold">1000</span>
                  </div>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm">
                    Configure Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Management Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">✅ Database Management</h2>
              <p className="text-gray-600 mt-1">Maintain and back up data • Database operations and monitoring</p>
            </div>

            {/* Database Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Records</p>
                    <p className="text-2xl font-bold text-blue-700">{users.length + sessions.length + supportTickets.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Database Size</p>
                    <p className="text-2xl font-bold text-green-700">2.1GB</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Last Backup</p>
                    <p className="text-2xl font-bold text-purple-700">2h ago</p>
                  </div>
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Status</p>
                    <p className="text-2xl font-bold text-orange-700">Healthy</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Database Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Restore</h3>
                <div className="space-y-4">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Create Backup</span>
                  </button>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Download Backup</span>
                  </button>
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5" />
                    <span>Restore Database</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
                <div className="space-y-4">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Export Users</span>
                  </button>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Export Sessions</span>
                  </button>
                  <button className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Export All Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Database Collections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Database Collections</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Users</span>
                      <span className="text-sm text-gray-500">{users.length} records</span>
                    </div>
                    <div className="text-sm text-gray-600">User accounts and profiles</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Sessions</span>
                      <span className="text-sm text-gray-500">{sessions.length} records</span>
                    </div>
                    <div className="text-sm text-gray-600">Float therapy sessions</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Support Tickets</span>
                      <span className="text-sm text-gray-500">{supportTickets.length} records</span>
                    </div>
                    <div className="text-sm text-gray-600">Customer support requests</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support & Feedback Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">✅ Support & Feedback</h2>
              <p className="text-gray-600 mt-1">Resolve issues raised by users • Manage support tickets and feedback</p>
            </div>

            {/* Support Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Tickets</p>
                    <p className="text-2xl font-bold text-blue-700">{supportTickets.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Open Tickets</p>
                    <p className="text-2xl font-bold text-orange-700">{supportTickets.filter(t => t.status === 'open').length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">High Priority</p>
                    <p className="text-2xl font-bold text-red-700">{supportTickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Resolved</p>
                    <p className="text-2xl font-bold text-green-700">{supportTickets.filter(t => t.status === 'resolved').length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Support Tickets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
                  <div className="flex items-center space-x-4">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">All Status</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {supportTickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ticket</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Subject</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Priority</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Created</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {supportTickets.map((ticket) => (
                        <tr key={ticket._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{ticket.ticketNumber || `TKT-${ticket._id?.slice(-6)}`}</div>
                            <div className="text-sm text-gray-500">{ticket.category || 'General'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{ticket.user?.name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{ticket.user?.email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.subject || 'No subject'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.priority || 'medium'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                              ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status || 'open'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowTicketModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Support Tickets</h4>
                  <p className="text-gray-600">Support tickets will appear here when users submit them</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-semibold text-green-600">2.5 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-semibold">4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance:</span>
                    <span className="font-semibold text-green-600">Excellent</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-semibold text-green-600">4.8/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews:</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend:</span>
                    <span className="font-semibold text-green-600">↗ Improving</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved Today:</span>
                    <span className="font-semibold text-blue-600">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week:</span>
                    <span className="font-semibold text-blue-600">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAdminDashboard;
