
import React, { useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon, ArrowPathIcon, ArrowDownTrayIcon } from './icons';

interface ScenePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | undefined;
    sceneNumber: number;
    totalScenes: number;
    onNext: () => void;
    onPrev: () => void;
    onRegenerate: () => void;
    onSave: () => void;
    isRegenerating: boolean;
}

const ScenePreviewModal: React.FC<ScenePreviewModalProps> = ({
    isOpen, onClose, imageUrl, sceneNumber, totalScenes,
    onNext, onPrev, onRegenerate, onSave, isRegenerating
}) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onNext, onPrev, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-xl animate-fade-in" onClick={onClose}>
            
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black text-white border-4 border-black hover:bg-gray-800 transition-colors z-50 shadow-neo-sm"
            >
                <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Navigation Buttons (Desktop) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white border-4 border-black hover:bg-gray-50 text-black transition-colors z-50 hidden md:block shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white border-4 border-black hover:bg-gray-50 text-black transition-colors z-50 hidden md:block shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
                <ArrowRightIcon className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <div className="relative w-full max-w-7xl h-full flex flex-col items-center justify-center p-4 md:p-8" onClick={e => e.stopPropagation()}>
                
                {/* Image Container */}
                <div className="relative w-auto h-auto max-w-full max-h-[80vh] flex items-center justify-center">
                    {isRegenerating ? (
                        <div className="w-[300px] h-[500px] flex flex-col items-center justify-center bg-white border-4 border-black shadow-neo">
                            <ArrowPathIcon className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                            <p className="text-black font-black tracking-widest animate-pulse uppercase">REGENERATING...</p>
                        </div>
                    ) : imageUrl ? (
                        <img 
                            src={`data:image/png;base64,${imageUrl}`} 
                            alt={`Scene ${sceneNumber}`} 
                            className="max-w-full max-h-[80vh] object-contain border-4 border-black shadow-neo"
                        />
                    ) : (
                        <div className="w-[300px] h-[500px] flex items-center justify-center bg-white border-4 border-black shadow-neo text-gray-500 font-black uppercase">
                            No Image Available
                        </div>
                    )}
                </div>

                {/* Bottom Controls Bar */}
                <div className="mt-6 flex items-center gap-4 bg-white px-6 py-3 border-4 border-black shadow-neo">
                    
                    {/* Counter */}
                    <div className="text-black font-black text-sm border-r-4 border-black pr-4 mr-2 uppercase tracking-widest">
                        <span className="text-gray-500">SCENE</span> <span className="font-black">{sceneNumber}</span> <span className="text-gray-400">/</span> {totalScenes}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-black text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest"
                        >
                            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Processing...' : 'Regenerate'}
                        </button>

                        <button 
                            onClick={onSave}
                            disabled={!imageUrl || isRegenerating}
                            className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-black border-4 border-black font-black text-xs transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                            Save
                        </button>
                    </div>

                    {/* Mobile Nav */}
                    <div className="flex md:hidden border-l-4 border-black pl-4 ml-2 gap-2">
                        <button onClick={onPrev} className="p-2 text-black hover:text-cyan-600"><ArrowLeftIcon className="w-5 h-5"/></button>
                        <button onClick={onNext} className="p-2 text-black hover:text-cyan-600"><ArrowRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScenePreviewModal;
