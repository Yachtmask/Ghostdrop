'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import emailjs from '@emailjs/browser';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileText, Mail, AlertTriangle, Trash2, Download, 
  RefreshCw, CheckCircle2, Clock, Search, Filter, Skull, 
  Activity, Copy, ExternalLink, User, MessageSquare, Send,
  ChevronDown, ArrowUpAz, Calendar, Activity as ActivityIcon,
  FileCode, FileImage, FileVideo, FileAudio, FileArchive, File as FileIcon,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- Types ---
interface Vault {
  id: number;
  name: string;
  blob: string;
  recipientEmail: string;
  recipientName: string;
  ownerEmail: string;
  note: string;
  days: number;
  passphrase: string;
  file: string;
  size: string;
  walletAddress: string;
  created: string;
  lastCheckin: string;
  dropDate: string;
  emailSent: boolean;
}

interface ActivityLog {
  timestamp: string;
  event: 'vault_created' | 'vault_checkin' | 'vault_dropped' | 'email_sent' | 'file_received';
  vaultName: string;
  details: string;
}

// --- Constants ---
const EMAIL_CONFIG = {
  serviceId: "service_pnqda5u",
  templateId: "template_cd45k9w",
  publicKey: "Z1ur48HaCwun7KTfO"
};

const COLORS = {
  bg: '#020508',
  surface: '#060d14',
  border: '#0f1e2e',
  green: '#00ff88',
  red: '#ff3d3d',
  blue: '#00b4ff',
  orange: '#ff8c00',
  text: '#9ab4c8',
  muted: '#4a6378',
  white: '#ddeeff'
};

// --- Helpers ---
const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return `${name[0]}***@${domain}`;
};

const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <FileCode className="w-5 h-5 text-red-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <FileImage className="w-5 h-5 text-blue-400" />;
    case 'mp4':
    case 'mov':
    case 'avi': return <FileVideo className="w-5 h-5 text-purple-400" />;
    case 'mp3':
    case 'wav': return <FileAudio className="w-5 h-5 text-pink-400" />;
    case 'zip':
    case 'rar':
    case '7z': return <FileArchive className="w-5 h-5 text-yellow-400" />;
    case 'doc':
    case 'docx':
    case 'txt': return <FileText className="w-5 h-5 text-blue-300" />;
    default: return <Skull className="w-5 h-5 text-slate-500" />;
  }
};

const formatTimeRemaining = (ms: number) => {
  if (ms <= 0) return "DROPPED";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

// --- Dashboard Component ---
export default function DashboardPage() {
  const { account, connected } = useWallet();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'vaults' | 'receive' | 'activity'>('vaults');
  const [now, setNow] = useState(new Date());
  
  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Urgent' | 'Dropped'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'drop' | 'status'>('created');

  // Receive Tab State
  const [receiveBlob, setReceiveBlob] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [receivePassphrase, setReceivePassphrase] = useState('');
  const [receiveStatus, setReceiveStatus] = useState<{ msg: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Load Data
  useEffect(() => {
    const savedVaults = localStorage.getItem('ghostdrop_vaults');
    const savedLogs = localStorage.getItem('ghostdrop_activity');
    if (savedVaults) setVaults(JSON.parse(savedVaults));
    if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
    
    if (connected && account) {
      setReceiveAddress(account.address.toString());
    }
  }, [connected, account]);

  // Real-time Ticking
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-check for dropped vaults
  useEffect(() => {
    const checkDrops = async () => {
      let updated = false;
      const newVaults = [...vaults];
      const newLogs = [...activityLogs];

      for (let i = 0; i < newVaults.length; i++) {
        const v = newVaults[i];
        if (new Date(v.dropDate) <= now && !v.emailSent) {
          try {
            await emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, {
              name: v.recipientName,
              email: v.recipientEmail,
              owner_email: v.ownerEmail,
              vault_name: v.name,
              blob_name: v.blob,
              passphrase: v.passphrase,
              note: v.note,
              message: v.note || "Your GhostDrop vault has been released."
            }, EMAIL_CONFIG.publicKey);

            newVaults[i] = { ...v, emailSent: true };
            newLogs.unshift({
              timestamp: new Date().toISOString(),
              event: 'email_sent',
              vaultName: v.name,
              details: `Drop notification sent to ${v.recipientEmail}`
            });
            newLogs.unshift({
              timestamp: new Date().toISOString(),
              event: 'vault_dropped',
              vaultName: v.name,
              details: `Vault reached drop date and was released.`
            });
            updated = true;
          } catch (err) {
            console.error("Failed to send drop email:", err);
          }
        }
      }

      if (updated) {
        setVaults(newVaults);
        setActivityLogs(newLogs);
        localStorage.setItem('ghostdrop_vaults', JSON.stringify(newVaults));
        localStorage.setItem('ghostdrop_activity', JSON.stringify(newLogs));
      }
    };

    if (vaults.length > 0) checkDrops();
  }, [now, vaults, activityLogs]);

  // Stats
  const stats = useMemo(() => {
    const total = vaults.length;
    const active = vaults.filter(v => new Date(v.dropDate) > now).length;
    const dropped = vaults.filter(v => new Date(v.dropDate) <= now).length;
    const totalSize = vaults.reduce((acc, v) => acc + (parseFloat(v.size) || 0), 0);
    return { total, active, dropped, totalSize: totalSize.toFixed(2) };
  }, [vaults, now]);

  // Filtered & Sorted Vaults
  const processedVaults = useMemo(() => {
    return vaults
      .filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
        const isDropped = new Date(v.dropDate) <= now;
        const isUrgent = !isDropped && (new Date(v.dropDate).getTime() - now.getTime()) <= 2 * 24 * 60 * 60 * 1000;
        
        if (filter === 'Active') return matchesSearch && !isDropped;
        if (filter === 'Urgent') return matchesSearch && isUrgent;
        if (filter === 'Dropped') return matchesSearch && isDropped;
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'created') return new Date(b.created).getTime() - new Date(a.created).getTime();
        if (sortBy === 'drop') return new Date(a.dropDate).getTime() - new Date(b.dropDate).getTime();
        if (sortBy === 'status') {
          const statusOrder = (v: Vault) => {
            if (new Date(v.dropDate) <= now) return 3;
            if ((new Date(v.dropDate).getTime() - now.getTime()) <= 2 * 24 * 60 * 60 * 1000) return 1;
            return 2;
          };
          return statusOrder(a) - statusOrder(b);
        }
        return 0;
      });
  }, [vaults, search, filter, sortBy, now]);

  // Actions
  const handleCheckIn = (id: number) => {
    const newVaults = vaults.map(v => {
      if (v.id === id) {
        const newDropDate = new Date();
        newDropDate.setDate(newDropDate.getDate() + v.days);
        
        const newLogs = [{
          timestamp: new Date().toISOString(),
          event: 'vault_checkin' as const,
          vaultName: v.name,
          details: `Heartbeat received. Drop date extended to ${newDropDate.toLocaleDateString()}`
        }, ...activityLogs];
        setActivityLogs(newLogs);
        localStorage.setItem('ghostdrop_activity', JSON.stringify(newLogs));

        return { ...v, lastCheckin: new Date().toISOString(), dropDate: newDropDate.toISOString(), emailSent: false };
      }
      return v;
    });
    setVaults(newVaults);
    localStorage.setItem('ghostdrop_vaults', JSON.stringify(newVaults));
    toast.success('Heartbeat confirmed. Vault drop date extended.', {
      style: { background: COLORS.surface, color: COLORS.green, border: `1px solid ${COLORS.border}` }
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this vault? This action is irreversible.')) {
      const v = vaults.find(v => v.id === id);
      const newVaults = vaults.filter(v => v.id !== id);
      setVaults(newVaults);
      localStorage.setItem('ghostdrop_vaults', JSON.stringify(newVaults));
      
      const newLogs = [{
        timestamp: new Date().toISOString(),
        event: 'vault_dropped' as const, // Reusing dropped as a generic removal event for logs
        vaultName: v?.name || 'Unknown',
        details: `Vault manually deleted by owner.`
      }, ...activityLogs];
      setActivityLogs(newLogs);
      localStorage.setItem('ghostdrop_activity', JSON.stringify(newLogs));
      
      toast.success('Vault deleted successfully.');
    }
  };

  const handleResendEmail = async (v: Vault) => {
    try {
      await emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, {
        name: v.recipientName,
        email: v.recipientEmail,
        owner_email: v.ownerEmail,
        vault_name: v.name,
        blob_name: v.blob,
        passphrase: v.passphrase,
        note: v.note,
        message: v.note || "Your GhostDrop vault has been released."
      }, EMAIL_CONFIG.publicKey);
      toast.success('Notification resent to recipient.');
    } catch (err) {
      toast.error('Failed to resend email.');
    }
  };

  // Receive Logic
  const handleReceive = async () => {
    if (!receiveBlob || !receiveAddress || !receivePassphrase) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsFetching(true);
    setReceiveStatus([{ msg: 'Connecting to Shelby network...', type: 'info' }]);

    try {
      // 1. Fetch from Shelby
      const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${receiveAddress}/${receiveBlob}`;
      setReceiveStatus(prev => [...prev, { msg: `Fetching blob: ${receiveBlob}`, type: 'info' }]);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Blob not found on Shelby network.');
      
      const encryptedData = new Uint8Array(await response.arrayBuffer());
      setReceiveStatus(prev => [...prev, { msg: 'Blob received. Starting decryption...', type: 'success' }]);

      // 2. Decrypt
      // Format: [32 bytes salt][12 bytes IV][ciphertext]
      const salt = encryptedData.slice(0, 32);
      const iv = encryptedData.slice(32, 44);
      const ciphertext = encryptedData.slice(44);

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(receivePassphrase), 'PBKDF2', false, ['deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 480000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      setReceiveStatus(prev => [...prev, { msg: 'Decryption successful!', type: 'success' }]);

      // 3. Download
      const blob = new Blob([decryptedBuffer]);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Remove .enc if present
      const fileName = receiveBlob.endsWith('.enc') ? receiveBlob.slice(0, -4) : receiveBlob;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      const newLogs = [{
        timestamp: new Date().toISOString(),
        event: 'file_received' as const,
        vaultName: receiveBlob,
        details: `Successfully fetched and decrypted file from ${truncateAddress(receiveAddress)}`
      }, ...activityLogs];
      setActivityLogs(newLogs);
      localStorage.setItem('ghostdrop_activity', JSON.stringify(newLogs));

    } catch (err: any) {
      console.error(err);
      setReceiveStatus(prev => [...prev, { msg: `Error: ${err.message}`, type: 'error' }]);
      toast.error(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020508] text-[#9ab4c8] font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-[Unbounded] font-bold text-[#ddeeff] tracking-tight">Dashboard</h1>
            <p className="text-[#4a6378]">Secure your legacy. Monitor your switches.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-mono uppercase tracking-widest text-[#4a6378]">Current Time</span>
              <span className="text-[#ddeeff] font-mono">{now.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Vaults', value: stats.total, color: COLORS.blue, icon: Shield },
            { label: 'Active', value: stats.active, color: COLORS.green, icon: ActivityIcon },
            { label: 'Dropped', value: stats.dropped, color: COLORS.red, icon: Skull },
            { label: 'Total Size (MB)', value: stats.totalSize, color: COLORS.orange, icon: FileIcon },
          ].map((stat, i) => (
            <div key={i} className="bg-[#060d14] border border-[#0f1e2e] rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#4a6378]">{stat.label}</span>
              </div>
              <p className="text-2xl md:text-3xl font-[Unbounded] font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-[#0f1e2e] gap-8">
          {[
            { id: 'vaults', label: 'My Vaults', icon: Shield },
            { id: 'receive', label: 'Receive File', icon: Download },
            { id: 'activity', label: 'Activity Log', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-[Unbounded] font-bold transition-all relative ${
                activeTab === tab.id ? 'text-[#ddeeff]' : 'text-[#4a6378] hover:text-[#9ab4c8]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00b4ff]" />
              )}
            </button>
          ))}
        </div>

        {/* SECTION 2: My Vaults Tab */}
        {activeTab === 'vaults' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6378]" />
                <input
                  type="text"
                  placeholder="Search vaults by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#060d14] border border-[#0f1e2e] rounded-xl focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff]"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {['All', 'Active', 'Urgent', 'Dropped'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                      filter === f 
                        ? 'bg-[#00b4ff]/10 border-[#00b4ff] text-[#00b4ff]' 
                        : 'bg-[#060d14] border-[#0f1e2e] text-[#4a6378] hover:border-[#9ab4c8]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-3 bg-[#060d14] border border-[#0f1e2e] rounded-xl text-xs font-bold text-[#ddeeff]">
                  <ArrowUpAz className="w-4 h-4" />
                  Sort By
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#060d14] border border-[#0f1e2e] rounded-xl p-2 hidden group-hover:block z-50 shadow-2xl">
                  {[
                    { id: 'name', label: 'Name', icon: FileText },
                    { id: 'created', label: 'Date Created', icon: Calendar },
                    { id: 'drop', label: 'Drop Date', icon: Clock },
                    { id: 'status', label: 'Status', icon: ActivityIcon },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id as any)}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#0f1e2e] rounded-lg text-xs text-left"
                    >
                      <s.icon className="w-3 h-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vault Grid */}
            {processedVaults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {processedVaults.map((vault) => {
                    const isDropped = new Date(vault.dropDate) <= now;
                    const isUrgent = !isDropped && (new Date(vault.dropDate).getTime() - now.getTime()) <= 2 * 24 * 60 * 60 * 1000;
                    const timeRemaining = new Date(vault.dropDate).getTime() - now.getTime();
                    const totalTime = new Date(vault.dropDate).getTime() - new Date(vault.created).getTime();
                    const progress = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));

                    return (
                      <motion.div
                        layout
                        key={vault.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-[#060d14] border rounded-xl overflow-hidden flex flex-col transition-all duration-500 ${
                          isUrgent ? 'border-[#ff8c00] shadow-[0_0_20px_rgba(255,140,0,0.1)] animate-pulse-border' : 'border-[#0f1e2e]'
                        }`}
                      >
                        <div className="p-6 space-y-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#020508] border border-[#0f1e2e] rounded-lg">
                                {getFileIcon(vault.file)}
                              </div>
                              <div className="space-y-0.5">
                                <h3 className="text-[#ddeeff] font-bold truncate max-w-[150px]">{vault.name}</h3>
                                <p className="text-[10px] font-mono text-[#4a6378] uppercase">{vault.size} MB</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isDropped ? 'bg-[#ff3d3d]/10 text-[#ff3d3d]' : isUrgent ? 'bg-[#ff8c00]/10 text-[#ff8c00]' : 'bg-[#00ff88]/10 text-[#00ff88]'
                            }`}>
                              {isDropped ? 'Dropped' : isUrgent ? 'Urgent' : 'Active'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                              <span className="text-[#4a6378]">Time Remaining</span>
                              <span className={isUrgent ? 'text-[#ff8c00]' : isDropped ? 'text-[#ff3d3d]' : 'text-[#00ff88]'}>
                                {formatTimeRemaining(timeRemaining)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#020508] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full transition-all duration-1000 ${
                                  isUrgent ? 'bg-[#ff8c00]' : isDropped ? 'bg-[#ff3d3d]' : 'bg-[#00ff88]'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-[#4a6378]">Recipient</p>
                              <p className="text-xs text-[#ddeeff] truncate">{maskEmail(vault.recipientEmail)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-[#4a6378]">Owner</p>
                              <p className="text-xs text-[#ddeeff] truncate">{truncateAddress(vault.walletAddress)}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#0f1e2e] flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-[#4a6378]">Blob Name</p>
                              <div className="flex items-center gap-2">
                                <code className="text-[10px] text-[#00b4ff] bg-[#00b4ff]/5 px-1.5 py-0.5 rounded">{vault.blob}</code>
                                <button onClick={() => { navigator.clipboard.writeText(vault.blob); toast.success('Blob name copied'); }} className="text-[#4a6378] hover:text-[#ddeeff]">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-[#4a6378]">Created</p>
                              <p className="text-[10px] text-[#ddeeff]">{new Date(vault.created).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#020508]/50 p-4 border-t border-[#0f1e2e] flex gap-2">
                          {!isDropped ? (
                            <button
                              onClick={() => handleCheckIn(vault.id)}
                              className="flex-1 py-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] rounded-lg text-xs font-bold transition-all border border-[#00ff88]/20 flex items-center justify-center gap-2"
                            >
                              <ActivityIcon className="w-3 h-3" />
                              Check In
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResendEmail(vault)}
                              disabled={vault.emailSent}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                                vault.emailSent 
                                  ? 'bg-[#4a6378]/10 border-[#4a6378]/20 text-[#4a6378] cursor-not-allowed'
                                  : 'bg-[#ff8c00]/10 hover:bg-[#ff8c00]/20 text-[#ff8c00] border-[#ff8c00]/20'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              {vault.emailSent ? 'Email Sent' : 'Resend Email'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(vault.id)}
                            className="p-2 bg-[#ff3d3d]/10 hover:bg-[#ff3d3d]/20 text-[#ff3d3d] rounded-lg border border-[#ff3d3d]/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center space-y-6 bg-[#060d14] border border-[#0f1e2e] rounded-[40px]">
                <div className="w-24 h-24 bg-[#020508] rounded-full flex items-center justify-center border border-[#0f1e2e]">
                  <Skull className="w-12 h-12 text-[#4a6378]" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-[Unbounded] font-bold text-[#ddeeff]">No vaults found</h3>
                  <p className="text-[#4a6378] max-w-xs mx-auto">You haven't secured any switches yet. Start by creating your first vault.</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/upload'}
                  className="px-8 py-4 bg-[#00b4ff] hover:bg-[#0094ff] text-[#020508] rounded-xl font-bold transition-all shadow-lg shadow-[#00b4ff]/20"
                >
                  Create New Vault
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Receive File Tab */}
        {activeTab === 'receive' && (
          <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-[#00b4ff]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#00b4ff]/20">
                <Download className="w-10 h-10 text-[#00b4ff]" />
              </div>
              <h2 className="text-2xl font-[Unbounded] font-bold text-[#ddeeff]">Retrieve a Vault</h2>
              <p className="text-[#4a6378]">Enter the details provided to you to fetch and decrypt your file.</p>
            </div>

            <div className="bg-[#060d14] border border-[#0f1e2e] rounded-[32px] p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#4a6378]">Blob Name</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6378]" />
                    <input
                      type="text"
                      placeholder="e.g. vault_12345"
                      value={receiveBlob}
                      onChange={(e) => setReceiveBlob(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#020508] border border-[#0f1e2e] rounded-xl focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#4a6378]">Owner Wallet Address</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6378]" />
                    <input
                      type="text"
                      placeholder="0x..."
                      value={receiveAddress}
                      onChange={(e) => setReceiveAddress(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#020508] border border-[#0f1e2e] rounded-xl focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#4a6378]">Passphrase</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6378]" />
                    <input
                      type="password"
                      placeholder="Enter the secret passphrase"
                      value={receivePassphrase}
                      onChange={(e) => setReceivePassphrase(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#020508] border border-[#0f1e2e] rounded-xl focus:border-[#00b4ff] outline-none transition-all text-[#ddeeff]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleReceive}
                disabled={isFetching}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isFetching 
                    ? 'bg-[#0f1e2e] text-[#4a6378] cursor-not-allowed' 
                    : 'bg-[#00b4ff] hover:bg-[#0094ff] text-[#020508] shadow-[#00b4ff]/20'
                }`}
              >
                {isFetching ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                {isFetching ? 'Processing...' : 'Fetch & Decrypt'}
              </button>

              {/* Status Messages */}
              <AnimatePresence>
                {receiveStatus.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-4 border-t border-[#0f1e2e]"
                  >
                    {receiveStatus.map((status, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-mono">
                        {status.type === 'info' && <RefreshCw className="w-3 h-3 animate-spin text-[#00b4ff]" />}
                        {status.type === 'success' && <CheckCircle2 className="w-3 h-3 text-[#00ff88]" />}
                        {status.type === 'error' && <AlertTriangle className="w-3 h-3 text-[#ff3d3d]" />}
                        <span className={
                          status.type === 'info' ? 'text-[#00b4ff]' : 
                          status.type === 'success' ? 'text-[#00ff88]' : 
                          'text-[#ff3d3d]'
                        }>
                          {status.msg}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* SECTION 4: Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-[Unbounded] font-bold text-[#ddeeff]">System Activity</h2>
                <p className="text-xs text-[#4a6378]">A record of all vault operations on this device.</p>
              </div>
              <button 
                onClick={() => { if(window.confirm('Clear all logs?')) { setActivityLogs([]); localStorage.removeItem('ghostdrop_activity'); } }}
                className="flex items-center gap-2 px-4 py-2 bg-[#ff3d3d]/10 hover:bg-[#ff3d3d]/20 text-[#ff3d3d] rounded-lg text-xs font-bold border border-[#ff3d3d]/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Logs
              </button>
            </div>

            <div className="bg-[#060d14] border border-[#0f1e2e] rounded-[32px] overflow-hidden">
              {activityLogs.length > 0 ? (
                <div className="divide-y divide-[#0f1e2e]">
                  {activityLogs.map((log, i) => (
                    <div key={i} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-[#020508]/30 transition-colors">
                      <div className="w-32 text-[10px] font-mono text-[#4a6378]">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                          log.event === 'vault_created' ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' :
                          log.event === 'vault_checkin' ? 'bg-[#00b4ff]/10 border-[#00b4ff]/20 text-[#00b4ff]' :
                          log.event === 'vault_dropped' ? 'bg-[#ff3d3d]/10 border-[#ff3d3d]/20 text-[#ff3d3d]' :
                          log.event === 'email_sent' ? 'bg-[#ff8c00]/10 border-[#ff8c00]/20 text-[#ff8c00]' :
                          'bg-[#ddeeff]/10 border-[#ddeeff]/20 text-[#ddeeff]'
                        }`}>
                          {log.event.replace('_', ' ')}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-sm text-[#ddeeff] font-bold">{log.vaultName}</p>
                          <p className="text-xs text-[#4a6378]">{log.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <ActivityIcon className="w-12 h-12 text-[#0f1e2e] mx-auto" />
                  <p className="text-[#4a6378] text-sm">No recent activity recorded.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes pulse-border {
            0% { border-color: #0f1e2e; }
            50% { border-color: #ff8c00; }
            100% { border-color: #0f1e2e; }
          }
          .animate-pulse-border {
            animation: pulse-border 2s infinite;
          }
        `}
      </style>
    </div>
  );
}
