import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Verify from './pages/Verify';
import SubmitNumber from './pages/SubmitNumber';
import Track from './pages/Track';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminVerified from './pages/AdminVerified';
import AdminPending from './pages/AdminPending';
import AdminSMSConfig from './pages/AdminSMSConfig';
import AdminUpload from './pages/AdminUpload';
import AdminBatches from './pages/AdminBatches';
import AdminLogs from './pages/AdminLogs';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#0f172a] dark:via-[#1e1b4b]/40 dark:to-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Background Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-300/15 dark:bg-sky-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      <Navbar />
      <main className="flex-grow w-full relative z-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-md py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
          <p className="font-medium">© {new Date().getFullYear()} OTESS Phone Number Verification System. All rights reserved.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Built for verifying data bundle order lists before purchasing.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: '#1e293b',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#2563EB',
              secondary: '#fff',
            },
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="verify" element={<Verify />} />
          <Route path="submit" element={<SubmitNumber />} />
          <Route path="track" element={<Track />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verified" element={<AdminVerified />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="sms-config" element={<AdminSMSConfig />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Routes>
    </>
  );
}
