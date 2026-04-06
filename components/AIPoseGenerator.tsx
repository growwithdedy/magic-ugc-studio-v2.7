import React, { useState, useEffect } from 'react';
import type { Language, PoseGenerationResult } from '../types';
import { POSE_THEMES } from '../constants';
import { generatePoseVariations } from '../services/geminiService';
import { 
    PhotoIcon, SparklesIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, UsersIcon, ArrowLeftIcon, ArrowRightIcon, 
    ClipboardDocumentIcon, CheckCircleIcon, VideoCameraIcon, ExclamationTriangleIcon 
} from './icons';

interface AIPoseGeneratorProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const AIPoseGenerator: React.FC<AIPoseGeneratorProps> = ({ language, globalModel, globalModelPreview }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedThemeId, setSelectedThemeId] = useState<string>('Minimalist & Japandi');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<PoseGenerationResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [usePro, setUsePro] = useState(false);

    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !uploadedFile) {
            setUploadedFile(globalModel);
            setImagePreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const handleFileChange = (file: File | undefined) => {
        if (file) {
            setUploadedFile(file);
            setGeneratedResults([]);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!uploadedFile) { setError("Mohon unggah foto model terlebih dahulu."); return; }
        if (usePro) { try { /* @ts-ignore */ const hasKey = await window.aistudio.hasSelectedApiKey(); if (!hasKey) { /* @ts-ignore */ await window.aistudio.openSelectKey(); } } catch (e) { console.error("API Key check failed", e); } }
        setIsGenerating(true); setError(null); setGeneratedResults([]);
        try { const results = await generatePoseVariations(uploadedFile, selectedThemeId, customPrompt, usePro); setGeneratedResults(results); } catch (err) { setError(err instanceof Error ? err.message : "Gagal membuat variasi pose."); } finally { setIsGenerating(false); }
    };

    const downloadImage = (base64: string, name: string) => { const link = document.createElement('a'); link.href = `data:image/png;base64,${base64}`; link.download = `${name.replace(/\s/g, '_')}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    const generateVeoPrompt = (result: PoseGenerationResult) => { const { job, backgroundPrompt } = result; let cameraMovement = "The scene comes alive with subtle, natural movements."; if (job.cameraAngleName.includes('Full Body')) cameraMovement = 'A slow, elegant dolly-in towards the subject.'; else if (job.cameraAngleName.includes('Close Up')) cameraMovement = 'A very subtle zoom-in, drawing attention to the expression.'; else if (job.cameraAngleName.includes('High Angle')) cameraMovement = 'A slow, cinematic crane shot moving downwards.'; return `Animate this image. The scene is: ${backgroundPrompt}. The subject is in a '${job.name}'. ${cameraMovement} The subject makes a subtle movement. Cinematic, photorealistic, 4K.`; };
    const copyI2VPrompt = (result: PoseGenerationResult, index: number) => { const prompt = generateVeoPrompt(result); navigator.clipboard.writeText(prompt).then(() => { setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }); };
    const openPreview = (index: number) => { setCurrentPreviewIndex(index); setIsPreviewOpen(true); }; const closePreview = () => setIsPreviewOpen(false); const goToNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentPreviewIndex(prev => (prev + 1) % generatedResults.length); }; const goToPrevious = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentPreviewIndex(prev => (prev - 1 + generatedResults.length) % generatedResults.length); };

    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";
    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
             <style>{` input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px #0f172a inset !important; -webkit-text-fill-color: white !important; } `}</style>

            {/* Right: Settings (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Configuration</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6 lg:space-y-8">
                     {/* Pro Mode */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div>
                            <div><p className="text-xs font-bold text-gray-900 dark:text-white">Pro Mode</p></div>
                        </div>
                        <button type="button" onClick={() => setUsePro(!usePro)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    {/* 1. Upload Model */}
                    <section>
                        <label className={CYBER_LABEL}>1. Model Upload</label>
                        <label className={`block w-full aspect-[4/3] rounded-2xl border border-dashed cursor-pointer overflow-hidden relative transition-all flex flex-col items-center justify-center group ${imagePreview ? 'border-brand-500' : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'}`}>
                            {imagePreview ? <img src={imagePreview} className="w-full h-full object-contain p-2" /> : <div className="text-center text-gray-400"><UsersIcon className="w-10 h-10 mx-auto mb-3" /><span className="text-xs font-bold">Click to upload</span></div>}
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} accept="image/*" />
                        </label>
                    </section>

                    {/* 2. Theme */}
                    <section>
                        <label className={CYBER_LABEL}>2. Background Theme</label>
                        <div className="grid grid-cols-4 gap-2">
                            {POSE_THEMES.map(theme => {
                                const Icon = theme.icon;
                                const isSelected = selectedThemeId === theme.id;
                                return (
                                    <button key={theme.id} onClick={() => setSelectedThemeId(theme.id)} className={`flex flex-col items-center justify-center p-2 lg:p-3 rounded-xl border aspect-square transition-all ${isSelected ? 'bg-brand-50 dark:bg-brand-500/20 border-brand-500 text-brand-700 dark:text-brand-300 shadow-lg' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                                        <Icon className={`w-4 h-4 lg:w-5 lg:h-5 mb-1 lg:mb-2 ${theme.color}`} />
                                        <span className="text-[8px] lg:text-[9px] font-bold leading-tight text-center tracking-wide">{theme.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedThemeId === 'Custom' && <div className="mt-4"><label className="text-[9px] font-bold text-gray-500 mb-1 block">Custom Prompt</label><textarea rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Describe your scene..." className={CYBER_INPUT} /></div>}
                    </section>
                </div>

                <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button onClick={handleGenerate} disabled={isGenerating || !uploadedFile} className="w-full py-4 bg-gradient-to-r from-brand-600 to-accent-purple text-white rounded-xl font-bold text-sm shadow-lg hover:from-brand-500 hover:to-accent-pink disabled:opacity-50 transition-all flex items-center justify-center uppercase">
                        {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2"/>}
                        {isGenerating ? 'Processing...' : 'Generate 9 Poses'}
                    </button>
                </div>
            </div>

            {/* Left/Middle: Gallery (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent flex justify-between items-center">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-brand-500/20 flex items-center justify-center mr-2 lg:mr-3 text-brand-500 dark:text-brand-400"><UsersIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                        Pose Generator
                        {generatedResults.length > 0 && <span className="ml-3 text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full uppercase tracking-wider border border-brand-500/20">{generatedResults.length}</span>}
                    </h2>
                    {generatedResults.length > 0 && (
                        <button onClick={() => setIsVideoModalOpen(true)} className="text-[10px] lg:text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/20 px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-colors flex items-center hover:bg-brand-100 dark:hover:bg-brand-500/30 border border-transparent dark:border-brand-500/30">
                            <VideoCameraIcon className="w-3 h-3 mr-1.5" /> Animate
                        </button>
                    )}
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2" />{error}</div>}

                    {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                            <div className="relative w-16 h-16 lg:w-24 lg:h-24"><div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-brand-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-accent-purple animate-spin animation-delay-150"></div></div>
                            <p className="text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple font-display">Generating Poses...</p>
                        </div>
                    ) : generatedResults.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                            {generatedResults.map((result, index) => (
                                <div key={result.id} className="group relative rounded-xl lg:rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl transition-all ring-1 ring-gray-200 dark:ring-white/10 flex flex-col">
                                    <div className="aspect-[3/4] w-full cursor-pointer relative overflow-hidden" onClick={() => openPreview(index)}>
                                        <img src={`data:image/png;base64,${result.base64}`} alt={result.job.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-2 backdrop-blur-sm">
                                            <button onClick={(e) => { e.stopPropagation(); downloadImage(result.base64, result.job.name); }} className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 text-xs font-bold shadow-lg flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors"><ArrowDownTrayIcon className="w-4 h-4 mr-1.5" /> Download</button>
                                            <button onClick={(e) => { e.stopPropagation(); copyI2VPrompt(result, index); }} className="w-full bg-brand-600 text-white rounded-lg px-3 py-2 text-xs font-bold shadow-lg flex items-center justify-center hover:bg-brand-500 transition-colors">{copiedIndex === index ? <CheckCircleIcon className="w-4 h-4 mr-1.5" /> : <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />} {copiedIndex === index ? 'Copied' : 'Prompt'}</button>
                                        </div>
                                    </div>
                                    <div className="p-2 lg:p-3 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate font-display" title={result.job.name}>{result.job.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate font-mono">{result.job.cameraAngleName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 border border-gray-200 dark:border-white/10 shadow-inner">
                                <UsersIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Pose Studio</h4>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && generatedResults.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={closePreview}>
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
                    <div className="relative w-full max-w-5xl h-[80vh] md:h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                            <img src={`data:image/png;base64,${generatedResults[currentPreviewIndex].base64}`} className="max-w-full max-h-full object-contain rounded-xl" />
                        </div>
                        <div className="absolute bottom-4 md:bottom-8 z-20 flex gap-4">
                            <button onClick={() => downloadImage(generatedResults[currentPreviewIndex].base64, generatedResults[currentPreviewIndex].job.name)} className="flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-bold shadow-lg"><ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download</button>
                        </div>
                        <button onClick={closePreview} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIPoseGenerator;