import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <ShieldCheck size={32} className="text-[#2563eb]" />
          </div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Admin Login</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Sign in to access the OTESS management dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
                placeholder="admin@otess.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 mt-4 font-medium shadow-md shadow-[#2563eb]/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
      </div>
    </div>
  );
}
