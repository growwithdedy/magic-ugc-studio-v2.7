import React, { useState } from 'react';
import type { Language, FnBFormData, FnBScene, FnBProductCategory, FnBTemperature, FnBTexture, FnBContentStrategy, FnBModelPersona, FnBScriptDensity, FnBSceneCount, HandGender, FnBEnvironment, FnBMotionFocus, FnBPlatingStyle, LightingMode } from '../types';
import { FNB_PRODUCT_CATEGORIES, FNB_TEMPERATURES, FNB_TEXTURES, FNB_STRATEGIES, FNB_PERSONAS, FNB_SCRIPT_DENSITIES, FNB_SCENE_COUNTS, LIGHTING_MODES, HAND_GENDERS, LANGUAGES, FNB_ENVIRONMENTS, FNB_MOTION_FOCUS, FNB_PLATING_STYLES } from '../constants';
import { generateFnBContent, regenerateFnBSceneImage, analyzeFnBProduct, retryOperation } from '../services/geminiService';
import { 
    CoffeeIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, FireIcon, CakeIcon, FolderArrowDownIcon, VideoCameraIcon, UsersIcon,
    ClipboardDocumentIcon, CheckCircleIcon, DocumentTextIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface FnBStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const FnBStudio: React.FC<FnBStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<FnBFormData>({
        productImage: null,
        modelImage: null,
        productName: '',
        productDescription: '',
        productCategory: '🍔 Makanan (Food)',
        temperature: '🔥 Steamy / Hot',
        texture: 'Juicy / Greasy',
        lighting: 'Softbox Studio',
        sceneCount: '5 Scenes (Standard)',
        strategy: '🍔 Mukbang / Big Appetite',
        modelPersona: 'The "Eargasm" Face',
        modelGender: 'Female',
        scriptLanguage: 'Bahasa Indonesia',
        scriptDensity: '⚖️ Balanced (Medium)', // Kept for types but unused in UI
        environment: 'Dark Studio',
        motionFocus: 'Cheese Pull',
        platingStyle: 'Fine Dining / Artistic',
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [scenes, setScenes] = useState<FnBScene[]>([]);
    
    // Incremental Rendering State
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
                analyzeFnBProduct(file).then(analysis => {
                    setFormData(prev => ({
                        ...prev,
                        productName: analysis.productName,
                        productDescription: analysis.productDescription,
                        temperature: (analysis.temperature as FnBTemperature) || prev.temperature,
                        texture: (analysis.texture as FnBTexture) || prev.texture
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
        if (!formData.productImage) { setError("Please upload a food/drink image."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingPlan(true);
        setError(null);
        setScenes([]);
        
        try {
            const plan = await generateFnBContent(formData);
            setScenes(plan);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate FnB plan.");
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
                        const base64 = await regenerateFnBSceneImage(formData, scenes[i]);
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
                const base64 = await regenerateFnBSceneImage(formData, scenes[index]);
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

    const getVeoPrompt = (scene: FnBScene) => {
        return JSON.stringify({
            subject_prompt: `${formData.productName}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: "Appetizing, Sensory Focus",
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}, Macro Food Photography`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, unappetizing, watermark"
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
        const safeName = formData.projectName?.trim().replace(/\s+/g, '_') || 'fnb';

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
        link.download = `${formData.projectName?.trim().replace(/\s+/g, '_') || 'fnb'}_scene_${index + 1}.png`;
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
                    <h3 className="font-black text-black flex items-center text-xl uppercase tracking-tight">Food Styling</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div>
                        <label className={CYBER_LABEL}>Project Filename</label>
                        <input type="text" value={formData.projectName} onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. burger_promo" />
                    </div>

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

                    {/* 1. MENU & INGREDIENTS */}
                    <div>
                        <h4 className={SECTION_HEADER}>1. Menu & Ingredients</h4>
                        <label className={`block w-full aspect-square border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group mb-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 ${productPreview ? 'bg-white' : 'bg-gray-50'}`}>
                            {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center"><ArrowPathIcon className="w-8 h-8 text-yellow-400 animate-spin mb-2"/><span className="text-[10px] text-white font-black uppercase tracking-widest">Analyzing...</span></div>}
                            {productPreview ? (
                                <img src={productPreview} className="w-full h-full object-contain p-4" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40">
                                    <PhotoIcon className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Food Photo</span>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                        </label>
                        <div className="mb-4">
                            <label className={CYBER_LABEL}>Menu Name</label>
                            <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CyberDropdown label="Category" value={formData.productCategory} options={FNB_PRODUCT_CATEGORIES} onChange={(val) => setFormData(prev => ({...prev, productCategory: val as FnBProductCategory}))} />
                            <CyberDropdown label="Plating Style" value={formData.platingStyle} options={FNB_PLATING_STYLES} onChange={(val) => setFormData(prev => ({...prev, platingStyle: val as FnBPlatingStyle}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CyberDropdown label="Temperature" value={formData.temperature} options={FNB_TEMPERATURES} onChange={(val) => setFormData(prev => ({...prev, temperature: val as FnBTemperature}))} />
                            <CyberDropdown label="Texture" value={formData.texture} options={FNB_TEXTURES} onChange={(val) => setFormData(prev => ({...prev, texture: val as FnBTexture}))} />
                        </div>
                    </div>

                    {/* 2. THE EATER & SETTING */}
                    <div>
                        <h4 className={SECTION_HEADER}>2. The Eater & Setting</h4>
                        <label className={`block w-full aspect-video border-4 border-black border-dashed cursor-pointer overflow-hidden relative transition-all group mb-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 ${modelPreview ? 'bg-white' : 'bg-gray-50'}`}>
                            {modelPreview ? (
                                <img src={modelPreview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40">
                                    <UsersIcon className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reference Eater (Optional)</span>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                        </label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CyberDropdown label="Eater Gender" value={formData.modelGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, modelGender: val as HandGender}))} />
                            <CyberDropdown label="Persona" value={formData.modelPersona} options={FNB_PERSONAS} onChange={(val) => setFormData(prev => ({...prev, modelPersona: val as FnBModelPersona}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CyberDropdown label="Environment" value={formData.environment} options={FNB_ENVIRONMENTS} onChange={(val) => setFormData(prev => ({...prev, environment: val as FnBEnvironment}))} />
                            <CyberDropdown label="Lighting" value={formData.lighting} options={LIGHTING_MODES} onChange={(val) => setFormData(prev => ({...prev, lighting: val as LightingMode}))} />
                        </div>
                    </div>

                    {/* 3. ACTION & CAMERA */}
                    <div>
                        <h4 className={SECTION_HEADER}>3. Action & Camera</h4>
                        <div className="space-y-4">
                            <CyberDropdown label="Content Strategy" value={formData.strategy} options={FNB_STRATEGIES} onChange={(val) => setFormData(prev => ({...prev, strategy: val as FnBContentStrategy}))} />
                            <CyberDropdown label="Motion Focus (VEO)" value={formData.motionFocus} options={FNB_MOTION_FOCUS} onChange={(val) => setFormData(prev => ({...prev, motionFocus: val as FnBMotionFocus}))} />
                            <CyberDropdown label="Language" value={formData.scriptLanguage} options={['Bahasa Indonesia', 'English', 'Javanese Slang']} onChange={(val) => setFormData(prev => ({...prev, scriptLanguage: val}))} />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t-4 border-black bg-white z-10 pb-24 lg:pb-6">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGeneratingPlan || !formData.productImage} 
                        className="w-full py-4 bg-yellow-400 text-black border-4 border-black font-black text-sm shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        {isGeneratingPlan ? <ArrowPathIcon className="w-6 h-6 animate-spin mr-3"/> : <FireIcon className="w-6 h-6 mr-3"/>}
                        {isGeneratingPlan ? 'Cooking Plan...' : 'Generate FnB Content'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-white flex flex-col relative border-t lg:border-t-0 lg:border-r-4 border-black">
                <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center">
                    <h2 className="text-xl font-black text-black flex items-center uppercase tracking-tight">
                        <span className="w-10 h-10 border-4 border-black bg-yellow-400 flex items-center justify-center mr-3 shadow-neo-sm">
                            <CoffeeIcon className="w-6 h-6 text-black" />
                        </span>
                        FnB Productions
                    </h2>
                    <div className="flex items-center gap-3">
                        {scenes.length > 0 && (
                            <button 
                                onClick={handleRenderVisuals} 
                                disabled={isRendering} 
                                className="bg-cyan-400 hover:bg-cyan-300 text-black px-6 py-3 border-4 border-black text-xs font-black shadow-neo-sm flex items-center disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest"
                            >
                                {isRendering ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                {isRendering ? 'Cooking...' : 'Start Cooking'}
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
                                <div className="absolute inset-0 border-8 border-black border-t-yellow-400 animate-spin"></div>
                            </div>
                            <p className="text-2xl font-black text-black uppercase tracking-widest">Planning Menu...</p>
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
                                                        <ArrowPathIcon className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
                                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">{retryStatus || 'COOKING...'}</span>
                                                    </div>
                                                ) : scene.visualKeyframe ? (
                                                    <>
                                                        <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                        
                                                        {/* OVERLAY */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }}
                                                                className="bg-white text-black p-3 border-2 border-black shadow-neo-sm hover:bg-yellow-400 transform hover:scale-110 transition-all"
                                                                title="Download"
                                                            >
                                                                <ArrowDownTrayIcon className="w-5 h-5" /> 
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRegenerateSingleScene(idx); }}
                                                                className="bg-cyan-400 text-black p-3 border-2 border-black shadow-neo-sm hover:bg-cyan-300 transform hover:scale-110 transition-all"
                                                                title="Regenerate"
                                                            >
                                                                <ArrowPathIcon className="w-5 h-5" /> 
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-black/20">
                                                        <PhotoIcon className={`w-16 h-16 mb-3 ${isWaiting ? 'opacity-10' : 'opacity-30'}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{isWaiting ? 'WAITING QUEUE' : 'CONCEPT READY'}</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 border-2 border-black text-[10px] font-black shadow-neo-sm uppercase tracking-widest">SCENE {idx + 1}</div>
                                            </div>
                                        </div>

                                        {/* CONTROLS */}
                                        <div className="flex-1 p-6 flex flex-col gap-6 bg-white">
                                            
                                            {/* Visual */}
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

                                            {/* Audio */}
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

                                            {/* Veo JSON */}
                                            <div className="bg-black border-4 border-black p-5 relative shadow-neo-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center">
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
                                <VideoCameraIcon className="w-12 h-12 text-black/20" />
                            </div>
                            <h4 className="font-black text-black mb-2 text-2xl uppercase tracking-widest">FnB Studio</h4>
                            <p className="text-xs text-black/60 font-bold max-w-xs mx-auto uppercase tracking-widest">Create mouth-watering food videos with AI precision.</p>
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

export default FnBStudio;