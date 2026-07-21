import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, ShieldCheck, LogOut, Lock } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Verify Number', path: '/verify' },
    { name: 'Submit Request', path: '/submit' },
    { name: 'Track Submission', path: '/track' },
    { name: 'Support', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#2563eb]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-extrabold tracking-tight text-[#2563eb] dark:text-blue-400 text-lg sm:text-xl leading-none">OtessData</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">OTESS Phone Number Verification</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#2563eb] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Utilities */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {admin ? (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-[#2563eb]/20"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-[#2563eb] hover:text-[#2563eb] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#2563eb] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          {admin ? (
            <>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#2563eb] hover:bg-slate-100 dark:hover:bg-slate-800">
                Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#2563eb] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
