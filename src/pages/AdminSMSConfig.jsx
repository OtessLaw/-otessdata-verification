import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Key, Globe, Eye, EyeOff, Save, CheckCircle, AlertCircle, MessageSquare, Smartphone, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSMSConfig() {
  const [provider, setProvider] = useState('arkesel');
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('OTESS');
  const [apiUrl, setApiUrl] = useState('https://sms.arkesel.com/api/v2/sms/send');
  const [isEnabled, setIsEnabled] = useState(true);
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from OTESS! Your Arkesel SMS Gateway connection is working perfectly.');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/sms-config');
      if (res.data.success && res.data.config) {
        const c = res.data.config;
        setProvider(c.provider || 'arkesel');
        setApiKey(c.apiKey || '');
        setSenderId(c.senderId || 'OTESS');
        setApiUrl(c.apiUrl || 'https://api.arkesel.com/v2/sms/send');
        setIsEnabled(c.isEnabled !== undefined ? c.isEnabled : true);
      }
    } catch (err) {
      toast.error('Failed to load SMS Gateway configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e) => {
    const selected = e.target.value;
    setProvider(selected);
    if (selected === 'arkesel') {
      setApiUrl('https://sms.arkesel.com/api/v2/sms/send');
    } else if (selected === 'mnotify') {
      setApiUrl('https://api.mnotify.com/api/sms/quick');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/admin/sms-config', {
        provider,
        apiKey,
        senderId,
        apiUrl,
        isEnabled
      });
      if (res.data.success) {
        toast.success('SMS Gateway settings saved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestSMS = async (e) => {
    e.preventDefault();
    if (!testPhone) {
      toast.error('Please enter a test phone number.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/admin/sms-config/test', {
        testPhone,
        message: testMessage
      });
      setTestResult({ success: true, message: res.data.message });
      toast.success(`Test SMS sent to ${testPhone}!`);
    } catch (err) {
      const errMessage = err.response?.data?.message || 'Test SMS failed';
      setTestResult({ success: false, message: errMessage });
      toast.error(errMessage);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading SMS Gateway settings...
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div>
        <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="text-[#2563eb]" size={28} />
          <span>Arkesel & SMS Gateway Settings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Connect your Arkesel SMS API key to send automated SMS alerts to agents on submission, approval, and rejection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={20} className="text-[#2563eb]" />
                <span>Gateway Configuration</span>
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isEnabled} 
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEnabled ? 'SMS Active' : 'SMS Disabled'}
                </span>
              </label>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select SMS Gateway Provider
              </label>
              <select
                value={provider}
                onChange={handleProviderChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563eb] outline-none"
              >
                <option value="arkesel">Arkesel (Ghana's Leading Gateway - Recommended)</option>
                <option value="mnotify">mNotify Ghana</option>
                <option value="hubtel">Hubtel Ghana</option>
                <option value="custom">Custom HTTP API</option>
              </select>
            </div>

            {/* Arkesel API Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Arkesel / Provider API Key</span>
                <a href="https://arkesel.com" target="_blank" rel="noreferrer" className="text-xs text-[#2563eb] hover:underline font-normal">
                  Get Arkesel API Key ↗
                </a>
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Arkesel API key here..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-12 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563eb] outline-none font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">If left empty, the system runs in simulation mode so testing never fails.</p>
            </div>

            {/* Sender ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Sender ID (Header Name on Recipient Phone)
              </label>
              <input
                type="text"
                value={senderId}
                maxLength={11}
                onChange={(e) => setSenderId(e.target.value.toUpperCase())}
                placeholder="e.g. OTESS or OtessData"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563eb] outline-none tracking-widest"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Max 11 characters allowed by telcos (e.g. OTESS).</p>
            </div>

            {/* API Endpoint URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                API Endpoint URL
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.arkesel.com/v2/sms/send"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2563eb] outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl shadow-lg shadow-[#2563eb]/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? 'Saving Settings...' : 'Save SMS Gateway Settings'}</span>
              </motion.button>
            </div>
          </form>

          {/* Test SMS Card */}
          <form onSubmit={handleSendTestSMS} className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Send size={20} className="text-emerald-500" />
              <span>Send Test SMS via Arkesel</span>
            </h2>
            <p className="text-xs text-slate-500">Verify your Arkesel credentials immediately by sending a test message to your mobile phone.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Recipient Test Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 0559876543"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Test Message Body
                </label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={testing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={15} />
                <span>{testing ? 'Sending Test SMS...' : 'Send Test SMS Now'}</span>
              </motion.button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'}`}>
                {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Templates Preview Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-[#2563eb]" />
              <span>Automated SMS Templates</span>
            </h3>
            <p className="text-xs text-slate-500">These 3 official templates are sent automatically to agents during each stage:</p>

            <div className="space-y-4 pt-2">
              {/* Submission Template */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase block">1. Agent Submission SMS</span>
                <p className="text-xs font-mono italic text-slate-700 dark:text-slate-300">
                  "Hello, your verification request has been received successfully. We will alert you once the number has been verified. Thank you."
                </p>
              </div>

              {/* Approval Template */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">2. Approval SMS</span>
                <p className="text-xs font-mono italic text-slate-700 dark:text-slate-300">
                  "Hello, your requested number has been successfully verified. You can now proceed with your order. Thank you."
                </p>
              </div>

              {/* Rejection Template */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase block">3. Rejection SMS</span>
                <p className="text-xs font-mono italic text-slate-700 dark:text-slate-300">
                  "Hello, your verification request was not approved at this time. Please contact support for more information."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
