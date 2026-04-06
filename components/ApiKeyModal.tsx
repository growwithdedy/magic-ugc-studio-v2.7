import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClick } from '../utils';
import { GoogleGenAI } from "@google/genai";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  onDelete: () => void;
  currentKey: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  currentKey 
}) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputKey(currentKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTestAndSave = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: 'Silakan masukkan API Key.' });
      return;
    }

    playClick();
    setIsTesting(true);
    setTestResult(null);

    try {
      const genAI = new GoogleGenAI({ apiKey: inputKey.trim() });
      
      // Test the key with a simple request
      await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Say 'ok' if you can hear me."
      });
      
      setTestResult({ success: true, message: 'Koneksi Berhasil! API Key valid.' });
      setTimeout(() => {
        onSave(inputKey.trim());
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("API Key Test Error:", error);
      setTestResult({ 
        success: false, 
        message: 'API Key tidak valid atau terjadi kesalahan koneksi. Pastikan key benar.' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    console.log("Handle Delete clicked in Modal");
    playClick();
    onDelete();
    setInputKey('');
    setTestResult({ success: true, message: 'API Key berhasil dihapus dari browser.' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md neo-border neo-shadow-lg overflow-hidden flex flex-col rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-neo-yellow px-6 py-4 border-b-[3px] border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white neo-border neo-shadow flex items-center justify-center -rotate-3">
                  <Key className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">API Key Google</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white neo-border hover:bg-neo-pink hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <p className="text-sm font-bold text-black leading-relaxed">
                  Masukkan API Key Google Gemini Anda untuk mulai menggunakan aplikasi. 
                  Sistem ini menggunakan metode <span className="font-black text-neo-purple">Bring Your Own Key</span>.
                </p>
                
                <motion.a 
                  href="https://s.id/caradapatapikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-2 text-xs font-black text-black uppercase tracking-widest bg-neo-yellow px-3 py-2 border-[2px] border-black rounded-lg hover:bg-neo-pink hover:text-white transition-colors neo-shadow-sm"
                >
                  📖 BACA CARA DAPATKAN API KEY DISINI <ExternalLink className="w-3 h-3" />
                </motion.a>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 ml-1">
                    Paste API Key Kamu di Sini 👇
                  </label>
                  <div className="relative">
                    <input 
                      type={showKey ? "text" : "password"}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white neo-border neo-shadow px-4 py-3 text-sm font-mono text-black focus:outline-none focus:bg-neo-yellow/5 transition-all pr-12 rounded-xl"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-black/40 hover:text-black transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 neo-border flex items-start gap-3 ${testResult.success ? 'bg-neo-lime/20 border-neo-lime' : 'bg-neo-pink/20 border-neo-pink'}`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-neo-pink shrink-0" />
                    )}
                    <p className="text-xs font-bold text-black">{testResult.message}</p>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleTestAndSave}
                    disabled={isTesting}
                    className={`w-full py-3 neo-border neo-shadow neo-shadow-hover neo-shadow-active font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-xl ${isTesting ? 'bg-zinc-200 cursor-not-allowed' : 'bg-neo-cyan text-black hover:-translate-y-1'}`}
                  >
                    {isTesting ? (
                      <>Menguji Koneksi...</>
                    ) : (
                      <>Simpan & Hubungkan</>
                    )}
                  </button>

                  {currentKey && (
                    <button 
                      onClick={handleDelete}
                      className="w-full py-3 neo-border bg-white text-neo-pink hover:bg-neo-pink hover:text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus API Key
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="bg-zinc-50 px-6 py-3 border-t-[2px] border-black/10">
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest text-center">
                Key Anda disimpan secara lokal di browser ini dan tidak pernah dikirim ke server kami.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
