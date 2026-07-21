import React, { useState } from 'react';
import { MessageSquare, Mail, Clock } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Support ticket submitted successfully!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 font-outfit text-slate-900 dark:text-white">
          <MessageSquare className="inline-block mr-2 text-[#2563eb]" size={36} />
          Contact & Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Get help with your OTESS Phone Number Verification portal.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 font-outfit text-slate-900 dark:text-white">Direct OTESS Channels</h2>
          
          <div className="space-y-6">
            <a 
              href="https://wa.me/233241234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4 group-hover:scale-105 transition-transform">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-500">WhatsApp Support</h3>
                <p className="text-sm text-green-600 dark:text-green-600/70">+233 24 123 4567</p>
              </div>
            </a>

            <a 
              href="mailto:support@otess.com" 
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-[#2563eb] rounded-full flex items-center justify-center text-white mr-4 group-hover:scale-105 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-800 dark:text-blue-500">Email Support</h3>
                <p className="text-sm text-blue-600 dark:text-blue-600/70">support@otess.com</p>
              </div>
            </a>

            <div className="flex items-start p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Clock className="text-slate-400 mr-4 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Operating Hours</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saturday: 9:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 font-outfit text-slate-900 dark:text-white">Submit a Support Ticket</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Issue Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
                placeholder="How can we help you today?"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 mt-2 font-medium shadow-md shadow-[#2563eb]/20 transition-colors"
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
