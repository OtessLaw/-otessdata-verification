import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, Search, FileSpreadsheet, Zap, Activity, Check, X, ArrowRight } from 'lucide-react';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20"
    >
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 bg-white/80 dark:bg-[#1e293b]/80 border border-blue-200/80 dark:border-blue-800/50 rounded-full text-xs font-bold shadow-md shadow-blue-500/5 backdrop-blur-md">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider">
              OTESS Instant Verification System
            </span>
          </div>

          {/* Styled Hero Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] font-outfit">
            OTESS Phone Number Verification For{' '}
            <span className="block mt-1 bg-gradient-to-r from-[#2563eb] via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
              Data Bundles
            </span>
          </h1>

          {/* Styled Description Card */}
          <div className="p-5 bg-white/80 dark:bg-[#1e293b]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-blue-500/5 backdrop-blur-md space-y-3">
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Check if numbers exist in the OTESS database before placing data bundle orders.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Results:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg shadow-sm">
                <Check size={14} className="text-emerald-500 font-bold" />
                <span>Verified numbers show GREEN</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-lg shadow-sm">
                <X size={14} className="text-rose-500 font-bold" />
                <span>Unverified numbers show RED</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/verify"
                className="px-7 py-4 bg-gradient-to-r from-[#2563eb] to-indigo-600 hover:from-[#1d4ed8] hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-[#2563eb]/25 transition-all text-center flex items-center justify-center space-x-2 animate-heartbeat"
              >
                <Search className="w-5 h-5" />
                <span>Verify Numbers Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/submit"
                className="px-7 py-4 bg-white/90 dark:bg-[#1e293b]/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-xl font-bold transition-all text-center flex items-center justify-center space-x-2 shadow-md"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#2563eb]" />
                <span>Submit Number</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Graphic Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-md h-80 sm:h-96 rounded-3xl bg-gradient-to-tr from-[#2563eb]/15 to-indigo-500/15 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -top-12 -left-12 w-48 h-48 bg-[#2563eb]/25 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ scale: [1.15, 1, 1.15], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl"
            />

            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-72 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4 relative z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">OTESS Check</span>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md shadow-green-500/30">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-green-700 dark:text-green-400">🟢 VERIFIED (GREEN)</h4>
                  <p className="text-[10px] text-green-600 dark:text-green-500">Ready for bundle order</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/30">
                  <span className="text-sm font-bold">✕</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400">🔴 NOT VERIFIED (RED)</h4>
                  <p className="text-[10px] text-red-600 dark:text-red-500">Not in OTESS system</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { title: 'Instant Single Search', desc: 'Check any mobile number instantly against the OTESS verification ledger.', icon: Search, color: 'text-[#2563eb]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { title: 'Bulk Verification', desc: 'Paste up to hundreds of numbers for batch status checking.', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { title: 'Real-Time Tracking', desc: 'Track your submission status with a visual timeline.', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { title: 'Secure & Fast', desc: 'Enterprise-grade security with sub-100ms response times.', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map((feature, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white/90 dark:bg-[#1e293b]/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
