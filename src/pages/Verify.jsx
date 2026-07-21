import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, Clock, Download, Copy, AlertCircle, Upload, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Verify() {
  const [tab, setTab] = useState('single');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);
  const [agentPhoneInput, setAgentPhoneInput] = useState('');
  const [submittingNow, setSubmittingNow] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  const handleVerifySingle = async (e) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleResult(null);
    setSingleError(null);
    setSubmitSuccess(null);
    try {
      const res = await axios.post('/api/verify/single', { phoneNumber: singlePhone });
      setSingleResult(res.data);
    } catch (err) {
      setSingleError(err.response?.data?.message || 'Verification failed');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleSubmitNotVerified = async (e) => {
    e.preventDefault();
    const phoneToSubmit = singlePhone || singleResult?.data?.phoneNumber;
    if (!phoneToSubmit) return;
    if (!agentPhoneInput) {
      toast.error('Please enter your Agent Phone Number for SMS notifications.');
      return;
    }
    setSubmittingNow(true);
    try {
      const res = await axios.post('/api/submit/single', {
        customerNumber: phoneToSubmit,
        phoneNumber: phoneToSubmit,
        agentNumber: agentPhoneInput
      });
      const expectedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      setSubmitSuccess({
        submissionId: res.data?.data?.submissionId || 'SUBMITTED',
        expectedDate
      });
      toast.success(`Submission received! SMS notification queued for agent.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmittingNow(false);
    }
  };

  const handleVerifyBulk = async (e) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResult(null);
    setBulkError(null);
    try {
      const phones = bulkPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
      const res = await axios.post('/api/verify/bulk', { phoneNumbers: phones });
      setBulkResult(res.data);
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk verification failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyResults = () => {
    if (!bulkResult?.results) return;
    const text = bulkResult.results.map(r => `${r.number || r.phoneNumber}\t${r.status}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard!');
  };

  const downloadCSV = () => {
    if (!bulkResult?.results) return;
    const csv = ['Phone Number,Status,Date']
      .concat(bulkResult.results.map(r => `${r.number || r.phoneNumber},${r.status},${new Date().toISOString()}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otess_verification_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          <ShieldCheck className="inline-block mr-2 text-[#2563eb]" size={36} />
          OTESS Phone Number Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Verify phone numbers instantly for bulk data bundle orders.
        </p>
      </div>

      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'single' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Single Verification
          </button>
          <button
            onClick={() => setTab('bulk')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'bulk' ? 'text-[#2563eb] border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Bulk Verification
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
                <form onSubmit={handleVerifySingle} className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Enter Phone Number
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      placeholder="e.g. 0241234567"
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-slate-900 dark:text-white"
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={singleLoading}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 font-medium shadow-md shadow-[#2563eb]/20 transition-colors disabled:opacity-50"
                    >
                      {singleLoading ? 'Verifying...' : 'Verify'}
                    </motion.button>
                  </div>
                </form>

                {singleError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {singleError}
                  </motion.div>
                )}

                {singleResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="space-y-4"
                  >
                    {singleResult.status === 'verified' && (
                      <div className="p-5 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-2xl space-y-3">
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                          <Check className="w-6 h-6 flex-shrink-0 text-green-500" />
                          <span className="font-outfit font-extrabold text-lg">🟢 VERIFIED</span>
                        </div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Your number has been successfully verified.</p>
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium">You are all set! You can now place your order with confidence.</p>
                        <div className="text-[11px] text-green-600 dark:text-green-500 pt-2 border-t border-green-500/20 flex justify-between">
                          <span>Verification Date: {new Date(singleResult.data?.verifiedDate || Date.now()).toLocaleDateString()}</span>
                          <span>Batch ID: {singleResult.data?.batchId || 'MANUAL-ENTRY'}</span>
                        </div>
                      </div>
                    )}

                    {singleResult.status === 'pending' && (
                      <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-2xl space-y-3">
                        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                          <Clock className="w-6 h-6 flex-shrink-0 text-amber-500" />
                          <span className="font-outfit font-extrabold text-lg">🟡 Verification in Progress</span>
                        </div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Your number has already been submitted for verification.</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Verification is typically completed within 72 hours.</p>
                        <div className="text-[11px] text-amber-600 dark:text-amber-500 pt-2 border-t border-amber-500/20 flex justify-between">
                          <span>Submission ID: {singleResult.data?.submissionId}</span>
                          <span>Queue Position: #{singleResult.data?.position || 1}</span>
                        </div>
                      </div>
                    )}

                    {(singleResult.status === 'not_found' || singleResult.status === 'invalid') && (
                      <div className="p-5 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                          <X className="w-6 h-6 flex-shrink-0 text-red-500" />
                          <span className="font-outfit font-extrabold text-lg">🔴 NOT VERIFIED</span>
                        </div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Your number has not been verified yet.</p>
                        
                        {submitSuccess ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-green-500/15 border border-green-500/40 text-green-700 dark:text-green-400 rounded-xl text-xs space-y-2"
                          >
                            <h4 className="font-bold text-sm flex items-center gap-1.5 text-green-600 dark:text-green-400">
                              <Check size={18} /> 🎉 Submission Successful!
                            </h4>
                            <p className="text-xs">Your verification request has been received successfully.</p>
                            <p className="text-xs">Our team will review and add your number to our verified database within 72 hours.</p>
                            <p className="text-xs">Please return on <strong className="underline">{submitSuccess.expectedDate}</strong> to check your verification status. Once your number is verified, you'll be able to place your order without any issues.</p>
                            <p className="text-xs font-semibold pt-1 border-t border-green-500/20">
                              Submission ID: <span className="font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-800 dark:text-green-300">{submitSuccess.submissionId}</span>
                            </p>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleSubmitNotVerified} className="space-y-3 pt-2 border-t border-red-500/20">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <UserCheck size={14} className="text-emerald-500" />
                                <span>Agent Phone Number (For SMS Alerts)</span>
                              </label>
                              <input
                                type="text"
                                value={agentPhoneInput}
                                onChange={(e) => setAgentPhoneInput(e.target.value)}
                                placeholder="Enter Agent Phone Number e.g. 0559876543"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                required
                              />
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              type="submit"
                              disabled={submittingNow}
                              className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-md shadow-[#2563eb]/20 animate-heartbeat disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{submittingNow ? 'Submitting...' : 'Submit Number Now'}</span>
                            </motion.button>
                          </form>
                        )}
                      </div>
                    )}
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
                <form onSubmit={handleVerifyBulk} className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Paste Numbers (newlines or commas)
                  </label>
                  <textarea
                    value={bulkPhones}
                    onChange={(e) => setBulkPhones(e.target.value)}
                    placeholder="0241234567&#10;0209876543&#10;0551122334"
                    rows={5}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-mono text-sm text-slate-900 dark:text-white"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={bulkLoading}
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl px-8 py-3 font-medium shadow-md shadow-[#2563eb]/20 transition-colors disabled:opacity-50 animate-heartbeat"
                  >
                    {bulkLoading ? 'Processing Bulk Verification...' : 'Verify All Numbers'}
                  </motion.button>
                </form>

                {bulkError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 flex items-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {bulkError}
                  </motion.div>
                )}

                {bulkResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-[#2563eb]">{bulkResult.summary?.total || 0}</div>
                        <div className="text-sm text-slate-500">Total Checked</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-900/30">
                        <div className="text-2xl font-bold text-green-600">{bulkResult.summary?.verified || 0}</div>
                        <div className="text-xs text-green-700 dark:text-green-500 font-bold">VERIFIED (GREEN)</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-200 dark:border-amber-900/30">
                        <div className="text-2xl font-bold text-amber-600">{bulkResult.summary?.pending || 0}</div>
                        <div className="text-xs text-amber-700 dark:text-amber-500 font-bold">PENDING</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-900/30">
                        <div className="text-2xl font-bold text-red-600">{(bulkResult.summary?.notFound || 0) + (bulkResult.summary?.invalid || 0)}</div>
                        <div className="text-xs text-red-700 dark:text-red-500 font-bold">NOT VERIFIED (RED)</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mb-4">
                      <button onClick={copyResults} className="flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg transition-colors">
                        <Copy size={16} className="mr-2" /> Copy
                      </button>
                      <button onClick={downloadCSV} className="flex items-center text-sm text-[#2563eb] hover:text-[#1d4ed8] bg-[#2563eb]/10 px-3 py-2 rounded-lg transition-colors">
                        <Download size={16} className="mr-2" /> Download CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Customer Number</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status Indicator</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Date</th>
                            <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResult.results?.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-mono font-medium dark:text-slate-200">{item.number || item.phoneNumber}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  item.status === 'verified' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                  item.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                }`}>
                                  {item.status === 'verified' ? '🟢 VERIFIED' : item.status === 'pending' ? '🟡 PENDING' : '🔴 NOT VERIFIED'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">{item.date || '-'}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{item.message || item.batchId || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
