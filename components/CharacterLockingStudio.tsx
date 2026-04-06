
import React, { useState } from 'react';
import type { Language, CharacterLockingFormData, CharacterArtStyle } from '../types';
import { CHARACTER_ART_STYLES } from '../constants';
import { generateCharacterSheet, generateCharacterPose, retryOperation, delay } from '../services/geminiService';
import { 
    UsersIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, CheckCircleIcon, DocumentTextIcon, BoltIcon, CubeIcon
} from './icons';
import CyberDropdown from './CyberDropdown';

interface CharacterLockingStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

// 12 Standard Poses for the Grid
const GRID_POSES = [
    { id: 1, label: "Front Face Close-up", prompt: "Extreme close-up of face, front view, neutral expression, focus on eyes and facial features." },
    { id: 2, label: "Side Profile (Left)", prompt: "Close-up side profile of face facing left." },
    { id: 3, label: "Side Profile (Right)", prompt: "Close-up side profile of face facing right." },
    { id: 4, label: "3/4 Angle Face", prompt: "Close-up 3/4 angle of face, looking slightly off-camera." },
    { id: 5, label: "Full Body (Front)", prompt: "Full body shot, standing straight, arms at sides, front view." },
    { id: 6, label: "Full Body (Side)", prompt: "Full body shot, standing straight, side view." },
    { id: 7, label: "Full Body (Back)", prompt: "Full body shot, standing straight, back view." },
    { id: 8, label: "Action Pose A", prompt: "Dynamic action pose, combat stance or active movement." },
    { id: 9, label: "Action Pose B", prompt: "Dynamic action pose, running or jumping or casting spell." },
    { id: 10, label: "Expression: Happy", prompt: "Close-up face, big happy smile, laughing." },
    { id: 11, label: "Expression: Angry", prompt: "Close-up face, angry expression, furrowed brows." },
    { id: 12, label: "Expression: Surprised", prompt: "Close-up face, surprised expression, mouth open." },
];

interface GridPanelState {
    id: number;
    base64: string | null;
    isLoading: boolean;
    error: boolean;
}

const CharacterLockingStudio: React.FC<CharacterLockingStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<CharacterLockingFormData>({
        referenceImage: null,
        characterName: '',
        characterDescription: '',
        outfitDescription: '',
        artStyle: CHARACTER_ART_STYLES[0].value,
        usePro: false
    });

    // MODE STATE: 'speed' (Single Image) or 'grid' (12 Images)
    const [generationMode, setGenerationMode] = useState<'speed' | 'grid'>('speed');

    const [refPreview, setRefPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Result State for Speed Mode
    const [generatedSheet, setGeneratedSheet] = useState<string | null>(null);
    
    // Result State for Grid Mode
    const [gridPanels, setGridPanels] = useState<GridPanelState[]>(GRID_POSES.map(p => ({ id: p.id, base64: null, isLoading: false, error: false })));
    
    const [error, setError] = useState<string | null>(null);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);
    const [isStitching, setIsStitching] = useState(false);

    // Auto-inject Global Cast if available
    React.useEffect(() => {
        if (globalModel && globalModelPreview && !formData.referenceImage) {
            setFormData(prev => ({ ...prev, referenceImage: globalModel }));
            setRefPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const handleImageUpload = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, referenceImage: file }));
            setRefPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // --- GENERATION HANDLERS ---

    const handleGenerate = async () => {
        if (!formData.referenceImage) { setError("Wajib upload foto referensi wajah."); return; }
        if (!formData.characterDescription) { setError("Mohon isi deskripsi karakter."); return; }

        // API Key Check
        if (formData.usePro || generationMode === 'grid') { // Grid mode is intensive, suggest key check
             try { /* @ts-ignore */ const hasKey = await window.aistudio.hasSelectedApiKey(); if (!hasKey) { /* @ts-ignore */ await window.aistudio.openSelectKey(); } } catch (e) { console.error("API Key check failed", e); }
        }

        setIsGenerating(true);
        setError(null);
        setRetryStatus(null);

        if (generationMode === 'speed') {
            await generateSpeedMode();
        } else {
            await generateGridMode();
        }
        
        setIsGenerating(false);
    };

    const generateSpeedMode = async () => {
        setGeneratedSheet(null);
        try {
            await retryOperation(async () => {
                const result = await generateCharacterSheet(formData);
                if (!result) throw new Error("Empty response from AI");
                setGeneratedSheet(result);
            }, 3, 3000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal membuat Character Sheet.");
        }
    };

    const generateGridMode = async () => {
        // Reset Grid
        setGridPanels(GRID_POSES.map(p => ({ id: p.id, base64: null, isLoading: true, error: false })));
        
        // Execute sequentially to avoid rate limits (or parallel in chunks)
        // For stability, we'll do batches of 2
        const batchSize = 2;
        for (let i = 0; i < GRID_POSES.length; i += batchSize) {
            const batch = GRID_POSES.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (pose) => {
                try {
                    await retryOperation(async () => {
                        const base64 = await generateCharacterPose(formData, pose.prompt);
                        if (!base64) throw new Error("Empty image");
                        
                        setGridPanels(prev => prev.map(p => 
                            p.id === pose.id ? { ...p, base64, isLoading: false } : p
                        ));
                    }, 3, 2000);
                } catch (e) {
                    console.error(`Failed panel ${pose.id}`, e);
                    setGridPanels(prev => prev.map(p => 
                        p.id === pose.id ? { ...p, isLoading: false, error: true } : p
                    ));
                }
            }));
            
            // Artificial delay between batches to be nice to the API
            if (i + batchSize < GRID_POSES.length) await delay(1000);
        }
    };

    const regenerateSinglePanel = async (id: number) => {
        const pose = GRID_POSES.find(p => p.id === id);
        if (!pose) return;

        setGridPanels(prev => prev.map(p => p.id === id ? { ...p, isLoading: true, error: false } : p));
        
        try {
            await retryOperation(async () => {
                const base64 = await generateCharacterPose(formData, pose.prompt);
                setGridPanels(prev => prev.map(p => 
                    p.id === id ? { ...p, base64, isLoading: false } : p
                ));
            }, 3, 2000);
        } catch (e) {
            setGridPanels(prev => prev.map(p => 
                p.id === id ? { ...p, isLoading: false, error: true } : p
            ));
        }
    };

    // --- DOWNLOAD HANDLERS ---

    const handleDownloadSingle = (base64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStitchAndDownload = async () => {
        if (generationMode === 'speed') {
            if (generatedSheet) handleDownloadSingle(generatedSheet, `${formData.characterName}_sheet.png`);
            return;
        }

        // GRID STITCHING LOGIC (4K MASTER SHEET)
        setIsStitching(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Define grid: 4 columns x 3 rows. 
            // Standardizing to high-res cells (e.g. 1024px each).
            const cellWidth = 1024;
            const cellHeight = 1024;
            const gap = 40;
            const cols = 4;
            const rows = 3;
            const headerHeight = 250;
            const padding = 60;
            
            // Total Dimensions Calculation
            // Width = (1024 * 4) + (40 * 3) + (60 * 2) = 4096 + 120 + 120 = 4336px (Cinema 4K is 4096, so this is >4K)
            const totalWidth = (cellWidth * cols) + (gap * (cols - 1)) + (padding * 2); 
            const totalHeight = headerHeight + (cellHeight * rows) + (gap * (rows - 1)) + (padding * 2); 

            canvas.width = totalWidth;
            canvas.height = totalHeight;

            // 1. Fill Background
            // Create a subtle dark gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#0f0f0f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Draw Header Info
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 90px sans-serif';
            ctx.fillText(`${formData.characterName}`, padding, 120);
            
            // Subtitle / Specs
            ctx.font = '40px sans-serif';
            ctx.fillStyle = '#888888';
            ctx.fillText(`Style: ${formData.artStyle} • 4K Reference Sheet`, padding, 180);
            
            // Description (Truncated)
            ctx.font = 'italic 32px sans-serif';
            ctx.fillStyle = '#aaaaaa';
            const desc = formData.characterDescription.length > 150 ? formData.characterDescription.substring(0, 150) + "..." : formData.characterDescription;
            ctx.fillText(desc, padding, 230);

            // 3. Load and Draw Images
            const startY = headerHeight + padding;
            
            await Promise.all(gridPanels.map(async (panel) => {
                if (!panel.base64) return;
                
                const img = new Image();
                img.src = `data:image/png;base64,${panel.base64}`;
                await new Promise((resolve) => { img.onload = resolve; });

                const poseIndex = GRID_POSES.findIndex(p => p.id === panel.id);
                const col = poseIndex % cols;
                const row = Math.floor(poseIndex / cols);

                const x = padding + (col * (cellWidth + gap));
                const y = startY + (row * (cellHeight + gap));

                // Draw Image
                ctx.drawImage(img, x, y, cellWidth, cellHeight);
                
                // Draw Label Overlay
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(x, y + cellHeight - 100, cellWidth, 100);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 40px sans-serif';
                ctx.fillText(GRID_POSES[poseIndex].label, x + 30, y + cellHeight - 35);
                
                // Draw Border around cell
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, cellWidth, cellHeight);
            }));

            // Watermark / Footer
            ctx.fillStyle = '#444444';
            ctx.font = '30px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText("Generated by Affiliate Studio Pro", canvas.width - padding, canvas.height - padding/2);

            const dataUrl = canvas.toDataURL('image/png', 1.0); // 1.0 = Max Quality
            handleDownloadSingle(dataUrl, `${formData.characterName}_4K_Master_Sheet.png`);

        } catch (e) {
            console.error("Stitching failed", e);
            setError("Gagal menggabungkan gambar. Coba download satu per satu.");
        } finally {
            setIsStitching(false);
        }
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right: Input Panel */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Character DNA</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Pro Mode Toggle */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400">Gemini 3 Pro</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* MODE SELECTION TOGGLE */}
                    <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex">
                        <button 
                            onClick={() => setGenerationMode('speed')}
                            className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${generationMode === 'speed' ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            <BoltIcon className="w-4 h-4" /> Speed Sheet
                        </button>
                        <button 
                            onClick={() => setGenerationMode('grid')}
                            className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${generationMode === 'grid' ? 'bg-white dark:bg-accent-purple shadow text-accent-purple dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            <CubeIcon className="w-4 h-4" /> Hi-Fi Grid
                        </button>
                    </div>

                    {/* Mode Description */}
                    <div className="text-[10px] p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300">
                        {generationMode === 'speed' 
                            ? "🚀 Single Image Generation: Creates one large image with 12 panels. Fast, standard resolution." 
                            : "💎 Multi-Step Generation: Generates 12 high-res images individually and stitches them into a 4K Master Sheet. Maximum quality."}
                    </div>

                    <section>
                        <label className={CYBER_LABEL}>1. Face Reference (Identity Source)</label>
                        <label className={`block w-full aspect-square rounded-xl border-2 border-dashed cursor-pointer overflow-hidden relative transition-all group ${refPreview ? 'border-brand-500 bg-brand-500/5' : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'}`}>
                            {refPreview ? (
                                <img src={refPreview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <UsersIcon className="w-10 h-10 mb-2" />
                                    <span className="text-[10px] font-bold uppercase">Upload Face</span>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} accept="image/*" />
                        </label>
                    </section>

                    <section className="space-y-4">
                        <label className={CYBER_LABEL}>2. Character Specs</label>
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Character Name</label>
                            <input 
                                type="text" 
                                value={formData.characterName} 
                                onChange={(e) => setFormData(prev => ({...prev, characterName: e.target.value}))} 
                                className={CYBER_INPUT} 
                                placeholder="e.g. Luna" 
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Physical Description</label>
                            <textarea 
                                value={formData.characterDescription} 
                                onChange={(e) => setFormData(prev => ({...prev, characterDescription: e.target.value}))} 
                                className={CYBER_INPUT} 
                                rows={3} 
                                placeholder="e.g. A cyberpunk hacker with neon blue hair, athletic build, cybernetic arm..." 
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Outfit Details</label>
                            <input 
                                type="text" 
                                value={formData.outfitDescription} 
                                onChange={(e) => setFormData(prev => ({...prev, outfitDescription: e.target.value}))} 
                                className={CYBER_INPUT} 
                                placeholder="e.g. Black leather jacket, combat boots..." 
                            />
                        </div>
                    </section>

                    <section>
                        <label className={CYBER_LABEL}>3. Art Direction</label>
                        <CyberDropdown 
                            value={formData.artStyle} 
                            options={CHARACTER_ART_STYLES} 
                            onChange={(val) => setFormData(prev => ({...prev, artStyle: val as CharacterArtStyle}))} 
                        />
                    </section>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !formData.referenceImage}
                        className={`w-full py-4 bg-gradient-to-r text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-wide
                            ${generationMode === 'speed' ? 'from-brand-600 to-accent-purple hover:from-brand-500' : 'from-accent-purple to-pink-600 hover:from-purple-500'}
                        `}
                    >
                        {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <UsersIcon className="w-5 h-5 mr-2"/>}
                        {isGenerating ? (generationMode === 'speed' ? 'Generating Sheet...' : 'Building Grid (Please Wait)...') : (generationMode === 'speed' ? 'Create Speed Sheet' : 'Create Hi-Fi Grid')}
                    </button>
                </div>
            </div>

            {/* Left: Result Panel */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-transparent">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-brand-500/20 flex items-center justify-center mr-2 lg:mr-3 text-brand-500 dark:text-brand-400"><DocumentTextIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                        {generationMode === 'speed' ? 'Single Sheet Output' : 'Grid Master Output'}
                    </h2>
                    
                    {/* Conditional Download Button */}
                    {(generatedSheet || gridPanels.some(p => p.base64)) && (
                        <button 
                            onClick={handleStitchAndDownload} 
                            disabled={isStitching}
                            className="bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center transition-all disabled:opacity-50"
                        >
                            {isStitching ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <ArrowDownTrayIcon className="w-4 h-4 mr-2" />} 
                            {isStitching ? 'Stitching 4K...' : 'Download 4K Sheet'}
                        </button>
                    )}
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-8 bg-gray-50/50 dark:bg-black/20 flex flex-col items-center">
                    {error && (
                        <div className="w-full max-w-lg mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 px-6 py-3 text-sm font-medium flex items-center shadow-xl backdrop-blur-md">
                            <XMarkIcon className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}

                    {/* SPEED MODE VIEW */}
                    {generationMode === 'speed' && (
                        <>
                            {isGenerating ? (
                                <div className="text-center space-y-4 my-auto">
                                    <div className="relative w-20 h-20 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-brand-500 animate-spin"></div>
                                        <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-accent-purple animate-spin animation-delay-150"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple text-xl font-display uppercase tracking-wider">{retryStatus || 'Constructing Sheet...'}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Generating 12-Panel Grid in one go...</p>
                                    </div>
                                </div>
                            ) : generatedSheet ? (
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                    <img 
                                        src={`data:image/png;base64,${generatedSheet}`} 
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10" 
                                        alt="Character Sheet" 
                                    />
                                </div>
                            ) : (
                                <div className="text-center my-auto opacity-50">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 shadow-inner mx-auto rotate-3 group hover:rotate-0 transition-transform duration-300">
                                        <BoltIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 font-display text-lg">Speed Mode Ready</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Fast generation for quick concepting.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* HI-FI GRID MODE VIEW */}
                    {generationMode === 'grid' && (
                        <>
                            {gridPanels.some(p => p.base64 || p.isLoading) ? (
                                <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {gridPanels.map((panel, idx) => {
                                        const pose = GRID_POSES.find(p => p.id === panel.id);
                                        return (
                                            <div key={panel.id} className="relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg group">
                                                {/* Header */}
                                                <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-white border border-white/10">
                                                    {pose?.label}
                                                </div>

                                                {/* Content */}
                                                {panel.isLoading ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
                                                        <ArrowPathIcon className="w-6 h-6 text-accent-purple animate-spin mb-2" />
                                                        <span className="text-[9px] font-bold text-white tracking-widest">RENDERING...</span>
                                                    </div>
                                                ) : panel.base64 ? (
                                                    <>
                                                        <img src={`data:image/png;base64,${panel.base64}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={pose?.label} />
                                                        
                                                        {/* Hover Controls */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleDownloadSingle(panel.base64!, `${formData.characterName}_${pose?.label}.png`)}
                                                                className="bg-white text-black px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform flex items-center"
                                                            >
                                                                <ArrowDownTrayIcon className="w-3 h-3 mr-1" /> Save
                                                            </button>
                                                            <button 
                                                                onClick={() => regenerateSinglePanel(panel.id)}
                                                                className="bg-accent-purple text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform flex items-center"
                                                            >
                                                                <ArrowPathIcon className="w-3 h-3 mr-1" /> Retry
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : panel.error ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-red-900/10">
                                                        <XMarkIcon className="w-8 h-8 mb-2" />
                                                        <span className="text-[9px] font-bold">FAILED</span>
                                                        <button onClick={() => regenerateSinglePanel(panel.id)} className="mt-2 text-[9px] underline">Retry</button>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-500">
                                                        <span className="text-[10px]">Waiting...</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center my-auto opacity-50">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 shadow-inner mx-auto rotate-3 group hover:rotate-0 transition-transform duration-300">
                                        <CubeIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 font-display text-lg">Hi-Fi Grid Mode</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Generates 12 high-resolution panels individually for maximum quality.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CharacterLockingStudio;
