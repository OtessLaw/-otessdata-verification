import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCcw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBatches = () => {
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
      const res = await axios.get(`/api/admin/batches?page=${page}&limit=10`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (batchId) => {
    if (!window.confirm(`Are you sure you want to rollback batch ${batchId}? This will remove all numbers added in this batch.`)) return;
    
    try {
      const res = await axios.post(`/api/admin/batches/${batchId}/rollback`);
      if (res.data.success) {
        toast.success('Batch rolled back successfully');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rollback batch');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Upload Batches</h1>
        <p className="text-slate-500 dark:text-slate-400">History of bulk uploads. You can rollback accidental uploads here.</p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Batch ID</th>
                <th className="px-6 py-4 font-medium">Filename</th>
                <th className="px-6 py-4 font-medium">Uploaded By</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-center">Added / Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center">No batches found.</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{item.batchId}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.filename}</td>
                    <td className="px-6 py-4">{item.uploadedBy?.name || item.uploadedBy || 'Admin'}</td>
                    <td className="px-6 py-4">{new Date(item.createdAt || item.date).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-green-600 dark:text-green-400">{item.addedCount}</span> / {item.totalCount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === 'rolled_back' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      }`}>
                        {item.status === 'rolled_back' ? 'Rolled Back' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status !== 'rolled_back' && (
                        <button 
                          onClick={() => handleRollback(item.batchId)} 
                          className="text-amber-500 hover:text-amber-700 flex items-center gap-1 ml-auto text-xs font-medium px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                        >
                          <RotateCcw size={14} /> Rollback
                        </button>
                      )}
                    </td>
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

export default AdminBatches;
