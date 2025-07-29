import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format, addDays, isSameDay } from 'date-fns';

const BookingPage = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const { token } = useAuth();

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      console.log('Fetching sessions from:', `${import.meta.env.VITE_API_BASE_URL}/api/sessions`);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sessions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sessions fetched successfully:', data);

      // Ensure each session has a schedule with available time slots
      const sessionsWithSchedule = data.map((session: any) => ({
        ...session,
        schedule: session.schedule || generateDefaultSchedule()
      }));

      setSessions(sessionsWithSchedule);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Use mock sessions with schedules if backend is unavailable
      const mockSessions = [
        {
          _id: 'mock-1',
          title: 'Deep Relaxation Float',
          description: 'Experience profound relaxation in our premium sensory deprivation tanks',
          duration: 60,
          price: 2500,
          capacity: 4,
          type: 'float',
          image: 'https://images.pexels.com/photos/3757950/pexels-photo-3757950.jpeg',
          schedule: generateDefaultSchedule(),
          amenities: ['Towels provided', 'Shower facilities', 'Relaxation area'],
          isActive: true
        },
        {
          _id: 'mock-2',
          title: 'Guided Meditation Float',
          description: 'Combine floating with guided meditation for enhanced mindfulness',
          duration: 75,
          price: 3000,
          capacity: 2,
          type: 'meditation',
          image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg',
          schedule: generateDefaultSchedule(),
          amenities: ['Audio guidance', 'Meditation cushions', 'Tea service'],
          isActive: true
        }
      ];
      setSessions(mockSessions);
      toast.error('Using demo sessions - backend unavailable');
    }
  };

  // Generate default schedule for next 30 days
  const generateDefaultSchedule = () => {
    const schedule: { [key: string]: string[] } = {};
    const timeSlots = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      schedule[dateKey] = [...timeSlots];
    }

    return schedule;
  };

  const handleBooking = async () => {
    if (!selectedSession || !selectedTime) {
      toast.error('Please select a session and time');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: selectedSession._id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          participants: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data);
        setShowConfirmation(true);
        toast.success('Booking confirmed!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Booking failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);

      // If backend is unavailable, create a mock booking for demo
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        const mockBooking = {
          _id: 'mock-booking-' + Date.now(),
          session: selectedSession,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          participants: 1,
          totalAmount: selectedSession.price,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        };

        setBookingDetails(mockBooking);
        setShowConfirmation(true);
        toast.success('Booking confirmed! (Demo mode)');
      } else {
        toast.error(error.message || 'Failed to create booking');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!selectedSession) return [];

    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // If no schedule, generate default time slots
    if (!selectedSession.schedule) {
      return ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
    }

    // Handle both Map and Object formats for schedule
    if (selectedSession.schedule instanceof Map) {
      return selectedSession.schedule.get(dateKey) || [];
    } else if (typeof selectedSession.schedule === 'object') {
      return selectedSession.schedule[dateKey] || [];
    }

    // Fallback to default time slots
    return ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-8">Your float session has been successfully booked.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session:</span>
                  <span className="font-medium">{selectedSession?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{selectedSession?.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Code:</span>
                  <span className="font-medium text-teal-600">{bookingDetails?.bookingCode}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-teal-600">₹{selectedSession?.price}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowConfirmation(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Book Another Session
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Book Your Float Session
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your preferred session and time slot for a transformative wellness experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Session Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Session</h2>
            
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => {
                    setSelectedSession(session);
                    setSelectedTime(''); // Reset selected time when changing session
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedSession?._id === session._id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={session.image}
                        alt={session.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      {selectedSession?._id === session._id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{session.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration} mins</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span>4.9</span>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-teal-600">₹{session.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Date and Time Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>
            
            {/* Date Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Date</h3>
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg text-center transition-all duration-200 ${
                      isSameDay(selectedDate, date)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 hover:bg-teal-100 text-gray-900'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-lg font-bold">
                      {format(date, 'd')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Times</h3>
              {selectedSession ? (
                getAvailableTimeSlots().length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {getAvailableTimeSlots().map((time, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                          selectedTime === time
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 hover:bg-teal-100 text-gray-900'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No available time slots for {format(selectedDate, 'MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-400">Please select a different date</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Please select a session first</p>
                  <p className="text-sm text-gray-400">Choose from the sessions on the left to see available times</p>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            {selectedSession && selectedTime && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-medium">{selectedSession.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{selectedSession.duration} minutes</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-teal-600">₹{selectedSession.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={handleBooking}
              disabled={!selectedSession || !selectedTime || isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;