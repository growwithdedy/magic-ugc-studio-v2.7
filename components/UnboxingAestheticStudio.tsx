
import React, { useState, useEffect } from 'react';
import type { Language, UnboxingFormData, UnboxingScene, PackagingType, UnboxingMood, UnboxingScriptPace, UnboxingFlowLength, UnboxingOutfitStyle, UnboxingClosingStrategy, UnboxingProductSize, HandGender, HandSkinTone } from '../types';
import { PACKAGING_TYPES, UNBOXING_MOODS, UNBOXING_SCRIPT_PACES, UNBOXING_FLOW_LENGTHS, UNBOXING_OUTFIT_STYLES, UNBOXING_PRODUCT_SIZES, UNBOXING_CLOSING_STRATEGIES, HAND_GENDERS, HAND_SKIN_TONES, LANGUAGES } from '../constants';
import { generateUnboxingContent, regenerateUnboxingSceneImage, analyzeUnboxingContext, retryOperation } from '../services/geminiService';
import { 
    ArchiveBoxIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, DocumentTextIcon, FolderArrowDownIcon, UsersIcon, VideoCameraIcon,
    ClipboardDocumentIcon, CheckCircleIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface UnboxingAestheticStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const UnboxingAestheticStudio: React.FC<UnboxingAestheticStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<UnboxingFormData>({
        productImage: null,
        modelImage: null,
        productName: '',
        productDescription: '',
        packagingType: 'Brown Cardboard Box',
        mood: 'ASMR / Silent',
        handSkinTone: 'Light',
        handGender: 'Female',
        backgroundVibe: 'Cozy Bedroom',
        scriptPace: '⚡ Snappy (Fast / TikTok)', 
        outfitStyle: 'Match Model Photo (Auto-Detect)',
        flowLength: 'Short (3 Scenes)',
        productSize: 'Handheld (Phone/Skincare)',
        closingStrategy: 'Satisfaction (Thumbs Up)',
        language: 'ID',
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [scenes, setScenes] = useState<UnboxingScene[]>([]);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);
    
    // Incremental rendering state
    const [isRendering, setIsRendering] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);

    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);

    // Preview State
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const handleImageUpload = (type: 'product' | 'model', file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'product') {
                setFormData(prev => ({ ...prev, productImage: file }));
                setProductPreview(reader.result as string);
                
                setIsAnalyzing(true);
                analyzeUnboxingContext(file).then(analysis => {
                    setFormData(prev => ({
                        ...prev,
                        productName: analysis.productName,
                        backgroundVibe: analysis.suggestedBackgrounds[0] || prev.backgroundVibe
                    }));
                }).catch(e => console.error(e)).finally(() => setIsAnalyzing(false));
            } else {
                setFormData(prev => ({ ...prev, modelImage: file }));
                setModelPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!formData.productImage) { setError("Please upload a product image."); return; }
        if (formData.usePro) {
            try { /* @ts-ignore */ const hasKey = await window.aistudio.hasSelectedApiKey(); if (!hasKey) { /* @ts-ignore */ await window.aistudio.openSelectKey(); } } catch (e) { console.error("API Key check failed", e); }
        }

        setIsGeneratingPlan(true);
        setError(null);
        setScenes([]);
        
        let initialPlan: UnboxingScene[] = [];

        try {
            initialPlan = await generateUnboxingContent(formData);
            setScenes(initialPlan);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate unboxing plan.");
            setIsGeneratingPlan(false);
            return; // Stop if plan generation fails
        } finally {
            setIsGeneratingPlan(false);
        }

        // Auto start rendering images incrementally with retry logic
        setIsRendering(true);
        setRetryStatus(null);
        
        // We use initialPlan here to iterate, but update 'scenes' state
        for (let i = 0; i < initialPlan.length; i++) {
            setProcessingIndex(i);
            try {
                await retryOperation(async () => {
                    const base64 = await regenerateUnboxingSceneImage(formData, initialPlan[i]);
                    setScenes(prev => {
                        const newScenes = [...prev];
                        if (newScenes[i]) {
                            newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                        }
                        return newScenes;
                    });
                }, 3, 2000, (attempt) => setRetryStatus(`Retrying scene ${i+1}... (${attempt}/3)`));
                
                setRetryStatus(null);
            } catch (e) { 
                console.error(e); 
                setError(`Rendering stopped at Scene ${i + 1}. Please try regenerating.`);
                setProcessingIndex(null);
                setIsRendering(false);
                return; // Stop execution
            }
        }
        
        setProcessingIndex(null);
        setIsRendering(false);
    };

    const handleRegenerateImage = async (index: number) => {
        setRegeneratingIndex(index);
        setError(null);
        setRetryStatus(null);
        try {
            await retryOperation(async () => {
                const base64 = await regenerateUnboxingSceneImage(formData, scenes[index]);
                setScenes(prev => {
                    const newScenes = [...prev];
                    newScenes[index] = { ...newScenes[index], visualKeyframe: base64 };
                    return newScenes;
                });
            }, 3, 2000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (e) { 
            console.error(e);
            setError("Failed to regenerate image.");
        } finally { 
            setRegeneratingIndex(null);
            setRetryStatus(null);
        }
    };

    const updateSceneData = (index: number, field: 'visual' | 'audio', value: string) => {
        setScenes(prev => prev.map((s, i) => {
            if (i !== index) return s;
            if (field === 'visual') return { ...s, visual_direction: { ...s.visual_direction, subject_action: value } };
            return { ...s, audio_direction: { ...s.audio_direction, voiceover_script: value } };
        }));
    };

    const getVeoPrompt = (scene: UnboxingScene) => {
        return JSON.stringify({
            subject_prompt: `Unboxing ${formData.productName}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: `${formData.mood}`,
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, watermark"
        }, null, 2);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const getSafeFilename = () => {
        return formData.projectName?.trim().replace(/\s+/g, '_') || 'unboxing';
    };

    const handleDownloadAll = async () => {
        if (isDownloadingAll) return;
        setIsDownloadingAll(true);
        const safeName = getSafeFilename();

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            if (scene.visualKeyframe) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${scene.visualKeyframe}`;
                link.download = `${safeName}_scene_${i + 1}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await new Promise(r => setTimeout(r, 500));
            }
        }
        setIsDownloadingAll(false);
    };

    const handleDownloadSingle = (base64: string, index: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `${getSafeFilename()}_scene_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CYBER_LABEL = "block text-[10px] font-black text-black uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black focus:ring-0 focus:border-black text-xs py-3 px-4 transition-all shadow-neo-sm placeholder-gray-400 font-bold";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right: Config (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Experience Config</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6 lg:space-y-8">
                    
                    {/* Project Name Input */}
                    <div>
                        <label className={CYBER_LABEL}>Project Name / Filename</label>
                        <input 
                            type="text" 
                            value={formData.projectName || ''} 
                            onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} 
                            className={CYBER_INPUT} 
                            placeholder="e.g. mystery_box_v1" 
                        />
                    </div>

                    {/* Pro Mode */}
                    <div className={`flex items-center justify-between p-3 border-4 border-black transition-all duration-300 ${formData.usePro ? 'bg-orange-400 shadow-neo' : 'bg-white shadow-neo-sm'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 border-2 border-black flex items-center justify-center shadow-neo-sm ${formData.usePro ? 'bg-white text-black' : 'bg-gray-100 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div>
                            <div><p className={`text-xs font-black uppercase ${formData.usePro ? 'text-black' : 'text-gray-500'}`}>Pro Mode</p></div>
                        </div>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-400' : 'bg-gray-200'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border-2 border-black shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    <section>
                        <label className={CYBER_LABEL}>1. Assets Upload</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-blue-500' : 'border-gray-300 dark:border-white/20 hover:border-blue-400 bg-gray-50 dark:bg-white/5'}`}>
                                {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center"><ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin mb-1"/><span className="text-[9px] text-white font-bold">Analyzing...</span></div>}
                                {productPreview ? <img src={productPreview} className="w-full h-full object-contain p-2" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Package/Item</span></div>}
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                            </label>
                            <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${modelPreview ? 'border-blue-500' : 'border-gray-300 dark:border-white/20 hover:border-blue-400 bg-gray-50 dark:bg-white/5'}`}>
                                {modelPreview ? <img src={modelPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><UsersIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Hand/Model Ref</span></div>}
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                            </label>
                        </div>
                        <div className="mt-3">
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Product Name</label>
                            <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Mystery Box..." />
                        </div>
                    </section>
                    
                    <section>
                        <label className={CYBER_LABEL}>2. Packaging & Mood</label>
                        <div className="space-y-3">
                             <CyberDropdown label="Packaging Type" value={formData.packagingType} options={PACKAGING_TYPES} onChange={(val) => setFormData(prev => ({...prev, packagingType: val as PackagingType}))} />
                             <CyberDropdown label="Unboxing Mood" value={formData.mood} options={UNBOXING_MOODS} onChange={(val) => setFormData(prev => ({...prev, mood: val as UnboxingMood}))} />
                             <CyberDropdown label="Product Size" value={formData.productSize} options={UNBOXING_PRODUCT_SIZES} onChange={(val) => setFormData(prev => ({...prev, productSize: val as UnboxingProductSize}))} />
                        </div>
                    </section>

                    <section>
                        <label className={CYBER_LABEL}>3. Video Flow</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <CyberDropdown label="Duration" value={formData.flowLength} options={UNBOXING_FLOW_LENGTHS} onChange={(val) => setFormData(prev => ({...prev, flowLength: val as UnboxingFlowLength}))} />
                            {/* Pace Dropdown Removed */}
                        </div>
                        <div className="space-y-3">
                             <CyberDropdown label="Closing / CTA" value={formData.closingStrategy} options={UNBOXING_CLOSING_STRATEGIES} onChange={(val) => setFormData(prev => ({...prev, closingStrategy: val as UnboxingClosingStrategy}))} />
                             <div>
                                 <label className="text-[9px] text-gray-500 font-bold mb-1 block">Hand Appearance</label>
                                 <div className="grid grid-cols-2 gap-2">
                                    <CyberDropdown value={formData.handGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, handGender: val as HandGender}))} />
                                    <CyberDropdown value={formData.handSkinTone} options={HAND_SKIN_TONES} onChange={(val) => setFormData(prev => ({...prev, handSkinTone: val as HandSkinTone}))} />
                                 </div>
                             </div>
                        </div>
                    </section>
                </div>

                <div className="p-4 lg:p-6 border-t-4 border-black bg-white z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGeneratingPlan || !formData.productImage}
                        className="w-full py-4 bg-yellow-400 text-black border-4 border-black font-black text-sm shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        {isGeneratingPlan ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2"/>}
                        {isGeneratingPlan ? 'Planning Unboxing...' : 'Generate Unboxing Plan'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b-4 border-black bg-white flex justify-between items-center">
                    <h2 className="text-sm lg:text-xl font-black text-black flex items-center uppercase tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 border-2 border-black bg-cyan-400 flex items-center justify-center mr-2 lg:mr-3 text-black shadow-neo-sm"><ArchiveBoxIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                        Unboxing Preview
                    </h2>
                    <div className="flex items-center gap-2">
                        {scenes.some(s => s.visualKeyframe) && (
                            <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="bg-white hover:bg-gray-50 text-black border-2 border-black px-4 py-2 text-xs font-black shadow-neo-sm flex items-center transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest">
                                {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                {isDownloadingAll ? 'Downloading...' : 'Download All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium">{error}</div>}

                    {isGeneratingPlan ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                            <div className="relative w-16 h-16 lg:w-24 lg:h-24"><div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-cyan-500 animate-spin animation-delay-150"></div></div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white font-display">Crafting Storyboard...</p>
                        </div>
                    ) : scenes.length > 0 ? (
                        <div className="space-y-8 max-w-5xl mx-auto pb-20">
                            {scenes.map((scene, idx) => {
                                const isLoading = (isRendering && processingIndex === idx) || regeneratingIndex === idx;
                                const isWaiting = isRendering && !scene.visualKeyframe && processingIndex !== idx;

                                return (
                                <div key={scene.id} className={`bg-white border-4 border-black transition-all duration-300 overflow-hidden shadow-neo flex flex-col md:flex-row ${processingIndex === idx ? 'ring-4 ring-yellow-400' : ''}`}>
                                    {/* LEFT: VISUAL MONITOR */}
                                    <div className="w-full md:w-[280px] lg:w-[320px] bg-gray-100 border-b md:border-b-0 md:border-r-4 border-black relative flex-shrink-0 flex flex-col">
                                        <div 
                                            className={`aspect-[9/16] w-full relative bg-gray-200 ${scene.visualKeyframe ? 'cursor-zoom-in group' : ''}`}
                                            onClick={() => scene.visualKeyframe && setPreviewIndex(idx)}
                                        >
                                            {isLoading ? (
                                                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                    <ArrowPathIcon className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                                                    <span className="text-[10px] text-black font-black tracking-widest uppercase">{retryStatus || 'RENDERING...'}</span>
                                                </div>
                                            ) : scene.visualKeyframe ? (
                                                <>
                                                    <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                    
                                                    {/* OVERLAY BUTTONS */}
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }}
                                                            className="bg-white text-black border-2 border-black p-2 rounded-full shadow-neo-sm hover:scale-110 pointer-events-auto transform transition-transform"
                                                            title="Download"
                                                        >
                                                            <ArrowDownTrayIcon className="w-4 h-4" /> 
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRegenerateImage(idx); }}
                                                            className="bg-yellow-400 text-black border-2 border-black p-2 rounded-full shadow-neo-sm hover:scale-110 pointer-events-auto transform transition-transform"
                                                            title="Regenerate"
                                                        >
                                                            <ArrowPathIcon className="w-4 h-4" /> 
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                                    <VideoCameraIcon className={`w-10 h-10 mb-2 ${isWaiting ? 'opacity-30' : 'opacity-10'}`} />
                                                    <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{isWaiting ? 'WAITING QUEUE' : 'NO IMAGE'}</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 bg-black text-white px-2 py-1 border-2 border-black text-[10px] font-black shadow-neo-sm pointer-events-none uppercase tracking-widest">SCENE {idx + 1}</div>
                                        </div>
                                    </div>

                                    {/* RIGHT: CONTROLS */}
                                    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-6 bg-gray-50/30 dark:bg-white/[0.02]">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center"><PhotoIcon className="w-3 h-3 mr-1.5" /> Visual Action</label>
                                                <button onClick={() => handleRegenerateImage(idx)} disabled={isLoading || isRendering} className="text-[10px] font-bold text-gray-500 hover:text-blue-500 flex items-center transition-colors disabled:opacity-50"><ArrowPathIcon className={`w-3 h-3 mr-1 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} /> Regenerate</button>
                                            </div>
                                            <textarea className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px] leading-relaxed" value={scene.visual_direction.subject_action} onChange={(e) => updateSceneData(idx, 'visual', e.target.value)} />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center"><DocumentTextIcon className="w-3 h-3 mr-1.5" /> Audio Script</label>
                                            <textarea className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px] italic leading-relaxed" value={scene.audio_direction.voiceover_script} onChange={(e) => updateSceneData(idx, 'audio', e.target.value)} />
                                        </div>

                                        <div className="bg-gray-900 rounded-xl p-4 border border-white/10 relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center"><SparklesIcon className="w-3 h-3 mr-1.5" /> Veo Prompt (JSON)</label>
                                                <button onClick={() => copyToClipboard(getVeoPrompt(scene), idx)} className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center transition-colors bg-white/10 px-2 py-1 rounded-md">{copiedIndex === idx ? <CheckCircleIcon className="w-3 h-3 mr-1.5 text-green-400" /> : <ClipboardDocumentIcon className="w-3 h-3 mr-1.5" />} {copiedIndex === idx ? 'Copied!' : 'Copy JSON'}</button>
                                            </div>
                                            <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar select-all">{getVeoPrompt(scene)}</pre>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 border border-gray-200 dark:border-white/10 shadow-inner">
                                <ArchiveBoxIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Unboxing Studio</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Upload assets to visualize the unboxing experience.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <ScenePreviewModal 
                isOpen={previewIndex !== null}
                onClose={() => setPreviewIndex(null)}
                imageUrl={previewIndex !== null && scenes[previewIndex]?.visualKeyframe ? scenes[previewIndex].visualKeyframe : undefined}
                sceneNumber={previewIndex !== null ? previewIndex + 1 : 0}
                totalScenes={scenes.length}
                onNext={() => setPreviewIndex(prev => prev !== null ? (prev + 1) % scenes.length : null)}
                onPrev={() => setPreviewIndex(prev => prev !== null ? (prev - 1 + scenes.length) % scenes.length : null)}
                onRegenerate={() => previewIndex !== null && handleRegenerateImage(previewIndex)}
                onSave={() => previewIndex !== null && scenes[previewIndex]?.visualKeyframe && handleDownloadSingle(scenes[previewIndex].visualKeyframe!, previewIndex)}
                isRegenerating={regeneratingIndex !== null}
            />
        </div>
    );
};

export default UnboxingAestheticStudio;
