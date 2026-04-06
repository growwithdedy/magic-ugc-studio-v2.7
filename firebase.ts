// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPIe6ROx6uDq0TDabxssT2toJe2SS4S9Q",
  authDomain: "magic-ugc-studio.firebaseapp.com",
  projectId: "magic-ugc-studio",
  storageBucket: "magic-ugc-studio.firebasestorage.app",
  messagingSenderId: "427480759382",
  appId: "1:427480759382:web:a90a82a0012151098d4ff7",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const ADMIN_EMAILS: string[] = [
  'growwithdedy@gmail.com',
];
