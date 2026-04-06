import React, { useState } from 'react';
import type { Language } from '../types';
import { generateMirrorSelfieStoryboard, generateMirrorSelfieKeyframe, analyzeProductImage, retryOperation } from '../services/geminiService';
import { MIRROR_SELFIE_POSES, MIRROR_SELFIE_BACKGROUNDS, MIRROR_SELFIE_ASPECTS } from '../constants';
import { 
    ArrowPathIcon, PhotoIcon, SparklesIcon, ArrowDownTrayIcon, 
    XMarkIcon, UsersIcon, CameraIcon
} from './icons';
import CyberDropdown from './CyberDropdown';
import SceneAudioPlayer from './SceneAudioPlayer';

declare var marked: { parse(markdown: string): string; };

interface MirrorSelfieStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

interface SelfieScene {
    id: string;
    sceneNumber: number;
    type: string;
    visual_direction: {
        subject_action: string;
        lighting_atmosphere: string;
        mirror_pose?: string;
    };
    audio_direction: {
        voiceover_script: string;
        voice_emotion: string;
        sfx_cue: string;
    };
    camera_direction: {
        movement: string;
        angle: string;
        focus: string;
    };
    overlay_suggestion: string;
    imageBase64?: string;
    isGenerating?: boolean;
}

const MirrorSelfieStudio: React.FC<MirrorSelfieStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelImage, setModelImage] = useState<File | null>(globalModel || null);
    const [modelPreview, setModelPreview] = useState<string | null>(globalModelPreview || null);
    
    const [productName, setProductName] = useState('');
    const [pose, setPose] = useState(MIRROR_SELFIE_POSES[0].value);
    const [background, setBackground] = useState(MIRROR_SELFIE_BACKGROUNDS[0].value);
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [usePro, setUsePro] = useState(false);
    const [sceneCount, setSceneCount] = useState(3);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [scenes, setScenes] = useState<SelfieScene[]>([]);
    const [selectedScene, setSelectedScene] = useState<SelfieScene | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    React.useEffect(() => {
        if (globalModel && globalModelPreview && !modelImage) {
            setModelImage(globalModel);
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProductImage(file);
        setAnalysisComplete(false);
        setScenes([]);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => setProductPreview(reader.result as string);
        reader.readAsDataURL(file);
        setIsAnalyzing(true);
        try {
            const result = await analyzeProductImage(file);
            setProductName(result.productName);
            setAnalysisComplete(true);
        } catch { setError('Gagal menganalisis produk.'); }
        finally { setIsAnalyzing(false); }
    };

    const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setModelImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setModelPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleGenerateStoryboard = async () => {
        if (!productImage) { setError('Upload foto produk dulu!'); return; }
        setIsPlanning(true);
        setError(null);
        setScenes([]);
        try {
            const result = await generateMirrorSelfieStoryboard(
                productName, pose, background, sceneCount, language === 'ID' ? 'Bahasa Indonesia' : 'English'
            );
            setScenes(result.map((s: any) => ({ ...s, imageBase64: undefined, isGenerating: false })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat storyboard.');
        } finally { setIsPlanning(false); }
    };

    const handleGenerateKeyframe = async (scene: SelfieScene, index: number) => {
        if (!productImage) return;
        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isGenerating: true } : s));
        try {
            await retryOperation(async () => {
                const base64 = await generateMirrorSelfieKeyframe(
                    productImage, modelImage, productName, scene, background, aspectRatio, usePro
                );
                setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageBase64: base64, isGenerating: false } : s));
            }, 3, 2000);
        } catch {
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isGenerating: false } : s));
            setError(`Gagal generate keyframe scene ${index + 1}.`);
        }
    };

    const handleGenerateAll = async () => {
        for (let i = 0; i < scenes.length; i++) {
            if (!scenes[i].imageBase64) {
                await handleGenerateKeyframe(scenes[i], i);
            }
        }
    };

    const handleDownload = (scene: SelfieScene) => {
        if (!scene.imageBase64) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${scene.imageBase64}`;
        link.download = `mirror_selfie_scene_${scene.sceneNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isLoading = isAnalyzing || isPlanning;
    const CYBER_LABEL = "block text-[10px] font-black text-black uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full border-4 border-black bg-white text-black font-bold focus:bg-yellow-50 text-xs py-3 px-4 transition-all placeholder-gray-400";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden bg-white">
             
            {/* Settings Panel */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white border-b-4 lg:border-b-0 lg:border-l-4 border-black flex flex-col lg:h-full lg:overflow-hidden z-10">
                <div className="p-4 lg:p-6 border-b-4 border-black bg-purple-400">
                    <h2 className="text-sm lg:text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <CameraIcon className="w-5 h-5" /> Mirror Selfie Studio
                    </h2>
                    <p className="text-[10px] font-bold text-black/60 mt-1">Storyboard selfie cermin untuk konten viral</p>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6">
                    <div className="space-y-6 lg:space-y-8">
                        
                        {/* Pro Mode */}
                        <div className={`flex items-center justify-between p-4 border-4 border-black transition-all duration-300 shadow-neo-sm ${usePro ? 'bg-yellow-400' : 'bg-white'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 border-4 border-black flex items-center justify-center shadow-neo-sm ${usePro ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-500'}`}>
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <div><p className="text-xs font-black text-black uppercase">Pro Mode</p><p className="text-[9px] font-bold text-black/60">Gemini 3 Pro</p></div>
                            </div>
                            <button type="button" onClick={() => setUsePro(!usePro)}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-none border-4 border-black transition-colors duration-200 ${usePro ? 'bg-black' : 'bg-white'}`}>
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-none bg-white border-2 border-black transition duration-200 ${usePro ? 'translate-x-5 bg-yellow-400' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Step 1: Upload */}
                        <div className="relative border-l-4 border-black pl-6 lg:pl-8 pb-4 ml-3">
                            <div className="absolute -left-[23px] lg:-left-[27px] top-0">
                                <span className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-purple-400 border-4 border-black text-black font-black text-xs lg:text-sm shadow-neo-sm">1</span>
                            </div>
                            <label className="block text-sm font-black text-black uppercase mb-4">Upload Assets</label>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`block w-full aspect-square border-4 border-dashed border-black cursor-pointer overflow-hidden relative transition-all shadow-neo-sm hover:shadow-neo ${isAnalyzing ? 'cursor-wait' : ''} ${productPreview ? 'bg-white' : 'bg-yellow-50 hover:bg-yellow-100'}`}>
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20">
                                            <ArrowPathIcon className="animate-spin h-8 w-8 text-black" />
                                            <p className="text-black mt-2 text-[9px] font-black uppercase animate-pulse">Analyzing...</p>
                                        </div>
                                    )}
                                    {productPreview ? (
                                        <img src={productPreview} className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40">
                                            <PhotoIcon className="w-8 h-8 mb-2" />
                                            <span className="text-[9px] font-black uppercase">Produk</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" onChange={handleProductUpload} accept="image/*" />
                                </label>
                                <label className={`block w-full aspect-square border-4 border-dashed border-black cursor-pointer overflow-hidden relative transition-all shadow-neo-sm hover:shadow-neo ${modelPreview ? 'bg-white' : 'bg-cyan-50 hover:bg-cyan-100'}`}>
                                    {modelPreview ? (
                                        <img src={modelPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-black/40">
                                            <UsersIcon className="w-8 h-8 mb-2" />
                                            <span className="text-[9px] font-black uppercase">Model (Opsional)</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" onChange={handleModelUpload} accept="image/*" />
                                </label>
                            </div>
                            <div className="mt-3">
                                <label className={CYBER_LABEL}>Nama Produk</label>
                                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className={CYBER_INPUT} placeholder="e.g. Serum Glow" />
                            </div>
                        </div>

                        {/* Step 2: Creative */}
                        <div className={`relative border-l-4 border-black pl-6 lg:pl-8 pb-4 ml-3 transition-all duration-500 ${analysisComplete || productName ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="absolute -left-[23px] lg:-left-[27px] top-0">
                                <span className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-cyan-400 border-4 border-black text-black font-black text-xs lg:text-sm shadow-neo-sm">2</span>
                            </div>
                            <label className="block text-sm font-black text-black uppercase mb-4">Creative Setup</label>
                            
                            <div className="bg-white p-4 border-4 border-black shadow-neo-sm space-y-4">
                                <CyberDropdown label="Pose Awal" value={pose} options={MIRROR_SELFIE_POSES} onChange={setPose} />
                                <CyberDropdown label="Lokasi Cermin" value={background} options={MIRROR_SELFIE_BACKGROUNDS} onChange={setBackground} />
                                <CyberDropdown label="Rasio Gambar" value={aspectRatio} options={MIRROR_SELFIE_ASPECTS} onChange={setAspectRatio} />
                                
                                <div>
                                    <label className={CYBER_LABEL}>Jumlah Scene</label>
                                    <div className="flex gap-2">
                                        {[3, 4, 5].map(n => (
                                            <button key={n} type="button" onClick={() => setSceneCount(n)}
                                                className={`flex-1 py-3 border-4 border-black text-xs font-black uppercase transition-all ${sceneCount === n ? 'bg-purple-400 shadow-neo translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-purple-50'}`}>
                                                {n} Scene
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Buttons */}
                        <div className="space-y-3 pb-20 lg:pb-0">
                            <button 
                                onClick={handleGenerateStoryboard} 
                                disabled={isLoading || !productImage}
                                className="w-full flex justify-center items-center py-4 px-4 border-4 border-black shadow-neo text-sm font-black uppercase text-black bg-purple-400 hover:bg-purple-300 disabled:opacity-50 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                            >
                                {isPlanning ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <SparklesIcon className="h-5 w-5 mr-2" />}
                                {isPlanning ? 'Creating Storyboard...' : '1. Generate Storyboard'}
                            </button>
                            
                            {scenes.length > 0 && (
                                <button 
                                    onClick={handleGenerateAll}
                                    disabled={scenes.some(s => s.isGenerating)}
                                    className="w-full flex justify-center items-center py-4 px-4 border-4 border-black shadow-neo text-sm font-black uppercase text-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                                >
                                    <CameraIcon className="h-5 w-5 mr-2" />
                                    2. Generate All Keyframes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Storyboard Canvas */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 flex flex-col relative border-t-4 lg:border-t-0 lg:border-r-4 border-black bg-white">
                <div className="p-4 lg:p-6 border-b-4 border-black flex justify-between items-center bg-purple-200">
                    <h2 className="text-sm lg:text-xl font-black text-black uppercase flex items-center tracking-tight">
                        <span className="w-8 h-8 lg:w-10 lg:h-10 border-4 border-black bg-white flex items-center justify-center mr-2 lg:mr-3 shadow-neo-sm">
                            <CameraIcon className="w-5 h-5 lg:w-6 lg:h-6 text-black" />
                        </span>
                        Mirror Storyboard
                        {scenes.length > 0 && <span className="ml-3 text-[10px] font-black text-black bg-white border-2 border-black px-2 py-1">{scenes.length} Scenes</span>}
                    </h2>
                </div>
                
                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-white">
                    {error && (
                        <div className="mb-6 p-4 border-4 border-black bg-pink-400 text-black text-sm font-black uppercase shadow-neo-sm">
                            {error}
                        </div>
                    )}

                    {isPlanning && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="relative w-20 h-20 lg:w-28 lg:h-28 mb-4 lg:mb-8 border-8 border-black bg-purple-400 shadow-neo animate-bounce flex items-center justify-center">
                                <CameraIcon className="w-10 h-10 text-black" />
                            </div>
                            <p className="text-xl lg:text-3xl font-black text-black uppercase tracking-tighter mb-2">Planning Storyboard...</p>
                            <p className="text-xs font-bold text-black/60 uppercase">AI sedang menyusun scene-by-scene untuk video selfie cerminmu</p>
                        </div>
                    )}

                    {scenes.length > 0 && (
                        <div className="space-y-6">
                            {scenes.map((scene, index) => (
                                <div key={scene.id} className="border-4 border-black shadow-neo-sm bg-white overflow-hidden">
                                    {/* Scene Header */}
                                    <div className="flex items-center justify-between p-3 bg-purple-100 border-b-4 border-black">
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 bg-purple-400 border-4 border-black flex items-center justify-center font-black text-sm text-black shadow-neo-sm">
                                                {scene.sceneNumber}
                                            </span>
                                            <div>
                                                <p className="text-xs font-black text-black uppercase">{scene.type}</p>
                                                <p className="text-[10px] font-bold text-black/50">{scene.camera_direction?.movement} • {scene.camera_direction?.focus}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleGenerateKeyframe(scene, index)}
                                            disabled={scene.isGenerating}
                                            className={`px-4 py-2 border-4 border-black text-[10px] font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${scene.imageBase64 ? 'bg-green-400' : 'bg-yellow-400 hover:bg-yellow-300'}`}
                                        >
                                            {scene.isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : scene.imageBase64 ? '✓ Done' : 'Generate'}
                                        </button>
                                    </div>

                                    <div className="flex flex-col lg:flex-row">
                                        {/* Keyframe Preview */}
                                        <div className="lg:w-48 flex-shrink-0 border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-gray-50 flex items-center justify-center min-h-[120px]">
                                            {scene.isGenerating ? (
                                                <div className="text-center p-4">
                                                    <ArrowPathIcon className="w-8 h-8 animate-spin text-black mx-auto mb-2" />
                                                    <p className="text-[9px] font-black uppercase text-black/50">Rendering...</p>
                                                </div>
                                            ) : scene.imageBase64 ? (
                                                <button onClick={() => { setSelectedScene(scene); setIsPreviewOpen(true); }} className="w-full h-full">
                                                    <img src={`data:image/png;base64,${scene.imageBase64}`} className="w-full h-full object-cover" />
                                                </button>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <PhotoIcon className="w-8 h-8 text-black/20 mx-auto mb-1" />
                                                    <p className="text-[9px] font-black uppercase text-black/30">Belum dirender</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Scene Details */}
                                        <div className="flex-1 p-4 space-y-3">
                                            <div>
                                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">📍 Visual Direction</p>
                                                <p className="text-xs font-bold text-black">{scene.visual_direction?.subject_action}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">🎙️ Voiceover</p>
                                                <p className="text-xs font-bold text-black/80 italic">"{scene.audio_direction?.voiceover_script}"</p>
                                                <p className="text-[9px] font-bold text-black/40 mt-1">Emotion: {scene.audio_direction?.voice_emotion} • SFX: {scene.audio_direction?.sfx_cue}</p>
                                            </div>
                                            {scene.overlay_suggestion && (
                                                <div>
                                                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">💬 Overlay</p>
                                                    <p className="text-xs font-bold text-black/70">{scene.overlay_suggestion}</p>
                                                </div>
                                            )}
                                            <SceneAudioPlayer
                                                script={scene.audio_direction?.voiceover_script || ''}
                                                sceneNumber={scene.sceneNumber}
                                                productName={productName}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && scenes.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white border-4 border-black flex items-center justify-center mb-4 lg:mb-6 shadow-neo">
                                <CameraIcon className="w-10 h-10 lg:w-14 lg:h-14 text-black/20" />
                            </div>
                            <p className="text-sm lg:text-xl font-black text-black uppercase mb-2">Belum Ada Storyboard</p>
                            <p className="text-xs font-bold text-black/40 uppercase max-w-xs">Upload foto produk, pilih pose & lokasi cermin, lalu generate storyboard</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && selectedScene?.imageBase64 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsPreviewOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full lg:w-[80vw] h-[90vh] bg-white border-4 border-black shadow-neo-lg flex flex-col lg:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 relative flex items-center justify-center bg-gray-100 p-4 border-b-4 lg:border-b-0 lg:border-r-4 border-black">
                            <div className="border-4 border-black shadow-neo bg-white p-2">
                                <img src={`data:image/png;base64,${selectedScene.imageBase64}`} className="max-w-full max-h-[70vh] object-contain" />
                            </div>
                        </div>
                        <div className="w-full lg:w-80 bg-white flex flex-col flex-shrink-0 h-1/3 lg:h-full">
                            <div className="p-4 border-b-4 border-black flex justify-between items-center bg-purple-400">
                                <h3 className="text-sm font-black text-black uppercase">Scene {selectedScene.sceneNumber}</h3>
                                <button onClick={() => setIsPreviewOpen(false)} className="text-black hover:bg-white p-1 border-2 border-black"><XMarkIcon className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <button onClick={() => handleDownload(selectedScene)} className="w-full flex items-center justify-center px-4 py-4 border-4 border-black bg-black text-white font-black uppercase text-sm shadow-neo active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download PNG
                                </button>
                                <div className="p-4 border-4 border-black bg-purple-50 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase mb-1">Visual</p>
                                        <p className="text-[11px] font-bold text-black/70">{selectedScene.visual_direction?.subject_action}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase mb-1">Voiceover</p>
                                        <p className="text-[11px] font-bold text-black/70 italic">"{selectedScene.audio_direction?.voiceover_script}"</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase mb-1">Camera</p>
                                        <p className="text-[11px] font-bold text-black/70">{selectedScene.camera_direction?.movement} • {selectedScene.camera_direction?.angle}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MirrorSelfieStudio;
