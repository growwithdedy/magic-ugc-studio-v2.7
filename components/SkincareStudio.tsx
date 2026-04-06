import React, { useState, useEffect } from 'react';
import type { Language, SkincareFormData, SkincareScene, SkincareModeType, GlobalVisualSettings } from '../types';
import { 
    SKINCARE_MODES, SKINCARE_SKIN_TYPES, SKINCARE_LOCATIONS, SKINCARE_FRAMINGS, 
    SKINCARE_VOCAL_PERSONAS, SKINCARE_WARDROBES, SKINCARE_HAIR_STYLES,
    SKINCARE_PRODUCT_PHYSICS, SKINCARE_LIGHTING_MOODS, SKINCARE_AUDIO_FOCUS,
    SKINCARE_AUTHENTICITY, SKINCARE_PROBLEM_INTENSITIES, SKINCARE_DREAM_GOALS,
    SKINCARE_EMOTIONAL_HOOKS
} from '../constants';
import { analyzeSkincareProduct, generateSkincareStoryboard, generateSkincareKeyframe, retryOperation, delay } from '../services/geminiService';
import { 
    SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, DocumentTextIcon, FolderArrowDownIcon, UsersIcon, 
    CameraIcon, BoltIcon, FireIcon, CheckCircleIcon, ClipboardDocumentIcon, 
    ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon, PencilIcon, QuestionMarkCircleIcon,
    SwatchIcon, SpeakerWaveIcon, ChatBubbleBottomCenterTextIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

declare var marked: {
    parse(markdown: string): string;
};

interface SkincareStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const SkincareStudio: React.FC<SkincareStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [view, setView] = useState<'lobby' | 'config' | 'storyboard'>('lobby');
    const [formData, setFormData] = useState<SkincareFormData>({
        mode: 'PROBLEM_SOLUTION',
        productImage: null,
        productImageB: null,
        modelImage: null,
        productName: '',
        productNameB: '',
        skinType: 'All Skin Types',
        targetProblem: '',
        location: 'Modern Minimalist Bathroom',
        backgroundMode: 'ai',
        customBackground: null,
        framing: 'Close-up (Face Focus)',
        language: 'Bahasa Indonesia (Gaul)',
        usePro: false,
        projectName: '',
        vocalPersona: SKINCARE_VOCAL_PERSONAS[1].value, // Default to hype friend
        wardrobe: SKINCARE_WARDROBES[0].value,
        hairStyle: SKINCARE_HAIR_STYLES[0].value,
        sceneCount: 5,
        
        // Mode specific fields
        comparisonFocus: 'Texture and Results',
        productPhysics: SKINCARE_PRODUCT_PHYSICS[0].value,
        lightingMood: SKINCARE_LIGHTING_MOODS[0].value,
        ingredientFocus: '',
        mythToDebunk: '',
        audioFocus: SKINCARE_AUDIO_FOCUS[0].value,
        authenticityLevel: SKINCARE_AUTHENTICITY[1].value,

        // Problem Solution Defaults
        problemIntensity: SKINCARE_PROBLEM_INTENSITIES[1].value,
        dreamStateGoal: SKINCARE_DREAM_GOALS[0].value,
        emotionalHook: SKINCARE_EMOTIONAL_HOOKS[0].value
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [productBPreview, setProductBPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [scenes, setScenes] = useState<SkincareScene[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalVisualSettings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [activeHelpModal, setActiveHelpModal] = useState<'persona' | 'wardrobe' | null>(null);

    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const handleModeSelect = (modeId: SkincareModeType) => {
        setFormData(prev => ({ 
            ...prev, 
            mode: modeId,
            // Smart Persona Defaults
            vocalPersona: modeId === 'BATTLE' ? 'Persuasive Challenger' : 
                          modeId === 'EDUCATIONAL' ? 'Scientific Skeptic' : 
                          modeId === 'PRO_COMMERCIAL' ? 'Zen Minimalist' : prev.vocalPersona,
            // Mode-specific defaults
            wardrobe: modeId === 'AESTHETIC_ASMR' ? 'Skin-First Minimal' : 
                      modeId === 'BATTLE' ? 'The Neutral Judge' : 
                      modeId === 'EDUCATIONAL' ? 'Modern Pioneer' : 
                      modeId === 'HONEST_REVIEW' ? 'Home Reality' : prev.wardrobe
        }));
        setView('config');
    };

    const handleImageUpload = (type: 'product' | 'productB' | 'model' | 'background', file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (type === 'product') {
                setFormData(prev => ({ ...prev, productImage: file }));
                setProductPreview(dataUrl);
                
                setIsAnalyzing(true);
                analyzeSkincareProduct(file).then(res => {
                    setFormData(prev => ({
                        ...prev,
                        productName: res.productName,
                        detectedTexture: res.texture,
                        detectedIngredients: res.ingredients
                    }));
                }).finally(() => setIsAnalyzing(false));
            } else if (type === 'productB') {
                setFormData(prev => ({ ...prev, productImageB: file }));
                setProductBPreview(dataUrl);
            } else if (type === 'model') {
                setFormData(prev => ({ ...prev, modelImage: file }));
                setModelPreview(dataUrl);
            } else if (type === 'background') {
                setFormData(prev => ({ ...prev, customBackground: file }));
                setCustomBgPreview(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!formData.productImage) { setError("Product photo is mandatory."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingPlan(true);
        setError(null);
        setScenes([]);
        
        try {
            const { scenes: generatedScenes, globalSettings: generatedSettings } = await generateSkincareStoryboard(formData);
            setScenes(generatedScenes);
            setGlobalSettings(generatedSettings);
            setView('storyboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to plan storyboard.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleRenderVisuals = async () => {
        setIsRendering(true);
        setError(null);
        setRetryStatus(null);
        
        for (let i = 0; i < scenes.length; i++) {
            if (!scenes[i].visualKeyframe) {
                setProcessingIndex(i);
                try {
                    await retryOperation(async () => {
                        const base64 = await generateSkincareKeyframe(formData, scenes[i], globalSettings || undefined);
                        setScenes(prev => {
                            const newScenes = [...prev];
                            newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                            return newScenes;
                        });
                    }, 3, 2000, (attempt) => setRetryStatus(`Retrying scene ${i+1}... (${attempt}/3)`));
                    setRetryStatus(null);
                } catch (e) {
                    setError(`Rendering stopped at Scene ${i + 1}.`);
                    setProcessingIndex(null);
                    setIsRendering(false);
                    return; 
                }
            }
        }
        setProcessingIndex(null);
        setIsRendering(false);
    };

    const handleRegenerateSingle = async (index: number) => {
        setRegeneratingIndex(index);
        try {
            const base64 = await generateSkincareKeyframe(formData, scenes[index], globalSettings || undefined);
            setScenes(prev => {
                const newScenes = [...prev];
                newScenes[index] = { ...newScenes[index], visualKeyframe: base64 };
                return newScenes;
            });
        } catch (e) { setError("Regeneration failed."); } finally { setRegeneratingIndex(null); }
    };

    const getVeoPrompt = (scene: SkincareScene) => {
        return JSON.stringify({
            subject_prompt: `${formData.productName}. Skin target: ${formData.skinType}. Physical state: ${formData.detectedTexture}.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: scene.audio_direction.voice_emotion,
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}, Professional Skincare Lab Aesthetic`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, bad texture, medically inaccurate, watermark"
        }, null, 2);
    };

    // --- ENHANCED EXPORT LOGIC ---

    const getTimestamp = () => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear()).slice(-2);
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${d}${m}${y}_${h}${min}`;
    };

    const getModeCode = (mode: SkincareModeType) => {
        const codes: Record<string, string> = {
            'PROBLEM_SOLUTION': 'PAS',
            'HONEST_REVIEW': 'HON',
            'BATTLE': 'BTL',
            'EDUCATIONAL': 'EDU',
            'AESTHETIC_ASMR': 'ASMR',
            'PRO_COMMERCIAL': 'TVC'
        };
        return codes[mode] || 'SKIN';
    };

    const getBaseFileName = () => {
        const safeName = (formData.projectName || formData.productName || activeModeObj?.label || 'Skincare').trim().replace(/\s+/g, '_');
        const modeCode = getModeCode(formData.mode);
        const ts = getTimestamp();
        return `${safeName}_${modeCode}_${ts}`;
    };

    const generateProductionPack = () => {
        const persona = SKINCARE_VOCAL_PERSONAS.find(p => p.value === formData.vocalPersona);
        const mode = SKINCARE_MODES.find(m => m.id === formData.mode);

        let content = `====================================================\n`;
        content += `SKINCARE STUDIO PRO - PRODUCTION SCRIPT\n`;
        content += `====================================================\n\n`;
        content += `PROJECT: ${formData.projectName || 'Untitled Skincare Video'}\n`;
        content += `MODE: ${mode?.label}\n`;
        content += `AUDIENCE/SKIN: ${formData.skinType}\n`;
        content += `LOCATION: ${formData.location}\n\n`;
        
        content += `DIRECTOR'S PERSONA: ${persona?.label}\n`;
        content += `PACE: ${persona?.pace} | IQ: ${persona?.complexity}\n`;
        content += `VISUAL STYLE: ${formData.wardrobe} | ${formData.hairStyle}\n`;
        content += `LANGUAGE: ${formData.language}\n`;
        content += `----------------------------------------------------\n\n`;

        scenes.forEach((scene, idx) => {
            content += `SCENE ${idx + 1} [MASTER LOG]\n`;
            content += `----------------------------------------------------\n`;
            content += `VISUAL ACTION: ${scene.visual_direction.subject_action}\n`;
            content += `CAMERA: ${scene.camera_direction.angle} | ${scene.camera_direction.movement}\n`;
            content += `AUDIO SCRIPT: "${scene.audio_direction.voiceover_script}"\n`;
            content += `TONE GUIDE: ${scene.intonation_guide}\n`;
            content += `VEO PROMPT:\n${getVeoPrompt(scene)}\n\n`;
        });

        content += `====================================================\n`;
        content += `Generated by Affiliate Studio Pro - 2025\n`;
        content += `====================================================\n`;

        return content;
    };

    const handleDownloadAll = async () => {
        if (isDownloadingAll) return;
        setIsDownloadingAll(true);
        
        const baseName = getBaseFileName();
        
        // 1. Download Script First
        const scriptContent = generateProductionPack();
        const scriptBlob = new Blob([scriptContent], { type: 'text/plain' });
        const scriptLink = document.createElement('a');
        scriptLink.href = URL.createObjectURL(scriptBlob);
        scriptLink.download = `${baseName}_PACK.txt`;
        document.body.appendChild(scriptLink);
        scriptLink.click();
        document.body.removeChild(scriptLink);
        await delay(500);

        // 2. Download Images (Original Candidate Resolution)
        for (let i = 0; i < scenes.length; i++) {
            if (scenes[i].visualKeyframe) {
                const link = document.createElement('a');
                // Ensuring we download as a direct raw blob/data to maintain 'Full Size'
                link.href = `data:image/png;base64,${scenes[i].visualKeyframe}`;
                link.download = `${baseName}_Scene_${i + 1}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await delay(800); // Slightly longer delay for high-res stability
            }
        }
        setIsDownloadingAll(false);
    };

    const handleDownloadSingleInternal = (base64: string, index: number) => {
        const baseName = getBaseFileName();
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `${baseName}_Scene_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const updateSceneData = (index: number, field: 'visual' | 'audio', value: string) => {
        setScenes(prev => prev.map((s, i) => {
            if (i !== index) return s;
            if (field === 'visual') return { ...s, visual_direction: { ...s.visual_direction, subject_action: value } };
            return { ...s, audio_direction: { ...s.audio_direction, voiceover_script: value } };
        }));
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const activeModeObj = SKINCARE_MODES.find(m => m.id === formData.mode);

    const CYBER_LABEL = "block text-[10px] font-black text-black uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black focus:ring-0 focus:border-black text-xs py-3 px-4 transition-all shadow-neo-sm placeholder-gray-400 font-bold";

    return (
        <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-[#020617] overflow-y-auto lg:overflow-hidden">
            
            {/* 1. LOBBY VIEW */}
            {view === 'lobby' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 animate-fade-in">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12">
                            <span className="text-brand-500 font-bold uppercase tracking-widest text-[10px] mb-2 block">The Studio Room</span>
                            <h2 className="text-3xl lg:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">Skincare Studio Pro</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                                Digital Content Director for beauty creators. Create viral hooks, texture demos, and ingredient education tailored to the skincare affiliate niche.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {SKINCARE_MODES.map((mode) => {
                                const Icon = mode.icon;
                                return (
                                    <button 
                                        key={mode.id}
                                        onClick={() => handleModeSelect(mode.id as SkincareModeType)}
                                        className={`group relative p-8 border-4 border-black transition-all duration-300 text-left bg-white hover:bg-yellow-50 hover:shadow-neo hover:-translate-y-1 overflow-hidden`}
                                    >
                                        <div className={`w-14 h-14 border-4 border-black bg-white flex items-center justify-center mb-6 shadow-neo-sm group-hover:bg-cyan-400 transition-colors`}>
                                            <Icon className={`w-7 h-7 text-black`} />
                                        </div>
                                        <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight">{mode.label}</h3>
                                        <p className="text-sm text-black/70 font-bold leading-relaxed mb-6">{mode.description}</p>
                                        <div className={`flex items-center text-xs font-black text-black uppercase tracking-widest`}>
                                            Enter Studio <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. CONFIG VIEW */}
            {view === 'config' && (
                <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden animate-fade-in relative">
                    
                    {/* Header Controls */}
                    <div className="absolute top-4 left-6 z-20">
                        <button onClick={() => setView('lobby')} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-500 transition-colors bg-white/50 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <ArrowLeftIcon className="w-4 h-4" /> Back to Lobby
                        </button>
                    </div>

                    {/* Right: Config Panel (Input) */}
                    <div className="w-full lg:w-[450px] flex-shrink-0 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg order-1 lg:order-2">
                        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeModeObj?.bg}`}>
                                    {activeModeObj && React.createElement(activeModeObj.icon, { className: `w-5 h-5 ${activeModeObj.color}` })}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white font-display text-lg">{activeModeObj?.label}</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            
                            {/* Pro Mode Toggle */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div>
                                    <div><p className="text-xs font-bold text-gray-900 dark:text-white">Pro Mode (G3)</p></div>
                                </div>
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                            </div>

                            {/* 1. ASSETS */}
                            <section className="relative z-[40]">
                                <label className={CYBER_LABEL}>1. Assets (Product & Cast)</label>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <label className={`block w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-brand-500' : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'}`}>
                                        {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-center p-4"><ArrowPathIcon className="w-5 h-5 text-brand-500 animate-spin mb-2"/><span className="text-[9px] text-white font-bold uppercase tracking-widest">Texture Lab...</span></div>}
                                        {productPreview ? <img src={productPreview} className="w-full h-full object-contain p-4" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><CameraIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Main Product</span></div>}
                                        <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                                    </label>
                                    
                                    {formData.mode === 'BATTLE' ? (
                                        <label className={`block w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden relative transition-all group ${productBPreview ? 'border-purple-500' : 'border-gray-300 dark:border-white/20 hover:border-purple-400 bg-gray-50 dark:bg-white/5'}`}>
                                            {productBPreview ? <img src={productBPreview} className="w-full h-full object-contain p-4" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><BoltIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Competitor</span></div>}
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('productB', e.target.files?.[0])} accept="image/*" />
                                        </label>
                                    ) : (
                                        <label className={`block w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden relative transition-all group ${modelPreview ? 'border-brand-500' : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'}`}>
                                            {modelPreview ? <img src={modelPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><UsersIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Model Ref</span></div>}
                                            {/* Fix: Use handleImageUpload('model', ...) directly to correct the "handleModelRefChange not found" error. */}
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                                        </label>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Project Name (File Name)</label><input type="text" value={formData.projectName} onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. serum_viral_v1" /></div>
                                    <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Product Name</label><input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Ceramide Serum" /></div>
                                    {formData.mode === 'BATTLE' && <div><label className="text-[9px] text-gray-500 font-bold mb-1 block">Competitor Name</label><input type="text" value={formData.productNameB} onChange={(e) => setFormData(prev => ({...prev, productNameB: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Generic Brand" /></div>}
                                </div>
                            </section>

                            {/* 2. DYNAMIC MODE CONFIG */}
                            <section className="relative z-[30] space-y-4 pt-6 border-t border-gray-200 dark:border-white/5 animate-fade-in">
                                <label className={CYBER_LABEL}>2. {activeModeObj?.label} Settings</label>
                                
                                {/* PROBLEM SOLUTION SPECIFIC */}
                                {formData.mode === 'PROBLEM_SOLUTION' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase">Target Problem (Pain Point)</label>
                                            <input type="text" value={formData.targetProblem} onChange={(e) => setFormData(prev => ({...prev, targetProblem: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Acne inflammation, Dry patches" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <CyberDropdown label="Problem Intensity" value={formData.problemIntensity || ''} options={SKINCARE_PROBLEM_INTENSITIES} onChange={(val) => setFormData(prev => ({...prev, problemIntensity: val}))} />
                                            <CyberDropdown label="Dream State Goal" value={formData.dreamStateGoal || ''} options={SKINCARE_DREAM_GOALS} onChange={(val) => setFormData(prev => ({...prev, dreamStateGoal: val}))} />
                                        </div>
                                        <CyberDropdown label="Emotional Hook Type" value={formData.emotionalHook || ''} options={SKINCARE_EMOTIONAL_HOOKS} onChange={(val) => setFormData(prev => ({...prev, emotionalHook: val}))} />
                                    </div>
                                )}

                                {/* BATTLE SPECIFIC */}
                                {formData.mode === 'BATTLE' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase">Winning Point (Comparison Focus)</label>
                                            <textarea value={formData.comparisonFocus} onChange={(e) => setFormData(prev => ({...prev, comparisonFocus: e.target.value}))} className={CYBER_INPUT} placeholder="Why is Product A better? (e.g. Absorbs faster, 50% cheaper, natural scent)" rows={2} />
                                        </div>
                                    </div>
                                )}

                                {/* PRO COMMERCIAL SPECIFIC */}
                                {formData.mode === 'PRO_COMMERCIAL' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <CyberDropdown label="Product Physics" value={formData.productPhysics || ''} options={SKINCARE_PRODUCT_PHYSICS} onChange={(val) => setFormData(prev => ({...prev, productPhysics: val}))} />
                                        <CyberDropdown label="Lighting Mood" value={formData.lightingMood || ''} options={SKINCARE_LIGHTING_MOODS} onChange={(val) => setFormData(prev => ({...prev, lightingMood: val}))} />
                                    </div>
                                )}

                                {/* EDUCATIONAL SPECIFIC */}
                                {formData.mode === 'EDUCATIONAL' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase">Main Ingredient Highlight</label><input type="text" value={formData.ingredientFocus} onChange={(e) => setFormData(prev => ({...prev, ingredientFocus: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. 5% Niacinamide, Pure Retinol" /></div>
                                        <div><label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase">Common Myth to Debunk</label><input type="text" value={formData.mythToDebunk} onChange={(e) => setFormData(prev => ({...prev, mythToDebunk: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. Moisturizer isn't for oily skin" /></div>
                                    </div>
                                )}

                                {/* ASMR SPECIFIC */}
                                {formData.mode === 'AESTHETIC_ASMR' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <CyberDropdown label="Audio Sensory Focus" value={formData.audioFocus || ''} options={SKINCARE_AUDIO_FOCUS} onChange={(val) => setFormData(prev => ({...prev, audioFocus: val}))} icon={SpeakerWaveIcon} />
                                    </div>
                                )}

                                {/* HONEST REVIEW SPECIFIC */}
                                {formData.mode === 'HONEST_REVIEW' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <CyberDropdown label="Authenticity Level" value={formData.authenticityLevel || ''} options={SKINCARE_AUTHENTICITY} onChange={(val) => setFormData(prev => ({...prev, authenticityLevel: val}))} />
                                    </div>
                                )}
                            </section>

                            {/* 3. VOCAL & CAST STYLING */}
                            <section className="relative z-[20] space-y-4 pt-6 border-t border-gray-200 dark:border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className={CYBER_LABEL}>{formData.mode === 'AESTHETIC_ASMR' ? '3. Atmospheric Focus' : '3. Vocal Persona (Director\'s Card)'}</label>
                                    <button onClick={() => setActiveHelpModal('persona')} className="text-brand-500 hover:text-brand-400 transition-colors"><QuestionMarkCircleIcon className="w-4 h-4"/></button>
                                </div>
                                
                                {formData.mode === 'AESTHETIC_ASMR' ? (
                                    <div className="grid grid-cols-1 gap-3 animate-fade-in">
                                        {SKINCARE_AUDIO_FOCUS.map((focus) => (
                                            <button
                                                key={focus.value}
                                                onClick={() => setFormData(prev => ({ ...prev, audioFocus: focus.value }))}
                                                className={`p-4 border-4 border-black text-left transition-all duration-300 ${formData.audioFocus === focus.value ? 'bg-yellow-400 shadow-neo translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-yellow-50 hover:shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px]'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 border-2 border-black ${formData.audioFocus === focus.value ? 'bg-white text-black' : 'bg-cyan-400 text-black'}`}><SpeakerWaveIcon className="w-4 h-4" /></div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-black uppercase tracking-wider">{focus.label}</h4>
                                                        <p className="text-[10px] text-black/60 font-bold line-clamp-1">{focus.value}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 animate-fade-in">
                                        {SKINCARE_VOCAL_PERSONAS.map((persona) => (
                                            <button
                                                key={persona.value}
                                                onClick={() => setFormData(prev => ({ ...prev, vocalPersona: persona.value }))}
                                                className={`group relative p-4 border-4 border-black transition-all duration-300 text-left overflow-hidden ${formData.vocalPersona === persona.value ? 'bg-yellow-400 shadow-neo translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-yellow-50 hover:shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px]'}`}
                                            >
                                                {formData.vocalPersona === persona.value && <div className="absolute top-0 right-0 p-2"><CheckCircleIcon className="w-4 h-4 text-black" /></div>}
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center flex-shrink-0 ${formData.vocalPersona === persona.value ? 'bg-white text-black' : 'bg-cyan-400 text-black'}`}>
                                                        <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`text-xs font-black uppercase tracking-widest text-black`}>{persona.label}</h4>
                                                        <p className={`text-[10px] leading-tight mb-2 font-bold text-black/70`}>{persona.desc}</p>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-[8px] font-black uppercase text-black/40`}>Pace:</span>
                                                                <span className={`text-[8px] font-black text-black`}>{persona.pace}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-[8px] font-black uppercase text-black/40`}>IQ:</span>
                                                                <span className={`text-[8px] font-black text-black`}>{persona.complexity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Visual Hint Indicator */}
                                                <div className={`mt-3 pt-3 border-t text-[8px] italic flex items-center gap-2 ${formData.vocalPersona === persona.value ? 'border-white/10 text-brand-200' : 'border-gray-100 dark:border-white/5 text-gray-500'}`}>
                                                    <CameraIcon className="w-2.5 h-2.5" /> Auto-sync expression: {persona.visual_cue.split('.')[0]}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Wardrobe Style</label>
                                            <button onClick={() => setActiveHelpModal('wardrobe')} className="text-brand-500 hover:text-brand-400 transition-colors"><QuestionMarkCircleIcon className="w-4 h-4"/></button>
                                        </div>
                                        <CyberDropdown value={formData.wardrobe} options={SKINCARE_WARDROBES.map(w => ({label: w.label, value: w.value}))} onChange={(val) => setFormData(prev => ({...prev, wardrobe: val}))} icon={SwatchIcon} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase tracking-widest">Hair Styling</label>
                                        <CyberDropdown value={formData.hairStyle} options={SKINCARE_HAIR_STYLES} onChange={(val) => setFormData(prev => ({...prev, hairStyle: val}))} />
                                    </div>
                                </div>
                            </section>

                            {/* 4. PRODUCTION CONFIG */}
                            <section className="relative z-[10] space-y-4 pt-6 border-t border-gray-200 dark:border-white/5">
                                <label className={CYBER_LABEL}>4. Production Logistics</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <CyberDropdown label="Target Skin Type" value={formData.skinType} options={SKINCARE_SKIN_TYPES} onChange={(val) => setFormData(prev => ({...prev, skinType: val}))} />
                                    <CyberDropdown label="Shooting Location" value={formData.location} options={SKINCARE_LOCATIONS} onChange={(val) => setFormData(prev => ({...prev, location: val}))} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <CyberDropdown label="Default Framing" value={formData.framing} options={SKINCARE_FRAMINGS} onChange={(val) => setFormData(prev => ({...prev, framing: val}))} />
                                    <div>
                                        <label className="text-[9px] text-gray-500 font-bold mb-1 block uppercase">Total Scenes</label>
                                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                            <button onClick={() => setFormData(prev => ({...prev, sceneCount: 5}))} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.sceneCount === 5 ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>5 Scenes</button>
                                            <button onClick={() => setFormData(prev => ({...prev, sceneCount: 8}))} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.sceneCount === 8 ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>8 Scenes</button>
                                        </div>
                                    </div>
                                </div>
                                <CyberDropdown label="Target Language" value={formData.language} options={['Bahasa Indonesia (Gaul)', 'English (Beauty Slang)', 'Melayu']} onChange={(val) => setFormData(prev => ({...prev, language: val}))} />
                            </section>
                        </div>

                        <div className="p-6 border-t-4 border-black bg-white z-10 pb-12 lg:pb-6">
                            <button 
                                onClick={handleGenerate} 
                                disabled={isGeneratingPlan || !formData.productImage}
                                className={`w-full py-4 bg-yellow-400 text-black border-4 border-black font-black text-sm shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                            >
                                {isGeneratingPlan ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <DocumentTextIcon className="w-5 h-5 mr-2"/>}
                                {isGeneratingPlan ? 'Mapping Storyboard...' : 'Generate Script & Visuals'}
                            </button>
                        </div>
                    </div>

                    {/* Left: Background Canvas */}
                    <div className="flex-none min-h-[40vh] lg:flex-1 bg-gray-100 dark:bg-black/40 flex flex-col items-center justify-center p-12 order-2 lg:order-1">
                        <div className="max-w-md w-full text-center space-y-6 opacity-40 group hover:opacity-60 transition-opacity">
                            <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-400 flex items-center justify-center mx-auto group-hover:rotate-12 transition-transform duration-500">
                                <SparklesIcon className="w-12 h-12 text-gray-400" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white font-display uppercase tracking-widest">Studio Control Center</h4>
                            <p className="text-sm text-gray-500">Configure your persona, wardrobe, and mode. The AI will synchronize your "vocal tone" with the generated visuals for absolute content cohesion.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STORYBOARD VIEW */}
            {view === 'storyboard' && (
                <div className="flex-1 flex flex-col h-full animate-fade-in bg-space-950 overflow-hidden">
                    
                    {/* Header Monitor */}
                    <div className="h-16 lg:h-20 border-b border-white/5 flex items-center px-6 justify-between bg-black/40 backdrop-blur-xl shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('config')} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ArrowLeftIcon className="w-5 h-5"/></button>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">SCENE MONITOR • {activeModeObj?.label}</h3>
                                <p className="text-[10px] text-gray-500">{formData.productName} • {formData.language}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleRenderVisuals} 
                                disabled={isRendering}
                                className={`px-5 py-2 border-2 border-black text-xs font-black flex items-center transition-all ${isRendering ? 'bg-gray-200 text-gray-500' : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'}`}
                            >
                                {isRendering ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                {isRendering ? (retryStatus || 'Rendering Master...') : 'Render Visuals'}
                            </button>
                            
                            {scenes.some(s => s.visualKeyframe) && (
                                <button 
                                    onClick={handleDownloadAll} 
                                    disabled={isDownloadingAll}
                                    className={`px-5 py-2 border-2 border-black text-xs font-black transition-all flex items-center ${isDownloadingAll ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-50 text-black shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'}`}
                                >
                                    {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                    {isDownloadingAll ? 'Exporting Pack...' : 'Export Production Pack'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Storyboard Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
                        <div className="max-w-7xl mx-auto space-y-12">
                            {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold mb-8">{error}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                                {scenes.map((scene, idx) => {
                                    const isLoading = (isRendering && processingIndex === idx) || regeneratingIndex === idx;
                                    const isWaiting = isRendering && !scene.visualKeyframe && processingIndex !== idx;
                                    
                                    // HERO SHOT DETECTION (Scene 3 is typically the hero)
                                    const isHeroShot = idx === 2;

                                    return (
                                        <div key={scene.id} className="flex flex-col group animate-fade-in">
                                            {/* Header Scene */}
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] font-mono">SCENE {idx + 1}</span>
                                                <span className="text-[9px] text-red-500 font-bold border border-red-500/30 px-1.5 rounded uppercase">00:00 - 00:08</span>
                                            </div>

                                            {/* Card */}
                                            <div className={`relative aspect-[9/16] border-4 border-black transition-all duration-500 overflow-hidden bg-white shadow-neo ${processingIndex === idx ? 'ring-4 ring-yellow-400' : ''}`}>
                                                {isLoading ? (
                                                    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                        <ArrowPathIcon className="w-10 h-10 text-cyan-500 animate-spin mb-3" />
                                                        <span className="text-[9px] text-black font-black tracking-[0.3em] uppercase animate-pulse">{retryStatus || 'RENDERING RAW'}</span>
                                                    </div>
                                                ) : scene.visualKeyframe ? (
                                                    <>
                                                        <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                        
                                                        {/* HERO BADGE */}
                                                        {isHeroShot && (
                                                            <div className="absolute top-3 right-3 z-20">
                                                                <div className="flex items-center gap-1 bg-yellow-400 text-black border-2 border-black px-2 py-0.5 text-[8px] font-black uppercase shadow-neo-sm animate-pulse">
                                                                    <SparklesIcon className="w-2.5 h-2.5" /> Hero Shot
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <button onClick={() => setPreviewIndex(idx)} className="p-3 bg-white text-black border-2 border-black hover:scale-110 transition-transform shadow-neo-sm"><CameraIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => handleRegenerateSingle(idx)} className="p-3 bg-yellow-400 text-black border-2 border-black hover:scale-110 transition-transform shadow-neo-sm"><ArrowPathIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                                        <PhotoIcon className={`w-12 h-12 mb-4 ${isWaiting ? 'opacity-20' : 'opacity-10'}`} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                                            {isWaiting ? 'In Queue...' : 'Blueprint Locked'}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Overlay Text Suggestion */}
                                                {scene.overlay_suggestion && scene.visualKeyframe && !isLoading && (
                                                    <div className="absolute bottom-12 left-4 right-4 pointer-events-none">
                                                        <div className="bg-yellow-400 text-black border-2 border-black px-2 py-1 text-[10px] font-black uppercase inline-block mb-1 shadow-neo-sm rotate-[-2deg]">{scene.overlay_suggestion}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Metadata Produksi */}
                                            <div className="mt-5 space-y-4">
                                                {/* Direction Panel */}
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex justify-between items-center">
                                                        Visual Direction (Editable)
                                                        {isHeroShot && <span className="text-[8px] text-amber-500 font-black">HIGH-END CINEMATIC</span>}
                                                    </p>
                                                    <textarea 
                                                        value={scene.visual_direction.subject_action}
                                                        onChange={(e) => updateSceneData(idx, 'visual', e.target.value)}
                                                        className={`w-full bg-transparent border-none p-0 text-[11px] leading-relaxed italic focus:ring-0 resize-none overflow-hidden h-auto min-h-[40px] ${isHeroShot ? 'text-amber-200/80' : 'text-gray-300'}`}
                                                        placeholder="Describe visual action..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded bg-white/5 border border-white/5">
                                                        <p className="text-[8px] font-bold text-gray-500 uppercase">Camera</p>
                                                        <p className="text-[9px] text-white truncate font-mono">{scene.camera_direction.angle}</p>
                                                    </div>
                                                    <div className="p-2 rounded bg-white/5 border border-white/5">
                                                        <p className="text-[8px] font-bold text-gray-500 uppercase">Movement</p>
                                                        <p className="text-[9px] text-white truncate font-mono">{scene.camera_direction.movement}</p>
                                                    </div>
                                                </div>

                                                {/* Script & Guide */}
                                                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 relative group/script">
                                                    <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                                        The Script (Editable)
                                                        <PencilIcon className="w-2.5 h-2.5 opacity-0 group-hover/script:opacity-50 transition-opacity" />
                                                    </label>
                                                    <textarea 
                                                        value={scene.audio_direction.voiceover_script}
                                                        onChange={(e) => updateSceneData(idx, 'audio', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-[12px] text-indigo-100 font-medium leading-relaxed focus:ring-0 resize-none overflow-hidden h-auto min-h-[60px]"
                                                        rows={3}
                                                        placeholder="Write voiceover script here..."
                                                    />
                                                    <div className="mt-3 pt-3 border-t border-indigo-500/10 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                                                        <p className="text-[9px] text-indigo-400 font-bold uppercase">Guide: {scene.intonation_guide}</p>
                                                    </div>
                                                </div>

                                                {/* VEO PROMPT BLOCK (Reactive) */}
                                                <div className="bg-gray-900 rounded-xl p-4 border border-white/10 relative group">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                                                            <SparklesIcon className="w-3 h-3 mr-1.5" /> Veo / Motion Prompt
                                                        </label>
                                                        <button 
                                                            onClick={() => copyToClipboard(getVeoPrompt(scene), idx)}
                                                            className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center transition-colors bg-white/10 px-2 py-1 rounded-md"
                                                        >
                                                            {copiedIndex === idx ? <CheckCircleIcon className="w-3 h-3 mr-1.5 text-green-400" /> : <ClipboardDocumentIcon className="w-3 h-3 mr-1.5" />}
                                                            {copiedIndex === idx ? 'Copied!' : 'Copy JSON'}
                                                        </button>
                                                    </div>
                                                    <pre className="text-[9px] text-gray-500 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar select-all leading-tight">
                                                        {getVeoPrompt(scene)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HELP MODALS */}
            {activeHelpModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setActiveHelpModal(null)}>
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                                {activeHelpModal === 'persona' ? 'Vocal Persona Guide' : 'Wardrobe Styling Guide'}
                            </h3>
                            <button onClick={() => setActiveHelpModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white dark:bg-black/20">
                            {activeHelpModal === 'persona' ? (
                                SKINCARE_VOCAL_PERSONAS.map((p, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-brand-500">{p.label}</h4>
                                            <div className="flex gap-2">
                                                <span className="text-[8px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded font-bold uppercase">Pace: {p.pace}</span>
                                                <span className="text-[8px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase">Complexity: {p.complexity}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{p.desc}</p>
                                        <div className="bg-gray-50 dark:bg-black/30 p-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10 mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Contoh Script:</span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{p.example}"</p>
                                        </div>
                                        <div className="text-[10px] text-gray-500 italic">
                                            <span className="font-bold">Director's Note:</span> Best matched with {p.complexity === 'High' ? 'Modern Pioneer' : 'Home Reality'} wardrobe.
                                        </div>
                                    </div>
                                ))
                            ) : (
                                SKINCARE_WARDROBES.map((w, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm">
                                        <h4 className="font-bold text-amber-500 mb-1">{w.label}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{w.desc}</p>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/30 p-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                                            <PhotoIcon className="w-5 h-5 text-gray-400"/>
                                            <p className="text-[10px] text-gray-700 dark:text-gray-300 font-mono leading-tight">{w.visual}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <button onClick={() => setActiveHelpModal(null)} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-500 transition-colors uppercase tracking-widest text-xs">Got it, Captain!</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            <ScenePreviewModal 
                isOpen={previewIndex !== null}
                onClose={() => setPreviewIndex(null)}
                imageUrl={previewIndex !== null && scenes[previewIndex]?.visualKeyframe ? scenes[previewIndex].visualKeyframe : undefined}
                sceneNumber={previewIndex !== null ? previewIndex + 1 : 0}
                totalScenes={scenes.length}
                onNext={() => setPreviewIndex(prev => prev !== null ? (prev + 1) % scenes.length : null)}
                onPrev={() => setPreviewIndex(prev => prev !== null ? (prev - 1 + scenes.length) % scenes.length : null)}
                onRegenerate={() => previewIndex !== null && handleRegenerateSingle(previewIndex)}
                onSave={() => previewIndex !== null && scenes[previewIndex]?.visualKeyframe && handleDownloadSingleInternal(scenes[previewIndex].visualKeyframe!, previewIndex)}
                isRegenerating={regeneratingIndex !== null}
            />
        </div>
    );
};

export default SkincareStudio;