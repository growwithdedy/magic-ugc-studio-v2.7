
import React, { useState, useEffect } from 'react';
import type { Language, UGCCreatorFormData, UGCScene, UGCContentStructure, UGCScriptStyle, UGCScriptDuration, UGCSceneStrategy, MarketingAngle, GlobalVisualSettings } from '../types';
import { UGC_CATEGORIES, UGC_CREATOR_SHOT_TYPES, UGC_TARGET_AUDIENCES, UGC_CONTENT_STRUCTURES, UGC_SCRIPT_STYLES, UGC_SCRIPT_DURATIONS, UGC_SCENE_STRATEGIES, UGC_HOOK_TEMPLATES, HAND_GENDERS, UGC_MODEL_OUTFITS, UGC_ENVIRONMENT_VIBES } from '../constants';
import { generateUGCScriptAndStoryboard, generateUGCSceneImage, analyzeUGCContext, retryOperation, delay } from '../services/geminiService';
import { 
    VideoCameraIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    XMarkIcon, PlayIcon, DocumentTextIcon, FolderArrowDownIcon, ClipboardDocumentIcon, CheckCircleIcon, UsersIcon, CheckIcon, FireIcon, ChevronDownIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import ScenePreviewModal from './ScenePreviewModal';

interface UGCCreatorStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const UGCCreatorStudio: React.FC<UGCCreatorStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<UGCCreatorFormData>({
        productImage: null,
        productName: '',
        productDescription: '',
        modelImage: null,
        modelGender: 'Female',
        modelOutfit: UGC_MODEL_OUTFITS[0].value, // Default to first preset value
        isHijabModel: false,
        category: 'Fashion',
        shotType: 'Hand Focus',
        targetAudience: UGC_TARGET_AUDIENCES[0].value,
        
        // Virtual Set Config
        backgroundMode: 'ai',
        customBackground: null,
        environmentVibe: UGC_ENVIRONMENT_VIBES[0].value, // Default to first preset value

        scriptLanguage: 'Bahasa Indonesia (Gaul)',
        contentStructure: UGC_CONTENT_STRUCTURES[0],
        scriptStyle: 'Santai & Akrab (Bestie Vibe)',
        scriptDuration: 'Balanced (Standard)', 
        sceneStrategy: 'Snappy (3 Scenes)',
        hookTemplate: '',
        painPoint: '',
        desiredState: '',
        usps: [],
        greeting: '',
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [customBackgroundPreview, setCustomBackgroundPreview] = useState<string | null>(null);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    // NEW STATE FOR SMART VISUAL RECOMMENDATIONS & ANGLE GAME
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAngleModal, setShowAngleModal] = useState(false);
    const [marketingAngles, setMarketingAngles] = useState<MarketingAngle[]>([]);
    const [selectedAngle, setSelectedAngle] = useState<MarketingAngle | null>(null);
    
    // NEW STATE FOR WORLD LOCK
    const [globalSettings, setGlobalSettings] = useState<GlobalVisualSettings | null>(null);

    // Visual Recommendations
    const [suggestedOutfits, setSuggestedOutfits] = useState<string[]>([]);
    const [suggestedVibes, setSuggestedVibes] = useState<string[]>([]);
    
    // Custom Input Toggles
    const [isCustomOutfit, setIsCustomOutfit] = useState(false);
    const [isCustomVibe, setIsCustomVibe] = useState(false);

    // Auto-Alignment Feedback
    const [autoAlignedMsg, setAutoAlignedMsg] = useState<string | null>(null);

    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
    const [scenes, setScenes] = useState<UGCScene[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
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
                
                // TRIGGER ANALYSIS
                setIsAnalyzing(true);
                setMarketingAngles([]);
                setSelectedAngle(null);
                setSuggestedOutfits([]);
                setSuggestedVibes([]);
                
                analyzeUGCContext(file).then(res => {
                    setFormData(prev => ({
                        ...prev,
                        productName: res.productName,
                        productDescription: res.productDescription,
                        targetAudience: res.targetAudience || prev.targetAudience,
                        usps: res.usps
                    }));
                    setMarketingAngles(res.marketingAngles);
                    setSuggestedOutfits(res.suggestedOutfits || []);
                    setSuggestedVibes(res.suggestedVibes || []);
                    setShowAngleModal(true); // Open Modal
                }).catch(e => {
                    console.error(e);
                    setError("Failed to analyze product. Please try again.");
                }).finally(() => setIsAnalyzing(false));

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

    const handleSelectAngle = (angle: MarketingAngle) => {
        setSelectedAngle(angle);
        setFormData(prev => ({
            ...prev,
            hookTemplate: angle.hook,
            painPoint: angle.description // Approximate mapping
        }));
        setShowAngleModal(false);
    };

    // --- SMART PRESET LOGIC (AUTO-ALIGNMENT) ---
    const handleTargetAudienceChange = (val: string) => {
        let newStyle = formData.scriptStyle;
        let newVibe = formData.environmentVibe;
        let newLang = formData.scriptLanguage;
        let didAlign = false;

        // Only auto-align vibe if in AI mode, don't overwrite if user is using custom background
        const shouldAlignVibe = formData.backgroundMode === 'ai';

        // 1. GEN Z / STUDENTS -> Santai, Gaul, Flash/Messy
        if (val.includes('Gen Z') || val.includes('Student') || val.includes('Budget')) {
            const styleObj = UGC_SCRIPT_STYLES.find(s => s.label.includes('Santai'));
            const vibeObj = UGC_ENVIRONMENT_VIBES.find(v => v.label.includes('Gen Z') || v.label.includes('Flash'));
            if(styleObj) newStyle = styleObj.value;
            if(shouldAlignVibe && vibeObj) newVibe = vibeObj.value;
            newLang = 'Bahasa Indonesia (Gaul)';
            didAlign = true;
        }
        // 2. MILLENNIALS / PRO / LUXURY -> Profesional, Golden Hour
        else if (val.includes('Millennials') || val.includes('Professional') || val.includes('Luxury')) {
            const styleObj = UGC_SCRIPT_STYLES.find(s => s.label.includes('Profesional') || s.label.includes('Mewah'));
            const vibeObj = UGC_ENVIRONMENT_VIBES.find(v => v.label.includes('Golden Hour') || v.label.includes('Clean'));
            if(styleObj) newStyle = styleObj.value;
            if(shouldAlignVibe && vibeObj) newVibe = vibeObj.value;
            // Keep existing language or default to standard, usually implies slightly cleaner lang
            didAlign = true;
        }
        // 3. PARENTS / FAMILY -> Emosional, Living Room
        else if (val.includes('Parents') || val.includes('Homeowners') || val.includes('Keluarga')) {
            const styleObj = UGC_SCRIPT_STYLES.find(s => s.label.includes('Emosional') || s.label.includes('Storytelling'));
            const vibeObj = UGC_ENVIRONMENT_VIBES.find(v => v.label.includes('Ruang Tamu') || v.label.includes('Living Room'));
            if(styleObj) newStyle = styleObj.value;
            if(shouldAlignVibe && vibeObj) newVibe = vibeObj.value;
            didAlign = true;
        }
        // 4. BEAUTY / SKINCARE -> Review Jujur, Bathroom
        else if (val.includes('Beauty')) {
            const styleObj = UGC_SCRIPT_STYLES.find(s => s.label.includes('Review') || s.label.includes('Santai'));
            const vibeObj = UGC_ENVIRONMENT_VIBES.find(v => v.label.includes('Bathroom') || v.label.includes('Kamar Mandi'));
            if(styleObj) newStyle = styleObj.value;
            if(shouldAlignVibe && vibeObj) newVibe = vibeObj.value;
            didAlign = true;
        }
        // 5. TECH / GAMERS -> Review Detail, Neon
        else if (val.includes('Tech') || val.includes('Gamers')) {
            const styleObj = UGC_SCRIPT_STYLES.find(s => s.label.includes('Profesional') || s.label.includes('Review'));
            const vibeObj = UGC_ENVIRONMENT_VIBES.find(v => v.label.includes('Neon') || v.label.includes('Gaming'));
            if(styleObj) newStyle = styleObj.value;
            if(shouldAlignVibe && vibeObj) newVibe = vibeObj.value;
            didAlign = true;
        }

        setFormData(prev => ({
            ...prev,
            targetAudience: val,
            scriptStyle: newStyle,
            environmentVibe: newVibe,
            scriptLanguage: newLang
        }));

        if (didAlign) {
            setAutoAlignedMsg("✨ AI Auto-Aligned Vibe & Tone");
            setTimeout(() => setAutoAlignedMsg(null), 4000);
        }
    };

    const handleOutfitChange = (val: string) => {
        if (val === 'Custom') {
            setIsCustomOutfit(true);
            setFormData(prev => ({ ...prev, modelOutfit: '' })); // Clear for typing
        } else {
            setIsCustomOutfit(false);
            setFormData(prev => ({ ...prev, modelOutfit: val }));
        }
    };

    const handleVibeChange = (val: string) => {
        if (val === 'Custom') {
            setIsCustomVibe(true);
            setFormData(prev => ({ ...prev, environmentVibe: '' })); // Clear for typing
        } else {
            setIsCustomVibe(false);
            setFormData(prev => ({ ...prev, environmentVibe: val }));
        }
    };

    const applySuggestion = (type: 'outfit' | 'vibe', value: string) => {
        if (type === 'outfit') {
            setIsCustomOutfit(true); // Treat suggestion as custom input
            setFormData(prev => ({ ...prev, modelOutfit: value }));
        } else {
            setIsCustomVibe(true); // Treat suggestion as custom input
            setFormData(prev => ({ ...prev, environmentVibe: value }));
        }
    };

    const handleGenerateScript = async () => {
        if (!formData.productImage) { setError("Please upload a product image."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingScript(true);
        setError(null);
        setScenes([]);
        setGlobalSettings(null); // Reset global settings
        
        try {
            // Updated call to receive both scenes and settings
            const { scenes: generatedScenes, globalSettings: generatedSettings } = await generateUGCScriptAndStoryboard(formData, selectedAngle || undefined);
            setScenes(generatedScenes);
            setGlobalSettings(generatedSettings);
            setActiveTab('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate script.");
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
                        // Pass globalSettings to enforce consistency
                        const base64 = await generateUGCSceneImage(formData, scenes[i], globalSettings || undefined);
                        setScenes(prev => {
                            const newScenes = [...prev];
                            newScenes[i] = { ...newScenes[i], visualKeyframe: base64 };
                            return newScenes;
                        });
                    }, 3, 2000, (attempt) => setRetryStatus(`Retrying scene ${i+1}... (${attempt}/3)`));
                    
                    setRetryStatus(null); // Clear retry status on success
                } catch (err) {
                    console.error(`Failed scene ${i + 1}`, err);
                    setError(`Rendering stopped at Scene ${i + 1}. Please try regenerating.`);
                    setProcessingIndex(null);
                    setIsGeneratingImages(false);
                    return; // STOP FLOW
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
                // Pass globalSettings here too
                const base64 = await generateUGCSceneImage(formData, scenes[index], globalSettings || undefined);
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

    const updateSceneData = (index: number, field: 'visual' | 'audio' | 'type' | 'cut', value: string) => {
        setScenes(prev => prev.map((s, i) => {
            if (i !== index) return s;
            if (field === 'visual') return { ...s, visual_direction: { ...s.visual_direction, subject_action: value } };
            if (field === 'audio') return { ...s, audio_direction: { ...s.audio_direction, voiceover_script: value } };
            if (field === 'type') return { ...s, type: value };
            return { ...s, suggestedCut: value };
        }));
    };

    const clearAllScenes = () => {
        if (window.confirm("Are you sure you want to clear all scenes? This cannot be undone.")) {
            setScenes([]);
        }
    };

    const regenerateAllVisuals = () => {
        if (window.confirm("This will clear all current visuals and start rendering again. Continue?")) {
            setScenes(prev => prev.map(s => ({ ...s, visualKeyframe: undefined })));
            handleGenerateVisuals();
        }
    };

    const getVeoPrompt = (scene: UGCScene) => {
        return JSON.stringify({
            subject_prompt: `${formData.productName}. The ${formData.modelGender} model.`,
            motion_action: scene.visual_direction.subject_action,
            audio_prompts: {
                context: scene.audio_direction.voice_emotion,
                transcript: scene.audio_direction.voiceover_script
            },
            cinematic_style: `${scene.visual_direction.lighting_atmosphere}, ${scene.camera_direction.movement}, ${scene.camera_direction.angle}`,
            aspect_ratio: "9:16",
            negative_prompt: "morphing, distortion, static image, text overlay, bad hands, watermark"
        }, null, 2);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const getSafeFilename = () => formData.projectName?.trim().replace(/\s+/g, '_') || 'ugc_project';

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

    // --- NEW EDITOR FUNCTIONS ---
    
    // Normalize scene numbers after reordering or deleting
    const normalizeSceneNumbers = (scenes: UGCScene[]) => {
        return scenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    };

    const moveScene = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= scenes.length) return;
        const newScenes = [...scenes];
        const temp = newScenes[index];
        newScenes[index] = newScenes[index + direction];
        newScenes[index + direction] = temp;
        setScenes(normalizeSceneNumbers(newScenes));
    };

    const deleteScene = (index: number) => {
        if (scenes.length <= 1) return; // Prevent deleting last scene
        const newScenes = scenes.filter((_, i) => i !== index);
        setScenes(normalizeSceneNumbers(newScenes));
    };

    const addScene = () => {
        const newSceneNumber = scenes.length + 1;
        const newScene: UGCScene = {
            id: Date.now().toString(),
            sceneNumber: newSceneNumber,
            type: "B-Roll",
            suggestedCut: "0s - 2s",
            visual_direction: {
                subject_action: "Describe action here...",
                lighting_atmosphere: "Consistent lighting",
                film_look: "iPhone footage",
                apparel_consistency: formData.modelOutfit
            },
            camera_direction: {
                movement: "Static",
                angle: "Eye level",
                focus: "Product",
                speed: "Normal"
            },
            audio_direction: {
                voiceover_script: "",
                voice_emotion: "Casual",
                sfx_cue: ""
            },
            technical_specs: {
                aspect_ratio: "9:16",
                negative_prompt: ""
            }
        };
        setScenes(normalizeSceneNumbers([...scenes, newScene]));
    };

    const CYBER_LABEL = "block text-[10px] font-black text-black uppercase tracking-widest mb-2 flex items-center gap-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black focus:ring-0 focus:border-black text-xs py-3 px-4 transition-all shadow-neo-sm placeholder-gray-400 font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-neo-sm";
    const SECTION_HEADER = "text-[10px] font-black text-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 bg-yellow-400 border-4 border-black px-4 py-2 shadow-neo-sm w-fit rounded-neo-sm";

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-white font-sans pb-20">
            <div className="max-w-4xl mx-auto px-4 pt-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2">
                        UGC Creator Studio
                    </h1>
                    <p className="text-sm text-black/60 font-bold uppercase tracking-[0.2em]">
                        Discover viral angles and generate scripts
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
                            {/* Project Name */}
                            <div className="mb-6">
                                <label className={CYBER_LABEL}>Project Filename</label>
                                <input type="text" value={formData.projectName} onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. serum_viral_v1" />
                            </div>

                            {/* Pro Toggle */}
                            <div className={`flex items-center justify-between p-4 border-4 border-black transition-all duration-300 mb-8 rounded-neo-sm ${formData.usePro ? 'bg-orange-400 shadow-neo' : 'bg-white shadow-neo-sm'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 border-4 border-black flex items-center justify-center shadow-neo-sm rounded-full ${formData.usePro ? 'bg-black text-white' : 'bg-white text-black'}`}><SparklesIcon className="w-5 h-5" /></div>
                                    <div><p className="text-xs font-black uppercase tracking-widest text-black">Pro Mode</p></div>
                                </div>
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-4 border-black transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-black' : 'bg-gray-200'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border-2 border-black shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                            </div>

                            {/* 1. CAST & PRODUCT */}
                            <h4 className={SECTION_HEADER}>1. Cast & Product</h4>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <label className={`block w-full aspect-square border-4 border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${productPreview ? 'border-black bg-white shadow-neo-sm' : 'border-black/20 hover:border-black bg-gray-50'}`}>
                                    {isAnalyzing && <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center"><ArrowPathIcon className="w-6 h-6 text-black animate-spin mb-2"/><span className="text-[10px] text-black font-black uppercase tracking-widest text-center px-2">Analyzing...</span></div>}
                                    {productPreview ? <img src={productPreview} className="w-full h-full object-contain p-2" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Product</span></div>}
                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                                </label>
                                <label className={`block w-full aspect-square border-4 border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${modelPreview ? 'border-black bg-white shadow-neo-sm' : 'border-black/20 hover:border-black bg-gray-50'}`}>
                                    {modelPreview ? <img src={modelPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40"><UsersIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Model</span></div>}
                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                                </label>
                            </div>
                            <div className="space-y-4 mb-8">
                                <div><label className={CYBER_LABEL}>Product Name</label><input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} /></div>
                                <div><label className={CYBER_LABEL}>Description</label><textarea value={formData.productDescription} onChange={(e) => setFormData(prev => ({...prev, productDescription: e.target.value}))} className={CYBER_INPUT} rows={2} /></div>
                            </div>

                            {/* 2. VISUAL DIRECTOR */}
                            <h4 className={SECTION_HEADER}>2. Visual Director</h4>
                            <div className="space-y-6 mb-8">
                                <div className="relative">
                                    <CyberDropdown label="Target Audience" value={formData.targetAudience} options={UGC_TARGET_AUDIENCES} onChange={handleTargetAudienceChange} />
                                    {autoAlignedMsg && <span className="absolute right-0 -top-2 text-[10px] bg-black text-white px-2 py-0.5 border-2 border-black shadow-neo-sm font-black uppercase tracking-widest animate-pulse">{autoAlignedMsg}</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CyberDropdown label="Model Gender" value={formData.modelGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, modelGender: val as any}))} />
                                    <div>
                                        <label className={CYBER_LABEL}>Hijab Model</label>
                                        <button onClick={() => setFormData(prev => ({...prev, isHijabModel: !prev.isHijabModel}))} className={`w-full py-3 border-4 border-black text-xs font-black uppercase tracking-widest transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${formData.isHijabModel ? 'bg-cyan-400 text-black' : 'bg-white text-black/40'}`}>{formData.isHijabModel ? 'Yes, Hijab' : 'No Hijab'}</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={CYBER_LABEL}>Model Outfit</label>
                                        {suggestedOutfits.length > 0 && <span className="text-[10px] bg-black text-white px-2 py-0.5 border-2 border-black shadow-neo-sm font-black uppercase tracking-widest animate-pulse">✨ AI Suggested</span>}
                                    </div>
                                    {suggestedOutfits.length > 0 && (
                                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                                            {suggestedOutfits.map((outfit, idx) => (
                                                <button key={idx} onClick={() => applySuggestion('outfit', outfit)} className="whitespace-nowrap px-4 py-2 bg-white hover:bg-cyan-400 text-black text-[10px] font-black border-4 border-black shadow-neo-sm transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest rounded-neo-sm">{outfit}</button>
                                            ))}
                                        </div>
                                    )}
                                    <CyberDropdown value={isCustomOutfit ? 'Custom' : formData.modelOutfit} options={UGC_MODEL_OUTFITS} onChange={handleOutfitChange} />
                                    {isCustomOutfit && <input type="text" value={formData.modelOutfit} onChange={(e) => setFormData(prev => ({...prev, modelOutfit: e.target.value}))} className={CYBER_INPUT + " mt-3 border-cyan-400"} placeholder="Type custom outfit..." autoFocus />}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1"><label className="text-[9px] text-black font-black uppercase tracking-widest">Environment / Virtual Set</label></div>
                                    <div className="flex bg-white border-4 border-black p-1 shadow-neo-sm mb-4 rounded-neo">
                                        <button onClick={() => setFormData(prev => ({...prev, backgroundMode: 'ai'}))} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-neo-sm ${formData.backgroundMode === 'ai' ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>✨ AI Vibe</button>
                                        <button onClick={() => setFormData(prev => ({...prev, backgroundMode: 'upload'}))} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-neo-sm ${formData.backgroundMode === 'upload' ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>📸 Custom Set</button>
                                    </div>

                                    {formData.backgroundMode === 'ai' && (
                                        <div className="animate-fade-in">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Recommended Vibe</span>
                                                {suggestedVibes.length > 0 && <span className="text-[10px] bg-black text-white px-2 py-0.5 border-2 border-black shadow-neo-sm font-black uppercase tracking-widest animate-pulse">✨ AI Suggested</span>}
                                            </div>
                                            {suggestedVibes.length > 0 && (
                                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                                                    {suggestedVibes.map((vibe, idx) => (
                                                        <button key={idx} onClick={() => applySuggestion('vibe', vibe)} className="whitespace-nowrap px-4 py-2 bg-white hover:bg-purple-400 text-black text-[10px] font-black border-4 border-black shadow-neo-sm transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest rounded-neo-sm">{vibe}</button>
                                                    ))}
                                                </div>
                                            )}
                                            <CyberDropdown value={isCustomVibe ? 'Custom' : formData.environmentVibe} options={UGC_ENVIRONMENT_VIBES} onChange={handleVibeChange} />
                                            {isCustomVibe && <input type="text" value={formData.environmentVibe} onChange={(e) => setFormData(prev => ({...prev, environmentVibe: e.target.value}))} className={CYBER_INPUT + " mt-3 border-purple-400"} placeholder="Type custom vibe..." autoFocus />}
                                        </div>
                                    )}

                                    {formData.backgroundMode === 'upload' && (
                                        <div className="animate-fade-in space-y-4">
                                            <label className={`block w-full aspect-video border-4 border-dashed cursor-pointer overflow-hidden relative transition-all group rounded-neo-sm ${customBackgroundPreview ? 'border-black bg-white shadow-neo-sm' : 'border-black/20 hover:border-black bg-gray-50'}`}>
                                                {customBackgroundPreview ? <img src={customBackgroundPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Upload Your Store/Room</span></div>}
                                                <input type="file" className="hidden" onChange={(e) => handleImageUpload('background', e.target.files?.[0])} accept="image/*" />
                                            </label>
                                            <div>
                                                <label className={CYBER_LABEL}>Lighting / Atmosphere Match</label>
                                                <CyberDropdown value={formData.environmentVibe} options={UGC_ENVIRONMENT_VIBES} onChange={(val) => setFormData(prev => ({...prev, environmentVibe: val}))} placeholder="Select lighting condition..." />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CyberDropdown label="Shot Type" value={formData.shotType} options={UGC_CREATOR_SHOT_TYPES} onChange={(val) => setFormData(prev => ({...prev, shotType: val as any}))} />
                                    <CyberDropdown label="Scene Count" value={formData.sceneStrategy} options={UGC_SCENE_STRATEGIES} onChange={(val) => setFormData(prev => ({...prev, sceneStrategy: val as any}))} />
                                </div>
                            </div>

                            {/* 3. SCRIPTWRITER'S ROOM */}
                            <h4 className={SECTION_HEADER}>3. Scriptwriter's Room</h4>
                            <div className="space-y-6 mb-8">
                                <CyberDropdown label="Script Style" value={formData.scriptStyle} options={UGC_SCRIPT_STYLES} onChange={(val) => setFormData(prev => ({...prev, scriptStyle: val}))} />
                                <CyberDropdown label="Language" value={formData.scriptLanguage} options={['Bahasa Indonesia (Gaul)', 'English', 'Javanese Slang']} onChange={(val) => setFormData(prev => ({...prev, scriptLanguage: val}))} />
                                <div><label className={CYBER_LABEL}>Current Angle Hook</label><input type="text" value={formData.hookTemplate} onChange={(e) => setFormData(prev => ({...prev, hookTemplate: e.target.value}))} className={CYBER_INPUT} /></div>
                                <div><label className={CYBER_LABEL}>Pain Point (Masalah)</label><textarea value={formData.painPoint} onChange={(e) => setFormData(prev => ({...prev, painPoint: e.target.value}))} className={CYBER_INPUT} rows={2} /></div>
                            </div>

                            <button 
                                onClick={handleGenerateScript}
                                disabled={isGeneratingScript || !formData.productImage}
                                className="w-full py-5 bg-yellow-400 text-black border-4 border-black font-black text-lg shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-neo"
                            >
                                {isGeneratingScript ? <ArrowPathIcon className="w-6 h-6 animate-spin mr-3"/> : <DocumentTextIcon className="w-6 h-6 mr-3"/>}
                                {isGeneratingScript ? 'Writing Script...' : 'Draft Concept'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-[600px]">
                            <div className="p-4 lg:p-6 border-b-4 border-black bg-white flex justify-between items-center">
                                <h2 className="text-sm lg:text-xl font-black text-black flex items-center uppercase tracking-tight">
                                    <span className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-black bg-yellow-400 flex items-center justify-center mr-2 lg:mr-3 text-black shadow-neo-sm rounded-neo-sm"><VideoCameraIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                                    Director's Monitor
                                </h2>
                                
                                <div className="flex items-center gap-2">
                                    {scenes.length > 0 && (
                                        <div className="flex items-center gap-2 mr-2 border-r-4 border-black pr-2">
                                            <button 
                                                onClick={regenerateAllVisuals} 
                                                disabled={isGeneratingImages || scenes.length === 0}
                                                className="p-2 bg-white border-4 border-black text-black hover:bg-yellow-400 disabled:opacity-30 shadow-neo-sm transition-all rounded-neo-sm"
                                                title="Regenerate All Visuals"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={clearAllScenes} 
                                                disabled={isGeneratingImages || scenes.length === 0}
                                                className="p-2 bg-white border-4 border-black text-black hover:bg-red-500 disabled:opacity-30 shadow-neo-sm transition-all rounded-neo-sm"
                                                title="Clear All Scenes"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {scenes.length > 0 && !scenes.every(s => s.visualKeyframe) && (
                                        <button onClick={handleGenerateVisuals} disabled={isGeneratingImages} className="bg-cyan-400 hover:bg-cyan-300 text-black border-4 border-black px-4 py-2 text-xs font-black shadow-neo-sm flex items-center disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase tracking-widest rounded-neo-sm">
                                            {isGeneratingImages ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                            {isGeneratingImages ? (retryStatus ? 'Retrying...' : 'Rendering Raw...') : 'Render Visuals'}
                                        </button>
                                    )}
                                    {scenes.some(s => s.visualKeyframe) && (
                                        <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="bg-white hover:bg-gray-50 text-black border-4 border-black px-4 py-2 text-xs font-black shadow-neo-sm flex items-center transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest rounded-neo-sm">
                                            {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                            {isDownloadingAll ? 'Downloading...' : 'Download All'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 p-4 lg:p-6 bg-white">
                                {error && <div className="mb-6 p-4 bg-red-100 border-4 border-black text-red-600 text-sm font-black uppercase tracking-widest shadow-neo-sm">{error}</div>}

                                {isGeneratingScript ? (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="relative w-20 h-20">
                                            <div className="absolute inset-0 border-8 border-black border-t-yellow-400 animate-spin shadow-neo"></div>
                                        </div>
                                        <p className="text-xl font-black text-black uppercase tracking-tighter animate-pulse">Writing Viral Script...</p>
                                    </div>
                                ) : scenes.length > 0 ? (
                                    <div className="space-y-8 max-w-5xl mx-auto pb-20">
                                        {/* Scene Timeline */}
                                        <div className="bg-white border-4 border-black p-2 shadow-neo mb-8 rounded-neo overflow-x-auto custom-scrollbar flex gap-2">
                                            {scenes.map((s, i) => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => {
                                                        const el = document.getElementById(`scene-${s.id}`);
                                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className={`flex-shrink-0 w-12 h-12 border-2 border-black flex items-center justify-center text-[10px] font-black transition-all rounded-neo-sm ${s.visualKeyframe ? 'bg-cyan-400' : 'bg-gray-100'} hover:bg-yellow-400`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button onClick={addScene} className="flex-shrink-0 w-12 h-12 border-2 border-dashed border-black flex items-center justify-center text-xl font-black hover:bg-yellow-400 rounded-neo-sm">+</button>
                                        </div>

                                        {/* Angle Badge */}
                                        {selectedAngle && (
                                            <div className="flex items-center justify-between bg-yellow-400 border-4 border-black p-6 shadow-neo mb-8 rounded-neo">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-black text-white border-4 border-black shadow-neo-sm rounded-neo-sm"><FireIcon className="w-6 h-6"/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">Strategi Aktif</p>
                                                        <p className="text-lg font-black text-black uppercase tracking-tighter">{selectedAngle.title}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowAngleModal(true)} className="text-xs font-black text-black hover:bg-white px-4 py-2 border-4 border-black shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase tracking-widest rounded-neo-sm">Ganti Angle</button>
                                            </div>
                                        )}

                                        {scenes.map((scene, idx) => {
                                            const isLoading = (isGeneratingImages && processingIndex === idx) || regeneratingIndex === idx;
                                            const isWaiting = isGeneratingImages && !scene.visualKeyframe && processingIndex !== idx;

                                            return (
                                                <div key={scene.id} id={`scene-${scene.id}`} className={`bg-white border-4 border-black transition-all duration-300 overflow-hidden shadow-neo flex flex-col md:flex-row rounded-neo ${processingIndex === idx ? 'ring-4 ring-yellow-400' : ''}`}>
                                                    {/* LEFT: VISUAL MONITOR */}
                                                    <div className="w-full md:w-[280px] lg:w-[320px] bg-gray-100 border-b md:border-b-0 md:border-r-4 border-black relative flex-shrink-0 flex flex-col">
                                                        <div 
                                                            className={`aspect-[9/16] w-full relative bg-gray-200 ${scene.visualKeyframe ? 'cursor-zoom-in group' : ''}`}
                                                            onClick={() => scene.visualKeyframe && setPreviewIndex(idx)}
                                                        >
                                                            {isLoading ? (
                                                                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                                    <ArrowPathIcon className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                                                                    <span className="text-[10px] text-black font-black tracking-widest uppercase">{retryStatus || 'RENDERING RAW...'}</span>
                                                                </div>
                                                            ) : scene.visualKeyframe ? (
                                                                <>
                                                                    <img src={`data:image/png;base64,${scene.visualKeyframe}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(scene.visualKeyframe!, idx); }} className="bg-white text-black border-4 border-black p-2 rounded-full shadow-neo-sm hover:scale-110 pointer-events-auto transform transition-transform"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleRegenerateImage(idx); }} className="bg-yellow-400 text-black border-4 border-black p-2 rounded-full shadow-neo-sm hover:scale-110 pointer-events-auto transform transition-transform"><ArrowPathIcon className="w-5 h-5" /></button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-black/20 h-full">
                                                                    <VideoCameraIcon className={`w-12 h-12 mb-3 ${isWaiting ? 'opacity-40 animate-pulse' : 'opacity-20'}`} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{isWaiting ? 'WAITING QUEUE' : 'NO IMAGE'}</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 border-4 border-black text-[10px] font-black shadow-neo-sm pointer-events-none uppercase tracking-widest rounded-neo-sm">SCENE {idx + 1}</div>
                                                            <div className="absolute bottom-3 left-3 right-3 bg-yellow-400 border-4 border-black px-3 py-2 shadow-neo-sm rounded-neo-sm">
                                                                <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1 opacity-60">Editor's Cut</p>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full bg-transparent border-none p-0 text-xs font-black text-black focus:ring-0" 
                                                                    value={scene.suggestedCut || "0s - 2s"} 
                                                                    onChange={(e) => updateSceneData(idx, 'cut', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT: DIRECTOR CONTROL PANEL */}
                                                    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-6 bg-white">
                                                        <div className="flex justify-between items-center border-b-4 border-black pb-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-black uppercase tracking-widest">Type:</span>
                                                                <input 
                                                                    type="text" 
                                                                    className="bg-gray-100 border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest focus:ring-0 focus:bg-white transition-all rounded-neo-sm" 
                                                                    value={scene.type} 
                                                                    onChange={(e) => updateSceneData(idx, 'type', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => moveScene(idx, -1)} disabled={idx === 0} className="p-2 bg-white border-4 border-black text-black hover:bg-yellow-400 disabled:opacity-30 shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all rounded-neo-sm"><ChevronDownIcon className="w-5 h-5 rotate-180" /></button>
                                                                <button onClick={() => moveScene(idx, 1)} disabled={idx === scenes.length - 1} className="p-2 bg-white border-4 border-black text-black hover:bg-yellow-400 disabled:opacity-30 shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all rounded-neo-sm"><ChevronDownIcon className="w-5 h-5" /></button>
                                                                <button onClick={() => deleteScene(idx)} className="p-2 bg-white border-4 border-black text-black hover:bg-red-500 shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all rounded-neo-sm"><XMarkIcon className="w-5 h-5" /></button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><PhotoIcon className="w-4 h-4" /> Raw Action (8s Master)</label>
                                                        <textarea className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold focus:ring-0 focus:border-black min-h-[100px] leading-relaxed shadow-neo-sm rounded-neo-sm" value={scene.visual_direction.subject_action} onChange={(e) => updateSceneData(idx, 'visual', e.target.value)} />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><DocumentTextIcon className="w-4 h-4" /> Bestie Voiceover</label>
                                                        <textarea className="w-full bg-white border-4 border-black p-4 text-xs text-black font-bold focus:ring-0 focus:border-black min-h-[80px] italic leading-relaxed shadow-neo-sm rounded-neo-sm" value={scene.audio_direction.voiceover_script} onChange={(e) => updateSceneData(idx, 'audio', e.target.value)} />
                                                    </div>

                                                    <div className="bg-black border-4 border-black p-5 shadow-neo relative group rounded-neo">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> Veo / VideoFX Prompt (JSON)</label>
                                                            <button onClick={() => copyToClipboard(getVeoPrompt(scene), idx)} className="text-[10px] font-black text-white hover:text-yellow-400 flex items-center transition-colors bg-white/10 px-3 py-1.5 border-2 border-white/20 uppercase tracking-widest rounded-neo-sm">
                                                                {copiedIndex === idx ? <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />}
                                                                {copiedIndex === idx ? 'Copied!' : 'Copy JSON'}
                                                            </button>
                                                        </div>
                                                        <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar select-all leading-relaxed">{getVeoPrompt(scene)}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })}

                                        <button onClick={addScene} className="w-full py-4 border-4 border-dashed border-black bg-white text-black hover:bg-yellow-400 transition-all group shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo-sm">
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors rounded-neo-sm"><span className="text-xl font-black leading-none">+</span></div>
                                                <span className="font-black text-sm uppercase tracking-widest">Add New Scene</span>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                                        <div className="w-20 h-20 lg:w-28 lg:h-28 bg-yellow-400 border-4 border-black flex items-center justify-center mb-6 shadow-neo rotate-3 rounded-neo-sm"><VideoCameraIcon className="w-10 h-10 lg:w-12 lg:h-12 text-black" /></div>
                                        <h4 className="font-black text-black mb-2 uppercase tracking-tighter text-2xl">UGC Video Studio</h4>
                                        <p className="text-sm text-black/60 max-w-xs mx-auto font-bold uppercase tracking-widest leading-tight">Upload product & model to discover viral angles.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="text-center mb-12">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">UGC Creator Studio © 2026</p>
                </div>
            </div>

            {/* ANGLE SELECTION MODAL */}
            {showAngleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowAngleModal(false)}>
                    <div className="bg-white w-full max-w-4xl border-4 border-black shadow-neo-lg overflow-hidden flex flex-col max-h-[90vh] rounded-neo" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-400">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black text-white border-4 border-black flex items-center justify-center shadow-neo-sm rounded-neo-sm">
                                    <FireIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase tracking-tighter">Pilih Angle Viral Kamu</h3>
                                    <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-1">Jangan cuma jual fitur. Jual cerita.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAngleModal(false)} className="p-2 bg-black text-white border-4 border-black hover:bg-gray-800 shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo-sm">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar bg-white">
                            {marketingAngles.map((angle, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => handleSelectAngle(angle)}
                                    className="text-left group relative bg-white p-6 border-4 border-black hover:bg-cyan-400 transition-all shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg rounded-neo"
                                >
                                    <h4 className="text-sm font-black text-black uppercase tracking-widest mb-3 border-b-2 border-black pb-2">{angle.title}</h4>
                                    <p className="text-black text-sm mb-4 font-bold leading-tight">{angle.description}</p>
                                    <div className="bg-white/50 border-2 border-black p-4 shadow-neo-sm rounded-neo-sm">
                                        <p className="text-xs text-black italic font-bold">"{angle.hook}"</p>
                                    </div>
                                </button>
                            ))}
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
                onRegenerate={() => previewIndex !== null && handleRegenerateImage(previewIndex)}
                onSave={() => previewIndex !== null && scenes[previewIndex]?.visualKeyframe && handleDownloadSingle(scenes[previewIndex].visualKeyframe!, previewIndex)}
                isRegenerating={regeneratingIndex !== null}
            />
        </div>
    );
};

export default UGCCreatorStudio;
