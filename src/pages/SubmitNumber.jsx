import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, AlertCircle, CheckCircle, Smartphone, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubmitNumber() {
  const [tab, setTab] = useState('single');
  
  // Single Submission State
  const [singlePhone, setSinglePhone] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [singleError, setSingleError] = useState(null);

  // Bulk Submission State
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkAgentPhone, setBulkAgentPhone] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    if (!singlePhone || !agentPhone) {
      toast.error('Please fill in both Customer and Agent phone numbers.');
      return;
    }
    setSingleLoading(true);
    setSingleResult(null);
    setSingleError(null);
    try {
      const res = await axios.post('/api/submit/single', {
        customerNumber: singlePhone,
        phoneNumber: singlePhone,
        agentNumber: agentPhone
      });
      const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      setSingleResult({
        submissionId: res.data?.data?.submissionId || 'SUB-SUCCESS',
        expectedDate
      });
      toast.success('Submission received! SMS alert queued for agent.');
      setSinglePhone('');
    } catch (err) {
      setSingleError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleSubmitBulk = async (e) => {
    e.preventDefault();
    if (!bulkPhones || !bulkAgentPhone) {
      toast.error('Please fill in both Customer numbers and Agent phone number.');
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    setBulkError(null);
    try {
      const phones = bulkPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
      const res = await axios.post('/api/submit/bulk', {
        phoneNumbers: phones,
        agentNumber: bulkAgentPhone
      });
      const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      setBulkResult({
        data: res.data,
        expectedDate
      });
      toast.success('Bulk submissions queued! SMS alert queued for agent.');
      setBulkPhones('');
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk submission failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 font-outfit text-slate-900 dark:text-white">
          <PlusCircle className="inline-block mr-2 text-[#2563eb]" size={36} />
          Submit Numbers for OTESS Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Submit unverified numbers to be approved by admins for data bundle orders.
        </p>
      </div>

      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'single' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Single Submission
          </button>
          <button
            onClick={() => setTab('bulk')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'bulk' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Bulk Submission
          </button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {tab === 'single' ? (
              <motion.div 
                key="single"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleSubmitSingle} className="space-y-5 mb-6">
                  {/* Customer Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Smartphone size={16} className="text-[#2563eb]" />
                      <span>Enter Phone Number</span>
                    </label>
                    <input
                      type="text"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      placeholder="e.g. 0241234567"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Agent Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck size={16} className="text-emerald-500" />
                        <span>Agent Phone Number (For SMS Alerts)</span>
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Required</span>
                    </label>
                    <input
                      type="text"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      placeholder="e.g. 0559876543"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={singleLoading}
                      className="px-7 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-[#2563eb]/20 animate-heartbeat disabled:opacity-50"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>{singleLoading ? 'Submitting...' : 'Submit Number'}</span>
                    </motion.button>
                  </div>
                </form>

                {singleError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30 flex items-center text-sm"
                  >
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-amber-600" />
                    <span>{singleError}</span>
                  </motion.div>
                )}

                {singleResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="p-5 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-2xl space-y-2"
                  >
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <span>🎉 Submission Successful!</span>
                    </h4>
                    <p className="text-xs">Your verification request has been received successfully.</p>
                    <p className="text-xs">Our team will review and add your number to our verified database within 72 hours.</p>
                    <p className="text-xs">Please return on <strong className="underline">{singleResult.expectedDate}</strong> to check your verification status. Once your number is verified, you'll be able to place your order without any issues.</p>
                    <p className="text-xs font-semibold pt-1 border-t border-green-500/20">
                      Submission ID: <span className="font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-800 dark:text-green-300">{singleResult.submissionId}</span>
                    </p>
                    <p className="text-xs opacity-75">Thank you for your patience.</p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="bulk"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleSubmitBulk} className="space-y-5 mb-6">
                  {/* Agent Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck size={16} className="text-emerald-500" />
                        <span>Agent Phone Number (For SMS Alerts)</span>
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Required</span>
                    </label>
                    <input
                      type="text"
                      value={bulkAgentPhone}
                      onChange={(e) => setBulkAgentPhone(e.target.value)}
                      placeholder="e.g. 0559876543"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Customer Phone Numbers */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Smartphone size={16} className="text-[#2563eb]" />
                      <span>Paste Numbers (newlines or commas)</span>
                    </label>
                    <textarea
                      value={bulkPhones}
                      onChange={(e) => setBulkPhones(e.target.value)}
                      placeholder="0241234567&#10;0557654321&#10;0201112222"
                      rows={6}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-mono text-sm text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={bulkLoading}
                      className="px-7 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-[#2563eb]/20 animate-heartbeat disabled:opacity-50"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>{bulkLoading ? 'Submitting All...' : 'Submit All'}</span>
                    </motion.button>
                  </div>
                </form>

                {bulkError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-900/30 flex items-center text-sm"
                  >
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" />
                    <span>{bulkError}</span>
                  </motion.div>
                )}

                {bulkResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="p-5 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-2xl space-y-2"
                  >
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <span>🎉 Bulk Submission Successful!</span>
                    </h4>
                    <p className="text-xs">Processed {bulkResult.data?.summary?.submitted || 0} numbers successfully.</p>
                    <p className="text-xs">Our team will review and add your numbers to our verified database within 72 hours.</p>
                    <p className="text-xs">Please check back on <strong className="underline">{bulkResult.expectedDate}</strong> for updates.</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
