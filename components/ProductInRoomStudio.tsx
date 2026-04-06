import React, { useState, useEffect } from 'react';
import type { Language, ProductInRoomFormData, CinematicShot, RoomScriptData, ProductPlacement, RoomType, InteriorStyle, LightingMode, UGCScriptStyle, ScriptTone, SceneScriptItem, GeminiVoiceName } from '../types';
import { ROOM_TYPES, PRODUCT_PLACEMENTS, INTERIOR_STYLES, LIGHTING_MODES, UGC_SCRIPT_STYLES, SCRIPT_TONES, ROOM_SELLING_ANGLES, UGC_TARGET_AUDIENCES, GEMINI_VOICES } from '../constants';
import { analyzeProductForRoom, generateProductInRoomScenes, generateProductInRoomScript, generateTextToSpeech } from '../services/geminiService';
import { 
    SparklesIcon, CubeIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    VideoCameraIcon, XMarkIcon, PencilIcon, CheckCircleIcon, DocumentTextIcon, ClipboardDocumentIcon,
    ChatBubbleBottomCenterTextIcon, SpeakerWaveIcon, PlayIcon
} from './icons';
import CyberDropdown from './CyberDropdown';

interface ProductInRoomStudioProps {
    language: Language;
}

const ProductInRoomStudio: React.FC<ProductInRoomStudioProps> = ({ language }) => {
    const [formData, setFormData] = useState<ProductInRoomFormData>({
        productImage: null,
        productName: '',
        productDescription: '',
        placement: 'Table Top',
        roomType: 'Living Room',
        interiorStyle: 'Minimalist',
        customInteriorStyle: '',
        lighting: 'Softbox Studio',
        backgroundMode: 'ai',
        backgroundReferenceImage: null,
        sceneCount: 4,
        usePro: false
    });

    const [activeTab, setActiveTab] = useState<'visuals' | 'script'>('visuals');
    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedShots, setGeneratedShots] = useState<CinematicShot[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Script State
    const [scriptData, setScriptData] = useState<RoomScriptData>({
        sellingAngle: 'Pain Solution',
        targetPersona: UGC_TARGET_AUDIENCES[0].value,
        scriptStyle: 'Mewah & Elegan (Luxury Vibe)',
        scriptTone: 'Soft Selling / Storytelling',
        language: 'ID'
    });
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [scriptScenes, setScriptScenes] = useState<SceneScriptItem[]>([]);
    
    // TTS State
    const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>('Kore');
    const [speechRate, setSpeechRate] = useState<number>(1.0);
    const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

    // Full Script Modal State
    const [isFullScriptModalOpen, setIsFullScriptModalOpen] = useState(false);
    const [copiedFullScript, setCopiedFullScript] = useState(false);

    // Preview Modal State
    const [previewImage, setPreviewImage] = useState<{ url: string, index: number } | null>(null);

    const handleProductUpload = async (file: File) => {
        if (!file) return;
        setFormData(prev => ({ ...prev, productImage: file }));
        const reader = new FileReader();
        reader.onloadend = () => setProductPreview(reader.result as string);
        reader.readAsDataURL(file);

        setIsAnalyzing(true);
        try {
            const analysis = await analyzeProductForRoom(file);
            setFormData(prev => ({
                ...prev,
                productName: analysis.productName || '',
                productDescription: analysis.productDescription || '',
                placement: (analysis.suggestedPlacement as ProductPlacement) || prev.placement,
                roomType: (analysis.suggestedRoomType as RoomType) || prev.roomType,
                interiorStyle: (analysis.suggestedInteriorStyle as InteriorStyle) || prev.interiorStyle
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!formData.productImage) {
            setError("Please upload a product image first.");
            return;
        }

        if (formData.usePro) {
            try {
                // @ts-ignore
                const hasKey = await window.aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    // @ts-ignore
                    await window.aistudio.openSelectKey();
                }
            } catch (e) {
                console.error("API Key check failed", e);
            }
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedShots([]);
        setActiveTab('visuals'); // Switch to visuals tab

        try {
            const results = await generateProductInRoomScenes(formData);
            setGeneratedShots(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate scenes.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateScript = async () => {
        setIsGeneratingScript(true);
        // Use the number of generated shots if available, otherwise fallback to form config
        const sceneCount = generatedShots.length > 0 ? generatedShots.length : formData.sceneCount;
        try {
            const roomContext = `${formData.interiorStyle} ${formData.roomType}`;
            const scenes = await generateProductInRoomScript(formData.productName, roomContext, scriptData, sceneCount);
            setScriptScenes(scenes);
        } catch (err) {
            console.error(err);
            setError("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateAudio = async (sceneId: string) => {
        const sceneIndex = scriptScenes.findIndex(s => s.id === sceneId);
        if (sceneIndex === -1) return;

        const scene = scriptScenes[sceneIndex];
        
        // Update loading state
        const updatedScenes = [...scriptScenes];
        updatedScenes[sceneIndex] = { ...scene, isLoadingAudio: true };
        setScriptScenes(updatedScenes);

        try {
            const audioBase64 = await generateTextToSpeech(scene.voiceoverText, selectedVoice, speechRate);
            
            // Update audio data
            const finalScenes = [...scriptScenes];
            finalScenes[sceneIndex] = { ...finalScenes[sceneIndex], isLoadingAudio: false, audioBase64: audioBase64 };
            setScriptScenes(finalScenes);
        } catch (err) {
            console.error(err);
            const errorScenes = [...scriptScenes];
            errorScenes[sceneIndex] = { ...errorScenes[sceneIndex], isLoadingAudio: false };
            setScriptScenes(errorScenes);
            alert("Failed to generate audio for this scene.");
        }
    };

    const handleGenerateAllAudio = async () => {
        // Iterate through all scenes sequentially to avoid rate limits
        for (const scene of scriptScenes) {
            await handleGenerateAudio(scene.id);
        }
    };

    const handlePlayAudio = (base64: string) => {
        if (activeAudio) {
            activeAudio.pause();
        }
        // Since we are now converting PCM to WAV in the service, we can use audio/wav
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        audio.play().catch(e => console.error("Playback failed", e));
        setActiveAudio(audio);
    };

    const downloadImage = (base64: string, id: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `room_scene_${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAudio = (base64: string, sceneNum: number) => {
        const link = document.createElement('a');
        // Changed to WAV for download as well
        link.href = `data:audio/wav;base64,${base64}`;
        link.download = `voiceover_scene_${sceneNum}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyMotionPrompt = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const updateScriptText = (id: string, newText: string) => {
        setScriptScenes(prev => prev.map(s => s.id === id ? { ...s, voiceoverText: newText, audioBase64: undefined } : s));
    };

    const getFullScriptText = () => {
        return scriptScenes.map(s => s.voiceoverText).join('\n\n');
    };

    const handleCopyFullScript = () => {
        navigator.clipboard.writeText(getFullScriptText()).then(() => {
            setCopiedFullScript(true);
            setTimeout(() => setCopiedFullScript(false), 2000);
        });
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right Config (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">
                        Scene Config
                    </h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-8">
                    
                    {/* Pro Mode */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode (High Quality)</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400">Gemini 3 Pro (Paid)</p>
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

                    {/* 1. Product */}
                    <section>
                        <label className={CYBER_LABEL}>1. Product Source</label>
                        <label className={`block w-full aspect-video rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-brand-500' : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'}`}>
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
                                    <ArrowPathIcon className="w-5 h-5 text-brand-500 animate-spin mb-1"/>
                                    <span className="text-[9px] text-white font-bold">Analyzing...</span>
                                </div>
                            )}
                            {productPreview ? (
                                <img src={productPreview} className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <PhotoIcon className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-bold uppercase">Upload Product</span>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={(e) => handleProductUpload(e.target.files?.[0]!)} accept="image/*" />
                        </label>
                        <div className="mt-3">
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Product Name (Auto)</label>
                            <input 
                                type="text"
                                value={formData.productName}
                                onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))}
                                className={CYBER_INPUT}
                                placeholder="Detected product name..."
                            />
                        </div>
                    </section>

                    {/* 2. Scene Construction */}
                    <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5" style={{ isolation: 'isolate' }}>
                        <label className={CYBER_LABEL}>2. Scene Construction</label>
                        
                        <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex gap-1 mb-2 relative z-50">
                             <button 
                                onClick={() => setFormData(prev => ({...prev, backgroundMode: 'ai'}))}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase ${formData.backgroundMode === 'ai' ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                AI Generation
                            </button>
                             <button 
                                onClick={() => setFormData(prev => ({...prev, backgroundMode: 'upload'}))}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase ${formData.backgroundMode === 'upload' ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Upload Ref
                            </button>
                        </div>

                        {formData.backgroundMode === 'ai' ? (
                            <div className="space-y-3 animate-fade-in relative z-40">
                                <div className="grid grid-cols-2 gap-3 relative z-30">
                                    <div className="relative z-50">
                                        <label className="text-[9px] text-gray-500 font-bold mb-1 block">Room Type</label>
                                        <CyberDropdown 
                                            value={formData.roomType}
                                            options={ROOM_TYPES}
                                            onChange={(val) => setFormData(prev => ({...prev, roomType: val as RoomType}))}
                                        />
                                    </div>
                                    <div className="relative z-50">
                                        <label className="text-[9px] text-gray-500 font-bold mb-1 block">Placement</label>
                                        <CyberDropdown 
                                            value={formData.placement}
                                            options={PRODUCT_PLACEMENTS}
                                            onChange={(val) => setFormData(prev => ({...prev, placement: val as ProductPlacement}))}
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative z-20">
                                    <label className="text-[9px] text-gray-500 font-bold mb-1 block">Interior Style</label>
                                    <CyberDropdown 
                                        value={formData.interiorStyle}
                                        options={INTERIOR_STYLES}
                                        onChange={(val) => setFormData(prev => ({...prev, interiorStyle: val as InteriorStyle}))}
                                    />
                                </div>

                                {formData.interiorStyle === 'Custom' && (
                                    <div className="animate-fade-in relative z-10">
                                        <label className="text-[9px] text-accent-purple font-bold mb-1 block">Custom Style Description</label>
                                        <input 
                                            type="text" 
                                            value={formData.customInteriorStyle}
                                            onChange={(e) => setFormData(prev => ({...prev, customInteriorStyle: e.target.value}))}
                                            className={CYBER_INPUT + " border-accent-purple"}
                                            placeholder="e.g. Victorian Goth with neon lights"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="animate-fade-in relative z-40">
                                <label className="block w-full rounded-xl border border-dashed border-gray-300 dark:border-white/20 p-4 cursor-pointer hover:border-brand-500 transition-colors bg-gray-50 dark:bg-white/5">
                                    <div className="flex items-center space-x-3">
                                        <PhotoIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-xs text-gray-400">Upload Background Reference</span>
                                    </div>
                                    <input type="file" className="hidden" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setFormData(prev => ({...prev, backgroundReferenceImage: file}));
                                    }} accept="image/*" />
                                </label>
                                {formData.backgroundReferenceImage && <p className="text-[9px] text-green-500 mt-1">Image Loaded: {formData.backgroundReferenceImage.name}</p>}
                            </div>
                        )}

                         <div className="relative z-10">
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Lighting Ambience</label>
                            <CyberDropdown 
                                value={formData.lighting}
                                options={LIGHTING_MODES}
                                onChange={(val) => setFormData(prev => ({...prev, lighting: val as LightingMode}))}
                            />
                        </div>
                    </section>
                    
                    {/* Scene Count */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 relative z-0">
                        <label className={CYBER_LABEL}>Output Count</label>
                        <div className="flex gap-2">
                            {[1, 2, 4, 8].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, sceneCount: num }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                        formData.sceneCount === num 
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                                        : 'bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !formData.productImage}
                        className="w-full py-4 bg-gradient-to-r from-brand-600 to-accent-purple text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/30 hover:from-brand-500 hover:to-accent-pink disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center transform active:scale-[0.98] tracking-wide uppercase"
                    >
                        {isGenerating ? (
                            <>
                                <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/>
                                Rendering...
                            </>
                        ) : (
                            <>
                                <CubeIcon className="w-5 h-5 mr-2"/>
                                Generate Scenes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Left Canvas (Tabs: Visuals | Script) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                
                {/* Header with Tabs */}
                <div className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center bg-white/50 dark:bg-transparent px-6 gap-6">
                    <button 
                        onClick={() => setActiveTab('visuals')}
                        className={`h-full flex items-center gap-2 border-b-2 px-2 transition-colors ${activeTab === 'visuals' ? 'border-brand-500 text-brand-600 dark:text-white font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <CubeIcon className="w-5 h-5" />
                        Visual Studio
                    </button>
                    <button 
                        onClick={() => setActiveTab('script')}
                        className={`h-full flex items-center gap-2 border-b-2 px-2 transition-colors ${activeTab === 'script' ? 'border-accent-purple text-accent-purple dark:text-white font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                        Copywriting Suite
                    </button>
                    
                    <div className="flex-1"></div>
                    
                    {activeTab === 'visuals' && generatedShots.length > 0 && (
                        <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full uppercase tracking-wider border border-brand-500/20">{generatedShots.length} Scenes Ready</span>
                    )}
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center backdrop-blur-sm">
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* VISUALS TAB CONTENT */}
                    {activeTab === 'visuals' && (
                        <>
                            {isGenerating ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-brand-500 animate-spin"></div>
                                        <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-accent-purple animate-spin animation-delay-150"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple text-xl font-display">Staging the Room...</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Placing product and adjusting lighting.</p>
                                    </div>
                                </div>
                            ) : generatedShots.length > 0 ? (
                                <div className="grid grid-cols-2 gap-6">
                                    {generatedShots.map((shot, index) => (
                                        <div key={shot.id} className="group relative rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden">
                                            {/* Image Area */}
                                            <div 
                                                className="aspect-[9/16] w-full relative overflow-hidden cursor-pointer"
                                                onClick={() => setPreviewImage({ url: `data:image/png;base64,${shot.imageBase64}`, index })}
                                            >
                                                <img src={`data:image/png;base64,${shot.imageBase64}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={shot.angleName} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <span className="bg-white/90 text-gray-900 px-3 py-1 rounded-lg text-[10px] font-bold">Preview</span>
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                                                    {shot.angleName}
                                                </div>
                                            </div>
                                            
                                            {/* Action Footer */}
                                            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 space-y-2">
                                                <button 
                                                    onClick={() => downloadImage(shot.imageBase64, shot.id)}
                                                    className="w-full flex items-center justify-center py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-brand-500 hover:text-white transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="w-3.5 h-3.5 mr-1.5" />
                                                    Download Image
                                                </button>
                                                <button 
                                                    onClick={() => copyMotionPrompt(shot.motionPrompt, shot.id)}
                                                    className={`w-full flex items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all ${
                                                        copiedId === shot.id
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20'
                                                    }`}
                                                >
                                                    {copiedId === shot.id ? <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5"/> : <VideoCameraIcon className="w-3.5 h-3.5 mr-1.5"/>}
                                                    {copiedId === shot.id ? 'Copied!' : 'Copy Motion Prompt'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 shadow-inner rotate-3 group hover:rotate-0 transition-transform duration-300">
                                        <CubeIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Interior Studio</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Visualize your product in any room environment. Configure settings on the right.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* SCRIPT TAB CONTENT */}
                    {activeTab === 'script' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                             
                             {/* Script Config Panel */}
                             <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-6 flex items-center">
                                    <PencilIcon className="w-5 h-5 mr-2 text-accent-purple" />
                                    Copywriting Suite Configuration
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={CYBER_LABEL}>Selling Angle</label>
                                        <CyberDropdown 
                                            value={scriptData.sellingAngle}
                                            options={ROOM_SELLING_ANGLES}
                                            onChange={(v) => setScriptData(prev => ({...prev, sellingAngle: v as any}))}
                                        />
                                    </div>
                                    <div>
                                        <label className={CYBER_LABEL}>Target Persona</label>
                                        <CyberDropdown 
                                            value={scriptData.targetPersona}
                                            options={UGC_TARGET_AUDIENCES}
                                            onChange={(v) => setScriptData(prev => ({...prev, targetPersona: v}))}
                                            placeholder="Select Audience"
                                        />
                                    </div>
                                    <div>
                                        <label className={CYBER_LABEL}>Tone</label>
                                        <CyberDropdown 
                                            value={scriptData.scriptTone}
                                            options={SCRIPT_TONES}
                                            onChange={(v) => setScriptData(prev => ({...prev, scriptTone: v as ScriptTone}))}
                                        />
                                    </div>
                                    <div>
                                        <label className={CYBER_LABEL}>Style</label>
                                        <CyberDropdown 
                                            value={scriptData.scriptStyle}
                                            options={UGC_SCRIPT_STYLES}
                                            onChange={(v) => setScriptData(prev => ({...prev, scriptStyle: v as UGCScriptStyle}))}
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateScript}
                                    disabled={isGeneratingScript || !formData.productName}
                                    className="w-full py-4 bg-accent-purple text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-colors flex justify-center items-center shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                >
                                    {isGeneratingScript ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2"/>}
                                    {isGeneratingScript ? 'Crafting Script...' : 'Generate Scene Script'}
                                </button>
                             </div>

                             {/* Script Results (Scene Cards) */}
                             {scriptScenes.length > 0 && (
                                <div className="space-y-6">
                                    
                                    {/* Global Audio Controls */}
                                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-48">
                                                 <CyberDropdown 
                                                    value={selectedVoice}
                                                    options={GEMINI_VOICES}
                                                    onChange={(v) => setSelectedVoice(v as GeminiVoiceName)}
                                                    icon={SpeakerWaveIcon}
                                                />
                                            </div>
                                            {/* Speed Control (Simplified) */}
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/10">
                                                <span>Speed:</span>
                                                <button onClick={() => setSpeechRate(1.0)} className={`px-2 py-1 rounded ${speechRate === 1.0 ? 'bg-brand-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`}>1x</button>
                                                <button onClick={() => setSpeechRate(1.2)} className={`px-2 py-1 rounded ${speechRate === 1.2 ? 'bg-brand-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`}>1.2x</button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGenerateAllAudio}
                                            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center"
                                        >
                                            <SparklesIcon className="w-3 h-3 mr-2" />
                                            Generate All Audio
                                        </button>
                                    </div>

                                    {/* Scene Grid */}
                                    <div className="grid gap-6">
                                        {scriptScenes.map((scene) => (
                                            <div key={scene.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
                                                <div className="flex flex-col md:flex-row">
                                                    
                                                    {/* Visual Context */}
                                                    <div className="w-full md:w-1/3 bg-gray-50 dark:bg-black/20 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded">SCENE {scene.sceneNumber}</span>
                                                            <span className="text-[10px] font-mono text-gray-400">VISUAL CUE</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                                            "{scene.visualDescription}"
                                                        </p>
                                                    </div>

                                                    {/* Audio Editor */}
                                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                                        <div className="mb-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Voiceover Text</label>
                                                                <span className={`text-[10px] font-bold ${
                                                                    (scene.voiceoverText || '').split(' ').length > 25 ? 'text-red-500' : 'text-green-500'
                                                                }`}>
                                                                    {(scene.voiceoverText || '').split(' ').length} words (~{((scene.voiceoverText || '').split(' ').length / 2.5).toFixed(1)}s)
                                                                </span>
                                                            </div>
                                                            <textarea 
                                                                value={scene.voiceoverText}
                                                                onChange={(e) => updateScriptText(scene.id, e.target.value)}
                                                                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all min-h-[80px]"
                                                            />
                                                        </div>

                                                        {/* Audio Controls */}
                                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                                            {!scene.audioBase64 ? (
                                                                <button 
                                                                    onClick={() => handleGenerateAudio(scene.id)}
                                                                    disabled={scene.isLoadingAudio}
                                                                    className="flex-1 flex items-center justify-center py-2 bg-gray-100 dark:bg-white/5 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                                >
                                                                    {scene.isLoadingAudio ? <ArrowPathIcon className="w-3 h-3 animate-spin mr-2" /> : <SpeakerWaveIcon className="w-3 h-3 mr-2" />}
                                                                    {scene.isLoadingAudio ? 'Generating...' : 'Generate Audio'}
                                                                </button>
                                                            ) : (
                                                                <div className="flex-1 flex gap-2">
                                                                    <button 
                                                                        onClick={() => handlePlayAudio(scene.audioBase64!)}
                                                                        className="flex-1 flex items-center justify-center py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-all"
                                                                    >
                                                                        <PlayIcon className="w-3 h-3 mr-2" /> Play
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => downloadAudio(scene.audioBase64!, scene.sceneNumber)}
                                                                        className="px-3 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg"
                                                                        title="Download WAV"
                                                                    >
                                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => updateScriptText(scene.id, scene.voiceoverText)} // Just triggers re-render essentially, to show generate button again if we cleared audio
                                                                        className="px-3 py-2 text-gray-400 hover:text-red-500 transition-colors"
                                                                        title="Regenerate"
                                                                        onClickCapture={() => {
                                                                            const newScenes = scriptScenes.map(s => s.id === scene.id ? { ...s, audioBase64: undefined } : s);
                                                                            setScriptScenes(newScenes);
                                                                        }}
                                                                    >
                                                                        <ArrowPathIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Full Script Generation Button */}
                                    <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-6">
                                        <button 
                                            onClick={() => setIsFullScriptModalOpen(true)}
                                            className="w-full py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold text-sm border border-gray-200 dark:border-white/10 transition-all flex items-center justify-center uppercase tracking-wider"
                                        >
                                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                                            View Full Voiceover Script
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* Empty State */}
                             {!isGeneratingScript && scriptScenes.length === 0 && (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Configure settings above to generate your scene-based script.</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Preview */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl"></div>
                    <div className="relative z-10 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <img src={previewImage.url} alt="Preview" className="w-full h-auto rounded-lg shadow-2xl border border-white/10" />
                        <button 
                            onClick={() => setPreviewImage(null)} 
                            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
                        >
                            <XMarkIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}

            {/* Full Script Modal */}
            {isFullScriptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFullScriptModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display flex items-center">
                                <DocumentTextIcon className="w-5 h-5 mr-2 text-brand-500" />
                                Full Voiceover Script
                            </h3>
                            <button onClick={() => setIsFullScriptModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <XMarkIcon className="w-6 h-6"/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-gray-50 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-white/5">
                             <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {getFullScriptText()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                             <button 
                                onClick={() => setIsFullScriptModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleCopyFullScript}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${copiedFullScript ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20'}`}
                            >
                                {copiedFullScript ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ClipboardDocumentIcon className="w-5 h-5 mr-2" />}
                                {copiedFullScript ? 'Copied!' : 'Copy to Clipboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductInRoomStudio;