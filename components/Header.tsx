
import React from 'react';
import type { AppName } from '../types';
import { AppName as AppNameEnum } from '../types';
import { ChevronLeft, RefreshCw, Key, Shield, LogOut, Settings } from 'lucide-react';

interface HeaderProps {
    activeApp: AppName;
    setActiveApp: (app: AppName) => void;
    // Auth props
    isAdmin?: boolean;
    apiKey?: string | null;
    userName?: string;
    onApiKeyClick?: () => void;
    onAdminClick?: () => void;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    activeApp, setActiveApp, isAdmin, apiKey, userName, onApiKeyClick, onAdminClick, onLogout
}) => {
    const isHome = activeApp === AppNameEnum.Home;

    return (
        <header className="sticky top-0 left-0 right-0 z-50 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between pointer-events-auto bg-white border-b-[3px] border-black">
            {/* Left: Logo & Back */}
            <div className="flex items-center gap-3">
                {!isHome && (
                    <button 
                        onClick={() => setActiveApp(AppNameEnum.Home)}
                        className="p-2 neo-border neo-shadow bg-white hover:bg-neo-yellow transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl"
                        title="Back to Home"
                    >
                        <ChevronLeft className="w-5 h-5 text-black" />
                    </button>
                )}
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 md:w-11 md:h-11 bg-neo-yellow neo-border flex items-center justify-center neo-shadow rounded-xl">
                        <span className="text-xl md:text-2xl font-black text-black font-logo">M</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base md:text-lg font-black text-black leading-none tracking-tight font-logo">
                            MAGIC UGC
                        </span>
                        {!isHome && (
                            <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-0.5">
                                {activeApp}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
                {/* User greeting */}
                {userName && (
                    <span className="hidden md:block text-[10px] font-bold text-black/40 uppercase tracking-widest mr-2">
                        👋 {userName}
                    </span>
                )}

                {/* API Key Button */}
                {onApiKeyClick && (
                    <button 
                        onClick={onApiKeyClick}
                        className={`p-2 md:px-3 md:py-2 neo-border neo-shadow transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl flex items-center gap-1.5 ${apiKey ? 'bg-neo-cyan' : 'bg-neo-pink'}`}
                        title="API Settings"
                    >
                        <Key className="w-4 h-4 md:w-5 md:h-5 text-black" />
                        <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                            {apiKey ? 'API ✓' : 'API Key'}
                        </span>
                    </button>
                )}

                {/* Admin Button */}
                {isAdmin && onAdminClick && (
                    <button 
                        onClick={onAdminClick}
                        className="p-2 md:px-3 md:py-2 neo-border neo-shadow bg-neo-yellow transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl flex items-center gap-1.5"
                        title="Admin Panel"
                    >
                        <Shield className="w-4 h-4 md:w-5 md:h-5 text-black" />
                        <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Admin</span>
                    </button>
                )}

                {/* Refresh */}
                <button 
                    onClick={() => window.location.reload()}
                    className="p-2 neo-border neo-shadow bg-white hover:bg-gray-100 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-black" />
                </button>

                {/* Logout */}
                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="p-2 neo-border neo-shadow bg-white hover:bg-neo-pink hover:text-white transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
