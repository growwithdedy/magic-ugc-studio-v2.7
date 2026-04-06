// src/auth/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { CheckCircle2, XCircle, Loader2, LogOut, UsersIcon, RefreshCw, Shield, Wifi } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';
type FilterTab = 'semua' | Status | 'online';

interface UserRecord {
  email: string;
  nama: string;
  status: Status;
  createdAt?: any;
  lastSeen?: any;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Online = lastSeen within the last 10 minutes ──────────────────────────────
const isOnline = (user: UserRecord): boolean => {
  if (!user.lastSeen?.toDate) return false;
  const diff = Date.now() - user.lastSeen.toDate().getTime();
  return diff < 10 * 60 * 1000; // 10 minutes
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: UserRecord[] = snap.docs.map((d) => ({
        email: d.id,
        ...(d.data() as Omit<UserRecord, 'email'>),
      }));
      setUsers(list);
    } catch (err) {
      console.error('fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen]);

  const updateStatus = async (email: string, status: Status) => {
    setUpdating(email);
    try {
      await updateDoc(doc(db, 'users', email), { status, updatedAt: serverTimestamp() });
      setUsers((prev) => prev.map((u) => u.email === email ? { ...u, status } : u));
    } catch (err) {
      console.error('updateStatus error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const onlineUsers = users.filter(isOnline);

  const filtered = (() => {
    if (filter === 'online') return onlineUsers;
    if (filter === 'semua') return users;
    return users.filter((u) => u.status === filter);
  })();

  const counts = {
    semua: users.length,
    online: onlineUsers.length,
    pending: users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
  };

  const tabs: { key: FilterTab; label: string; color: string }[] = [
    { key: 'online',   label: 'Online',   color: 'bg-green-400 text-black' },
    { key: 'semua',    label: 'Semua',    color: 'bg-black text-white' },
    { key: 'pending',  label: 'Pending',  color: 'bg-neo-cyan text-black' },
    { key: 'approved', label: 'Approved', color: 'bg-neo-lime text-black' },
    { key: 'rejected', label: 'Rejected', color: 'bg-neo-pink text-black' },
  ];

  const statusBadge = (status: Status) => {
    const map: Record<Status, string> = {
      pending: 'bg-neo-cyan text-black',
      approved: 'bg-neo-lime text-black',
      rejected: 'bg-neo-pink text-black',
    };
    const emoji: Record<Status, string> = { pending: '⏳', approved: '✅', rejected: '❌' };
    return (
      <span className={`${map[status]} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-black`}>
        {emoji[status]} {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-8 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'backOut' }}
          className="bg-white border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-2xl overflow-hidden mb-8"
        >
          {/* Header */}
          <div className="bg-black px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-neo-yellow p-2 rounded-xl">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest text-white">Admin Panel</p>
                <p className="font-bold text-[10px] text-white/50 uppercase tracking-widest">Manajemen Akses Pengguna</p>
              </div>
            </div>
            {/* Online count badge */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-400 border-2 border-white/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-700 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-black uppercase tracking-wider">
                  {onlineUsers.length} online
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/20 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white font-black text-lg w-8 h-8 rounded-xl flex items-center justify-center border border-white/20 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Stats tabs */}
          <div className="bg-neo-yellow border-b-[3px] border-black px-4 py-3 grid grid-cols-5 gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`rounded-xl border-[3px] border-black py-2 px-2 text-center transition-all ${filter === t.key ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ' + t.color : 'bg-white text-black hover:bg-gray-100'}`}
              >
                <p className="text-lg font-black leading-none">{counts[t.key]}</p>
                <p className="text-[8px] font-black uppercase tracking-widest mt-0.5">{t.label}</p>
              </button>
            ))}
          </div>

          {/* User list */}
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-black/50">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-black text-sm uppercase tracking-widest">Memuat data...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-black/30">
                <UsersIcon className="w-10 h-10" />
                <p className="font-black text-sm uppercase tracking-widest">Tidak ada pengguna di kategori ini</p>
              </div>
            ) : (
              filtered.map((u) => {
                const online = isOnline(u);
                return (
                  <div
                    key={u.email}
                    className={`bg-white border-[3px] border-black rounded-xl p-4 flex items-center justify-between gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${online ? 'border-green-400' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {/* Online dot */}
                        <div className={`w-2.5 h-2.5 rounded-full border-[2px] border-black flex-shrink-0 ${online ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                        <p className="font-black text-sm text-black truncate">{u.nama}</p>
                      </div>
                      <p className="text-xs font-mono font-bold text-black/50 truncate pl-4">{u.email}</p>
                      {u.lastSeen?.toDate && (
                        <p className={`text-[10px] font-bold mt-0.5 pl-4 ${online ? 'text-green-600' : 'text-black/30'}`}>
                          {online
                            ? '🟢 Online sekarang'
                            : `Terakhir: ${u.lastSeen.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      )}
                      {u.createdAt?.toDate && !u.lastSeen?.toDate && (
                        <p className="text-[10px] font-bold text-black/30 mt-0.5 pl-4">
                          Daftar: {u.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusBadge(u.status)}

                      {u.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(u.email, 'approved')}
                          disabled={updating === u.email}
                          className="bg-neo-lime text-black border-[2px] border-black p-1.5 rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Setujui"
                        >
                          {updating === u.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      )}
                      {u.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(u.email, 'rejected')}
                          disabled={updating === u.email}
                          className="bg-neo-pink text-black border-[2px] border-black p-1.5 rounded-lg hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Tolak"
                        >
                          {updating === u.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t-[3px] border-black bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onlineUsers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                    {onlineUsers.length} pengguna online
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => { onClose(); logout(); }}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
