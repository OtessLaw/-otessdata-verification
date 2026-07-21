import React, { useState } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckCircle, Clock, Upload, Layers, FileText, LogOut, Menu, X, ShieldCheck, MessageSquare } from 'lucide-react';

const AdminLayout = () => {
  const { admin, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-medium">
        Loading admin dashboard...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { to: '/admin/verified', icon: <CheckCircle size={20} />, label: 'Verified Numbers' },
    { to: '/admin/pending', icon: <Clock size={20} />, label: 'Pending Requests' },
    { to: '/admin/sms-config', icon: <MessageSquare size={20} />, label: 'SMS Gateway (Arkesel)' },
    { to: '/admin/upload', icon: <Upload size={20} />, label: 'Bulk Upload' },
    { to: '/admin/batches', icon: <Layers size={20} />, label: 'Upload Batches' },
    { to: '/admin/logs', icon: <FileText size={20} />, label: 'Activity Logs' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      isActive
        ? 'bg-blue-50 text-[#2563eb] dark:bg-blue-900/30 dark:text-blue-400 font-medium'
        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 font-outfit font-bold text-xl text-slate-900 dark:text-white">
          <ShieldCheck className="text-[#2563eb]" size={24} />
          <span>OTESS Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-800 z-10 transition-transform duration-200 ease-in-out flex flex-col`}
      >
        <div className="hidden md:flex items-center gap-2 font-outfit font-bold text-xl text-slate-900 dark:text-white p-6 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="text-[#2563eb]" size={28} />
          <span>OTESS Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 md:mt-0">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="mb-3 px-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{admin.name || 'System Admin'}</p>
            <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 text-sm font-semibold"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
