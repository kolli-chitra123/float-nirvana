const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('rate-limiter-flexible');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');
const { User, Session, Product, Booking, Order, Notification, Membership, Activity, SupportTicket } = require('./models');
const { generateScheduleMap, getDefaultTimeSlots, extendSchedule, cleanPastDates } = require('./utils/scheduleGenerator');
const { activityTracker, logUserAction, logCriticalAction } = require('./middleware/activityTracker');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-float-nirvana-2024';

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

// Activity tracking middleware (after authentication)
app.use(activityTracker({
  excludePaths: ['/health', '/favicon.ico', '/api/analytics'],
  trackOnlyAuthenticated: true
}));

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10,
  duration: 60,
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Broadcast update function
const broadcastUpdate = (event, data) => {
  io.emit(event, data);
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate role
    const validRoles = ['user', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: userRole
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log registration activity
    await logUserAction(user._id, 'User registered', `New ${user.role} account created`, {
      email: user.email,
      role: user.role
    }, 'auth');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to Float Nirvana!',
      message: 'Thank you for joining us. Explore our sessions and start your wellness journey.',
      type: 'welcome'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log login activity
    await logUserAction(user._id, 'User logged in', `Successful login as ${user.role}`, {
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    }, 'auth');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Session Routes
app.get('/api/sessions', async (req, res) => {
  try {
    console.log('📡 GET /api/sessions - Fetching sessions...');
    const sessions = await Session.find({ isActive: true }).sort({ createdAt: -1 });
    console.log(`✅ Found ${sessions.length} sessions`);
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // If no schedule provided, generate default schedule
    if (!req.body.schedule) {
      const defaultTimeSlots = getDefaultTimeSlots(req.body.type || 'float');
      req.body.schedule = generateScheduleMap(defaultTimeSlots);
    }

    const session = new Session(req.body);
    await session.save();

    res.status(201).json(session);
    broadcastUpdate('sessionCreated', session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh schedules for all sessions
app.post('/api/sessions/refresh-schedules', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const sessions = await Session.find({ isActive: true });
    let updatedCount = 0;

    for (const session of sessions) {
      const defaultTimeSlots = getDefaultTimeSlots(session.type);
      const cleanedSchedule = cleanPastDates(session.schedule);
      const extendedSchedule = extendSchedule(cleanedSchedule, defaultTimeSlots);

      session.schedule = extendedSchedule;
      await session.save();
      updatedCount++;
    }

    res.json({
      message: `Successfully refreshed schedules for ${updatedCount} sessions`,
      updatedCount
    });

    broadcastUpdate('schedulesRefreshed', { updatedCount });
  } catch (error) {
    console.error('Error refreshing schedules:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Booking Routes
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('session', 'title duration price')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { sessionId, date, time, participants } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const booking = new Booking({
      user: req.user.id,
      session: sessionId,
      date,
      time,
      participants: participants || 1,
      totalAmount: session.price * (participants || 1),
      status: 'pending'
    });

    await booking.save();
    await booking.populate('session', 'title duration price');
    
    res.status(201).json(booking);
    
    // Create notification
    await Notification.create({
      user: req.user.id,
      title: 'Booking Confirmed',
      message: `Your booking for ${session.title} on ${date} at ${time} has been confirmed.`,
      type: 'booking',
      data: { bookingId: booking._id }
    });
    
    broadcastUpdate('bookingCreated', booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Order Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    console.log('Order request:', { items, shippingAddress, userId: req.user.id });

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ error: 'Valid shipping address is required' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Validate item structure
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item data: productId and positive quantity required' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }

      if (!product.isActive) {
        return res.status(400).json({ error: `Product ${product.name} is no longer available` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 5000 ? 0 : 500; // Free shipping over ₹50
    const total = subtotal + tax + shipping;

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      status: 'pending'
    });

    await order.save();
    await order.populate('items.product', 'name price');

    res.status(201).json(order);

    // Create notification
    await Notification.create({
      user: req.user.id,
      title: 'Order Placed',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      type: 'order',
      data: { orderId: order._id }
    });

    broadcastUpdate('orderCreated', order);
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Notification Routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
      isActive: true
    }).sort({ createdAt: -1 }).limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Analytics Routes (Admin only)
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [totalUsers, totalSessions, totalBookings, totalOrders] = await Promise.all([
      User.countDocuments(),
      Session.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Order.countDocuments()
    ]);

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalUsers,
      totalSessions,
      totalBookings,
      totalOrders,
      revenue: revenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Activity Monitoring Routes
app.get('/api/admin/activities', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      limit = 50,
      skip = 0,
      category,
      type,
      startDate,
      endDate,
      userId
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (type) query.type = type;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Transform activities for frontend
    const transformedActivities = activities.map(activity => ({
      action: activity.action,
      user: activity.user ? activity.user.email : 'Unknown',
      userName: activity.user ? activity.user.name : 'Unknown',
      timestamp: activity.createdAt,
      type: activity.type,
      ip: activity.ipAddress || 'N/A',
      details: activity.details,
      category: activity.category,
      severity: activity.severity,
      endpoint: activity.endpoint,
      method: activity.method,
      statusCode: activity.statusCode,
      responseTime: activity.responseTime,
      deviceInfo: activity.deviceInfo
    }));

    res.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity statistics
app.get('/api/admin/activities/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeframe = '24h' } = req.query;
    const stats = await Activity.getActivityStats(timeframe);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Booking Approval Routes
app.put('/api/bookings/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { approved } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = approved ? 'confirmed' : 'cancelled';
    await booking.save();

    // Create notification for user
    await Notification.create({
      user: booking.user,
      title: approved ? 'Booking Approved' : 'Booking Rejected',
      message: approved
        ? `Your booking for ${booking.date} at ${booking.time} has been approved.`
        : `Your booking for ${booking.date} at ${booking.time} has been rejected.`,
      type: 'booking',
      data: { bookingId: booking._id }
    });

    res.json(booking);
    broadcastUpdate('bookingUpdated', booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Session Delete Route
app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const sessionId = req.params.id;

    // Check if there are any active bookings for this session
    const activeBookings = await Booking.countDocuments({
      session: sessionId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: `Cannot delete session. There are ${activeBookings} active bookings.`
      });
    }

    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
    broadcastUpdate('sessionDeleted', { sessionId });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users Routes (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (Admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await logUserAction(req.user.id, 'User updated', `Admin updated user ${user.email}`, {
      updatedUser: user.email,
      updatedFields: Object.keys(updateData)
    }, 'admin');

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      user: id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: `Cannot delete user. They have ${activeBookings} active bookings.`
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log critical admin action
    await logCriticalAction(req.user.id, 'User deleted', `Admin deleted user ${user.email}`, {
      deletedUser: user.email,
      deletedUserId: id
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban/Unban user (Admin only)
app.put('/api/users/:id/ban', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { banned, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: !banned, banReason: banned ? reason : null },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log critical admin action
    await logCriticalAction(req.user.id, banned ? 'User banned' : 'User unbanned',
      `Admin ${banned ? 'banned' : 'unbanned'} user ${user.email}${reason ? ` - Reason: ${reason}` : ''}`, {
      targetUser: user.email,
      action: banned ? 'ban' : 'unban',
      reason: reason || null
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user ban status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Recommendations Route
app.get('/api/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    // Simple recommendation logic - can be enhanced
    const sessions = await Session.find({ isActive: true }).limit(3);
    const products = await Product.find({ isActive: true }).limit(3);

    res.json({
      sessions,
      products
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Membership Routes
app.get('/api/memberships', async (req, res) => {
  try {
    const memberships = await Membership.find({ isActive: true }).sort({ priority: 1, price: 1 });
    res.json(memberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/memberships', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const membership = new Membership(req.body);
    await membership.save();

    res.status(201).json(membership);
    broadcastUpdate('membershipCreated', membership);
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Membership Subscription
app.post('/api/users/:userId/membership', authenticateToken, async (req, res) => {
  try {
    const { membershipId } = req.body;
    const userId = req.params.userId;

    // Verify user can only update their own membership or admin can update any
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + membership.duration);

    // Update user membership
    user.membership = {
      plan: membershipId,
      startDate: new Date(),
      expiryDate: expiryDate,
      isActive: true
    };

    await user.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: 'Membership Activated',
      message: `Your ${membership.name} membership has been activated successfully!`,
      type: 'system'
    });

    res.json({ message: 'Membership activated successfully', user });
    broadcastUpdate('membershipActivated', { userId, membership });
  } catch (error) {
    console.error('Error activating membership:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Website Configuration Routes (Admin only)
app.get('/api/admin/config', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return current configuration (this would typically come from a Config model)
    const config = {
      siteName: process.env.SITE_NAME || 'Wellness Center',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      paymentGateway: {
        enabled: process.env.PAYMENT_ENABLED === 'true',
        provider: process.env.PAYMENT_PROVIDER || 'stripe'
      },
      emailSettings: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        provider: process.env.EMAIL_PROVIDER || 'smtp'
      },
      security: {
        sessionTimeout: process.env.SESSION_TIMEOUT || '7d',
        maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS || 5
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Database Management Routes (Admin only)
app.get('/api/admin/database/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await Promise.all([
      User.countDocuments(),
      Session.countDocuments(),
      Booking.countDocuments(),
      Order.countDocuments(),
      Activity.countDocuments(),
      Product.countDocuments()
    ]);

    const dbStats = {
      collections: {
        users: stats[0],
        sessions: stats[1],
        bookings: stats[2],
        orders: stats[3],
        activities: stats[4],
        products: stats[5]
      },
      totalDocuments: stats.reduce((sum, count) => sum + count, 0),
      lastBackup: process.env.LAST_BACKUP || null
    };

    res.json(dbStats);
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export data (Admin only)
app.get('/api/admin/export/:collection', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { collection } = req.params;
    const { format = 'json' } = req.query;

    let data;
    switch (collection) {
      case 'users':
        data = await User.find().select('-password');
        break;
      case 'sessions':
        data = await Session.find();
        break;
      case 'bookings':
        data = await Booking.find().populate('user', 'name email').populate('session', 'title');
        break;
      case 'orders':
        data = await Order.find().populate('user', 'name email');
        break;
      case 'activities':
        data = await Activity.find().populate('user', 'name email');
        break;
      default:
        return res.status(400).json({ error: 'Invalid collection' });
    }

    // Log export action
    await logUserAction(req.user.id, 'Data exported', `Admin exported ${collection} data`, {
      collection,
      format,
      recordCount: data.length
    }, 'admin');

    if (format === 'csv') {
      // Convert to CSV (simplified)
      const csv = data.map(item => Object.values(item.toObject ? item.toObject() : item).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${collection}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${collection}.json`);
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Support & Feedback Routes (Admin only)
app.get('/api/admin/support/tickets', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, priority, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create support ticket
app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = new SupportTicket({
      user: req.user.id,
      subject,
      description,
      category,
      priority,
      messages: [{
        sender: req.user.id,
        message: description,
        isAdminReply: false
      }]
    });

    await ticket.save();
    await ticket.populate('user', 'name email');

    // Log ticket creation
    await logUserAction(req.user.id, 'Support ticket created', `Created ticket: ${subject}`, {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      category,
      priority
    }, 'support');

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update support ticket (Admin only)
app.put('/api/admin/support/tickets/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, priority, assignedTo, resolution } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user.id;
      updateData.status = 'resolved';
    }

    const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Log admin action
    await logUserAction(req.user.id, 'Support ticket updated', `Updated ticket ${ticket.ticketNumber}`, {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      updates: updateData
    }, 'admin');

    res.json(ticket);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add message to support ticket
app.post('/api/support/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    ticket.messages.push({
      sender: req.user.id,
      message,
      isAdminReply: req.user.role === 'admin'
    });

    await ticket.save();
    await ticket.populate('user', 'name email');
    await ticket.populate('messages.sender', 'name email');

    res.json(ticket);
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// System Health Check (Admin only)
app.get('/api/admin/system/health', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      timestamp: new Date()
    };

    res.json(health);
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server and connect to database
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`🔗 Backend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
