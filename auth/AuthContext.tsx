// src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ADMIN_EMAILS } from '../firebase';

export type AuthStatus = 'loading' | 'unauthenticated' | 'pending' | 'approved' | 'rejected';

export interface UserData {
  email: string;
  nama: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  lastSeen?: any;
}

interface AuthContextType {
  user: UserData | null;
  authStatus: AuthStatus;
  isAdmin: boolean;
  requestAccess: (email: string, nama: string) => Promise<void>;
  checkAccess: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'ugc_user_email';
const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

const updateLastSeen = async (emailKey: string) => {
  try {
    await updateDoc(doc(db, 'users', emailKey), { lastSeen: serverTimestamp() });
  } catch (err) {
    // Silently fail - not critical
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  // Heartbeat: update lastSeen every 2 min while approved
  useEffect(() => {
    if (authStatus !== 'approved' || !user?.email) return;
    const emailKey = user.email.toLowerCase();

    updateLastSeen(emailKey);

    const interval = setInterval(() => updateLastSeen(emailKey), HEARTBEAT_INTERVAL);

    const onVisible = () => { if (!document.hidden) updateLastSeen(emailKey); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authStatus, user?.email]);

  // On mount, check if there's a saved session
  useEffect(() => {
    const savedEmail = localStorage.getItem(SESSION_KEY);
    if (savedEmail) {
      checkAccess(savedEmail);
    } else {
      setAuthStatus('unauthenticated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAccess = useCallback(async (email: string) => {
    setAuthStatus('loading');
    try {
      const emailKey = email.toLowerCase().trim();

      if (ADMIN_EMAILS.includes(emailKey)) {
        const adminUser: UserData = { email: emailKey, nama: 'Admin', status: 'approved' };
        setUser(adminUser);
        setAuthStatus('approved');
        localStorage.setItem(SESSION_KEY, emailKey);
        return;
      }

      const ref = doc(db, 'users', emailKey);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUser(data);
        setAuthStatus(data.status as AuthStatus);
        localStorage.setItem(SESSION_KEY, emailKey);
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (err) {
      console.error('checkAccess error:', err);
      setAuthStatus('unauthenticated');
    }
  }, []);

  const requestAccess = useCallback(async (email: string, nama: string) => {
    setAuthStatus('loading');
    try {
      const emailKey = email.toLowerCase().trim();

      if (ADMIN_EMAILS.includes(emailKey)) {
        const adminUser: UserData = { email: emailKey, nama: nama.trim() || 'Admin', status: 'approved' };
        const ref = doc(db, 'users', emailKey);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { ...adminUser, createdAt: serverTimestamp() });
        }
        setUser(adminUser);
        setAuthStatus('approved');
        localStorage.setItem(SESSION_KEY, emailKey);
        return;
      }

      const ref = doc(db, 'users', emailKey);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUser(data);
        setAuthStatus(data.status as AuthStatus);
        localStorage.setItem(SESSION_KEY, emailKey);
      } else {
        const newUser: UserData = {
          email: emailKey,
          nama: nama.trim(),
          status: 'pending',
        };
        await setDoc(ref, { ...newUser, createdAt: serverTimestamp() });
        setUser(newUser);
        setAuthStatus('pending');
        localStorage.setItem(SESSION_KEY, emailKey);
      }
    } catch (err) {
      console.error('requestAccess error:', err);
      setAuthStatus('unauthenticated');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ user, authStatus, isAdmin, requestAccess, checkAccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
