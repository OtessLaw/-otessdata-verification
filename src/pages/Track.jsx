import React, { useState } from 'react';
import axios from 'axios';
import { Navigation, Search, Check, AlertCircle, Clock } from 'lucide-react';

export default function Track() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await axios.get(`/api/track/${encodeURIComponent(query)}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Tracking information not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 font-outfit text-slate-900 dark:text-white">
          <Navigation className="inline-block mr-2 text-[#2563eb]" size={36} />
          Track Submission
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Enter a phone number or submission ID to check verification progress.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-6 md:p-8 mb-8">
        <form onSubmit={handleTrack} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Phone Number or SUB-12345"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-slate-900 dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 font-medium shadow-md shadow-[#2563eb]/20 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center mb-8">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && result.success && (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-6 md:p-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-8 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tracking Result For</p>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{result.data?.phoneNumber || query}</h3>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Submission ID</p>
              <p className="font-mono text-slate-800 dark:text-slate-200">{result.data?.submissionId || 'N/A'}</p>
            </div>
          </div>

          <div className="relative pl-8 md:pl-10 space-y-8">
            <div className="absolute left-[1.15rem] md:left-[1.65rem] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
            
            {(result.timeline || []).map((node, index) => {
              const isCompleted = node.status === 'completed';
              const isActive = node.status === 'active';
              const isFailed = node.status === 'failed';
              const isPending = node.status === 'pending';
              
              let dotClass = "bg-slate-300 dark:bg-slate-700 ring-slate-100 dark:ring-slate-800";
              let textClass = "text-slate-500 dark:text-slate-400";
              let icon = <Clock size={14} className="text-white" />;

              if (isCompleted) {
                dotClass = "bg-green-500 ring-green-100 dark:ring-green-900/30";
                textClass = "text-slate-900 dark:text-white";
                icon = <Check size={14} className="text-white" />;
              } else if (isActive) {
                dotClass = "bg-amber-500 ring-amber-100 dark:ring-amber-900/30";
                textClass = "text-[#2563eb] dark:text-blue-400";
                icon = <Clock size={14} className="text-white" />;
              } else if (isFailed) {
                dotClass = "bg-red-500 ring-red-100 dark:ring-red-900/30";
                textClass = "text-red-600 dark:text-red-400";
                icon = <AlertCircle size={14} className="text-white" />;
              }

              return (
                <div key={index} className="relative z-10">
                  <div className={`absolute -left-[2.15rem] md:-left-[2.65rem] w-8 h-8 rounded-full flex items-center justify-center ring-4 ${dotClass}`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className={`font-bold ${textClass}`}>{node.label}</h4>
                    {node.date && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{node.date}</p>}
                    {node.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{node.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
