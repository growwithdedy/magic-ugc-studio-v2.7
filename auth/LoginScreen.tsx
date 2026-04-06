// src/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from './AuthContext';

export const LoginScreen = () => {
  const { requestAccess, checkAccess } = useAuth();
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'form' | 'returning'>('form');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Email tidak valid.');
      return;
    }

    if (mode === 'form' && !nama.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'form') {
        await requestAccess(email.trim(), nama.trim());
      } else {
        await checkAccess(email.trim());
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
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
          <div className="bg-black text-white px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-neo-yellow" />
              <h1 className="text-lg font-black uppercase tracking-widest font-logo">Magic UGC Studio</h1>
              <Sparkles className="w-5 h-5 text-neo-yellow" />
            </div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Eksklusif untuk Pembeli
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex border-b-[3px] border-black">
            <button
              type="button"
              onClick={() => { setMode('form'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors border-r-[3px] border-black ${mode === 'form' ? 'bg-neo-yellow text-black' : 'bg-white text-black/50 hover:bg-gray-50'}`}
            >
              🆕 Minta Akses
            </button>
            <button
              type="button"
              onClick={() => { setMode('returning'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${mode === 'returning' ? 'bg-neo-yellow text-black' : 'bg-white text-black/50 hover:bg-gray-50'}`}
            >
              ✅ Sudah Punya Akses
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs font-bold text-black/60 text-center mb-4">
              {mode === 'form'
                ? '📝 Masukkan data kamu. Admin akan mereview dan menyetujui aksesmu dalam 1 x 24 jam.'
                : '✅ Sudah pernah daftar? Masukkan email kamu untuk cek status akses.'}
            </p>

            {mode === 'form' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama Kamu"
                  required
                  className="w-full px-4 py-3 bg-white neo-border rounded-xl text-sm font-bold text-black placeholder:text-black/30 focus:outline-none focus:border-neo-yellow transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@kamu.com"
                required
                className="w-full px-4 py-3 bg-white neo-border rounded-xl text-sm font-bold text-black placeholder:text-black/30 focus:outline-none focus:border-neo-yellow transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-100 border-[2px] border-red-500 rounded-xl p-3">
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-black text-neo-yellow font-black text-sm uppercase tracking-widest neo-border rounded-xl transition-all neo-shadow hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
              ) : (
                <>{mode === 'form' ? 'Minta Akses' : 'Cek Status Akses'} <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-[10px] text-black/40 font-bold text-center">
              Aplikasi ini eksklusif untuk pembeli Magic UGC Studio
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
