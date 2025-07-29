const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database configuration
let useMongoDb = false;
let inMemoryUsers = [];

// MongoDB Connection (with detailed error handling)
console.log('🔍 Attempting MongoDB Atlas connection...');
console.log('📍 Database: floatnirvana');
console.log('🔗 Host: cluster0.ltgyp3g.mongodb.net');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds timeout
  authSource: 'admin' // Specify auth source
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully!');
  console.log('📍 Database: floatnirvana');
  console.log('🏠 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  console.log('📊 Connection State:', mongoose.connection.readyState);
  useMongoDb = true;
  initializeDefaultUsers();
})
.catch((error) => {
  console.error('❌ MongoDB Atlas connection failed:');
  console.error('   Error Code:', error.code);
  console.error('   Error Message:', error.message);

  if (error.message.includes('authentication failed')) {
    console.log('\n🔧 AUTHENTICATION ISSUE DETECTED:');
    console.log('1. ❌ Username or password is incorrect');
    console.log('2. ❌ Database user "chitrabhanu" may not exist');
    console.log('3. ❌ User may not have permissions for "floatnirvana" database');
    console.log('\n📋 TO FIX:');
    console.log('1. Go to MongoDB Atlas → Database Access');
    console.log('2. Check if user "chitrabhanu" exists');
    console.log('3. Verify password is "Chitra1234"');
    console.log('4. Ensure user has "readWrite" role for "floatnirvana" database');
    console.log('5. Check Network Access → IP Whitelist (add 0.0.0.0/0 for all IPs)');
  }

  console.log('\n🔄 Using in-memory database as fallback...');
  console.log('⚠️  Data will NOT persist between server restarts!');
  useMongoDb = false;
  initializeInMemoryUsers();
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  membership: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Admin Schema (separate collection for admin users)
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  permissions: {
    userManagement: { type: Boolean, default: true },
    contentManagement: { type: Boolean, default: true },
    systemSettings: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
    support: { type: Boolean, default: true }
  },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// Session Schema (for booking sessions)
const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  price: { type: Number, required: true },
  category: { type: String, enum: ['relaxation', 'therapy', 'meditation', 'wellness'], required: true },
  isActive: { type: Boolean, default: true },
  maxCapacity: { type: Number, default: 1 }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// Product Schema (for shop wellness)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['wellness', 'accessories', 'supplements', 'gift-cards'], required: true },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Order Schema (for shop purchases)
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  category: { type: String, enum: ['technical', 'billing', 'booking', 'general'], required: true },
  adminResponse: { type: String, default: '' },
  resolvedAt: { type: Date }
}, { timestamps: true });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// Initialize default users if they don't exist
const initializeDefaultUsers = async () => {
  try {
    // Create default admin in Admin collection
    const adminExists = await Admin.findOne({ email: 'admin@floatnirvana.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        name: 'Admin User',
        email: 'admin@floatnirvana.com',
        phone: '+1234567890',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Default admin user created in Admin collection');
    }

    // Create default user in User collection
    const userExists = await User.findOne({ email: 'user@example.com' });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      await User.create({
        name: 'Test User',
        email: 'user@example.com',
        phone: '+1234567891',
        password: hashedPassword,
        role: 'user'
      });
      console.log('✅ Default test user created in User collection');
    }

    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    console.log(`📊 Total users in MongoDB: ${totalUsers}`);
    console.log(`👑 Total admins in MongoDB: ${totalAdmins}`);
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Initialize in-memory users (fallback)
const initializeInMemoryUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedPassword2 = await bcrypt.hash('user123', 10);

    inMemoryUsers = [
      {
        _id: '1',
        name: 'Admin User',
        email: 'admin@floatnirvana.com',
        phone: '+1234567890',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        membership: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        name: 'Test User',
        email: 'user@example.com',
        phone: '+1234567891',
        password: hashedPassword2,
        role: 'user',
        isActive: true,
        membership: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    console.log('✅ Default users created in memory');
    console.log(`📊 Total users in memory: ${inMemoryUsers.length}`);
  } catch (error) {
    console.error('Error initializing in-memory users:', error);
  }
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-float-nirvana-2024',
    { expiresIn: '24h' }
  );
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Checkpoint 6 Backend Server Running!', 
    timestamp: new Date().toISOString(),
    port: PORT,
    cors: 'enabled',
    database: 'MongoDB (floatnirvana)'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    let totalUsers;
    let databaseStatus;

    if (useMongoDb) {
      totalUsers = await User.countDocuments();
      databaseStatus = 'MongoDB Connected';
    } else {
      totalUsers = inMemoryUsers.length;
      databaseStatus = 'In-Memory (Fallback)';
    }

    res.json({
      status: 'OK',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      endpoints: ['/api/auth/login', '/api/auth/register', '/api/users'],
      totalUsers: totalUsers,
      database: databaseStatus
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      endpoints: ['/api/auth/login', '/api/auth/register', '/api/users'],
      totalUsers: 'Error counting users',
      database: 'Database Error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for: ${email}`);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in database (check both Admin and User collections)
    let user;
    let userType = 'user';

    if (useMongoDb) {
      // First check Admin collection
      user = await Admin.findOne({ email: email.toLowerCase() });
      if (user) {
        userType = 'admin';
        console.log(`🔍 Found admin user: ${email}`);
      } else {
        // Then check User collection
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          userType = 'user';
          console.log(`🔍 Found regular user: ${email}`);
        }
      }
    } else {
      user = inMemoryUsers.find(u => u.email === email.toLowerCase());
    }

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data (without password)
    const userWithoutPassword = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      membership: user.membership,
      createdAt: user.createdAt
    };

    console.log(`✅ Login successful for: ${email} (${user.role}) from ${userType === 'admin' ? 'Admin' : 'User'} collection`);

    res.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body;

    console.log(`📝 Registration attempt for: ${email}`);
    console.log(`📋 Registration data:`, { name, email, phone, role });
    console.log(`🔍 Role received:`, role, `(type: ${typeof role})`);

    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    let existingUser;
    if (useMongoDb) {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } else {
      existingUser = inMemoryUsers.find(u => u.email === email.toLowerCase());
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    let newUser;
    if (useMongoDb) {
      const userRole = role === 'admin' ? 'admin' : 'user';
      console.log(`🎯 Creating user with role: ${userRole}`);

      if (userRole === 'admin') {
        // Store admin users in Admin collection
        newUser = await Admin.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password: hashedPassword,
          role: 'admin'
        });
        console.log(`✅ Admin created in Admin collection: ${newUser.role}`);
      } else {
        // Store regular users in User collection
        newUser = await User.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password: hashedPassword,
          role: 'user'
        });
        console.log(`✅ User created in User collection: ${newUser.role}`);
      }
    } else {
      newUser = {
        _id: (inMemoryUsers.length + 1).toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        isActive: true,
        membership: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryUsers.push(newUser);
    }

    // Generate token
    const token = generateToken(newUser);

    // Return user data (without password)
    const userWithoutPassword = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      isActive: newUser.isActive,
      membership: newUser.membership,
      createdAt: newUser.createdAt
    };

    let totalUsers;
    if (useMongoDb) {
      totalUsers = await User.countDocuments();
    } else {
      totalUsers = inMemoryUsers.length;
    }

    console.log(`✅ Registration successful for: ${email} (${newUser.role})`);
    console.log(`📊 Total users in database: ${totalUsers}`);

    res.status(201).json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all users (for admin dashboard)
app.get('/api/users', async (req, res) => {
  try {
    let users;
    if (useMongoDb) {
      users = await User.find({}, '-password').sort({ createdAt: -1 });
    } else {
      users = inMemoryUsers.map(({ password, ...user }) => user);
    }

    const usersWithId = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      membership: user.membership,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.json(usersWithId);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all admins (for super admin dashboard)
app.get('/api/admins', async (req, res) => {
  try {
    let admins;
    if (useMongoDb) {
      admins = await Admin.find({}, '-password').sort({ createdAt: -1 });
    } else {
      admins = inMemoryUsers.filter(user => user.role === 'admin').map(({ password, ...admin }) => admin);
    }

    const adminsWithId = admins.map(admin => ({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
      loginCount: admin.loginCount,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }));
    res.json(adminsWithId);
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userWithoutPassword = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      membership: user.membership,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SESSION MANAGEMENT ENDPOINTS =====

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    if (useMongoDb) {
      const sessions = await Session.find({ isActive: true }).sort({ createdAt: -1 });
      res.json(sessions);
    } else {
      // Fallback mock data
      res.json([
        { _id: '1', title: 'Relaxation Float', duration: 60, price: 80, category: 'relaxation', isActive: true },
        { _id: '2', title: 'Therapy Session', duration: 90, price: 120, category: 'therapy', isActive: true },
        { _id: '3', title: 'Meditation Float', duration: 45, price: 70, category: 'meditation', isActive: true }
      ]);
    }
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new session (Admin only)
app.post('/api/sessions', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { title, description, duration, price, category } = req.body;

    const newSession = await Session.create({
      title,
      description,
      duration,
      price,
      category
    });

    console.log(`✅ New session created: ${title}`);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('❌ Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== BOOKING MANAGEMENT ENDPOINTS =====

// Get user bookings
app.get('/api/bookings', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.json([]);
    }

    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('session', 'title duration price')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { userId, sessionId, date, time, totalAmount } = req.body;

    const newBooking = await Booking.create({
      user: userId,
      session: sessionId,
      date,
      time,
      totalAmount
    });

    console.log(`✅ New booking created for user: ${userId}`);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PRODUCT MANAGEMENT ENDPOINTS =====

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (useMongoDb) {
      const products = await Product.find({ inStock: true }).sort({ createdAt: -1 });
      res.json(products);
    } else {
      // Fallback mock data
      res.json([
        { _id: '1', name: 'Wellness Package', price: 150, category: 'wellness', inStock: true },
        { _id: '2', name: 'Float Accessories', price: 25, category: 'accessories', inStock: true }
      ]);
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product (Admin only)
app.post('/api/products', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { name, description, price, category, stockQuantity } = req.body;

    const newProduct = await Product.create({
      name,
      description,
      price,
      category,
      stockQuantity
    });

    console.log(`✅ New product created: ${name}`);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ORDER MANAGEMENT ENDPOINTS =====

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { userId, items, totalAmount } = req.body;

    const newOrder = await Order.create({
      user: userId,
      items: items,
      totalAmount: totalAmount
    });

    console.log(`✅ New order created for user: ${userId} - Total: ₹${totalAmount}`);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user orders
app.get('/api/orders', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.json([]);
    }

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SUPPORT TICKET ENDPOINTS =====

// Get all support tickets
app.get('/api/admin/support/tickets', async (req, res) => {
  try {
    if (useMongoDb) {
      const tickets = await SupportTicket.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      res.json(tickets);
    } else {
      // Fallback mock data
      res.json([
        { _id: '1', subject: 'Login Issue', status: 'open', priority: 'medium', user: 'user@example.com' },
        { _id: '2', subject: 'Booking Problem', status: 'resolved', priority: 'high', user: 'test@example.com' }
      ]);
    }
  } catch (error) {
    console.error('❌ Error fetching support tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new support ticket
app.post('/api/support/tickets', async (req, res) => {
  try {
    if (!useMongoDb) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { userId, subject, message, category } = req.body;

    const newTicket = await SupportTicket.create({
      user: userId,
      subject,
      message,
      category
    });

    console.log(`✅ New support ticket created: ${subject}`);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('❌ Error creating support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ADMIN ACTIVITY ENDPOINTS =====

app.get('/api/admin/activities', async (req, res) => {
  try {
    // For now, return recent user activities
    if (useMongoDb) {
      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
      const activities = recentUsers.map(user => ({
        _id: user._id,
        action: 'registration',
        user: user.email,
        timestamp: user.createdAt
      }));
      res.json(activities);
    } else {
      res.json([
        { _id: '1', action: 'login', user: 'admin@floatnirvana.com', timestamp: new Date().toISOString() },
        { _id: '2', action: 'register', user: 'user@example.com', timestamp: new Date().toISOString() }
      ]);
    }
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Checkpoint 6 Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 CORS: Enabled for all origins`);
  console.log(`💾 Database: ${useMongoDb ? 'MongoDB (floatnirvana)' : 'In-Memory (fallback)'}`);
  console.log(`🔑 Test Credentials:`);
  console.log(`   Admin: admin@floatnirvana.com / admin123`);
  console.log(`   User: user@example.com / user123`);
  console.log(`✅ Ready for Checkpoint 6 testing!`);
});
