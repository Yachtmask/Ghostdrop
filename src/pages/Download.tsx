import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Download as DownloadIcon, Key, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { EncryptionService } from '../services/encryptionService';

const Download = () => {
  const { account, blobName } = useParams<{ account: string, blobName: string }>();
  const location = useLocation();
  const [passphrase, setPassphrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyPackage, setKeyPackage] = useState<string | null>(null);

  useEffect(() => {
    // Extract key package from URL hash
    // location.hash includes the '#' character
    const hash = location.hash;
    if (hash && hash.includes('key=')) {
      const keyPart = hash.split('key=')[1];
      // If there are other hash params, split them
      const key = keyPart.split('&')[0];
      if (key) {
        setKeyPackage(decodeURIComponent(key));
      } else {
        setError("No key package found in URL. Please use the exact link from your notification.");
      }
    } else {
      setError("No key package found in URL. Please use the exact link from your notification.");
    }
  }, [location]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) {
      toast.error('Please enter the decryption passphrase.');
      return;
    }
    if (!keyPackage || !account || !blobName) {
      toast.error('Missing required information to download.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      toast.loading('Decrypting key package...', { id: 'download' });
      
      // 1. Decrypt the AES key using the passphrase
      let exportedKey: string;
      try {
        exportedKey = await EncryptionService.decryptKeyForRecipient(keyPackage, passphrase);
      } catch (e) {
        throw new Error('Invalid passphrase. Could not decrypt the key package.');
      }

      const aesKey = await EncryptionService.importKey(exportedKey);

      // 2. Fetch the ciphertext blob from Shelby
      toast.loading('Downloading encrypted file from Shelby...', { id: 'download' });
      const gatewayUrl = "https://api.testnet.shelby.xyz/shelby";
      const response = await fetch(`${gatewayUrl}/v1/blobs/${account}/${blobName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download file from Shelby. Status: ${response.status}`);
      }

      const encryptedData = await response.arrayBuffer();
      const encryptedBlob = new Blob([encryptedData]);

      // 3. Decrypt the file
      toast.loading('Decrypting file...', { id: 'download' });
      const decryptedBlob = await EncryptionService.decryptFile(encryptedBlob, aesKey);

      // 4. Trigger download
      toast.loading('Preparing download...', { id: 'download' });
      
      // Try to extract original filename from blobName (format: timestamp_filename)
      let originalFileName = 'decrypted_file';
      const parts = blobName.split('_');
      if (parts.length > 1) {
        originalFileName = parts.slice(1).join('_');
      }

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File decrypted and downloaded successfully!', { id: 'download' });
    } catch (e: any) {
      console.error("Download error:", e);
      setError(e.message || 'An unknown error occurred.');
      toast.error(`Error: ${e.message || 'Unknown error'}`, { id: 'download' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border border-slate-800">
          <Shield className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Decrypt Vault</h1>
        <p className="text-slate-400">Enter the passphrase provided by the vault owner to decrypt and download the file.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-10 rounded-3xl md:rounded-[48px] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleDownload} className="space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">
              Encryption Passphrase
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                disabled={isProcessing || !keyPackage}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !passphrase || !keyPackage}
            className={`w-full py-6 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
              isProcessing || !passphrase || !keyPackage
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            {isProcessing ? (
              'Decrypting...'
            ) : (
              <>
                <DownloadIcon className="w-6 h-6" />
                Decrypt & Download
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Download;
