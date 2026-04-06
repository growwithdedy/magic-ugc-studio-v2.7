
import React, { useState, useEffect } from 'react';
import type { Language, FashionReelFormData, FashionReelScene, FashionReelMode, FashionLighting, FashionEnvironment, FashionKeyFeature, FashionHook, GlobalVisualSettings } from '../types';
import { FASHION_SHOWCASE_MODES, FASHION_LIGHTING_REALITY, FASHION_KEY_FEATURES, FASHION_HOOKS, FASHION_AUDIENCE_MAP, FASHION_GENDERS, FASHION_ENVIRONMENTS, FASHION_FIDELITY_MODES } from '../constants';
import { generateFashionReelPlan, generateFashionReelKeyframe, analyzeFashionReelInput, retryOperation } from '../services/geminiService';
import { 
    VideoCameraIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, DocumentTextIcon, FolderArrowDownIcon, UsersIcon,
    ClipboardDocumentIcon, CheckCircleIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface FashionReelStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const FashionReelStudio: React.FC<FashionReelStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    // Initial State: Default to 'WOMEN'
    const initialGender = 'WOMEN';
    
    const [formData, setFormData] = useState<FashionReelFormData>({
        productImage: null,
        modelImage: null,
        productName: '',
        productDescription: '',
        
        // Strategy Defaults
        showcaseMode: FASHION_SHOWCASE_MODES[0].value,
        affiliateHook: FASHION_HOOKS[0].value,
        gender: initialGender,
        targetAudience: FASHION_AUDIENCE_MAP[initialGender][0].value,
        language: 'Bahasa Indonesia',
        sceneCount: 5,
        usePro: false,
        projectName: '',
        
        // Visual Defaults
        backgroundMode: 'ai',
        customBackground: null,
        environment: FASHION_ENVIRONMENTS[0].value,
        lighting: FASHION_LIGHTING_REALITY[0].value,
        keyFeature: FASHION_KEY_FEATURES[0].value,
        fidelityMode: 'high_fidelity', // Default to strict per user request trend
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [customBackgroundPreview, setCustomBackgroundPreview] = useState<string | null>(null);
    
    const [scenes, setScenes] = useState<FashionReelScene[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalVisualSettings | null>(null);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    // Handle Gender Change -> Update Audience List automatically
    const handleGenderChange = (newGender: string) => {
        const newAudienceList = FASHION_AUDIENCE_MAP[newGender] || [];
        setFormData(prev => ({
            ...prev,
            gender: newGender,
            targetAudience: newAudienceList.length > 0 ? newAudienceList[0].value : ''
        }));
    };

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
    const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');

    const handleImageUpload = (type: 'product' | 'model' | 'background', file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'product') {
                setFormData(prev => ({ ...prev, productImage: file }));
                setProductPreview(reader.result as string);
                
                setIsAnalyzing(true);
                analyzeFashionReelInput(file).then(res => {
                    setFormData(prev => ({
                        ...prev,
                        productName: res.productName,
                        productDescription: res.productDescription,
                        // Keep current target audience or try to map AI suggestion if robust
                    }));
                }).catch(console.error).finally(() => setIsAnalyzing(false));
            } else if (type === 'model') {
                setFormData(prev => ({ ...prev, modelImage: file }));
                setModelPreview(reader.result as string);
            } else if (type === 'background') {
                setFormData(prev => ({ ...prev, customBackground: file }));
                setCustomBackgroundPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!formData.productImage) { setError("Please upload a fashion item image."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingPlan(true);
        setError(null);
        setScenes([]);
        setGlobalSettings(null);
        
        try {
            // Receive both scenes and global settings
            const result = await generateFashionReelPlan(formData);
            setScenes(result.scenes);
            setGlobalSettings(result.globalSettings);
            setActiveTab('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate fashion reel.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleRenderVisuals = async () => {
        setIsRendering(true);
        setError(null);
        setRetryStatus(null);
        
        // Loop sequentially through scenes
        for (let i = 0; i < scenes.length; i++) {
            if(!scenes[i].visualKeyframe) {
                setProcessingIndex(i);
                try {
                    await retryOperation(async () => {
                        // Pass Global Settings for Consistency
                        const base64 = await generateFashionReelKeyframe(formData, scenes[i], globalSettings || undefined);
                        setScenes(prev => {
                            const newScenes = [...prev];
                            newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                            return newScenes;
                        });
                    }, 3, 2000, (attempt) => setRetryStatus(`Retrying scene ${i+1}... (${attempt}/3)`));
                    
                    setRetryStatus(null);
                } catch (e) { 
                    console.error(e); 
                    setError(`Rendering stopped at Scene ${i + 1}. Please try regenerating.`);
                    setProcessingIndex(null);
                    setIsRendering(false);
                    return; // Stop flow
                }
            }
        }
        
        setProcessingIndex(null);
        setIsRendering(false);
    };

    const handleRegenerateSingleScene = async (index: number) => {
        setRegeneratingIndex(index);
        setError(null);
        setRetryStatus(null);
        try {
            await retryOperation(async () => {
                const base64 = await generateFashionReelKeyframe(formData, scenes[index], globalSettings || undefined);
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

    const getVeoPrompt = (scene: FashionReelScene) => {
        return JSON.stringify({
            subject_prompt: `Fashion Model (${formData.gender} style) wearing ${formData.productName}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: `${formData.affiliateHook}`,
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, ugly face, watermark"
        }, null, 2);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const handleDownloadAll = async () => {
        if (isDownloadingAll) return;
        setIsDownloadingAll(true);
        const safeName = formData.projectName?.trim().replace(/\s+/g, '_') || 'fashion_reel';

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
        link.download = `${formData.projectName?.trim().replace(/\s+/g, '_') || 'fashion_reel'}_scene_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black focus:ring-0 focus:border-black text-xs py-3 px-4 transition-all shadow-neo-sm placeholder-gray-400 font-bold rounded-neo-sm";
    const SECTION_HEADER = "text-xs font-bold text-pink-500 uppercase tracking-widest border-b border-pink-500/20 pb-2 mb-4 mt-6 first:mt-0";

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-white font-sans pb-20">
            <div className="max-w-4xl mx-auto px-4 pt-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2">
                        Affiliate Reel Studio
                    </h1>
                    <p className="text-sm text-black/60 font-bold uppercase tracking-[0.2em]">
                        Create sales-optimized videos with AI
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-white border-4 border-black p-1 shadow-neo mb-8 rounded-neo max-w-md mx-auto">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex-1 py-3 text-xs font-black transition-all uppercase tracking-widest rounded-neo-sm flex items-center justify-center gap-2 ${activeTab === 'config' ? 'bg-black text-white shadow-neo-sm' : 'text-black/40 hover:text-black'}`}
                    >
                        <VideoCameraIcon className="w-4 h-4" />
                        Studio Config
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex-1 py-3 text-xs font-black transition-all uppercase tracking-widest rounded-neo-sm flex items-center justify-center gap-2 ${activeTab === 'results' ? 'bg-black text-white shadow-neo-sm' : 'text-black/40 hover:text-black'}`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        View Results
                    </button>
                </div>

                {/* Main Studio Card */}
                <div className="bg-white border-4 border-black shadow-neo overflow-hidden rounded-neo mb-12">
                    {activeTab === 'config' ? (
                        <div className="p-6 lg:p-10 space-y-10">
                            {/* Pro Mode */}
                            <div className={`flex items-center justify-between p-4 border-4 border-black transition-all duration-300 shadow-neo-sm rounded-neo-sm ${formData.usePro ? 'bg-yellow-400' : 'bg-white'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center shadow-neo-sm rounded-full ${formData.usePro ? 'bg-black text-white' : 'bg-white text-black'}`}><SparklesIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs font-black text-black uppercase tracking-widest">Pro Mode (Gemini 3)</p>
                                        <p className="text-[10px] text-black/60 font-bold uppercase tracking-widest">High consistency mode</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))}
                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left Column: Visuals */}
                                <div className="space-y-8">
                                    <h4 className={SECTION_HEADER}>1. Product & Cast</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`block w-full aspect-square border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${productPreview ? 'bg-white shadow-neo-sm' : 'bg-gray-50'}`}>
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                                                    <ArrowPathIcon className="w-6 h-6 text-black animate-spin mb-1"/>
                                                    <span className="text-[10px] text-black font-black uppercase tracking-widest">Analyzing...</span>
                                                </div>
                                            )}
                                            {productPreview ? (
                                                <img src={productPreview} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-black/20">
                                                    <PhotoIcon className="w-10 h-10 mb-2" />
                                                    <span className="text-[10px] font-black uppercase">Outfit Item</span>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0]!)} accept="image/*" />
                                        </label>
                                        
                                        <label className={`block w-full aspect-square border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${modelPreview ? 'bg-white shadow-neo-sm' : 'bg-gray-50'}`}>
                                            {modelPreview ? (
                                                <img src={modelPreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-black/20">
                                                    <UsersIcon className="w-10 h-10 mb-2" />
                                                    <span className="text-[10px] font-black uppercase">Model Ref</span>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0]!)} accept="image/*" />
                                        </label>
                                    </div>

                                    <div>
                                        <label className={CYBER_LABEL}>Product Name (Auto)</label>
                                        <input 
                                            type="text"
                                            value={formData.productName}
                                            onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))}
                                            className={CYBER_INPUT}
                                            placeholder="Detected product name..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <CyberDropdown 
                                            label="Gender Model / Target" 
                                            value={formData.gender} 
                                            options={FASHION_GENDERS} 
                                            onChange={handleGenderChange} 
                                        />
                                        <CyberDropdown 
                                            label="Target Audience" 
                                            value={formData.targetAudience} 
                                            options={FASHION_AUDIENCE_MAP[formData.gender] || []} 
                                            onChange={(val) => setFormData(prev => ({...prev, targetAudience: val}))} 
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Strategy */}
                                <div className="space-y-8">
                                    <h4 className={SECTION_HEADER}>2. Showcase Strategy</h4>
                                    <div className="space-y-4">
                                        <CyberDropdown label="Showcase Mode" value={formData.showcaseMode} options={FASHION_SHOWCASE_MODES} onChange={(val) => setFormData(prev => ({...prev, showcaseMode: val as FashionReelMode}))} />
                                        <CyberDropdown label="Affiliate Hook" value={formData.affiliateHook} options={FASHION_HOOKS} onChange={(val) => setFormData(prev => ({...prev, affiliateHook: val as FashionHook}))} />
                                        <CyberDropdown label="Key Feature" value={formData.keyFeature} options={FASHION_KEY_FEATURES} onChange={(val) => setFormData(prev => ({...prev, keyFeature: val as FashionKeyFeature}))} />
                                    </div>

                                    <h4 className={SECTION_HEADER}>3. Visual & World</h4>
                                    <div className="space-y-4">
                                        <CyberDropdown label="Lighting Reality" value={formData.lighting} options={FASHION_LIGHTING_REALITY} onChange={(val) => setFormData(prev => ({...prev, lighting: val as FashionLighting}))} />
                                        <CyberDropdown label="Product Fidelity" value={formData.fidelityMode} options={FASHION_FIDELITY_MODES} onChange={(val) => setFormData(prev => ({...prev, fidelityMode: val as 'standard' | 'high_fidelity'}))} />
                                        
                                        <div>
                                            <label className={CYBER_LABEL}>Environment Mode</label>
                                            <div className="flex bg-white border-4 border-black p-1 shadow-neo-sm mb-3 rounded-neo">
                                                <button 
                                                    onClick={() => setFormData(prev => ({...prev, backgroundMode: 'ai'}))}
                                                    className={`flex-1 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-neo-sm ${formData.backgroundMode === 'ai' ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}
                                                >
                                                    AI World Lock
                                                </button>
                                                <button 
                                                    onClick={() => setFormData(prev => ({...prev, backgroundMode: 'upload'}))}
                                                    className={`flex-1 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-neo-sm ${formData.backgroundMode === 'upload' ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}
                                                >
                                                    Custom Set
                                                </button>
                                            </div>

                                            {formData.backgroundMode === 'ai' && (
                                                <CyberDropdown 
                                                    value={formData.environment} 
                                                    options={FASHION_ENVIRONMENTS} 
                                                    onChange={(val) => setFormData(prev => ({...prev, environment: val as FashionEnvironment}))} 
                                                />
                                            )}

                                            {formData.backgroundMode === 'upload' && (
                                                <label className={`block w-full aspect-video border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${customBackgroundPreview ? 'bg-white shadow-neo-sm' : 'bg-gray-50'}`}>
                                                    {customBackgroundPreview ? (
                                                        <img src={customBackgroundPreview} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-black/20">
                                                            <PhotoIcon className="w-6 h-6 mb-2" />
                                                            <span className="text-[10px] font-black uppercase">Upload Room/Studio</span>
                                                        </div>
                                                    )}
                                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload('background', e.target.files?.[0])} accept="image/*" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t-4 border-black">
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={isGeneratingPlan || !formData.productImage} 
                                    className="w-full py-5 bg-yellow-400 text-black border-4 border-black font-black text-lg shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-neo"
                                >
                                    {isGeneratingPlan ? <ArrowPathIcon className="w-6 h-6 animate-spin mr-3"/> : <VideoCameraIcon className="w-6 h-6 mr-3"/>}
                                    {isGeneratingPlan ? 'Planning Showcase...' : 'Generate Plan'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-[600px]">
                            <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center">
                                <h2 className="text-xl font-black text-black flex items-center uppercase tracking-tighter">
                                    <span className="w-8 h-8 border-2 border-black bg-pink-400 flex items-center justify-center mr-3 text-black shadow-neo-sm rounded-neo-sm"><VideoCameraIcon className="w-5 h-5" /></span>
                                    Production Monitor
                                </h2>
                                
                                <div className="flex items-center gap-3">
                                    {scenes.length > 0 && (
                                        <button onClick={handleRenderVisuals} disabled={isRendering} className="bg-pink-500 hover:bg-pink-400 text-black border-4 border-black px-6 py-3 text-sm font-black shadow-neo-sm flex items-center disabled:opacity-50 uppercase tracking-widest active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo-sm">
                                            {isRendering ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                            {isRendering ? (retryStatus ? 'Retrying...' : 'Rendering...') : 'Start Production'}
                                        </button>
                                    )}
                                    {scenes.some(s => s.visualKeyframe) && (
                                        <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="bg-white hover:bg-gray-50 text-black border-4 border-black px-6 py-3 text-sm font-black shadow-neo-sm flex items-center transition-all uppercase tracking-widest active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo-sm">
                                            {isDownloadingAll ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-5 h-5 mr-2" />}
                                            {isDownloadingAll ? 'Downloading...' : 'Download All'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 p-6 lg:p-10 bg-gray-50">
                                {error && <div className="mb-8 p-4 border-4 border-black bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest shadow-neo-sm rounded-neo-sm">{error}</div>}

                                {isGeneratingPlan ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                                        <div className="relative w-24 h-24">
                                            <div className="absolute inset-0 border-8 border-black border-t-pink-500 animate-spin rounded-full"></div>
                                        </div>
                                        <p className="text-3xl font-black text-black uppercase tracking-tighter">Directing Video...</p>
                                    </div>
                                ) : scenes.length > 0 ? (
                                    <div className="space-y-12 max-w-4xl mx-auto">
                                        {scenes.map((scene, idx) => {
                                            const isLoading = (isRendering && processingIndex === idx) || regeneratingIndex === idx;
                                            const isWaiting = isRendering && !scene.visualKeyframe && processingIndex !== idx;

                                            return (
                                                <div key={scene.id} className={`bg-white border-4 border-black transition-all duration-300 overflow-hidden shadow-neo flex flex-col md:flex-row rounded-neo ${processingIndex === idx ? 'ring-8 ring-pink-400/30' : ''}`}>
                                                    
                                                    {/* VISUAL MONITOR */}
                                                    <div className="w-full md:w-[320px] bg-gray-100 border-b-4 md:border-b-0 md:border-r-4 border-black relative flex-shrink-0">
                                                        <div 
                                                            className={`aspect-[9/16] w-full relative bg-gray-200 ${scene.visualKeyframe ? 'cursor-zoom-in group' : ''}`}
                                                            onClick={() => scene.visualKeyframe && setPreviewIndex(idx)}
                                                        >
                                                            {isLoading ? (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                                                                    <ArrowPathIcon className="w-10 h-10 text-pink-500 animate-spin mb-3" />
                                                                    <span className="text-[10px] font-black text-black tracking-widest uppercase">{retryStatus || 'RENDERING...'}</span>
                                                                </div>
                                                            ) : scene.visualKeyframe ? (
                                                                <>
                                                                    <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }}
                                                                            className="bg-white text-black border-2 border-black p-3 shadow-neo-sm hover:bg-yellow-400 pointer-events-auto transform hover:scale-110 transition-transform rounded-neo-sm"
                                                                        >
                                                                            <ArrowDownTrayIcon className="w-6 h-6" /> 
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleRegenerateSingleScene(idx); }}
                                                                            className="bg-pink-500 text-black border-2 border-black p-3 shadow-neo-sm hover:bg-pink-400 pointer-events-auto transform hover:scale-110 transition-transform rounded-neo-sm"
                                                                        >
                                                                            <ArrowPathIcon className="w-6 h-6" /> 
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-black/20">
                                                                    <PhotoIcon className={`w-12 h-12 ${isWaiting ? 'opacity-20' : 'opacity-40'}`} />
                                                                    <span className="text-[10px] font-black mt-3 tracking-widest uppercase">{isWaiting ? 'WAITING QUEUE' : 'CONCEPT'}</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 border-2 border-black text-[10px] font-black shadow-neo-sm uppercase tracking-widest rounded-neo-sm">SCENE {idx + 1}</div>
                                                        </div>
                                                    </div>

                                                    {/* CONTROLS */}
                                                    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 bg-white">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center"><PhotoIcon className="w-4 h-4 mr-2" /> Visual Action</label>
                                                            </div>
                                                            <textarea className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold focus:ring-0 focus:border-black min-h-[100px] leading-relaxed shadow-neo-sm rounded-neo-sm" value={scene.visual_direction.subject_action} onChange={(e) => updateSceneData(idx, 'visual', e.target.value)} />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center"><DocumentTextIcon className="w-4 h-4 mr-2" /> Narration Script</label>
                                                            <textarea className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold focus:ring-0 focus:border-black min-h-[80px] italic leading-relaxed shadow-neo-sm rounded-neo-sm" value={scene.audio_direction.voiceover_script} onChange={(e) => updateSceneData(idx, 'audio', e.target.value)} />
                                                        </div>

                                                        <div className="bg-black p-5 border-4 border-black relative group shadow-neo-sm rounded-neo-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center"><SparklesIcon className="w-4 h-4 mr-2" /> Veo Prompt (JSON)</label>
                                                                <button onClick={() => copyToClipboard(getVeoPrompt(scene), idx)} className="text-[10px] font-black text-white hover:text-yellow-400 flex items-center transition-colors bg-white/10 px-3 py-1.5 border-2 border-white/20 uppercase tracking-widest rounded-neo-sm">{copiedIndex === idx ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4 mr-2" />} {copiedIndex === idx ? 'Copied!' : 'Copy JSON'}</button>
                                                            </div>
                                                            <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-40 custom-scrollbar select-all">{getVeoPrompt(scene)}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                        <div className="w-24 h-24 bg-pink-400 border-4 border-black flex items-center justify-center mb-8 shadow-neo rotate-3 rounded-neo">
                                            <VideoCameraIcon className="w-12 h-12 text-black" />
                                        </div>
                                        <h4 className="font-black text-black mb-3 uppercase tracking-tighter text-3xl">Ready to Direct?</h4>
                                        <p className="text-sm text-black/60 max-w-md mx-auto font-bold uppercase tracking-widest leading-relaxed">
                                            Configure your showcase strategy in the config tab first, then generate your viral reel plan.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="text-center mb-12">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Affiliate Reel Studio © 2026</p>
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

export default FashionReelStudio;