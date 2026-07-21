import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const res = await axios.post('/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.success) {
        toast.success('File uploaded successfully');
        setResult(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Bulk Upload</h1>
        <p className="text-slate-500 dark:text-slate-400">Upload a spreadsheet or text file to add multiple verified numbers at once.</p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 text-center">
        {!file ? (
          <div 
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] dark:text-blue-400 rounded-full flex items-center justify-center">
              <UploadIcon size={32} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-slate-500">Supports .xlsx, .xls, .csv, .txt</p>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-6">
            <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileSpreadsheet className="text-[#2563eb] flex-shrink-0" size={24} />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                <span className="text-xs text-slate-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button onClick={clearFile} disabled={uploading} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <UploadIcon size={20} />
                  <span>Process File</span>
                </>
              )}
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx,.xls,.csv,.txt" 
          className="hidden" 
        />
      </div>

      {result && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">Upload Complete</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Total Processed</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{result.total || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Successfully Added</p>
                <p className="text-xl font-bold text-green-600">{result.added || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Duplicates Skipped</p>
                <p className="text-xl font-bold text-amber-500">{result.duplicates || 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-slate-500">Invalid Format</p>
                <p className="text-xl font-bold text-red-500">{result.invalid || 0}</p>
              </div>
            </div>
            {result.batchId && (
              <p className="mt-4 text-sm text-green-700 dark:text-green-500">
                Batch ID: <span className="font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded">{result.batchId}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
