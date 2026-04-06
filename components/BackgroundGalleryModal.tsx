
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PhotoIcon, SparklesIcon, CheckCircleIcon, PencilIcon, ArrowPathIcon } from './icons';
import { BACKGROUND_PRESETS } from '../constants';
import { generateCustomBackgroundThemes } from '../services/geminiService';

interface BackgroundGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (themes: string[]) => void;
    suggestedThemes: string[];
    selectedThemes: string[];
}

const BackgroundGalleryModal: React.FC<BackgroundGalleryModalProps> = ({ isOpen, onClose, onConfirm, suggestedThemes, selectedThemes: initialSelectedThemes }) => {
    const [selectedTab, setSelectedTab] = useState<'presets' | 'ai' | 'custom'>('presets');
    const [currentSelection, setCurrentSelection] = useState<string[]>([]);
    
    // Custom Generator State
    const [customPrompt, setCustomPrompt] = useState('');
    const [customCount, setCustomCount] = useState(4);
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
    const [generatedCustomThemes, setGeneratedCustomThemes] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setCurrentSelection(initialSelectedThemes);
        }
    }, [isOpen, initialSelectedThemes]);

    if (!isOpen) return null;

    const toggleSelection = (theme: string) => {
        setCurrentSelection(prev => {
            if (prev.includes(theme)) {
                return prev.filter(t => t !== theme);
            } else {
                return [...prev, theme];
            }
        });
    };

    const handleConfirm = () => {
        onConfirm(currentSelection);
        onClose();
    };

    const handleGenerateCustom = async () => {
        if (!customPrompt.trim()) return;
        setIsGeneratingCustom(true);
        try {
            const results = await generateCustomBackgroundThemes(customPrompt, customCount);
            setGeneratedCustomThemes(results);
            // Optionally auto-select new results
            setCurrentSelection(prev => [...prev, ...results]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingCustom(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            {/* Set width to 60vw as requested */}
            <div className="relative w-[85vw] lg:w-[60vw] bg-white border-4 border-black shadow-neo-lg flex flex-col max-h-[85vh] overflow-hidden animate-fade-in">
                
                {/* Header */}
                <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-400 z-10">
                    <div>
                        <h3 className="text-xl font-black text-black uppercase tracking-tight">Select Background Themes</h3>
                        <p className="text-xs font-bold text-black/60 mt-1 uppercase">Select multiple themes to generate variations.</p>
                    </div>
                    <button onClick={onClose} className="p-2 border-2 border-black hover:bg-white text-black transition-colors bg-white/50">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-4 border-black bg-white">
                    <button 
                        onClick={() => setSelectedTab('presets')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors border-r-4 border-black last:border-r-0 ${selectedTab === 'presets' ? 'bg-cyan-400 text-black' : 'text-black/40 hover:bg-gray-50'}`}
                    >
                        Presets
                    </button>
                    <button 
                        onClick={() => setSelectedTab('ai')}
                        disabled={suggestedThemes.length === 0}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors border-r-4 border-black last:border-r-0 ${selectedTab === 'ai' ? 'bg-pink-400 text-black' : 'text-black/40 hover:bg-gray-50'} ${suggestedThemes.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        AI Suggestions
                    </button>
                    <button 
                        onClick={() => setSelectedTab('custom')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors ${selectedTab === 'custom' ? 'bg-green-400 text-black' : 'text-black/40 hover:bg-gray-50'}`}
                    >
                        Custom Generator
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white cyber-grid">
                    
                    {/* Custom Generator Inputs */}
                    {selectedTab === 'custom' && (
                        <div className="mb-8 p-6 border-4 border-black bg-gray-50 shadow-neo-sm space-y-4">
                             <div>
                                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Describe Your Background Concept</label>
                                <textarea 
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g. A futuristic laboratory with neon blue liquids, or a rustic wooden table in a sunny Tuscan garden..."
                                    className="w-full bg-white border-4 border-black p-3 text-sm text-black font-bold focus:bg-yellow-50 transition-all placeholder-gray-400"
                                    rows={2}
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="w-full sm:flex-1">
                                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Quantity (1-10)</label>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        value={customCount} 
                                        onChange={(e) => setCustomCount(parseInt(e.target.value))}
                                        className="w-full h-4 bg-gray-200 border-2 border-black appearance-none cursor-pointer accent-black"
                                    />
                                    <div className="flex justify-between text-[10px] text-black font-black mt-1 uppercase">
                                        <span>1</span>
                                        <span className="bg-yellow-400 px-2 border-2 border-black">{customCount} Variations</span>
                                        <span>10</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleGenerateCustom}
                                    disabled={!customPrompt || isGeneratingCustom}
                                    className="w-full sm:w-auto px-6 py-3 border-4 border-black bg-black text-white font-black uppercase text-sm shadow-neo active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center h-[52px]"
                                >
                                    {isGeneratingCustom ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                    Generate Concepts
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Presets Grid */}
                        {selectedTab === 'presets' && BACKGROUND_PRESETS.map((theme, index) => {
                            const isSelected = currentSelection.includes(theme);
                            return (
                                <button 
                                    key={index}
                                    onClick={() => toggleSelection(theme)}
                                    className={`group relative aspect-[4/3] transition-all text-left p-4 flex flex-col justify-between border-4 border-black shadow-neo-sm hover:shadow-neo hover:-translate-x-1 hover:-translate-y-1 ${
                                        isSelected 
                                        ? 'bg-cyan-400' 
                                        : 'bg-white hover:bg-yellow-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start w-full relative z-10">
                                        <div className={`w-10 h-10 border-4 border-black flex items-center justify-center transition-colors ${isSelected ? 'bg-white text-black' : 'bg-gray-100 text-black/40'}`}>
                                            <PhotoIcon className="w-6 h-6" />
                                        </div>
                                        {isSelected && <div className="w-8 h-8 border-4 border-black bg-black text-white flex items-center justify-center shadow-neo-sm"><CheckIcon className="w-5 h-5" /></div>}
                                    </div>
                                    <p className={`text-xs font-black uppercase leading-relaxed relative z-10 line-clamp-3 ${isSelected ? 'text-black' : 'text-black/60'}`}>{theme}</p>
                                </button>
                            );
                        })}

                        {/* AI Suggestions Grid */}
                        {selectedTab === 'ai' && suggestedThemes.map((theme, index) => {
                            const isSelected = currentSelection.includes(theme);
                            return (
                                <button 
                                    key={index}
                                    onClick={() => toggleSelection(theme)}
                                    className={`group relative aspect-[4/3] transition-all text-left p-4 flex flex-col justify-between border-4 border-black shadow-neo-sm hover:shadow-neo hover:-translate-x-1 hover:-translate-y-1 ${
                                        isSelected 
                                        ? 'bg-pink-400' 
                                        : 'bg-white hover:bg-yellow-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start w-full relative z-10">
                                        <div className={`w-10 h-10 border-4 border-black flex items-center justify-center transition-colors ${isSelected ? 'bg-white text-black' : 'bg-gray-100 text-black/40'}`}>
                                            <SparklesIcon className="w-6 h-6" />
                                        </div>
                                        {isSelected && <div className="w-8 h-8 border-4 border-black bg-black text-white flex items-center justify-center shadow-neo-sm"><CheckIcon className="w-5 h-5" /></div>}
                                    </div>
                                    <p className={`text-xs font-black uppercase leading-relaxed relative z-10 line-clamp-3 ${isSelected ? 'text-black' : 'text-black/60'}`}>{theme}</p>
                                </button>
                            );
                        })}

                        {/* Custom Generator Grid */}
                        {selectedTab === 'custom' && generatedCustomThemes.map((theme, index) => {
                            const isSelected = currentSelection.includes(theme);
                            return (
                                <button 
                                    key={index}
                                    onClick={() => toggleSelection(theme)}
                                    className={`group relative aspect-[4/3] transition-all text-left p-4 flex flex-col justify-between border-4 border-black shadow-neo-sm hover:shadow-neo hover:-translate-x-1 hover:-translate-y-1 animate-fade-in ${
                                        isSelected 
                                        ? 'bg-green-400' 
                                        : 'bg-white hover:bg-yellow-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start w-full relative z-10">
                                        <div className={`w-10 h-10 border-4 border-black flex items-center justify-center transition-colors ${isSelected ? 'bg-white text-black' : 'bg-gray-100 text-black/40'}`}>
                                            <PencilIcon className="w-6 h-6" />
                                        </div>
                                        {isSelected && <div className="w-8 h-8 border-4 border-black bg-black text-white flex items-center justify-center shadow-neo-sm"><CheckIcon className="w-5 h-5" /></div>}
                                    </div>
                                    <p className={`text-xs font-black uppercase leading-relaxed relative z-10 line-clamp-3 ${isSelected ? 'text-black' : 'text-black/60'}`}>{theme}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white border-t-4 border-black flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
                    <span className="text-sm font-black uppercase text-black">
                        <span className="bg-yellow-400 px-2 border-2 border-black">{currentSelection.length}</span> themes selected
                    </span>
                    <button 
                        onClick={handleConfirm}
                        disabled={currentSelection.length === 0}
                        className="w-full sm:w-auto px-8 py-4 border-4 border-black bg-black text-white font-black uppercase text-sm shadow-neo active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center"
                    >
                        <CheckCircleIcon className="w-6 h-6 mr-2" />
                        Apply Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackgroundGalleryModal;