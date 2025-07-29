import React from 'react';
import { Waves, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Waves className="w-8 h-8 text-teal-400" />
              <span className="text-xl font-bold">Float Nirvana</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Disconnect to reconnect. Experience profound relaxation and mental clarity through 
              our premium sensory deprivation therapy sessions.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-teal-400 cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-teal-400 cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-teal-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-teal-400 transition-colors">Home</a></li>
              <li><a href="/booking" className="text-gray-400 hover:text-teal-400 transition-colors">Book Session</a></li>
              <li><a href="/shop" className="text-gray-400 hover:text-teal-400 transition-colors">Shop</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-teal-400 transition-colors">Dashboard</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Float Therapy</li>
              <li className="text-gray-400">Guided Meditation</li>
              <li className="text-gray-400">Wellness Products</li>
              <li className="text-gray-400">Corporate Wellness</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="text-gray-400">123 Wellness Street, Bhimavaram, AP</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-teal-400" />
                <span className="text-gray-400">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-teal-400" />
                <span className="text-gray-400">info@floatnirvana.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Float Nirvana. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;