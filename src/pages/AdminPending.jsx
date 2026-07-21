import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Send, MessageSquare, ShieldCheck, UserCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPending = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, [page, search, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/pending?page=${page}&limit=10&status=${statusFilter}&search=${search}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approving' }));
    try {
      const res = await axios.put(`/api/admin/pending/${id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || 'Approved & SMS Sent to Agent!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve submission');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'rejecting' }));
    try {
      const res = await axios.put(`/api/admin/pending/${id}/reject`);
      if (res.data.success) {
        toast.success(res.data.message || 'Rejected & SMS Sent to Agent!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject submission');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleResendSMS = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'resending' }));
    try {
      const res = await axios.post(`/api/admin/pending/${id}/resend-sms`);
      if (res.data.success) {
        toast.success(res.data.message || 'SMS notification resent successfully!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend SMS notification');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await axios.delete(`/api/admin/pending/${id}`);
      if (res.data.success) {
        toast.success('Record deleted successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/admin/pending/bulk-approve', { ids: selectedIds });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk approved & SMS sent to agents!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed bulk approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/admin/pending/bulk-reject', { ids: selectedIds });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk rejected & SMS sent to agents!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed bulk reject');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length && data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item._id || item.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-[#2563eb]" size={28} />
            <span>Verification Requests & Agent SMS Notifications</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Approve or reject customer verification requests. Agents automatically receive SMS alerts.
          </p>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search phone or submission ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full md:w-72 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#2563eb] text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 outline-none focus:border-[#2563eb] text-sm text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-2">{selectedIds.length} selected</span>
              <button onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <CheckCircle size={15} /> Approve & Notify Agents
              </button>
              <button onClick={handleBulkReject} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <XCircle size={15} /> Reject & Notify Agents
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                </th>
                <th className="px-5 py-4 font-bold">Customer Number</th>
                <th className="px-5 py-4 font-bold">Agent Number</th>
                <th className="px-4 py-4 font-bold">Submission ID</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 font-bold">SMS Alert</th>
                <th className="px-4 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-400">Loading requests...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-400">No verification requests found.</td></tr>
              ) : (
                data.map(item => {
                  const id = item._id || item.id;
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';
                  const currentLoading = actionLoading[id];

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleSelect(id)}
                          className="rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                        />
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Smartphone size={16} className="text-[#2563eb]" />
                        <span>{item.customerNumber || item.phoneNumber}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        <div className="flex items-center gap-1">
                          <UserCheck size={14} className="text-emerald-500" />
                          <span>{item.agentNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.submissionId || 'SUB-N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          isRejected ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {isApproved ? '🟢 Approved' : isRejected ? '🔴 Rejected' : '🟡 Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {item.smsSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <MessageSquare size={12} /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {new Date(item.submittedAt || item.submittedDate || item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(id)}
                                disabled={!!currentLoading}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                title="Approve & Notify Agent via SMS"
                              >
                                <CheckCircle size={14} />
                                <span>Approve & SMS</span>
                              </button>
                              <button
                                onClick={() => handleReject(id)}
                                disabled={!!currentLoading}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                title="Reject & Notify Agent via SMS"
                              >
                                <XCircle size={14} />
                                <span>Reject & SMS</span>
                              </button>
                            </>
                          )}

                          {!isPending && (
                            <button
                              onClick={() => handleResendSMS(id)}
                              disabled={!!currentLoading}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                              title="Resend SMS Notification to Agent"
                            >
                              <Send size={13} />
                              <span>Resend SMS</span>
                            </button>
                          )}

                          <button 
                            onClick={() => handleDelete(id)} 
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pagination.pages} ({pagination.total} total requests)
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

export default AdminPending;
