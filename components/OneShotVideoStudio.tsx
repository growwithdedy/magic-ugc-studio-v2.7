import React, { useState, useEffect } from 'react';
import type { Language, OneShotFormData, OneShotScene, OneShotMode, OneShotPlatform, OneShotCTA, HandGender, OneShotCameraMotion } from '../types';
import { ONE_SHOT_PLATFORMS, ONE_SHOT_CTA_OPTIONS, HAND_GENDERS, UGC_TARGET_AUDIENCES, ONE_SHOT_CAMERA_MOTIONS, UGC_HOOK_TEMPLATES } from '../constants';
import { generateOneShotPlan, generateOneShotKeyframe, analyzeOneShotInput } from '../services/geminiService';
import { 
    FilmIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    FolderArrowDownIcon, PencilIcon, CheckCircleIcon, UsersIcon,
    VideoCameraIcon, ClipboardDocumentIcon, ChevronDownIcon, DocumentTextIcon, XMarkIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface OneShotVideoStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const OneShotVideoStudio: React.FC<OneShotVideoStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<OneShotFormData>({
        productImage: null,
        modelImage: null, 
        productName: '',
        productDescription: '',
        productContext: '',
        usps: [],
        greeting: '',
        hookTemplate: '',
        targetAudience: UGC_TARGET_AUDIENCES[0].value,
        mode: 'Mode Reviewer (Vlog)',
        cameraMotion: '🎥 Dynamic Zoom',
        backgroundVibe: 'Native / Authentic',
        platform: 'TikTok',
        ctaStrategy: 'Jualan Langsung (Hard Sell)',
        modelGender: 'Female',
        sceneCount: 3,
        language: 'Bahasa Indonesia',
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelOverridePreview, setModelOverridePreview] = useState<string | null>(null);
    const [scenes, setScenes] = useState<OneShotScene[]>([]);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            // For One-Shot, keeping it empty by default to enforce simplicity, 
            // but ensuring consistency if user opts for override.
        }
    }, [globalModel, globalModelPreview]);

    const [isRendering, setIsRendering] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);

    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [suggestedGreetings, setSuggestedGreetings] = useState<string[]>([]);
    const [newUSP, setNewUSP] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Preview State
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const handleMainUpload = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, productImage: file }));
            setProductPreview(reader.result as string);
            
            setIsAnalyzing(true);
            analyzeOneShotInput(file).then(analysis => {
                setFormData(prev => ({
                    ...prev,
                    productName: analysis.productName,
                    productDescription: analysis.productDescription,
                    targetAudience: analysis.suggestedAudience || prev.targetAudience,
                    usps: analysis.usps || [],
                }));
                setSuggestedGreetings(analysis.suggestedGreetings || []);
            }).catch(e => console.error(e)).finally(() => setIsAnalyzing(false));
        };
        reader.readAsDataURL(file);
    };

    const handleModelOverrideUpload = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, modelImage: file }));
            setModelOverridePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const addUSP = () => {
        if (!newUSP.trim()) return;
        if (formData.usps && formData.usps.length >= 5) { setError("Maximum 5 USPs allowed."); return; }
        setFormData(prev => ({ ...prev, usps: [...(prev.usps || []), newUSP.trim()] }));
        setNewUSP('');
        setError(null);
    };

    const removeUSP = (index: number) => {
        setFormData(prev => ({ ...prev, usps: (prev.usps || []).filter((_, i) => i !== index) }));
    };

    const handleGenerate = async () => {
        if (!formData.productImage) { setError("Please upload your photo first."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingPlan(true);
        setError(null);
        setScenes([]);
        
        try {
            const plan = await generateOneShotPlan(formData);
            setScenes(plan);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate one-shot plan.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleRenderVisuals = async () => {
        setIsRendering(true);
        for (let i = 0; i < scenes.length; i++) {
            if(!scenes[i].visualKeyframe) {
                setProcessingIndex(i);
                try {
                    const base64 = await generateOneShotKeyframe(formData, scenes[i]);
                    setScenes(prev => {
                        const newScenes = [...prev];
                        newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                        return newScenes;
                    });
                } catch (e) { console.error(e); }
            }
        }
        setProcessingIndex(null);
        setIsRendering(false);
    };

    const handleRegenerateSingleScene = async (index: number) => {
        setRegeneratingIndex(index);
        try {
            const base64 = await generateOneShotKeyframe(formData, scenes[index]);
            setScenes(prev => {
                const newScenes = [...prev];
                newScenes[index] = { ...newScenes[index], visualKeyframe: base64 };
                return newScenes;
            });
        } catch (e) { console.error(e); } finally { setRegeneratingIndex(null); }
    };

    const updateSceneData = (index: number, field: 'visual' | 'audio', value: string) => {
        setScenes(prev => prev.map((s, i) => {
            if (i !== index) return s;
            if (field === 'visual') return { ...s, visual_direction: { ...s.visual_direction, subject_action: value } };
            return { ...s, audio_direction: { ...s.audio_direction, voiceover_script: value } };
        }));
    };

    const getVeoPrompt = (scene: OneShotScene) => {
        return JSON.stringify({
            subject_prompt: `${formData.productName}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: scene.audio_direction.voice_emotion,
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

    const getSafeFilename = () => formData.projectName?.trim().replace(/\s+/g, '_') || 'oneshot';

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
    const SECTION_HEADER = "text-xs font-black text-black uppercase tracking-widest border-b-4 border-black pb-2 mb-4 mt-6 first:mt-0";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden bg-white">
            
            {/* Right: Config (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white border-b lg:border-b-0 lg:border-l-4 border-black flex flex-col lg:overflow-hidden lg:h-full z-10">
                <div className="p-6 border-b-4 border-black bg-yellow-400">
                    <h3 className="font-black text-black flex items-center text-xl uppercase tracking-tight">Ad Configuration</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Pro Mode */}
                    <div className={`flex items-center justify-between p-4 border-4 border-black transition-all duration-300 ${formData.usePro ? 'bg-yellow-400 shadow-neo' : 'bg-white shadow-neo-sm'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 border-4 border-black flex items-center justify-center shadow-neo-sm ${formData.usePro ? 'bg-white text-black' : 'bg-gray-100 text-gray-400'}`}>
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-black tracking-widest">Pro Mode</p>
                                <p className="text-[9px] font-bold text-black/60 uppercase">Ultra High Quality</p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} 
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-4 border-black transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-cyan-400' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border-2 border-black shadow-neo-sm transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* 1. SOURCE */}
                    <div>
                        <h4 className={SECTION_HEADER}>1. Source Media</h4>
                        <div className="mb-6">
                            <label className={`block w-full aspect-video border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 ${productPreview ? 'bg-white' : 'bg-gray-50'}`}>
                                {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-center p-4"><ArrowPathIcon className="w-10 h-10 text-yellow-400 animate-spin mb-3"/><span className="text-[10px] text-white font-black uppercase tracking-widest">Scanning & Searching Web...</span></div>}
                                {productPreview ? (
                                    <img src={productPreview} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40">
                                        <PhotoIcon className="w-12 h-12 mb-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo (Product + Model)</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" onChange={(e) => handleMainUpload(e.target.files?.[0])} accept="image/*" />
                            </label>
                            <div className="mt-4">
                                <label className={CYBER_LABEL}>Product Name (Auto)</label>
                                <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} />
                            </div>
                        </div>
                    </div>

                    {/* 2. STRATEGY */}
                    <div>
                        <h4 className={SECTION_HEADER}>2. Strategy & Target</h4>
                        <div className="space-y-4">
                            <CyberDropdown label="Target Audience" value={formData.targetAudience} options={UGC_TARGET_AUDIENCES} onChange={(val) => setFormData(prev => ({...prev, targetAudience: val}))} />
                            
                            <div>
                                <label className={CYBER_LABEL}>Unique Selling Points (USPs)</label>
                                <div className="flex gap-3 mb-3">
                                    <input type="text" value={newUSP} onChange={(e) => setNewUSP(e.target.value)} className={CYBER_INPUT} placeholder="Add USP..." onKeyDown={(e) => e.key === 'Enter' && addUSP()} />
                                    <button onClick={addUSP} className="px-4 bg-black text-white font-black border-4 border-black shadow-neo-sm hover:bg-gray-800 transition-all">+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(formData.usps || []).map((usp, idx) => (
                                        <div key={idx} className="flex items-center text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black border-2 border-black px-2 py-1 shadow-neo-sm">
                                            <span className="mr-2">{usp}</span>
                                            <button onClick={() => removeUSP(idx)} className="hover:text-red-600"><XMarkIcon className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {(!formData.usps || formData.usps.length === 0) && <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest italic">No USPs added. AI will detect from image.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. FORMAT & MODE */}
                    <div>
                        <h4 className={SECTION_HEADER}>3. Video Format</h4>
                        <div className="space-y-6">
                            {/* Scene Count Toggle */}
                            <div>
                                <label className={CYBER_LABEL}>Duration / Scene Count</label>
                                <div className="flex border-4 border-black p-1 bg-gray-100">
                                    <button 
                                        onClick={() => setFormData(prev => ({...prev, sceneCount: 3}))}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${formData.sceneCount === 3 ? 'bg-black text-white shadow-neo-sm' : 'text-black/40 hover:text-black'}`}
                                    >
                                        ⚡ 3 Scenes (Fast)
                                    </button>
                                    <button 
                                        onClick={() => setFormData(prev => ({...prev, sceneCount: 5}))}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${formData.sceneCount === 5 ? 'bg-black text-white shadow-neo-sm' : 'text-black/40 hover:text-black'}`}
                                    >
                                        🎬 5 Scenes (Story)
                                    </button>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setFormData(prev => ({...prev, mode: 'Mode Reviewer (Vlog)'}))}
                                    className={`w-full flex items-start p-4 border-4 border-black text-left transition-all ${formData.mode === 'Mode Reviewer (Vlog)' ? 'bg-cyan-400 shadow-neo' : 'bg-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5'}`}
                                >
                                    <div className={`w-10 h-10 border-4 border-black flex items-center justify-center mr-4 flex-shrink-0 ${formData.mode === 'Mode Reviewer (Vlog)' ? 'bg-white text-black' : 'bg-gray-100 text-black/40'}`}>
                                        <UsersIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black block mb-1 uppercase tracking-widest text-black">Reviewer Mode (Talking Head)</span>
                                        <span className="text-[10px] block leading-tight font-bold text-black/60 uppercase">Model berbicara langsung (Lip-sync).</span>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setFormData(prev => ({...prev, mode: 'Mode Sinematik (B-Roll)'}))}
                                    className={`w-full flex items-start p-4 border-4 border-black text-left transition-all ${formData.mode === 'Mode Sinematik (B-Roll)' ? 'bg-cyan-400 shadow-neo' : 'bg-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5'}`}
                                >
                                    <div className={`w-10 h-10 border-4 border-black flex items-center justify-center mr-4 flex-shrink-0 ${formData.mode === 'Mode Sinematik (B-Roll)' ? 'bg-white text-black' : 'bg-gray-100 text-black/40'}`}>
                                        <FilmIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black block mb-1 uppercase tracking-widest text-black">Cinematic Mode (B-Roll)</span>
                                        <span className="text-[10px] block leading-tight font-bold text-black/60 uppercase">Video estetik dengan voiceover latar.</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* ADVANCED SETTINGS TOGGLE */}
                    <div className="border-t-4 border-black pt-6">
                        <button 
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="w-full flex items-center justify-between text-[10px] font-black text-black uppercase tracking-widest hover:text-cyan-500 transition-colors"
                        >
                            <span>Advanced Settings</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isAdvancedOpen && (
                            <div className="mt-6 space-y-6 animate-fade-in">
                                {/* Override Face */}
                                <div>
                                    <label className={CYBER_LABEL}>Override Face (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <label className={`w-16 h-16 border-4 border-black border-dashed flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all shadow-neo-sm hover:shadow-neo ${modelOverridePreview ? 'bg-white' : 'bg-gray-50'}`}>
                                            {modelOverridePreview ? <img src={modelOverridePreview} className="w-full h-full object-cover" /> : <UsersIcon className="w-6 h-6 text-black/20" />}
                                            <input type="file" className="hidden" onChange={(e) => handleModelOverrideUpload(e.target.files?.[0])} accept="image/*" />
                                        </label>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-tight">Upload a different face to swap onto the model in the video.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <CyberDropdown label="Platform" value={formData.platform} options={ONE_SHOT_PLATFORMS} onChange={(val) => setFormData(prev => ({...prev, platform: val as OneShotPlatform}))} />
                                    <CyberDropdown label="Camera Motion" value={formData.cameraMotion} options={ONE_SHOT_CAMERA_MOTIONS} onChange={(val) => setFormData(prev => ({...prev, cameraMotion: val as OneShotCameraMotion}))} />
                                    <CyberDropdown label="Call To Action" value={formData.ctaStrategy} options={ONE_SHOT_CTA_OPTIONS} onChange={(val) => setFormData(prev => ({...prev, ctaStrategy: val as OneShotCTA}))} />
                                    <CyberDropdown label="Hook Template" value={formData.hookTemplate || ''} options={[{label: 'Auto Detect', value: ''}, ...UGC_HOOK_TEMPLATES]} onChange={(val) => setFormData(prev => ({...prev, hookTemplate: val}))} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t-4 border-black bg-white z-10 pb-24 lg:pb-6">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGeneratingPlan || !formData.productImage} 
                        className="w-full py-4 bg-yellow-400 text-black border-4 border-black font-black text-sm shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        {isGeneratingPlan ? <ArrowPathIcon className="w-6 h-6 animate-spin mr-3"/> : <FilmIcon className="w-6 h-6 mr-3"/>}
                        {isGeneratingPlan ? 'Creating Plan...' : 'Generate One-Shot'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-white flex flex-col relative border-t lg:border-t-0 lg:border-r-4 border-black">
                <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center">
                    <h2 className="text-xl font-black text-black flex items-center uppercase tracking-tight">
                        <span className="w-10 h-10 border-4 border-black bg-cyan-400 flex items-center justify-center mr-3 text-black shadow-neo-sm">
                            <FilmIcon className="w-6 h-6" />
                        </span>
                        One-Shot Plan
                    </h2>
                    <div className="flex items-center gap-3">
                        {scenes.length > 0 && (
                            <button 
                                onClick={handleRenderVisuals} 
                                disabled={isRendering} 
                                className="bg-cyan-400 hover:bg-cyan-300 text-black border-4 border-black px-6 py-3 text-xs font-black shadow-neo-sm flex items-center disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest"
                            >
                                {isRendering ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                {isRendering ? 'Rendering...' : 'Render Visuals'}
                            </button>
                        )}
                        {scenes.some(s => s.visualKeyframe) && (
                            <button 
                                onClick={handleDownloadAll} 
                                disabled={isDownloadingAll} 
                                className="bg-white hover:bg-gray-50 text-black border-4 border-black px-6 py-3 text-xs font-black shadow-neo-sm flex items-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest"
                            >
                                {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                {isDownloadingAll ? 'Downloading...' : 'Download All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 bg-gray-50">
                    {error && <div className="mb-6 p-4 bg-red-100 border-4 border-black shadow-neo-sm text-red-600 text-xs font-black uppercase tracking-widest">{error}</div>}

                    {isGeneratingPlan ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 lg:py-0">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-8 border-black border-t-cyan-400 animate-spin"></div>
                            </div>
                            <p className="text-2xl font-black text-black uppercase tracking-widest">Directing Video...</p>
                        </div>
                    ) : scenes.length > 0 ? (
                        <div className="space-y-10 max-w-5xl mx-auto pb-24">
                            {scenes.map((scene, idx) => {
                                const isLoading = (isRendering && processingIndex === idx) || regeneratingIndex === idx;
                                const isWaiting = isRendering && !scene.visualKeyframe && processingIndex !== idx;

                                return (
                                    <div key={scene.id} className={`bg-white border-4 border-black transition-all duration-300 overflow-hidden shadow-neo flex flex-col md:flex-row ${processingIndex === idx ? 'ring-8 ring-yellow-400 ring-offset-4' : ''}`}>
                                        
                                        {/* VISUAL MONITOR */}
                                        <div className="w-full md:w-[280px] lg:w-[320px] bg-gray-100 border-b md:border-b-0 md:border-r-4 border-black relative flex-shrink-0 flex flex-col">
                                            <div 
                                                className={`aspect-[9/16] w-full relative bg-gray-200 ${scene.visualKeyframe ? 'cursor-zoom-in group' : ''}`}
                                                onClick={() => scene.visualKeyframe && setPreviewIndex(idx)}
                                            >
                                                {isLoading ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                                        <ArrowPathIcon className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">RENDERING...</span>
                                                    </div>
                                                ) : scene.visualKeyframe ? (
                                                    <>
                                                        <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                        
                                                        {/* OVERLAY BUTTONS */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }}
                                                                className="bg-white text-black border-2 border-black p-3 rounded-full shadow-neo-sm hover:bg-yellow-400 transform hover:scale-110 transition-all"
                                                                title="Download"
                                                            >
                                                                <ArrowDownTrayIcon className="w-5 h-5" /> 
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRegenerateSingleScene(idx); }}
                                                                className="bg-cyan-400 text-black border-2 border-black p-3 rounded-full shadow-neo-sm hover:bg-cyan-300 transform hover:scale-110 transition-all"
                                                                title="Regenerate"
                                                            >
                                                                <ArrowPathIcon className="w-5 h-5" /> 
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-black/20">
                                                        <PhotoIcon className={`w-16 h-16 mb-3 ${isWaiting ? 'opacity-10' : 'opacity-30'}`} />
                                                        <span className="text-[10px] font-black mt-2 opacity-50 uppercase tracking-widest">{isWaiting ? 'WAITING QUEUE' : 'CONCEPT READY'}</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 border-2 border-black text-[10px] font-black shadow-neo-sm pointer-events-none uppercase tracking-widest">SCENE {idx + 1}</div>
                                            </div>
                                        </div>

                                        {/* CONTROLS */}
                                        <div className="flex-1 p-6 flex flex-col gap-6 bg-white">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center">
                                                        <PhotoIcon className="w-4 h-4 mr-2 text-cyan-500" /> Visual Action
                                                    </label>
                                                    <button 
                                                        onClick={() => handleRegenerateSingleScene(idx)} 
                                                        disabled={isLoading || isRendering} 
                                                        className="text-[10px] font-black text-black hover:text-cyan-500 flex items-center transition-colors disabled:opacity-50 uppercase tracking-widest"
                                                    >
                                                        <ArrowPathIcon className={`w-3 h-3 mr-1.5 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} /> Regenerate
                                                    </button>
                                                </div>
                                                <textarea 
                                                    className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold focus:ring-0 focus:border-black min-h-[100px] leading-relaxed shadow-neo-sm" 
                                                    value={scene.visual_direction.subject_action} 
                                                    onChange={(e) => updateSceneData(idx, 'visual', e.target.value)} 
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center">
                                                    <DocumentTextIcon className="w-4 h-4 mr-2 text-yellow-500" /> Audio Script
                                                </label>
                                                <textarea 
                                                    className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold italic focus:ring-0 focus:border-black min-h-[80px] leading-relaxed shadow-neo-sm" 
                                                    value={scene.audio_direction.voiceover_script} 
                                                    onChange={(e) => updateSceneData(idx, 'audio', e.target.value)} 
                                                />
                                            </div>

                                            <div className="bg-black border-4 border-black p-5 relative shadow-neo-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center">
                                                        <SparklesIcon className="w-4 h-4 mr-2" /> Veo Prompt (JSON)
                                                    </label>
                                                    <button 
                                                        onClick={() => copyToClipboard(getVeoPrompt(scene), idx)} 
                                                        className="text-[10px] font-black text-white hover:bg-white/20 flex items-center transition-all bg-white/10 px-3 py-1.5 border-2 border-white/20 uppercase tracking-widest"
                                                    >
                                                        {copiedIndex === idx ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4 mr-2" />} 
                                                        {copiedIndex === idx ? 'Copied!' : 'Copy JSON'}
                                                    </button>
                                                </div>
                                                <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-40 custom-scrollbar select-all leading-relaxed">{getVeoPrompt(scene)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-neo">
                                <FilmIcon className="w-12 h-12 text-black/20" />
                            </div>
                            <h4 className="font-black text-black mb-2 text-2xl uppercase tracking-widest">One-Shot Video</h4>
                            <p className="text-xs text-black/60 font-bold max-w-xs mx-auto uppercase tracking-widest">Upload a photo, choose a mode, generate a video plan with AI precision.</p>
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
                onRegenerate={() => previewIndex !== null && handleRegenerateSingleScene(previewIndex)}
                onSave={() => previewIndex !== null && scenes[previewIndex]?.visualKeyframe && handleDownloadSingle(scenes[previewIndex].visualKeyframe!, previewIndex)}
                isRegenerating={regeneratingIndex !== null}
            />
        </div>
    );
};

export default OneShotVideoStudio;