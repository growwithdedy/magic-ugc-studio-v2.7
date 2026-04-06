// src/auth/StatusScreen.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, XCircle, RefreshCw, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const ADMIN_WA = '6285123514560';

export const StatusScreen = () => {
  const { authStatus, logout, checkAccess, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const isPending = authStatus === 'pending';

  const waMessage = encodeURIComponent(
    `Halo Admin, saya ${user?.nama || ''} (${user?.email || ''}) ingin konfirmasi akses Magic UGC Studio.`
  );

  const handleRefresh = async () => {
    if (!user?.email || refreshing) return;
    setRefreshing(true);
    try {
      await checkAccess(user.email);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f0f0]">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white neo-border rounded-2xl overflow-hidden neo-shadow-lg">
          {/* Header */}
          <div className={`${isPending ? 'bg-neo-yellow' : 'bg-neo-pink'} text-black px-6 py-8 text-center`}>
            <div className="flex items-center justify-center mb-3">
              {isPending ? (
                <Clock className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-1">
              {isPending ? 'Menunggu Persetujuan' : 'Akses Ditolak'}
            </h2>
            <p className={`text-xs font-bold ${isPending ? 'text-black/60' : 'text-white/80'}`}>
              {user?.email}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-sm font-bold text-black/70 text-center">
              {isPending
                ? 'Admin sedang mereview permintaan aksesmu. Biasanya disetujui dalam 1 x 24 jam.'
                : 'Maaf, permintaan aksesmu ditolak oleh admin. Silakan hubungi admin untuk info lebih lanjut.'}
            </p>

            {/* WhatsApp Contact */}
            <a
              href={`https://wa.me/${ADMIN_WA}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 bg-green-500 text-white font-black text-sm uppercase tracking-widest neo-border rounded-xl transition-all neo-shadow hover:neo-shadow-lg active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Admin via WhatsApp
            </a>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full py-3 px-6 bg-neo-cyan text-black font-black text-sm uppercase tracking-widest neo-border rounded-xl transition-all neo-shadow hover:neo-shadow-lg active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Mengecek...' : 'Refresh Status'}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full py-3 px-6 bg-white text-black font-black text-sm uppercase tracking-widest neo-border rounded-xl transition-all neo-shadow hover:neo-shadow-lg active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Coba Email Lain
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
