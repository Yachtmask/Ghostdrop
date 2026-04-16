import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useDeleteBlobs } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from '@aptos-labs/ts-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileText, Trash2, Download, 
  Clock, Search, FileCode, FileImage, FileVideo, FileAudio, FileArchive, File as FileIcon,
  Lock, Edit2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { shelbyService } from '../services/shelbyService';
import { EncryptionService } from '../services/encryptionService';

const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: "aptoslabs_Rtogsh34Kap_NwmjG9ChuFGAmNc4Kg7zVXQVbdRHchTJL",
  // @ts-ignore
  gatewayUrl: "https://api.shelbynet.shelby.xyz/shelby",
});

interface Recipient {
  email: string;
  telegram: string;
  aptosAddress: string;
  encryptedKeyPackage: string;
}

interface VaultMetadata {
  blobName: string;
  fileName: string;
  uploadTimestamp: number;
  durationMs: number;
  dropTimestamp: number;
  notified: boolean;
  recipients: Recipient[];
  metadataBlobName: string; // Added for deletion
}

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
    default: return <FileIcon className="w-5 h-5 text-slate-500" />;
  }
};

const formatTimeRemaining = (ms: number) => {
  if (ms <= 0) return "DROPPED";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const Dashboard = () => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const { mutateAsync: deleteBlobs } = useDeleteBlobs({ client: shelbyClient });
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vaults' | 'receive' | 'verify'>('vaults');
  const [receiveBlob, setReceiveBlob] = useState('');
  const [receivePassphrase, setReceivePassphrase] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Delete Modal State
  const [vaultToDelete, setVaultToDelete] = useState<{ metadataBlobName: string, fileBlobName: string } | null>(null);

  // Edit Timer Modal State
  const [vaultToEditTimer, setVaultToEditTimer] = useState<{ metadataBlobName: string, durationMs: number } | null>(null);
  const [editTimerValue, setEditTimerValue] = useState(30);
  const [editTimerUnit, setEditTimerUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'months'>('days');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (connected && account) {
      fetchVaults();
    } else {
      setIsLoading(false);
    }
  }, [connected, account]);

  const fetchVaults = async () => {
    setIsLoading(true);
    try {
      // 1. Get list of metadata blobs and extensions for this account
      const addressStr = account?.address?.toString();
      const res = await fetch(`/api/vaults/${addressStr}`);
      const data = await res.json();
      const metadataBlobs: string[] = data.metadataBlobs || [];
      const extensions: Record<string, number> = data.extensions || {};

      // 2. Fetch each metadata blob from Shelby
      const fetchedVaults: VaultMetadata[] = [];

      for (const blobName of metadataBlobs) {
        try {
          // Use shelbyService to download the metadata blob
          const blobDataBytes = await shelbyService.download(addressStr || '', blobName);
          const blobDataText = new TextDecoder().decode(blobDataBytes);
          const blobData = JSON.parse(blobDataText);
          
          if (blobData.vaults && Array.isArray(blobData.vaults)) {
            blobData.vaults.forEach((v: any) => {
              // Apply extension if it exists
              const effectiveDropTimestamp = extensions[blobName] || v.dropTimestamp;
              fetchedVaults.push({ ...v, metadataBlobName: blobName, dropTimestamp: effectiveDropTimestamp });
            });
          }
        } catch (e) {
          console.error(`Failed to fetch metadata blob ${blobName}:`, e);
        }
      }

      setVaults(fetchedVaults.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp));
    } catch (error) {
      console.error("Failed to fetch vaults:", error);
      toast.error("Failed to load vaults");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (metadataBlobName: string, durationMs: number) => {
    if (!account) return;
    
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountAddress: account.address.toString(),
          metadataBlobName,
          durationMs
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Successfully checked in! Timer extended.");
        // Update local state immediately
        setVaults(prev => prev.map(v => 
          v.metadataBlobName === metadataBlobName 
            ? { ...v, dropTimestamp: data.newDropTimestamp } 
            : v
        ));
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Network error during check-in");
    }
  };

  const handleDelete = async (metadataBlobName: string, fileBlobName: string) => {
    setVaultToDelete({ metadataBlobName, fileBlobName });
  };

  const handleDeleteConfirm = async () => {
    if (!account || !vaultToDelete) return;
    
    const { metadataBlobName, fileBlobName } = vaultToDelete;
    setVaultToDelete(null);
    setIsDeleting(metadataBlobName);
    try {
      // Delete both the metadata and the file blob from Shelby
      await deleteBlobs({
        // @ts-ignore
        signer: { account, signAndSubmitTransaction },
        blobNames: [metadataBlobName, fileBlobName] as any
      });

      // Deregister from watchdog
      await fetch('/api/watch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountAddress: account.address.toString(),
          metadataBlobName
        })
      });

      toast.success("Vault deleted successfully");
      fetchVaults();
    } catch (error: any) {
      console.error("Failed to delete vault:", error);
      toast.error(`Failed to delete vault: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditTimerConfirm = async () => {
    if (!account || !vaultToEditTimer) return;
    const { metadataBlobName } = vaultToEditTimer;
    
    const multipliers = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000,
    };
    const newDurationMs = editTimerValue * multipliers[editTimerUnit];
    
    setVaultToEditTimer(null);
    
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountAddress: account.address.toString(),
          metadataBlobName,
          durationMs: newDurationMs
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Timer updated successfully!");
        setVaults(prev => prev.map(v => 
          v.metadataBlobName === metadataBlobName 
            ? { ...v, dropTimestamp: data.newDropTimestamp, durationMs: newDurationMs } 
            : v
        ));
      } else {
        toast.error(data.error || "Failed to update timer");
      }
    } catch (error) {
      console.error("Update timer error:", error);
      toast.error("Network error during timer update");
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveBlob || !receivePassphrase) {
      toast.error("Please enter both Blob ID and Passphrase");
      return;
    }

    setIsDecrypting(true);
    try {
      let targetAccount = '';
      let targetBlobName = '';
      let targetKeyPackage = '';

      // Check if it's a full link
      if (receiveBlob.includes('/download/')) {
        try {
          const url = new URL(receiveBlob);
          const pathParts = url.pathname.split('/');
          // Format: /download/:account/:blobName
          const downloadIndex = pathParts.indexOf('download');
          if (downloadIndex !== -1 && pathParts.length >= downloadIndex + 3) {
            targetAccount = pathParts[downloadIndex + 1];
            targetBlobName = pathParts[downloadIndex + 2];
          }

          // Extract key from hash
          const hashParams = new URLSearchParams(url.hash.substring(1));
          targetKeyPackage = hashParams.get('key') || '';
        } catch (err) {
          console.error("Failed to parse link:", err);
        }
      } else {
        // Assume it's just a Blob ID, but we need the owner address
        // In this case, we can't easily download without the owner address
        // unless we search all vaults (which we don't have an API for here).
        // So we still tell them to use the full link if they don't have the owner.
        toast.error("Please use the full Download Link provided in the email/message to decrypt from here.");
        setIsDecrypting(false);
        return;
      }

      if (!targetAccount || !targetBlobName || !targetKeyPackage) {
        toast.error("Invalid link format. Please use the exact link from your notification.");
        setIsDecrypting(false);
        return;
      }

      toast.loading('Decrypting key package...', { id: 'dashboard-decrypt' });
      
      // 1. Decrypt the AES key using the passphrase
      let exportedKey: string;
      try {
        exportedKey = await EncryptionService.decryptKeyForRecipient(targetKeyPackage, receivePassphrase);
      } catch (e) {
        toast.error('Invalid passphrase. Could not decrypt the key package.', { id: 'dashboard-decrypt' });
        setIsDecrypting(false);
        return;
      }

      const aesKey = await EncryptionService.importKey(exportedKey);

      // 2. Fetch the ciphertext blob from Shelby
      toast.loading('Downloading encrypted file from Shelby...', { id: 'dashboard-decrypt' });
      const encryptedData = await shelbyService.download(targetAccount, targetBlobName);
      const encryptedBlob = new Blob([encryptedData]);

      // 3. Decrypt the file
      toast.loading('Decrypting file...', { id: 'dashboard-decrypt' });
      const decryptedBlob = await EncryptionService.decryptFile(encryptedBlob, aesKey);

      // 4. Trigger download
      toast.loading('Preparing download...', { id: 'dashboard-decrypt' });
      
      let originalFileName = 'decrypted_file';
      const parts = targetBlobName.split('_');
      if (parts.length > 1) {
        originalFileName = parts.slice(1).join('_');
      }

      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success('File decrypted and downloaded successfully!', { id: 'dashboard-decrypt' });
    } catch (error: any) {
      console.error("Decryption failed:", error);
      toast.error(`Decryption failed: ${error.message || 'Unknown error'}`, { id: 'dashboard-decrypt' });
    } finally {
      setIsDecrypting(false);
    }
  };

  const filteredVaults = vaults.filter(v => 
    v.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.blobName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800">
          <Shield className="w-12 h-12 text-slate-700" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Connect Your Wallet</h2>
          <p className="text-slate-400 max-w-md">Please connect your Aptos wallet to view your vaults.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Connected as <span className="font-mono text-slate-300">{account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}</span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Active Vaults</p>
            <p className="text-3xl font-bold text-blue-400">{vaults.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('vaults')}
          className={`pb-4 px-4 font-bold transition-all relative ${activeTab === 'vaults' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          My Vaults
          {activeTab === 'vaults' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('receive')}
          className={`pb-4 px-4 font-bold transition-all relative ${activeTab === 'receive' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Receive & Decrypt
          {activeTab === 'receive' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'vaults' ? (
          <motion.div
            key="vaults"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search vaults..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredVaults.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Vaults Found</h3>
                <p className="text-slate-500">You haven't created any vaults yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVaults.map((vault, index) => {
                  const timeRemaining = vault.dropTimestamp - now;
                  const isDropped = timeRemaining <= 0;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-slate-900 border rounded-3xl p-6 relative group transition-all ${
                        isDropped ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Status Badge */}
                      <div className={`absolute -top-3 -right-3 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${
                        isDropped ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {isDropped ? 'Dropped' : 'Active'}
                      </div>

                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800">
                          {getFileIcon(vault.fileName)}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDelete(vault.metadataBlobName, vault.blobName)}
                            disabled={isDeleting === vault.metadataBlobName}
                            className={`p-2 rounded-xl transition-colors ${
                              isDeleting === vault.metadataBlobName 
                                ? 'text-slate-600 cursor-not-allowed' 
                                : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                            }`}
                            title="Delete Vault"
                          >
                            {isDeleting === vault.metadataBlobName ? (
                              <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold truncate" title={vault.fileName}>
                            {vault.fileName}
                          </h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-500 flex justify-between">
                              <span>Blob ID:</span>
                              <span className="font-mono text-slate-400" title={vault.blobName}>
                                {vault.blobName.slice(0, 10)}...{vault.blobName.slice(-8)}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 flex justify-between">
                              <span>Owner:</span>
                              <span className="font-mono text-slate-400">
                                {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 flex justify-between">
                              <span>Last Checked In:</span>
                              <span className="font-mono text-slate-400">
                                {new Date(vault.dropTimestamp - vault.durationMs).toLocaleString()}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Clock className={`w-5 h-5 ${isDropped ? 'text-red-500' : 'text-blue-500'}`} />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Time Remaining</p>
                                <p className={`font-mono font-bold ${isDropped ? 'text-red-400' : 'text-blue-400'}`}>
                                  {formatTimeRemaining(timeRemaining)}
                                </p>
                              </div>
                            </div>
                            {!isDropped && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setVaultToEditTimer({ metadataBlobName: vault.metadataBlobName, durationMs: vault.durationMs })}
                                  className="p-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 rounded-xl transition-colors"
                                  title="Edit Timer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCheckIn(vault.metadataBlobName, vault.durationMs)}
                                  className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-xl text-sm font-bold transition-colors"
                                >
                                  Check In
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${isDropped ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${isDropped ? 100 : Math.max(0, Math.min(100, ((vault.durationMs - timeRemaining) / vault.durationMs) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            AES-256-GCM
                          </div>
                          <div>
                            {vault.recipients.length} Recipient{vault.recipients.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'receive' ? (
          <motion.div
            key="receive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className="text-center space-y-4 mb-10">
                <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center mx-auto border border-slate-800">
                  <Download className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold">Decrypt a Vault</h2>
                <p className="text-slate-400">Enter the Blob ID and Passphrase provided by the vault owner to download and decrypt the file.</p>
              </div>

              <form onSubmit={handleReceive} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Blob ID</label>
                  <input
                    type="text"
                    value={receiveBlob}
                    onChange={(e) => setReceiveBlob(e.target.value)}
                    placeholder="e.g., 0x123abc..."
                    className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-mono text-sm"
                    disabled={isDecrypting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Encryption Passphrase</label>
                  <input
                    type="password"
                    value={receivePassphrase}
                    onChange={(e) => setReceivePassphrase(e.target.value)}
                    placeholder="Enter passphrase"
                    className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none"
                    disabled={isDecrypting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDecrypting || !receiveBlob || !receivePassphrase}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    isDecrypting || !receiveBlob || !receivePassphrase
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  {isDecrypting ? (
                    'Decrypting...'
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Decrypt & Download
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="receive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className="text-center space-y-4 mb-10">
                <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center mx-auto border border-slate-800">
                  <Download className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold">Decrypt a Vault</h2>
                <p className="text-slate-400">Enter the Blob ID and Passphrase provided by the vault owner to download and decrypt the file.</p>
              </div>

              <form onSubmit={handleReceive} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Blob ID</label>
                  <input
                    type="text"
                    value={receiveBlob}
                    onChange={(e) => setReceiveBlob(e.target.value)}
                    placeholder="e.g., 0x123abc..."
                    className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none font-mono text-sm"
                    disabled={isDecrypting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Encryption Passphrase</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      value={receivePassphrase}
                      onChange={(e) => setReceivePassphrase(e.target.value)}
                      placeholder="Enter passphrase"
                      className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none"
                      disabled={isDecrypting}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isDecrypting || !receiveBlob || !receivePassphrase}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    isDecrypting || !receiveBlob || !receivePassphrase
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  {isDecrypting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-6 h-6" />
                  )}
                  {isDecrypting ? 'Decrypting...' : 'Decrypt & Download'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {vaultToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Delete Vault
                </h3>
                <button
                  onClick={() => setVaultToDelete(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this vault? This action cannot be undone and the vault will be permanently removed from the network.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setVaultToDelete(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold transition-colors"
                >
                  Delete Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Timer Modal */}
      <AnimatePresence>
        {vaultToEditTimer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Edit Timer Duration
                </h3>
                <button
                  onClick={() => setVaultToEditTimer(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">
                  New Duration
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min="1"
                    value={editTimerValue}
                    onChange={(e) => setEditTimerValue(Number(e.target.value))}
                    className="w-1/2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  />
                  <select
                    value={editTimerUnit}
                    onChange={(e) => setEditTimerUnit(e.target.value as any)}
                    className="w-1/2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-sm text-slate-500">
                  This will reset the timer and start counting down from the new duration immediately.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setVaultToEditTimer(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTimerConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Update Timer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
