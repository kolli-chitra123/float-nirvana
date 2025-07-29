import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  notifications: any[];
  markNotificationRead: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
      setSocket(newSocket);

      // Join user room for targeted notifications
      newSocket.emit('join', user.id);

      // Listen for real-time notifications
      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        toast.success(notification.message);
      });

      // Listen for booking updates
      newSocket.on('bookingCreated', (booking) => {
        if (user.role === 'admin' || booking.userId === user.id) {
          toast.success('New booking created!');
        }
      });

      // Listen for session updates
      newSocket.on('sessionCreated', (session) => {
        if (user.role === 'user') {
          toast.success(`New session available: ${session.title}`);
        }
      });

      // Listen for product updates
      newSocket.on('productCreated', (product) => {
        if (user.role === 'user') {
          toast.success(`New product available: ${product.name}`);
        }
      });

      // Load existing notifications
      fetchNotifications();

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, markNotificationRead }}>
      {children}
    </SocketContext.Provider>
  );
};