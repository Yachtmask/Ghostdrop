import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Ghost, User } from 'lucide-react';

const Navbar = () => {
  const { connected } = useWallet();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: connected },
    { name: 'Upload', path: '/create', icon: PlusCircle, show: connected },
    { name: 'Settings', path: '/settings', icon: User, show: connected },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
            <Ghost className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            GhostDrop
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-1 md:gap-4">
            {navItems.map((item) => item.show && (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'text-blue-400 bg-blue-400/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title={item.name}
              >
                <item.icon className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <WalletSelector />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
