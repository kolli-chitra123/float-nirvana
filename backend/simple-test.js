const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

// Test routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is working!', timestamp: new Date().toISOString() });
});

// Mock auth routes for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock admin user
  if (email === 'admin@floatnirvana.com' && password === 'admin123') {
    res.json({
      token: 'mock-admin-token',
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@floatnirvana.com',
        role: 'admin',
        phone: '+1234567890',
        membership: null
      }
    });
  }
  // Mock regular user
  else if (email === 'user@example.com' && password === 'user123') {
    res.json({
      token: 'mock-user-token',
      user: {
        id: '2',
        name: 'Test User',
        email: 'user@example.com',
        role: 'user',
        phone: '+1234567890',
        membership: null
      }
    });
  }
  else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  res.json({
    token: 'mock-token',
    user: {
      id: '3',
      name,
      email,
      role: role || 'user',
      phone,
      membership: null
    }
  });
});

// Mock admin routes
app.get('/api/users', (req, res) => {
  res.json([
    { _id: '1', name: 'Admin User', email: 'admin@floatnirvana.com', role: 'admin', isActive: true },
    { _id: '2', name: 'Test User', email: 'user@example.com', role: 'user', isActive: true }
  ]);
});

app.get('/api/sessions', (req, res) => {
  res.json([
    { _id: '1', title: 'Relaxation Float', duration: 60, price: 80, category: 'relaxation', isActive: true },
    { _id: '2', title: 'Therapy Session', duration: 90, price: 120, category: 'therapy', isActive: true }
  ]);
});

app.get('/api/admin/activities', (req, res) => {
  res.json([]);
});

app.get('/api/admin/support/tickets', (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`🚀 Simple backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API health: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Admin login: admin@floatnirvana.com / admin123`);
  console.log(`👤 User login: user@example.com / user123`);
});
