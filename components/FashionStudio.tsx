import React, { useState } from 'react';
import type { Language, FashionStudioFormData, FashionGarmentType, FashionMode, FashionScene, UGCAspectRatio, UGCScriptStyle, GeminiVoiceName, UGCContentStructure } from '../types';
import { 
    FASHION_POSE_PRESETS, FASHION_FRAMING, FASHION_CLOTHING_FITS, FASHION_TUCK_STYLES,
    HAND_GENDERS, UGC_MODEL_ETHNICITIES, UGC_ASPECT_RATIOS, FASHION_CINEMATIC_MOVES, VIDEO_MOODS, UGC_SCRIPT_STYLES, UGC_TARGET_AUDIENCES, LANGUAGES, GEMINI_VOICES, FASHION_GARMENT_TYPES, FASHION_LOCATIONS, UGC_CONTENT_STRUCTURES
} from '../constants';
import { generateFashionVariations, generateFashionUGC, generateFashionCinematic, regenerateFashionSceneImage, analyzeFashionItem } from '../services/geminiService';
import { 
    PhotoIcon, SparklesIcon, ArrowPathIcon, ArrowDownTrayIcon, XMarkIcon, 
    CameraIcon, UsersIcon, ArrowLeftIcon, ArrowRightIcon, SwatchIcon, VideoCameraIcon,
    CheckCircleIcon, ClipboardDocumentIcon
} from './icons';
import CyberDropdown from './CyberDropdown';

interface FashionStudioProps {
    language: Language;
}

const FashionStudio: React.FC<FashionStudioProps> = ({ language }) => {
    // ... State (same as before)
    const [activeMode, setActiveMode] = useState<FashionMode>('lookbook');
    const [formData, setFormData] = useState<FashionStudioFormData>({
        garments: [{ id: '1', file: null, type: 'Top (Atasan)' }], 
        useModelReference: false,
        modelReferenceImage: null,
        modelGender: 'Female',
        modelEthnicity: 'Asian (Indonesian)',
        modelAge: 'Young Adult',
        modelBodyType: 'Standard',
        location: 'Studio Polos (White Cyclorama)',
        aspectRatio: '9:16',
        posePreset: 'Catalog Front (Standar)',
        framing: 'Full Body',
        clothingFit: 'Regular Fit',
        tuckStyle: 'Untucked (Keluar)',
        contentStructure: '🔍 In-Depth Review / Demo (Edukatif)',
        scriptStyle: 'Santai & Akrab (Bestie Vibe)',
        targetAudience: 'Gen Z (Trendy & Youthful)',
        scriptLanguage: 'Bahasa Indonesia',
        cinematicMove: 'Slow Motion Walk',
        cinematicMood: 'Mewah & Elegan',
        usePro: false,
    });

    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
    const [modelRefPreview, setModelRefPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]); 
    const [fashionScenes, setFashionScenes] = useState<FashionScene[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

    // ... Handlers (addGarmentSlot, removeGarmentSlot, updateGarmentType, handleGarmentUpload, handleModelRefChange, handleGenerate, handleRegenerateImage, downloadImage, copyFullData, openPreview, closePreview, goToNext, goToPrevious) ...
    const addGarmentSlot = () => { if (formData.garments.length >= 5) return; const newId = Date.now().toString(); setFormData(prev => ({ ...prev, garments: [...prev.garments, { id: newId, file: null, type: 'Accessory (Tas/Topi)' }] })); };
    const removeGarmentSlot = (id: string) => { if (formData.garments.length <= 1) return; setFormData(prev => ({ ...prev, garments: prev.garments.filter(g => g.id !== id) })); const newPreviews = { ...imagePreviews }; delete newPreviews[id]; setImagePreviews(newPreviews); };
    const updateGarmentType = (id: string, newType: FashionGarmentType) => { setFormData(prev => ({ ...prev, garments: prev.garments.map(g => g.id === id ? { ...g, type: newType } : g) })); };
    const handleGarmentUpload = async (id: string, file: File | undefined) => { if (!file) return; const reader = new FileReader(); reader.onloadend = () => { setImagePreviews(prev => ({ ...prev, [id]: reader.result as string })); }; reader.readAsDataURL(file); setFormData(prev => ({ ...prev, garments: prev.garments.map(g => g.id === id ? { ...g, file: file, isAnalyzing: true, description: undefined } : g) })); try { const description = await analyzeFashionItem(file); setFormData(prev => ({ ...prev, garments: prev.garments.map(g => g.id === id ? { ...g, isAnalyzing: false, description: description } : g) })); } catch (e) { setFormData(prev => ({ ...prev, garments: prev.garments.map(g => g.id === id ? { ...g, isAnalyzing: false } : g) })); } };
    const handleModelRefChange = (file: File | undefined) => { if (file) { setFormData(prev => ({ ...prev, modelReferenceImage: file })); const reader = new FileReader(); reader.onloadend = () => setModelRefPreview(reader.result as string); reader.readAsDataURL(file); } };
    const handleGenerate = async () => {
        if (!formData.garments.some(g => g.file !== null)) { setError("Please upload at least one fashion item."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ const hasKey = await window.aistudio.hasSelectedApiKey(); if (!hasKey) { /* @ts-ignore */ await window.aistudio.openSelectKey(); } } catch (e) { console.error("API Key check failed", e); } }
        setIsGenerating(true); setError(null); setGeneratedImages([]); setFashionScenes([]);
        try {
            if (activeMode === 'lookbook') { const results = await generateFashionVariations(formData); setGeneratedImages(results); }
            else if (activeMode === 'ugc_host') { const scenes = await generateFashionUGC(formData); setFashionScenes(scenes); }
            else if (activeMode === 'cinematic') { const scenes = await generateFashionCinematic(formData); setFashionScenes(scenes); }
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to generate."); } finally { setIsGenerating(false); }
    };
    const handleRegenerateImage = async (index: number) => { const scene = fashionScenes[index]; setRegeneratingIndex(index); try { const newBase64 = await regenerateFashionSceneImage(formData, scene); setFashionScenes(prev => { const newScenes = [...prev]; newScenes[index] = { ...newScenes[index], imageBase64: newBase64 }; return newScenes; }); } catch (err) { console.error("Regeneration failed", err); } finally { setRegeneratingIndex(null); } };
    const downloadImage = (base64: string, index: number) => {
        const img = new Image(); img.src = `data:image/png;base64,${base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let targetWidth = 1080; let targetHeight = 1080;
            switch (formData.aspectRatio) { case '9:16': targetWidth = 1080; targetHeight = 1920; break; case '4:5': targetWidth = 1080; targetHeight = 1350; break; case '1:1': targetWidth = 1080; targetHeight = 1080; break; default: targetWidth = 1080; targetHeight = 1080; break; }
            canvas.width = targetWidth; canvas.height = targetHeight; const ctx = canvas.getContext('2d'); if (!ctx) return;
            ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, targetWidth, targetHeight);
            const scale = Math.max(targetWidth / img.width, targetHeight / img.height); const x = (targetWidth / 2) - (img.width / 2) * scale; const y = (targetHeight / 2) - (img.height / 2) * scale;
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            const link = document.createElement('a'); link.href = canvas.toDataURL('image/png', 1.0); link.download = `fashion_${activeMode}_${formData.aspectRatio}_${index + 1}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        };
    };
    const copyFullData = (scene: FashionScene, index: number) => { const data = { visual_prompt: scene.visualPrompt, technical_prompt: scene.motionPrompt, voiceover: scene.voiceover }; navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => { setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }); };
    const openPreview = (index: number) => { setCurrentPreviewIndex(index); setIsPreviewOpen(true); }; const closePreview = () => setIsPreviewOpen(false); const goToNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentPreviewIndex(prev => (prev + 1) % generatedImages.length); }; const goToPrevious = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentPreviewIndex(prev => (prev - 1 + generatedImages.length) % generatedImages.length); };

    const CYBER_LABEL = "block text-[10px] font-black text-black uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black focus:ring-0 focus:border-black text-xs py-3 px-4 transition-all shadow-neo-sm placeholder-gray-400 font-bold rounded-neo-sm";
    const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-white font-sans pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
                
                {/* 1. MODE SELECTION (TOP) */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <button 
                        onClick={() => setActiveMode('lookbook')} 
                        className={`px-6 py-3 border-4 border-black text-xs lg:text-sm font-black transition-all uppercase tracking-widest shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo ${activeMode === 'lookbook' ? 'bg-yellow-400 text-black' : 'bg-white text-gray-400 hover:text-black'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CameraIcon className="w-5 h-5" /> Lookbook
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveMode('ugc_host')} 
                        className={`px-6 py-3 border-4 border-black text-xs lg:text-sm font-black transition-all uppercase tracking-widest shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo ${activeMode === 'ugc_host' ? 'bg-cyan-400 text-black' : 'bg-white text-gray-400 hover:text-black'}`}
                    >
                        <div className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5" /> UGC Host
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveMode('cinematic')} 
                        className={`px-6 py-3 border-4 border-black text-xs lg:text-sm font-black transition-all uppercase tracking-widest shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo ${activeMode === 'cinematic' ? 'bg-pink-400 text-black' : 'bg-white text-gray-400 hover:text-black'}`}
                    >
                        <div className="flex items-center gap-2">
                            <VideoCameraIcon className="w-5 h-5" /> Cinematic
                        </div>
                    </button>
                </div>

                {/* 2. MAIN STUDIO CARD */}
                <div className="bg-white border-4 border-black shadow-neo rounded-neo overflow-hidden mb-8">
                    {/* Internal Tabs */}
                    <div className="flex border-b-4 border-black bg-gray-50">
                        <button 
                            onClick={() => setActiveTab('config')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-black border-r-4 border-black' : 'text-gray-400 hover:text-black border-r-4 border-black'}`}
                        >
                            Studio Config
                        </button>
                        <button 
                            onClick={() => setActiveTab('results')}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'results' ? 'bg-white text-black' : 'text-gray-400 hover:text-black'}`}
                        >
                            View Results
                            {(generatedImages.length > 0 || fashionScenes.length > 0) && (
                                <span className="absolute top-3 right-4 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </div>

                    <div className="p-6 lg:p-10">
                        {activeTab === 'config' ? (
                            <div className="space-y-10 animate-fade-in">
                                {/* Pro Mode Toggle */}
                                <div className={`flex items-center justify-between p-4 border-4 border-black transition-all duration-300 rounded-neo ${formData.usePro ? 'bg-orange-400 shadow-neo' : 'bg-white shadow-neo-sm'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 border-4 border-black flex items-center justify-center shadow-neo-sm rounded-full ${formData.usePro ? 'bg-white text-black' : 'bg-gray-100 text-gray-500'}`}>
                                            <SparklesIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black uppercase tracking-widest ${formData.usePro ? 'text-black' : 'text-gray-500'}`}>Pro Mode</p>
                                            <p className="text-[10px] font-bold text-black/40 uppercase">High Quality Rendering</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-4 border-black transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-black' : 'bg-gray-200'}`}>
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white border-2 border-black shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* 1. Wardrobe Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 bg-yellow-400 border-4 border-black px-4 py-2 shadow-neo-sm rounded-neo-sm">
                                            1. Wardrobe Items
                                        </h4>
                                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{formData.garments.length} / 5 Items</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {formData.garments.map((slot, index) => (
                                            <div key={slot.id} className="relative p-5 bg-white border-4 border-black shadow-neo-sm group rounded-neo hover:shadow-neo transition-all">
                                                <div className="flex gap-5">
                                                    <label className={`w-24 h-32 border-4 border-black border-dashed flex-shrink-0 cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all hover:bg-yellow-50 rounded-neo ${imagePreviews[slot.id] ? 'bg-white' : 'bg-gray-50'}`}>
                                                        {imagePreviews[slot.id] ? <img src={imagePreviews[slot.id]} alt="Item" className="w-full h-full object-contain p-2" /> : <PhotoIcon className="w-8 h-8 text-black/20" />}
                                                        <input type="file" className="hidden" onChange={(e) => handleGarmentUpload(slot.id, e.target.files?.[0])} accept="image/*" />
                                                    </label>
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <label className="text-[10px] text-black font-black uppercase tracking-widest mb-2">Category</label>
                                                        <CyberDropdown value={slot.type} options={FASHION_GARMENT_TYPES} onChange={(val) => updateGarmentType(slot.id, val as FashionGarmentType)} placeholder="Select..." icon={SwatchIcon} />
                                                    </div>
                                                </div>
                                                {formData.garments.length > 1 && (
                                                    <button onClick={() => removeGarmentSlot(slot.id)} className="absolute -top-4 -right-4 p-2 bg-red-500 text-white border-4 border-black rounded-full shadow-neo-sm hover:scale-110 transition-transform">
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {formData.garments.length < 5 && (
                                            <button onClick={addGarmentSlot} className="h-44 border-4 border-black border-dashed bg-white text-sm font-black text-black/40 hover:text-black hover:bg-yellow-50 transition-all flex flex-col items-center justify-center uppercase tracking-widest rounded-neo shadow-neo-sm hover:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                                                <span className="text-3xl mb-2 leading-none">+</span> Add Item
                                            </button>
                                        )}
                                    </div>
                                </section>

                                {/* 2. Model & Location Section */}
                                <section className="pt-10 border-t-4 border-black">
                                    <h4 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 bg-cyan-400 border-4 border-black px-4 py-2 shadow-neo-sm rounded-neo-sm w-fit">
                                        2. Model & Location
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className={CYBER_LABEL}>Location / Set</label>
                                                <CyberDropdown value={formData.location} options={FASHION_LOCATIONS} onChange={(val) => setFormData(prev => ({...prev, location: val}))} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={CYBER_LABEL}>Gender</label>
                                                    <CyberDropdown value={formData.modelGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, modelGender: val as any}))} />
                                                </div>
                                                <div>
                                                    <label className={CYBER_LABEL}>Ethnicity</label>
                                                    <CyberDropdown value={formData.modelEthnicity} options={UGC_MODEL_ETHNICITIES} onChange={(val) => setFormData(prev => ({...prev, modelEthnicity: val}))} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className={CYBER_LABEL}>Aspect Ratio</label>
                                            <div className="flex bg-white border-4 border-black p-1 shadow-neo-sm rounded-neo">
                                                {UGC_ASPECT_RATIOS.map(r => (
                                                    <button key={r} onClick={() => setFormData(prev => ({ ...prev, aspectRatio: r }))} className={`flex-1 py-3 text-xs font-black transition-all uppercase tracking-widest rounded-neo-sm ${formData.aspectRatio === r ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Mode Specific Settings */}
                                <section className="pt-10 border-t-4 border-black">
                                    <h4 className={`text-xs font-black text-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 border-4 border-black px-4 py-2 shadow-neo-sm rounded-neo-sm w-fit ${activeMode === 'lookbook' ? 'bg-yellow-400' : activeMode === 'ugc_host' ? 'bg-cyan-400' : 'bg-pink-400'}`}>
                                        3. {activeMode === 'lookbook' ? 'Editorial Settings' : activeMode === 'ugc_host' ? 'Video Script Settings' : 'Cinematic Direction'}
                                    </h4>
                                    
                                    {activeMode === 'lookbook' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={CYBER_LABEL}>Pose Preset</label><CyberDropdown value={formData.posePreset} options={FASHION_POSE_PRESETS} onChange={(val) => setFormData(prev => ({...prev, posePreset: val as any}))} /></div>
                                            <div><label className={CYBER_LABEL}>Framing</label><CyberDropdown value={formData.framing} options={FASHION_FRAMING} onChange={(val) => setFormData(prev => ({...prev, framing: val as any}))} /></div>
                                            <div><label className={CYBER_LABEL}>Clothing Fit</label><CyberDropdown value={formData.clothingFit} options={FASHION_CLOTHING_FITS} onChange={(val) => setFormData(prev => ({...prev, clothingFit: val as any}))} /></div>
                                            <div><label className={CYBER_LABEL}>Tuck Style</label><CyberDropdown value={formData.tuckStyle} options={FASHION_TUCK_STYLES} onChange={(val) => setFormData(prev => ({...prev, tuckStyle: val as any}))} /></div>
                                        </div>
                                    )}
                                    {activeMode === 'ugc_host' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={CYBER_LABEL}>Content Structure</label><CyberDropdown value={formData.contentStructure} options={UGC_CONTENT_STRUCTURES} onChange={(val) => setFormData(prev => ({...prev, contentStructure: val as UGCContentStructure}))} /></div>
                                            <div><label className={CYBER_LABEL}>Script Style</label><CyberDropdown value={formData.scriptStyle} options={UGC_SCRIPT_STYLES} onChange={(val) => setFormData(prev => ({...prev, scriptStyle: val as UGCScriptStyle}))} /></div>
                                        </div>
                                    )}
                                    {activeMode === 'cinematic' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={CYBER_LABEL}>Cinematic Move</label><CyberDropdown value={formData.cinematicMove} options={FASHION_CINEMATIC_MOVES} onChange={(val) => setFormData(prev => ({...prev, cinematicMove: val as any}))} /></div>
                                            <div><label className={CYBER_LABEL}>Cinematic Mood</label><CyberDropdown value={formData.cinematicMood} options={VIDEO_MOODS} onChange={(val) => setFormData(prev => ({...prev, cinematicMood: val as any}))} /></div>
                                        </div>
                                    )}
                                </section>

                                {/* Generate Button */}
                                <div className="pt-6">
                                    <button 
                                        onClick={async () => {
                                            await handleGenerate();
                                            setActiveTab('results');
                                        }} 
                                        disabled={isGenerating || !formData.garments.some(g => g.file !== null)} 
                                        className="w-full py-6 bg-yellow-400 text-black border-4 border-black font-black text-xl shadow-neo hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-neo"
                                    >
                                        {isGenerating ? <ArrowPathIcon className="w-8 h-8 animate-spin mr-3"/> : (activeMode === 'lookbook' ? <CameraIcon className="w-8 h-8 mr-3"/> : <VideoCameraIcon className="w-8 h-8 mr-3"/>)}
                                        {isGenerating ? 'Producing Magic...' : 'Generate Content'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in min-h-[400px]">
                                {error && <div className="mb-8 p-5 border-4 border-black bg-red-100 text-red-600 text-sm font-black uppercase tracking-widest shadow-neo-sm rounded-neo-sm">{error}</div>}

                                {isGenerating ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-8">
                                        <div className="relative w-24 h-24">
                                            <div className="absolute inset-0 border-8 border-black border-t-cyan-400 animate-spin rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-black uppercase tracking-widest mb-2">Creating Magic</p>
                                            <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Please wait while AI renders your vision...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {activeMode === 'lookbook' && generatedImages.length > 0 && (
                                            <div className={`grid gap-6 ${formData.aspectRatio === '9:16' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                                                {generatedImages.map((base64, index) => (
                                                    <div key={index} onClick={() => openPreview(index)} className="group relative border-4 border-black overflow-hidden bg-white shadow-neo cursor-pointer rounded-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all">
                                                        <div className={`w-full ${formData.aspectRatio === '9:16' ? 'aspect-[9/16]' : formData.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-square'}`}>
                                                            <img src={`data:image/png;base64,${base64}`} alt={`Look ${index}`} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                                                            <button onClick={(e) => { e.stopPropagation(); downloadImage(base64, index); }} className="w-full bg-white text-black border-4 border-black py-3 text-xs font-black shadow-neo-sm flex items-center justify-center hover:bg-yellow-400 transition-all uppercase tracking-widest rounded-neo-sm">
                                                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {(activeMode === 'ugc_host' || activeMode === 'cinematic') && fashionScenes.length > 0 && (
                                            <div className="space-y-8 pb-12">
                                                {fashionScenes.map((scene, idx) => (
                                                    <div key={scene.id} className="bg-white border-4 border-black overflow-hidden shadow-neo rounded-neo flex flex-col md:flex-row">
                                                        <div className="w-full md:w-64 aspect-[9/16] relative bg-gray-100 border-b md:border-b-0 md:border-r-4 border-black flex-shrink-0">
                                                            {regeneratingIndex === idx && <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30"><ArrowPathIcon className="w-10 h-10 text-cyan-500 animate-spin" /></div>}
                                                            {scene.imageBase64 ? <img src={`data:image/png;base64,${scene.imageBase64}`} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-500">Image Error</div>}
                                                            {scene.imageBase64 && (
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                                    <button onClick={() => handleRegenerateImage(idx)} disabled={regeneratingIndex === idx} className="p-3 bg-yellow-400 border-4 border-black rounded-full text-black shadow-neo-sm hover:scale-110 transition-transform"><ArrowPathIcon className={`w-6 h-6 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} /></button>
                                                                    <button onClick={() => downloadImage(scene.imageBase64!, idx)} className="p-3 bg-white border-4 border-black rounded-full text-black shadow-neo-sm hover:scale-110 transition-transform"><ArrowDownTrayIcon className="w-6 h-6" /></button>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-4 left-4 px-3 py-1.5 border-4 border-black bg-black text-white text-[10px] font-black shadow-neo-sm uppercase tracking-widest rounded-neo-sm">SCENE {idx + 1}</div>
                                                        </div>
                                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                                            <div className="space-y-4">
                                                                <h4 className="text-lg font-black text-black uppercase tracking-tight leading-tight">{scene.description}</h4>
                                                                <div className="bg-gray-50 border-2 border-black p-4 rounded-neo-sm">
                                                                    <p className="text-[10px] font-black text-black/40 uppercase mb-2">Visual Direction</p>
                                                                    <p className="text-xs text-black font-bold leading-relaxed">{scene.visualPrompt}</p>
                                                                </div>
                                                                {scene.voiceover && (
                                                                    <div className="bg-cyan-50 border-2 border-black p-4 rounded-neo-sm">
                                                                        <p className="text-[10px] font-black text-cyan-600 uppercase mb-2">Voiceover Script</p>
                                                                        <p className="text-xs italic text-black font-bold leading-relaxed">"{scene.voiceover}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button onClick={() => copyFullData(scene, idx)} className="mt-6 w-full py-3 border-4 border-black text-xs font-black text-black hover:bg-yellow-400 transition-all uppercase tracking-widest shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-neo-sm">
                                                                {copiedIndex === idx ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ClipboardDocumentIcon className="w-5 h-5 mr-2" />} {copiedIndex === idx ? 'Copied to Clipboard!' : 'Copy Scene Data'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {generatedImages.length === 0 && fashionScenes.length === 0 && (
                                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="w-24 h-24 bg-yellow-400 border-4 border-black flex items-center justify-center shadow-neo rotate-3 rounded-neo">
                                                    <CameraIcon className="w-12 h-12 text-black" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-black mb-2 uppercase tracking-tighter text-2xl">Studio Ready</h4>
                                                    <p className="text-xs text-black/40 max-w-xs mx-auto font-bold uppercase tracking-widest leading-tight">Configure your studio and click generate to see the magic happen.</p>
                                                </div>
                                                <button onClick={() => setActiveTab('config')} className="px-8 py-3 bg-black text-white border-4 border-black font-black text-xs uppercase shadow-neo-sm hover:bg-gray-800 transition-all rounded-neo-sm">Go to Config</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Magic UGC Studio © 2026</p>
                </div>
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && activeMode === 'lookbook' && generatedImages.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" onClick={closePreview}>
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
                    <div className="relative w-full max-w-5xl h-[90vh] flex flex-col items-center justify-center bg-white border-8 border-black shadow-neo rounded-neo-lg" onClick={e => e.stopPropagation()}>
                        <div className="relative w-full h-full flex items-center justify-center p-4 lg:p-12 overflow-hidden">
                            <img src={`data:image/png;base64,${generatedImages[currentPreviewIndex]}`} className="max-w-full max-h-full object-contain border-4 border-black shadow-neo-sm rounded-neo" />
                            
                            {/* Navigation */}
                            <button onClick={goToPrevious} className="absolute left-4 lg:left-8 p-3 bg-white border-4 border-black text-black shadow-neo-sm hover:bg-yellow-400 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-full">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <button onClick={goToNext} className="absolute right-4 lg:right-8 p-3 bg-white border-4 border-black text-black shadow-neo-sm hover:bg-yellow-400 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-full">
                                <ArrowRightIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="absolute bottom-8 z-20 flex gap-4">
                             <button onClick={() => downloadImage(generatedImages[currentPreviewIndex], currentPreviewIndex)} className="flex items-center px-8 py-4 bg-yellow-400 text-black border-4 border-black font-black shadow-neo hover:bg-yellow-300 transition-all uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-neo">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> DOWNLOAD
                             </button>
                             <button onClick={closePreview} className="flex items-center px-8 py-4 bg-white text-black border-4 border-black font-black shadow-neo hover:bg-gray-50 transition-all uppercase tracking-widest active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-neo">
                                CLOSE
                             </button>
                        </div>
                        
                        <button onClick={closePreview} className="absolute -top-6 -right-6 p-3 bg-red-500 text-white border-4 border-black shadow-neo hover:scale-110 transition-transform rounded-full">
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 border-2 border-black text-xs font-black shadow-neo-sm uppercase tracking-widest rounded-neo-sm">
                            IMAGE {currentPreviewIndex + 1} / {generatedImages.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FashionStudio;