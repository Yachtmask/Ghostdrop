'use client';

import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useSettings } from '../hooks/useSettings';
import { Copy, LogOut, Mail, Shield, AlertTriangle, Download, Trash2, Check, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

const Settings = () => {
  const { account, connected, disconnect, wallet } = useWallet();
  const { settings, updateNotifications, updateEmailJS, updateDefaults } = useSettings();
  const [isTestingEmail, setIsTestingEmail] = useState(false);

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

  const handleTestEmail = async () => {
    if (!settings.emailjs.serviceId || !settings.emailjs.templateId || !settings.emailjs.publicKey) {
      toast.error('Please fill in all EmailJS fields first');
      return;
    }

    setIsTestingEmail(true);
    try {
      await emailjs.send(
        settings.emailjs.serviceId,
        settings.emailjs.templateId,
        {
          to_email: account?.address.toString(),
          message: 'This is a test notification from GhostDrop.',
        },
        settings.emailjs.publicKey
      );
      toast.success('Test email sent successfully!', {
        style: {
          background: '#060d14',
          color: '#00ff88',
          border: '1px solid #0f1e2e',
        },
        position: 'bottom-right',
        duration: 3000,
      });
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error('Failed to send test email. Check your credentials.');
    } finally {
      setIsTestingEmail(false);
    }
  };

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
    if (window.confirm('Are you absolutely sure? This will delete all local vault metadata. This action cannot be undone.')) {
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
    }
  };

  const handleToggle = (key: keyof typeof settings.notifications) => {
    updateNotifications({ [key]: !settings.notifications[key] });
    toast.success('Notification setting updated', {
      style: {
        background: '#060d14',
        color: '#00ff88',
        border: '1px solid #0f1e2e',
      },
      position: 'bottom-right',
      duration: 3000,
    });
  };

  const handleEmailJSChange = (key: keyof typeof settings.emailjs, value: string) => {
    updateEmailJS({ [key]: value });
  };

  const handleDefaultChange = (key: keyof typeof settings.defaults, value: string | number) => {
    updateDefaults({ [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 font-sans text-[#9ab4c8]">
      <div className="space-y-2">
        <h1 className="text-4xl font-[Unbounded] font-bold text-[#ddeeff] tracking-tight">Settings</h1>
        <p className="text-[#4a6378]">Manage your profile, notifications, and vault defaults.</p>
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

      {/* Notifications Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#ddeeff]">
          <Mail className="w-5 h-5 text-[#00ff88]" />
          <h2 className="text-xl font-[Unbounded] font-bold">Notifications</h2>
        </div>
        <div className="bg-[#060d14] border border-[#0f1e2e] rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            {[
              { id: 'emailOnDrop', label: 'Email notifications on vault drop', desc: 'Get notified when a vault you created is released.' },
              { id: 'warningEmail', label: 'Warning email when 2 days remain', desc: 'Receive a reminder before your vault is automatically dropped.' },
              { id: 'confirmationEmail', label: 'Confirmation email when vault is created', desc: 'Get a receipt for every new vault secured on Shelby.' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-2">
                <div className="space-y-1">
                  <p className="text-[#ddeeff] font-bold">{item.label}</p>
                  <p className="text-xs text-[#4a6378]">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.id as keyof typeof settings.notifications)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    settings.notifications[item.id as keyof typeof settings.notifications] ? 'bg-[#00ff88]' : 'bg-[#0f1e2e]'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-[#020508] rounded-full transition-all duration-300 ${
                    settings.notifications[item.id as keyof typeof settings.notifications] ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EmailJS Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#ddeeff]">
          <ExternalLink className="w-5 h-5 text-[#00b4ff]" />
          <h2 className="text-xl font-[Unbounded] font-bold">EmailJS Configuration</h2>
        </div>
        <div className="bg-[#060d14] border border-[#0f1e2e] rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Service ID</label>
              <input 
                type="text"
                value={settings.emailjs.serviceId}
                onChange={(e) => handleEmailJSChange('serviceId', e.target.value)}
                placeholder="service_xxxxxx"
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Template ID</label>
              <input 
                type="text"
                value={settings.emailjs.templateId}
                onChange={(e) => handleEmailJSChange('templateId', e.target.value)}
                placeholder="template_xxxxxx"
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Public Key</label>
              <input 
                type="text"
                value={settings.emailjs.publicKey}
                onChange={(e) => handleEmailJSChange('publicKey', e.target.value)}
                placeholder="user_xxxxxx"
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
            </div>
          </div>
          <button 
            onClick={handleTestEmail}
            disabled={isTestingEmail}
            className="w-full py-4 bg-[#00b4ff]/10 hover:bg-[#00b4ff]/20 text-[#00b4ff] rounded-xl font-bold transition-all border border-[#00b4ff]/20 flex items-center justify-center gap-2"
          >
            {isTestingEmail ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            Test Email Configuration
          </button>
        </div>
      </section>

      {/* Default Vault Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#ddeeff]">
          <SettingsIcon className="w-5 h-5 text-[#00ff88]" />
          <h2 className="text-xl font-[Unbounded] font-bold">Default Vault Settings</h2>
        </div>
        <div className="bg-[#060d14] border border-[#0f1e2e] rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Check-in Window (Days)</label>
              <input 
                type="number"
                value={settings.defaults.checkInWindow}
                onChange={(e) => handleDefaultChange('checkInWindow', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00ff88] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Default Expiry (Days)</label>
              <input 
                type="number"
                value={settings.defaults.expiry}
                onChange={(e) => handleDefaultChange('expiry', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00ff88] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Blob Name Prefix</label>
              <input 
                type="text"
                value={settings.defaults.blobNamePrefix}
                onChange={(e) => handleDefaultChange('blobNamePrefix', e.target.value)}
                className="w-full px-4 py-3 bg-[#020508] border border-[#0f1e2e] rounded-lg focus:border-[#00ff88] outline-none transition-all text-[#ddeeff] font-mono text-sm"
              />
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
    </div>
  );
};

// Helper for RefreshCw icon since it was missing in imports
const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export default Settings;
