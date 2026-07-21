import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminVerified = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  
  const [newNumber, setNewNumber] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/verified?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load verified numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNumber) return;
    
    try {
      setAdding(true);
      const res = await axios.post('/api/admin/verified', { phoneNumber: newNumber });
      if (res.data.success) {
        toast.success('Number added successfully');
        setNewNumber('');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add number');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this number?')) return;
    
    try {
      const res = await axios.delete(`/api/admin/verified/${id}`);
      if (res.data.success) {
        toast.success('Number deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete number');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Verified Numbers</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage the database of verified phone numbers.</p>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add phone number"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 outline-none focus:border-[#2563eb] text-sm"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search numbers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#2563eb] text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Phone Number</th>
                <th className="px-6 py-4 font-medium">Batch ID</th>
                <th className="px-6 py-4 font-medium">Date Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center">No verified numbers found.</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.phoneNumber}</td>
                    <td className="px-6 py-4">{item.batchId || 'Manual'}</td>
                    <td className="px-6 py-4">{new Date(item.createdAt || item.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item._id || item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={18} />
                      </button>
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

export default AdminVerified;
