import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, XCircle, Layers, Upload, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentBatches(res.data.recentBatches || []);
        setChartData(res.data.chartData || []);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400">Loading...</div>;
  }

  const statCards = [
    { title: 'Verified Numbers', value: stats?.verifiedCount || 0, icon: <CheckCircle className="text-green-500" size={24} />, bg: 'bg-green-50 dark:bg-green-500/10' },
    { title: 'Pending Queue', value: stats?.pendingCount || 0, icon: <Clock className="text-amber-500" size={24} />, bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { title: 'Rejected', value: stats?.rejectedCount || 0, icon: <XCircle className="text-red-500" size={24} />, bg: 'bg-red-50 dark:bg-red-500/10' },
    { title: 'Total Batches', value: stats?.totalBatches || 0, icon: <Layers className="text-blue-500" size={24} />, bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: "Today's Uploads", value: stats?.todayUploads || 0, icon: <Upload className="text-purple-500" size={24} />, bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome back. Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-slate-400" />
            <h2 className="font-outfit text-lg font-semibold">Verification Activity (7 Days)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="verified" stroke="#10b981" fillOpacity={1} fill="url(#colorVerified)" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPending)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Layers size={20} className="text-slate-400" />
            <h2 className="font-outfit text-lg font-semibold">Recent Batches</h2>
          </div>
          <div className="space-y-4">
            {recentBatches.length > 0 ? (
              recentBatches.map(batch => (
                <div key={batch._id || batch.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{batch.filename || 'Manual Entry'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{batch.totalCount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No recent batches.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
