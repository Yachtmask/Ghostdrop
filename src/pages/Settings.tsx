'use client';

import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useSettings } from '../hooks/useSettings';
import { Copy, LogOut, Shield, AlertTriangle, Download, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Settings = () => {
  const { account, connected, disconnect, wallet } = useWallet();
  const { settings } = useSettings();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard', {
      style: {
        background: '#060d14',
        color: '#00ff88',
        border: '1px solid #0f1e2e',
      },
      position: 'bottom-right',
      duration: 3000,
    });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const exportVaults = () => {
    const vaults = localStorage.getItem('ghostdrop_vaults');
    if (!vaults) {
      toast.error('No vaults found to export');
      return;
    }
    const blob = new Blob([vaults], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostdrop_vaults_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Vaults exported successfully!', {
      style: {
        background: '#060d14',
        color: '#00ff88',
        border: '1px solid #0f1e2e',
      },
      position: 'bottom-right',
      duration: 3000,
    });
  };

  const deleteAllVaults = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAllVaults = () => {
    localStorage.removeItem('ghostdrop_vaults');
    toast.success('All local vault metadata deleted', {
      style: {
        background: '#060d14',
        color: '#ff3d3d',
        border: '1px solid #0f1e2e',
      },
      position: 'bottom-right',
      duration: 3000,
    });
    setShowDeleteModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 font-sans text-[#9ab4c8]">
      <div className="space-y-2">
        <h1 className="text-4xl font-[Unbounded] font-bold text-[#ddeeff] tracking-tight">Settings</h1>
        <p className="text-[#4a6378]">Manage your profile and local data.</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#ddeeff]">
          <Shield className="w-5 h-5 text-[#00b4ff]" />
          <h2 className="text-xl font-[Unbounded] font-bold">Profile</h2>
        </div>
        <div className="bg-[#060d14] border border-[#0f1e2e] rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Connected Wallet</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#ddeeff] text-sm break-all">
                  {account?.address.toString() || 'Not Connected'}
                </span>
                {connected && (
                  <button 
                    onClick={() => copyToClipboard(account?.address.toString() || '')}
                    className="p-1.5 hover:bg-[#0f1e2e] rounded-md transition-colors text-[#00b4ff]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {connected && wallet && (
                <span className="px-3 py-1 bg-[#00b4ff]/10 text-[#00b4ff] text-xs font-bold rounded-full border border-[#00b4ff]/20">
                  {wallet.name}
                </span>
              )}
              {connected && (
                <button 
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff3d3d]/10 hover:bg-[#ff3d3d]/20 text-[#ff3d3d] rounded-lg font-bold text-sm transition-all border border-[#ff3d3d]/20"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#ff3d3d]">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-xl font-[Unbounded] font-bold">Danger Zone</h2>
        </div>
        <div className="bg-[#060d14] border border-[#ff3d3d]/30 rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[#ddeeff] font-bold">Manage Local Data</p>
              <p className="text-xs text-[#4a6378]">Export your vault metadata for backup or clear it from this device.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={exportVaults}
                className="flex items-center gap-2 px-6 py-3 bg-[#0f1e2e] hover:bg-[#1a2e3e] text-[#ddeeff] rounded-lg font-bold text-sm transition-all border border-[#0f1e2e]"
              >
                <Download className="w-4 h-4" />
                Export All Vaults
              </button>
              <button 
                onClick={deleteAllVaults}
                className="flex items-center gap-2 px-6 py-3 bg-[#ff3d3d]/10 hover:bg-[#ff3d3d]/20 text-[#ff3d3d] rounded-lg font-bold text-sm transition-all border border-[#ff3d3d]/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Vaults
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#060d14] border border-[#0f1e2e] rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#ddeeff] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#ff3d3d]" />
                  Delete All Vaults
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-[#4a6378] hover:text-[#ddeeff] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#4a6378] mb-6">
                Are you absolutely sure? This will delete all local vault metadata. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-[#ddeeff] hover:bg-[#0f1e2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAllVaults}
                  className="px-4 py-2 bg-[#ff3d3d]/10 text-[#ff3d3d] hover:bg-[#ff3d3d]/20 rounded-xl font-bold transition-colors"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
