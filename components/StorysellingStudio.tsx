import React, { useState, useEffect } from 'react';
import type { Language, StorysellingFormData, UGCScene, StorysellingFramework, StorysellingHook, StoryMood, StorySetting, UGCScriptDuration, HandGender } from '../types';
// Fix: Use singular STORY_MOOD to match constant.ts export
import { STORYSELLING_FRAMEWORKS, STORYSELLING_HOOKS, UGC_TARGET_AUDIENCES, STORY_MOOD, STORY_SETTINGS, UGC_SCRIPT_DURATIONS, HAND_GENDERS } from '../constants';
import { generateStorysellingContent, generateStorySceneImage, analyzeProductImage, retryOperation } from '../services/geminiService';
import { 
    VideoCameraIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, DocumentTextIcon, RocketLaunchIcon, FolderArrowDownIcon, UsersIcon,
    ClipboardDocumentIcon, CheckCircleIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface StorysellingStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const StorysellingStudio: React.FC<StorysellingStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<StorysellingFormData>({
        productImage: null,
        modelImage: null,
        productName: '',
        productDescription: '',
        modelGender: 'Female',
        isHijabModel: false,
        modelOutfit: 'Casual',
        storySetting: '🏠 Cozy Bedroom (Rainy)',
        targetAudience: UGC_TARGET_AUDIENCES[0].value,
        framework: STORYSELLING_FRAMEWORKS[0].value,
        hookType: STORYSELLING_HOOKS[0].value,
        painPoint: '',
        desiredState: '',
        mood: '😢 Melancholic to Happy (Healing)',
        language: 'Bahasa Indonesia',
        duration: 'Detailed (Long)', 
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    
    // Incremental Rendering State
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scenes, setScenes] = useState<UGCScene[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
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
                analyzeProductImage(file).then(res => {
                    setFormData(prev => ({
                        ...prev,
                        productName: res.productName,
                        productDescription: res.productDescription,
                        painPoint: res.painPoint || prev.painPoint,
                        desiredState: res.desiredState || prev.desiredState,
                        targetAudience: res.suggestedTargetAudience || prev.targetAudience
                    }));
                }).catch(console.error).finally(() => setIsAnalyzing(false));
            } else {
                setFormData(prev => ({ ...prev, modelImage: file }));
                setModelPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateScript = async () => {
        if (!formData.productImage) { setError("Please upload a product image."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingScript(true);
        setError(null);
        setScenes([]);
        
        try {
            const generatedScenes = await generateStorysellingContent(formData);
            setScenes(generatedScenes);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate story script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateVisuals = async () => {
        setIsGeneratingImages(true);
        setError(null);
        setRetryStatus(null);
        
        for (let i = 0; i < scenes.length; i++) {
            if (!scenes[i].visualKeyframe) {
                setProcessingIndex(i);
                try {
                    await retryOperation(async () => {
                        const base64 = await generateStorySceneImage(formData, scenes[i]);
                        setScenes(prev => {
                            const newScenes = [...prev];
                            newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                            return newScenes;
                        });
                    }, 3, 2000, (attempt) => setRetryStatus(`Retrying scene ${i+1}... (${attempt}/3)`));
                    
                    setRetryStatus(null);
                } catch (err) { 
                    console.error(err);
                    setError(`Rendering stopped at Scene ${i + 1}. Please try regenerating.`);
                    setProcessingIndex(null);
                    setIsGeneratingImages(false);
                    return; // Stop execution
                }
            }
        }
        
        setProcessingIndex(null);
        setIsGeneratingImages(false);
    };

    const handleRegenerateImage = async (index: number) => {
        setRegeneratingIndex(index);
        setError(null);
        setRetryStatus(null);
        try {
            await retryOperation(async () => {
                const base64 = await generateStorySceneImage(formData, scenes[index]);
                setScenes(prev => {
                    const newScenes = [...prev];
                    newScenes[index] = { ...newScenes[index], visualKeyframe: base64 };
                    return newScenes;
                });
            }, 3, 2000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (err) { 
            console.error(err);
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

    const getVeoPrompt = (scene: UGCScene) => {
        return JSON.stringify({
            subject_prompt: `${formData.productName}. Character in ${formData.storySetting}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: scene.audio_direction.voice_emotion,
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, bad anatomy, watermark"
        }, null, 2);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const getSafeFilename = () => formData.projectName?.trim().replace(/\s+/g, '_') || 'story';

    const handleDownloadAll = async () => {
        if (isDownloadingAll) return;
        setIsDownloadingAll(true);
        const safeName = getSafeFilename();

        for (let i = 0; i < scenes.length; i++) {
            if (scenes[i].visualKeyframe) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${scenes[i].visualKeyframe}`;
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

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";
    const SECTION_HEADER = "text-xs font-bold text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-2 mb-4 mt-6 first:mt-0";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right: Config (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Narrative Config</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6">
                    <div className="mb-6"><label className={CYBER_LABEL}>Project Filename</label><input type="text" value={formData.projectName} onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. brand_story_v1" /></div>

                    {/* Pro Toggle */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 mb-6 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div>
                            <div><p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode</p></div>
                        </div>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    {/* 1. CAST & WORLD */}
                    <h4 className={SECTION_HEADER}>1. Cast & World</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-indigo-500' : 'border-gray-300 dark:border-white/20 hover:border-indigo-400 bg-gray-50 dark:bg-white/5'}`}>
                            {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-center p-4"><ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin mb-2"/><span className="text-xs text-white font-bold block">Analyzing...</span></div>}
                            {productPreview ? <img src={productPreview} className="w-full h-full object-contain p-2" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Product</span></div>}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                        </label>
                        <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${modelPreview ? 'border-indigo-500' : 'border-gray-300 dark:border-white/20 hover:border-indigo-400 bg-gray-50 dark:bg-white/5'}`}>
                            {modelPreview ? <img src={modelPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><UsersIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Model Ref</span></div>}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                        </label>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Product Name</label><input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} /></div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <CyberDropdown label="Model Gender" value={formData.modelGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, modelGender: val as any}))} />
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold mb-1 block">Hijab Model</label>
                                <button onClick={() => setFormData(prev => ({...prev, isHijabModel: !prev.isHijabModel}))} className={`w-full py-3 rounded-xl border text-xs font-bold transition-all ${formData.isHijabModel ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'}`}>{formData.isHijabModel ? 'Yes, Hijab' : 'No Hijab'}</button>
                            </div>
                        </div>
                        
                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Outfit</label><input type="text" value={formData.modelOutfit} onChange={(e) => setFormData(prev => ({...prev, modelOutfit: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Casual chic, Office wear" /></div>
                        <CyberDropdown label="Setting / Location" value={formData.storySetting} options={STORY_SETTINGS} onChange={(val) => setFormData(prev => ({...prev, storySetting: val as any}))} />
                    </div>

                    {/* 2. NARRATIVE ARC */}
                    <h4 className={SECTION_HEADER}>2. Narrative Arc</h4>
                    <div className="space-y-4 mb-6">
                        <CyberDropdown label="Target Audience" value={formData.targetAudience} options={UGC_TARGET_AUDIENCES} onChange={(val) => setFormData(prev => ({...prev, targetAudience: val}))} />
                        <CyberDropdown label="Framework" value={formData.framework} options={STORYSELLING_FRAMEWORKS} onChange={(val) => setFormData(prev => ({...prev, framework: val as StorysellingFramework}))} />
                        <CyberDropdown label="Emotional Hook" value={formData.hookType} options={STORYSELLING_HOOKS} onChange={(val) => setFormData(prev => ({...prev, hookType: val as StorysellingHook}))} />
                        
                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Pain Point (Musuh)</label><textarea value={formData.painPoint} onChange={(e) => setFormData(prev => ({...prev, painPoint: e.target.value}))} className={CYBER_INPUT} rows={2} placeholder="e.g. Jerawat yang bikin malu..." /></div>
                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Desired State (Mimpi)</label><textarea value={formData.desiredState} onChange={(e) => setFormData(prev => ({...prev, desiredState: e.target.value}))} className={CYBER_INPUT} rows={2} placeholder="e.g. Wajah glowing percaya diri..." /></div>
                    </div>

                    {/* 3. TONE & DELIVERY */}
                    <h4 className={SECTION_HEADER}>3. Tone & Delivery</h4>
                    <div className="space-y-4 mb-6">
                        {/* Fix: Use STORY_MOOD singular to match constants.ts export */}
                        <CyberDropdown label="Mood / Atmosphere" value={formData.mood} options={STORY_MOOD} onChange={(val) => setFormData(prev => ({...prev, mood: val as StoryMood}))} />
                        <CyberDropdown label="Language" value={formData.language} options={['Bahasa Indonesia', 'English', 'Storytelling Style']} onChange={(val) => setFormData(prev => ({...prev, language: val}))} />
                        <CyberDropdown label="Duration" value={formData.duration} options={UGC_SCRIPT_DURATIONS} onChange={(val) => setFormData(prev => ({...prev, duration: val as UGCScriptDuration}))} />
                    </div>
                </div>

                <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript || !formData.productImage}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg hover:from-indigo-500 hover:to-purple-400 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-wide"
                    >
                        {isGeneratingScript ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <DocumentTextIcon className="w-5 h-5 mr-2"/>}
                        {isGeneratingScript ? 'Writing Story...' : 'Draft Storyboard'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent flex justify-between items-center">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mr-2 lg:mr-3 text-indigo-500 dark:text-indigo-400"><RocketLaunchIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                        Story Monitor
                    </h2>
                    <div className="flex items-center gap-2">
                        {scenes.length > 0 && !scenes.some(s => s.visualKeyframe) && (
                            <button onClick={handleGenerateVisuals} disabled={isGeneratingImages} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center disabled:opacity-50">
                                {isGeneratingImages ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                {isGeneratingImages ? (retryStatus ? 'Retrying...' : 'Visualizing...') : 'Visualize Story'}
                            </button>
                        )}
                        {scenes.some(s => s.visualKeyframe) && (
                            <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center transition-all">
                                {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                {isDownloadingAll ? 'Downloading...' : 'Download All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium">{error}</div>}

                    {isGeneratingScript ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                            <div className="relative w-16 h-16"><div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-indigo-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-purple-500 animate-spin animation-delay-150"></div></div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white font-display">Crafting Narrative...</p>
                        </div>
                    ) : scenes.length > 0 ? (
                        <div className="space-y-8 max-w-5xl mx-auto pb-20">
                            {scenes.map((scene, idx) => {
                                const isLoading = (isGeneratingImages && processingIndex === idx) || regeneratingIndex === idx;
                                const isWaiting = isGeneratingImages && !scene.visualKeyframe && processingIndex !== idx;

                                return (
                                <div key={scene.id} className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg flex flex-col md:flex-row ${processingIndex === idx ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-white/10'}`}>
                                    {/* VISUAL */}
                                    <div className="w-full md:w-[280px] lg:w-[320px] bg-gray-100 dark:bg-black/40 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10 relative flex-shrink-0 flex flex-col">
                                        <div 
                                            className={`aspect-[9/16] w-full relative bg-gray-200 dark:bg-gray-800 ${scene.visualKeyframe ? 'cursor-zoom-in group' : ''}`}
                                            onClick={() => scene.visualKeyframe && setPreviewIndex(idx)}
                                        >
                                            {isLoading ? (
                                                <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                                                    <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                                    <span className="text-[10px] text-indigo-400 font-bold tracking-widest">{retryStatus || 'RENDERING...'}</span>
                                                </div>
                                            ) : scene.visualKeyframe ? (
                                                <>
                                                    <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                    
                                                    {/* OVERLAY BUTTONS */}
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }}
                                                            className="bg-white/90 text-black p-2 rounded-full shadow-lg hover:bg-white pointer-events-auto transform hover:scale-110 transition-transform"
                                                            title="Download"
                                                        >
                                                            <ArrowDownTrayIcon className="w-4 h-4" /> 
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRegenerateImage(idx); }}
                                                            className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-500 pointer-events-auto transform hover:scale-110 transition-transform"
                                                            title="Regenerate"
                                                        >
                                                            <ArrowPathIcon className="w-4 h-4" /> 
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                                    <VideoCameraIcon className={`w-10 h-10 mb-2 ${isWaiting ? 'opacity-30' : 'opacity-10'}`} />
                                                    <span className="text-[10px] font-bold opacity-50">{isWaiting ? 'WAITING QUEUE' : 'NO IMAGE'}</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 shadow-sm pointer-events-none">SCENE {idx + 1}</div>
                                        </div>
                                    </div>

                                    {/* CONTROLS */}
                                    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-6 bg-gray-50/30 dark:bg-white/[0.02]">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center"><PhotoIcon className="w-3 h-3 mr-1.5" /> Visual Prompt</label>
                                                <button onClick={() => handleRegenerateImage(idx)} disabled={isLoading || isGeneratingImages} className="text-[10px] font-bold text-gray-500 hover:text-indigo-500 flex items-center transition-colors disabled:opacity-50"><ArrowPathIcon className={`w-3 h-3 mr-1 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} /> Regenerate Image</button>
                                            </div>
                                            <textarea className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-brand-500 min-h-[80px] leading-relaxed" value={scene.visual_direction.subject_action} onChange={(e) => updateSceneData(idx, 'visual', e.target.value)} />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center"><DocumentTextIcon className="w-3 h-3 mr-1.5" /> Narration</label>
                                            <textarea className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-brand-500 min-h-[60px] italic leading-relaxed" value={scene.audio_direction.voiceover_script} onChange={(e) => updateSceneData(idx, 'audio', e.target.value)} />
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
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 shadow-inner">
                                <RocketLaunchIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Storyselling Studio</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Create emotional connections that sell.</p>
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

export default StorysellingStudio;