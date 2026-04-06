
import React, { useState, useEffect } from 'react';
import type { Language, AppName } from './types';
import { AppName as AppNameEnum } from './types';
import Header from './components/Header';
import Homepage from './components/Homepage'; 
import UGCCreatorStudio from './components/UGCCreatorStudio';
import UnboxingAestheticStudio from './components/UnboxingAestheticStudio';
import FnBStudio from './components/FnBStudio';
import StorysellingStudio from './components/StorysellingStudio';
import OneShotVideoStudio from './components/OneShotVideoStudio';
import FashionReelStudio from './components/FashionReelStudio'; 
import SkincareStudio from './components/SkincareStudio';
import HandOnProductStudio from './components/HandOnProductStudio';
import MirrorSelfieStudio from './components/MirrorSelfieStudio';

// Auth & Firebase imports
import { useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { StatusScreen } from './auth/StatusScreen';
import { AdminPanel } from './auth/AdminPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
    const { authStatus, isAdmin, logout, user } = useAuth();
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    const [language, setLanguage] = useState<Language>('ID');
    const [activeApp, setActiveApp] = useState<AppName>(AppNameEnum.Home); 

    // --- API Key State ---
    const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('gemini_api_key'));
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    useEffect(() => {
        if (!apiKey && authStatus === 'approved') {
            const timer = setTimeout(() => setIsKeyModalOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [apiKey, authStatus]);

    const handleSaveKey = (key: string) => {
        localStorage.setItem('gemini_api_key', key);
        setApiKey(key);
    };

    const handleDeleteKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey(null);
    };

    // --- GLOBAL CAST STATE ---
    const [globalModel, setGlobalModel] = useState<File | null>(null);
    const [globalModelPreview, setGlobalModelPreview] = useState<string | null>(null);

    const handleGlobalModelUpload = (file: File) => {
        setGlobalModel(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setGlobalModelPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);
    
    const supportedApps = [
        AppNameEnum.Home, 
        AppNameEnum.SkincareStudio,
        AppNameEnum.OneShotVideo,
        AppNameEnum.FashionReel,
        AppNameEnum.UGCCreator,
        AppNameEnum.Storyselling,
        AppNameEnum.Unboxing,
        AppNameEnum.FnB,
        AppNameEnum.HandOnProduct,
        AppNameEnum.MirrorSelfie
    ];

    // --- AUTH GATING ---
    if (authStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
                <div className="text-center bg-white neo-border neo-shadow p-8 rounded-2xl">
                    <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-black/50">Memuat...</p>
                </div>
            </div>
        );
    }

    if (authStatus === 'unauthenticated') {
        return <LoginScreen />;
    }

    if (authStatus === 'pending' || authStatus === 'rejected') {
        return <StatusScreen />;
    }

    // --- APPROVED: Show main app ---
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-[#f0f0f0] relative text-black">
            
            {/* Navbar - v2.5 style: compact, all controls integrated */}
            <Header 
                activeApp={activeApp}
                setActiveApp={setActiveApp}
                isAdmin={isAdmin}
                apiKey={apiKey}
                userName={user?.nama || user?.email}
                onApiKeyClick={() => setIsKeyModalOpen(true)}
                onAdminClick={() => setIsAdminPanelOpen(true)}
                onLogout={logout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative z-0">
                <div className="h-full w-full">
                    
                    {/* Homepage */}
                    <div className={activeApp === AppNameEnum.Home ? 'block h-full' : 'hidden'}>
                        <Homepage setActiveApp={setActiveApp} />
                    </div>

                    {/* App Components */}
                    <div className={activeApp === AppNameEnum.SkincareStudio ? 'block h-full' : 'hidden'}>
                        <SkincareStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.UGCCreator ? 'block h-full' : 'hidden'}>
                        <UGCCreatorStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>
                    
                    <div className={activeApp === AppNameEnum.Storyselling ? 'block h-full' : 'hidden'}>
                        <StorysellingStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.OneShotVideo ? 'block h-full' : 'hidden'}>
                        <OneShotVideoStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.FashionReel ? 'block h-full' : 'hidden'}>
                        <FashionReelStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.FnB ? 'block h-full' : 'hidden'}>
                        <FnBStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.Unboxing ? 'block h-full' : 'hidden'}>
                        <UnboxingAestheticStudio 
                            language={language} 
                            globalModel={globalModel} 
                            globalModelPreview={globalModelPreview} 
                        />
                    </div>

                    <div className={activeApp === AppNameEnum.HandOnProduct ? 'block h-full' : 'hidden'}>
                        <HandOnProductStudio language={language} />
                    </div>

                    <div className={activeApp === AppNameEnum.MirrorSelfie ? 'block h-full' : 'hidden'}>
                        <MirrorSelfieStudio 
                            language={language} 
                            globalModel={globalModel}
                            globalModelPreview={globalModelPreview}
                        />
                    </div>

                    {/* Coming Soon */}
                    {!supportedApps.includes(activeApp) && (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="max-w-md w-full text-center bg-white neo-border p-10 neo-shadow-lg rounded-2xl">
                                <div className="w-20 h-20 bg-neo-yellow neo-border flex items-center justify-center mx-auto mb-6 neo-shadow rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-black">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-black text-black mb-3 uppercase tracking-tight">Coming Soon</h2>
                                <p className="text-black font-bold">
                                    Modul <span className="bg-neo-cyan px-2 py-0.5 neo-border inline-block rounded-lg">{activeApp}</span> sedang dalam pengembangan.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* API Key Modal */}
            <ApiKeyModal
                isOpen={isKeyModalOpen}
                onClose={() => setIsKeyModalOpen(false)}
                currentKey={apiKey}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
            />

            {/* Admin Panel */}
            {isAdmin && (
                <AdminPanel
                    isOpen={isAdminPanelOpen}
                    onClose={() => setIsAdminPanelOpen(false)}
                />
            )}
        </div>
    );
};

export default App;
