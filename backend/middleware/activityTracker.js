const { Activity } = require('../models');

const activityTracker = (options = {}) => {
  const {
    excludePaths = [],
    trackOnlyAuthenticated = false
  } = options;

  return async (req, res, next) => {
    // Skip tracking for excluded paths
    if (excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Skip if tracking only authenticated users and user is not authenticated
    if (trackOnlyAuthenticated && !req.user) {
      return next();
    }

    const startTime = Date.now();

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = Date.now() - startTime;
      
      // Log activity asynchronously
      setImmediate(async () => {
        try {
          await logActivity({
            user: req.user?._id,
            action: getActionFromPath(req.path, req.method),
            resource: getResourceFromPath(req.path),
            resourceId: req.params.id,
            method: req.method,
            endpoint: req.path,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime,
            success: res.statusCode < 400,
            category: getCategoryFromPath(req.path),
            severity: getSeverityFromStatus(res.statusCode)
          });
        } catch (error) {
          console.error('Error logging activity:', error);
        }
      });

      originalEnd.apply(this, args);
    };

    next();
  };
};

const logActivity = async (activityData) => {
  try {
    const activity = new Activity(activityData);
    await activity.save();
  } catch (error) {
    console.error('Failed to save activity:', error);
  }
};

const logUserAction = async (userId, action, resource, metadata = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      action,
      resource,
      method: 'SYSTEM',
      endpoint: '/system/action',
      metadata,
      category: 'user',
      severity: 'medium'
    });
    await activity.save();
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
};

const logCriticalAction = async (userId, action, resource, metadata = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      action,
      resource,
      method: 'SYSTEM',
      endpoint: '/system/critical',
      metadata,
      category: 'admin',
      severity: 'critical'
    });
    await activity.save();
  } catch (error) {
    console.error('Failed to log critical action:', error);
  }
};

const getActionFromPath = (path, method) => {
  if (path.includes('/login')) return 'login';
  if (path.includes('/register')) return 'register';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/booking')) return 'booking';
  if (path.includes('/payment')) return 'payment';
  if (path.includes('/admin')) return 'admin_access';
  
  switch (method) {
    case 'GET': return 'view';
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'DELETE': return 'delete';
    default: return 'unknown';
  }
};

const getResourceFromPath = (path) => {
  if (path.includes('/users')) return 'user';
  if (path.includes('/sessions')) return 'session';
  if (path.includes('/bookings')) return 'booking';
  if (path.includes('/products')) return 'product';
  if (path.includes('/orders')) return 'order';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/auth')) return 'auth';
  return 'system';
};

const getCategoryFromPath = (path) => {
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/booking')) return 'booking';
  if (path.includes('/payment')) return 'payment';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/users')) return 'user';
  return 'system';
};

const getSeverityFromStatus = (statusCode) => {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'high';
  if (statusCode >= 300) return 'medium';
  return 'low';
};

module.exports = {
  activityTracker,
  logUserAction,
  logCriticalAction
};
