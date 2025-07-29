# Float Nirvana - Wellness & Float Therapy Platform

A comprehensive wellness and float therapy booking platform with advanced admin dashboard built with React, Node.js, and MongoDB.

## 🌟 Features

### User Features
- 🏊‍♀️ Float session booking system
- 👤 User authentication & profiles
- 🛒 Product marketplace
- 📱 Responsive design
- 🔔 Real-time notifications
- 💳 Payment integration ready

### Admin Features
- 📊 Advanced analytics dashboard
- 👥 Comprehensive user management
- 🎛️ Content management system
- ⚙️ Website configuration panel
- 🗄️ Database management interface
- 🎫 Support ticket system
- 📈 User activity monitoring
- 🔒 Security & permissions management

## 🏗️ Project Structure

```
float-nirvana/
├── 📁 frontend/                 # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable UI components
│   │   ├── 📁 pages/          # Page components (User & Admin)
│   │   ├── 📁 context/        # React context providers
│   │   └── 📄 ...
│   ├── 📁 public/             # Static assets
│   ├── 📄 .env                # Frontend environment variables
│   └── 📄 package.json
├── 📁 backend/                 # Node.js backend API
│   ├── 📁 models/             # Database models
│   ├── 📁 middleware/         # Express middleware
│   ├── 📁 config/             # Configuration files
│   ├── 📁 utils/              # Utility functions
│   ├── 📁 scripts/            # Database scripts
│   ├── 📄 .env                # Backend environment variables
│   └── 📄 package.json
├── 📁 scripts/                # Development & build scripts
│   ├── 📄 start-all.bat       # Start both servers
│   ├── 📄 start-frontend.bat  # Start frontend only
│   ├── 📄 start-backend.bat   # Start backend only
│   ├── 📄 install-all.bat     # Install all dependencies
│   └── 📄 build-production.bat # Build for production
├── 📄 README.md               # This file
└── 📄 package.json           # Root package.json
```

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)
1. **Install all dependencies**
   ```bash
   # Double-click or run:
   scripts/install-all.bat
   ```

2. **Start the application**
   ```bash
   # Double-click or run:
   scripts/start-all.bat
   ```

### Option 2: Using NPM Commands
1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```

### 3. **Access the application**
- 🌐 **Frontend**: http://localhost:5173
- 🔗 **Backend API**: http://localhost:3001
- 🔧 **Admin Dashboard**: http://localhost:5173/admin

## ⚙️ Environment Setup

### Backend Environment (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/floatnirvana
JWT_SECRET=your-super-secret-jwt-key-for-float-nirvana-2024
PORT=3001
NODE_ENV=development
```

### Frontend Environment (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **React Router** (routing)
- **Socket.io Client** (real-time)

### Backend
- **Node.js** + Express
- **MongoDB Atlas** (database)
- **Mongoose** (ODM)
- **Socket.io** (WebSocket)
- **JWT** (authentication)
- **bcryptjs** (password hashing)

### Database Collections
- **Users** - User accounts and profiles
- **Sessions** - Float therapy sessions
- **Bookings** - Session reservations
- **Orders** - Product purchases
- **Products** - Marketplace items
- **SupportTickets** - Customer support
- **Activities** - User activity logs
- **Notifications** - System notifications

## 📋 Available Scripts

### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run frontend:dev     # Start frontend only
npm run backend:dev      # Start backend only
npm run frontend:build   # Build frontend for production
npm run backend:start    # Start backend in production
npm run install:all      # Install all dependencies
```

### Batch Scripts (Windows)
```bash
scripts/start-all.bat        # Start both servers
scripts/start-frontend.bat   # Start frontend only
scripts/start-backend.bat    # Start backend only
scripts/install-all.bat      # Install all dependencies
scripts/build-production.bat # Build for production
```

## 🔐 Default Login Credentials

**Admin User:**
- Email: admin@floatnirvana.com
- Password: admin123

**Regular User:**
- Email: user@example.com
- Password: user123

## 🔐 Admin Dashboard Features

### User Management
- View all users with advanced filtering
- Edit user details and roles
- Ban/unban users with reasons
- User activity monitoring
- Security permissions

### Content Management
- Website configuration settings
- Database management tools
- Data export functionality
- System health monitoring

### Analytics & Monitoring
- Revenue tracking and trends
- User growth analytics
- System performance metrics
- Real-time activity feeds

### Support System
- Support ticket management
- Priority and status tracking
- Message threading
- Resolution tracking

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session (admin)
- `PUT /api/sessions/:id` - Update session (admin)
- `DELETE /api/sessions/:id` - Delete session (admin)

### User Management (Admin)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/ban` - Ban/unban user

### Support System
- `GET /api/admin/support/tickets` - Get support tickets (admin)
- `POST /api/support/tickets` - Create support ticket
- `PUT /api/admin/support/tickets/:id` - Update ticket (admin)

### Analytics (Admin)
- `GET /api/analytics` - Get analytics data
- `GET /api/admin/activities` - Get user activities
- `GET /api/admin/config` - Get website configuration

## 🔧 Development

### Adding New Features
1. Create feature branch
2. Implement frontend components in `frontend/src/`
3. Add backend routes in `backend/`
4. Update database models if needed
5. Test thoroughly
6. Submit pull request

### Database Seeding
```bash
cd backend
npm run seed
```

## 🚀 Production Deployment

1. **Build frontend**
   ```bash
   scripts/build-production.bat
   ```

2. **Deploy files**
   - Upload `frontend/dist/` to web server
   - Deploy `backend/` to Node.js server
   - Update environment variables

3. **Environment Variables**
   - Set `NODE_ENV=production`
   - Update `MONGODB_URI` for production database
   - Set secure `JWT_SECRET`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ by the Float Nirvana Team**
