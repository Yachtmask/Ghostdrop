import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  RefreshCw, 
  Globe,
  Mail,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const { account, connected } = useWallet();
  const [aptBalance, setAptBalance] = useState<string>('0.00');
  const [shelbyUsdBalance, setShelbyUsdBalance] = useState<string>('0.00');
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  useEffect(() => {
    // Load recipient email from localStorage
    const savedEmail = localStorage.getItem('ghostdrop_recipient_email');
    if (savedEmail) {
      setRecipientEmail(savedEmail);
    }

    const fetchBalances = async () => {
      if (!connected || !account) return;
      
      try {
        const aptosConfig = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(aptosConfig);
        
        // Fetch APT balance
        try {
          const aptAmount = await aptos.getAccountCoinAmount({
            accountAddress: account.address.toString(),
            coinType: "0x1::aptos_coin::AptosCoin",
          });
          setAptBalance((aptAmount / 100000000).toFixed(4));
        } catch (e) {
          console.error("Error fetching APT balance:", e);
        }

        // Fetch ShelbyUSD balance
        try {
          const coinsData = await aptos.getAccountCoinsData({
            accountAddress: account.address.toString(),
          });
          
          const shelbyCoin = coinsData.find(c => 
            c.asset_type.toLowerCase().includes('shelby') || 
            (c.metadata && c.metadata.symbol === 'ShelbyUSD')
          );
          
          if (shelbyCoin) {
            const decimals = shelbyCoin.metadata?.decimals || 8;
            setShelbyUsdBalance((shelbyCoin.amount / Math.pow(10, decimals)).toFixed(2));
          } else {
            setShelbyUsdBalance('0.00');
          }
        } catch (e) {
          console.error("Error fetching ShelbyUSD balance:", e);
        }
      } catch (error) {
        console.error("Error setting up Aptos client:", error);
      }
    };

    fetchBalances();
  }, [connected, account]);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    localStorage.setItem('ghostdrop_recipient_email', recipientEmail);
    toast.success('Recipient email saved successfully!');
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800">
          <Shield className="w-12 h-12 text-slate-700" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Connect Your Wallet</h2>
          <p className="text-slate-400 max-w-md">Please connect your Aptos wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-slate-400">Manage your wallet and network connections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Navigation & Status */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Wallet Connected</h3>
                <p className="text-sm text-slate-400 font-mono">
                  {account?.address?.toString().substring(0, 6)}...{account?.address?.toString().substring(60)}
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Network</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full">
                  Aptos Protocol
                </span>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Balances
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">APT Balance</p>
                <p className="text-xl font-mono font-bold text-white">{aptBalance} APT</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">ShelbyUSD Balance</p>
                <p className="text-xl font-mono font-bold text-blue-400">{shelbyUsdBalance} SUSD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="md:col-span-2 space-y-8">
          {/* Notification Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-slate-900 border border-slate-800 rounded-[40px] space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Notification Settings</h3>
                <span className="font-bold text-xs uppercase tracking-widest text-purple-400">Dead Man Switch</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Set the recipient email address. If you miss your daily check-in, an email notification will be sent to this address.
            </p>
            
            <form onSubmit={handleSaveEmail} className="space-y-4 pt-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Recipient Email Address"
                  className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Email Settings
              </button>
            </form>
          </motion.div>

          {/* Shelby Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[40px] space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Decentralized Storage</h3>
                <span className="font-bold text-xs uppercase tracking-widest text-blue-400">Shelby Protocol</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">
              All vault data is stored verifiably on the Shelby network using ShelbyUSD. Your history is immutable and secured by the Aptos blockchain.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
