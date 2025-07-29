import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Membership {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  benefits: string[];
  discountPercentage: number;
  maxSessions: number | null;
  priority: 'basic' | 'premium' | 'vip';
  color: string;
  isPopular: boolean;
}

const MembershipPlans = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/memberships`);
      const data = await response.json();
      setMemberships(data);
    } catch (error) {
      toast.error('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (membershipId: string) => {
    if (!user || !token) {
      toast.error('Please login to subscribe');
      return;
    }

    setSubscribing(membershipId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${user.id}/membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ membershipId })
      });

      if (response.ok) {
        toast.success('Membership activated successfully!');
        // Refresh user data or redirect
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate membership');
      }
    } catch (error) {
      toast.error('Failed to activate membership');
    } finally {
      setSubscribing(null);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'vip':
        return <Crown className="w-6 h-6" />;
      case 'premium':
        return <Star className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip':
        return 'from-purple-500 to-pink-500';
      case 'premium':
        return 'from-blue-500 to-teal-500';
      default:
        return 'from-green-500 to-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Membership</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Unlock exclusive benefits and save on your wellness journey with our membership plans.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {memberships.map((membership, index) => (
          <motion.div
            key={membership._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden ${
              membership.isPopular ? 'border-teal-500 scale-105' : 'border-gray-200'
            }`}
          >
            {membership.isPopular && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-center py-2 text-sm font-semibold">
                Most Popular
              </div>
            )}

            <div className={`p-6 ${membership.isPopular ? 'pt-12' : ''}`}>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getPriorityColor(membership.priority)} text-white mb-4`}>
                  {getPriorityIcon(membership.priority)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{membership.name}</h3>
                <p className="text-gray-600 text-sm">{membership.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">₹{membership.price}</span>
                  <span className="text-gray-500 ml-1">/{membership.duration} months</span>
                </div>
                {membership.discountPercentage > 0 && (
                  <div className="text-green-600 text-sm font-semibold mt-1">
                    {membership.discountPercentage}% off sessions
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-8">
                {membership.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
                {membership.maxSessions && (
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Up to {membership.maxSessions} sessions</span>
                  </div>
                )}
                {!membership.maxSessions && (
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited sessions</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(membership._id)}
                disabled={subscribing === membership._id}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  membership.isPopular
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscribing === membership._id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activating...
                  </div>
                ) : (
                  'Choose Plan'
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MembershipPlans;
