import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/logs?page=${page}&limit=15`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionStyle = (action) => {
    const act = action.toLowerCase();
    if (act.includes('approve')) return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
    if (act.includes('reject') || act.includes('delete') || act.includes('rollback')) return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
    if (act.includes('upload') || act.includes('batch')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-slate-500 dark:text-slate-400">Audit trail of all administrative actions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Admin</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">No logs found.</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionStyle(item.action)}`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{item.description}</td>
                    <td className="px-6 py-4">{item.admin?.name || item.admin || 'System'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.ipAddress || '-'}</td>
                    <td className="px-6 py-4">{new Date(item.createdAt || item.date).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing page {page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
