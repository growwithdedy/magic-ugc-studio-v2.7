import React, { useState, useEffect } from 'react';
import type { Language, UGCCarouselFormData, CarouselSlide, CarouselVibe, CarouselHook, CarouselSlideCount } from '../types';
import { CAROUSEL_VIBES, CAROUSEL_HOOKS, UGC_TARGET_AUDIENCES } from '../constants';
import { generateCarouselPlan, generateCarouselSlideImage, analyzeProductImage, retryOperation } from '../services/geminiService';
import { 
    ViewColumnsIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    FolderArrowDownIcon, DocumentTextIcon, UsersIcon, CheckCircleIcon, ClipboardDocumentIcon
} from './icons';
import CyberDropdown from './CyberDropdown';

interface UGCCarouselStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const UGCCarouselStudio: React.FC<UGCCarouselStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    const [formData, setFormData] = useState<UGCCarouselFormData>({
        productImage: null,
        productName: '',
        productDescription: '',
        modelImage: null,
        slideCount: 5,
        vibe: CAROUSEL_VIBES[0].value,
        hookType: CAROUSEL_HOOKS[0].value,
        targetAudience: UGC_TARGET_AUDIENCES[0].value,
        language: 'Bahasa Indonesia',
        usePro: false,
        projectName: ''
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [slides, setSlides] = useState<CarouselSlide[]>([]);
    
    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelImage) {
            setFormData(prev => ({ ...prev, modelImage: globalModel }));
            setModelPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);

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

    const handleGeneratePlan = async () => {
        if (!formData.productImage) { setError("Please upload a product image."); return; }
        if (formData.usePro) { try { /* @ts-ignore */ await window.aistudio.openSelectKey(); } catch (e) {} }

        setIsGeneratingPlan(true);
        setError(null);
        setSlides([]);
        
        try {
            const plan = await generateCarouselPlan(formData);
            setSlides(plan);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to plan carousel.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleRenderSlides = async () => {
        setIsRendering(true);
        setError(null);
        setRetryStatus(null);
        
        for (let i = 0; i < slides.length; i++) {
            if (!slides[i].imageBase64) {
                setProcessingIndex(i);
                try {
                    await retryOperation(async () => {
                        const base64 = await generateCarouselSlideImage(formData, slides[i]);
                        setSlides(prev => {
                            const newSlides = [...prev];
                            newSlides[i] = { ...newSlides[i], imageBase64: base64 };
                            return newSlides;
                        });
                    }, 3, 2000, (attempt) => setRetryStatus(`Retrying Slide ${i+1}... (${attempt}/3)`));
                    setRetryStatus(null);
                } catch (e) {
                    console.error(e);
                    setError(`Stopped at Slide ${i + 1}. Try regenerating.`);
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
        setError(null);
        try {
            await retryOperation(async () => {
                const base64 = await generateCarouselSlideImage(formData, slides[index]);
                setSlides(prev => {
                    const newSlides = [...prev];
                    newSlides[index] = { ...newSlides[index], imageBase64: base64 };
                    return newSlides;
                });
            }, 3, 2000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (e) { 
            console.error(e); 
            setError("Regeneration failed.");
        } finally { 
            setRegeneratingIndex(null);
            setRetryStatus(null);
        }
    };

    const updateSlideText = (index: number, field: 'title' | 'caption', value: string) => {
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const copyText = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const handleDownloadAll = async () => {
        if (isDownloadingAll) return;
        setIsDownloadingAll(true);
        const safeName = formData.projectName?.trim().replace(/\s+/g, '_') || 'carousel';

        for (let i = 0; i < slides.length; i++) {
            if (slides[i].imageBase64) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${slides[i].imageBase64}`;
                link.download = `${safeName}_slide_${i + 1}.png`;
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
        link.download = `${formData.projectName || 'slide'}_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";
    const SECTION_HEADER = "text-xs font-bold text-teal-500 uppercase tracking-widest border-b border-teal-500/20 pb-2 mb-4 mt-6 first:mt-0";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* RIGHT: CONFIG PANEL (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Slide Config</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6">
                    <div className="mb-6"><label className={CYBER_LABEL}>Project Name</label><input type="text" value={formData.projectName} onChange={(e) => setFormData(prev => ({...prev, projectName: e.target.value}))} className={CYBER_INPUT} placeholder="e.g. skin_routine_slides" /></div>

                    {/* Pro Toggle */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 mb-6 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div><div><p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode</p></div></div>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    {/* 1. ASSETS */}
                    <h4 className={SECTION_HEADER}>1. Source Assets</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-teal-500' : 'border-gray-300 dark:border-white/20 hover:border-teal-400 bg-gray-50 dark:bg-white/5'}`}>
                            {isAnalyzing && <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center"><ArrowPathIcon className="w-5 h-5 text-teal-500 animate-spin mb-1"/><span className="text-[9px] text-white font-bold">Analyzing...</span></div>}
                            {productPreview ? <img src={productPreview} className="w-full h-full object-contain p-2" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Product</span></div>}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                        </label>
                        <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${modelPreview ? 'border-teal-500' : 'border-gray-300 dark:border-white/20 hover:border-teal-400 bg-gray-50 dark:bg-white/5'}`}>
                            {modelPreview ? <img src={modelPreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"><UsersIcon className="w-8 h-8 mb-2" /><span className="text-[10px] font-bold uppercase">Model (Opt)</span></div>}
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                        </label>
                    </div>
                    <div className="mb-6">
                        <label className="text-[9px] text-gray-500 font-bold mb-1 block">Product Name (Auto)</label>
                        <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))} className={CYBER_INPUT} />
                    </div>

                    {/* 2. STRATEGY */}
                    <h4 className={SECTION_HEADER}>2. Carousel Strategy</h4>
                    <div className="space-y-4 mb-6">
                        <CyberDropdown label="Vibe / Aesthetic" value={formData.vibe} options={CAROUSEL_VIBES} onChange={(val) => setFormData(prev => ({...prev, vibe: val as CarouselVibe}))} />
                        <CyberDropdown label="Hook Strategy" value={formData.hookType} options={CAROUSEL_HOOKS} onChange={(val) => setFormData(prev => ({...prev, hookType: val as CarouselHook}))} />
                        <CyberDropdown label="Target Audience" value={formData.targetAudience} options={UGC_TARGET_AUDIENCES} onChange={(val) => setFormData(prev => ({...prev, targetAudience: val}))} />
                    </div>

                    {/* 3. FLOW */}
                    <h4 className={SECTION_HEADER}>3. Flow & Length</h4>
                    <div className="space-y-4">
                        <div>
                            <label className={CYBER_LABEL}>Number of Slides</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                {[3, 5, 7, 10].map(num => (
                                    <button 
                                        key={num} 
                                        onClick={() => setFormData(prev => ({...prev, slideCount: num as CarouselSlideCount}))}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.slideCount === num ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <CyberDropdown label="Language" value={formData.language} options={['Bahasa Indonesia', 'English', 'Javanese Slang']} onChange={(val) => setFormData(prev => ({...prev, language: val}))} />
                    </div>
                </div>

                <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan || !formData.productImage}
                        className="w-full py-4 bg-gradient-to-r from-teal-600 to-green-500 text-white rounded-xl font-bold text-sm shadow-lg hover:from-teal-500 hover:to-green-400 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-wide"
                    >
                        {isGeneratingPlan ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <ViewColumnsIcon className="w-5 h-5 mr-2"/>}
                        {isGeneratingPlan ? 'Planning Slides...' : 'Generate Carousel Plan'}
                    </button>
                </div>
            </div>

            {/* LEFT: SLIDE PREVIEW (Results) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent flex justify-between items-center">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-teal-500/20 flex items-center justify-center mr-2 lg:mr-3 text-teal-500 dark:text-teal-400"><ViewColumnsIcon className="w-4 h-4 lg:w-5 lg:h-5" /></span>
                        Carousel Builder
                    </h2>
                    <div className="flex items-center gap-2">
                        {slides.length > 0 && (
                            <button onClick={handleRenderSlides} disabled={isRendering} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center disabled:opacity-50">
                                {isRendering ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                                {isRendering ? (retryStatus || 'Developing...') : 'Develop Photos'}
                            </button>
                        )}
                        {slides.some(s => s.imageBase64) && (
                            <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center transition-all">
                                {isDownloadingAll ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> : <FolderArrowDownIcon className="w-4 h-4 mr-2" />}
                                {isDownloadingAll ? 'Saving...' : 'Save All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-gray-50/50 dark:bg-black/20 flex items-center p-4 lg:p-8 gap-6">
                    {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 px-4 py-2 text-sm font-medium z-50">{error}</div>}

                    {isGeneratingPlan ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative w-16 h-16"><div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-teal-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-green-500 animate-spin animation-delay-150"></div></div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white font-display">Planning Carousel...</p>
                        </div>
                    ) : slides.length > 0 ? (
                        slides.map((slide, idx) => {
                            const isLoading = (isRendering && processingIndex === idx) || regeneratingIndex === idx;
                            return (
                                <div key={slide.id} className="w-[280px] lg:w-[320px] h-full max-h-[600px] flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden relative group">
                                    {/* Slide Number */}
                                    <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">SLIDE {slide.slideNumber}</div>
                                    
                                    {/* Image Area */}
                                    <div className="aspect-[9/16] relative bg-gray-100 dark:bg-gray-800 w-full group-hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] transition-all">
                                        {isLoading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10"><ArrowPathIcon className="w-8 h-8 text-teal-400 animate-spin mb-2" /><span className="text-[10px] font-bold text-white tracking-widest">{retryStatus || 'DEVELOPING...'}</span></div>
                                        ) : slide.imageBase64 ? (
                                            <>
                                                <img src={`data:image/png;base64,${slide.imageBase64}`} className="w-full h-full object-cover" />
                                                
                                                {/* Text Overlay Suggestion (Visual Only) */}
                                                <div className="absolute bottom-16 left-4 right-4 z-10 pointer-events-none">
                                                    <div className="bg-white/90 text-black px-3 py-1 text-sm font-black uppercase inline-block mb-1 shadow-lg transform -rotate-1">{slide.title}</div>
                                                    <div className="bg-black/70 text-white px-2 py-1 text-[10px] font-medium inline-block shadow-lg">{slide.caption}</div>
                                                </div>

                                                {/* Actions */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button onClick={() => handleDownloadSingle(slide.imageBase64!, idx)} className="bg-white text-black p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleRegenerateSingle(idx)} className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><ArrowPathIcon className="w-5 h-5"/></button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                                                <PhotoIcon className="w-10 h-10 mb-2 opacity-30" />
                                                <p className="text-[10px] font-bold opacity-50 mb-4">CONCEPT PHASE</p>
                                                <p className="text-[10px] italic opacity-60 line-clamp-3">"{slide.visualPrompt}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Tools */}
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Text Overlay</span>
                                            <button onClick={() => copyText(`${slide.title}\n${slide.caption}`, idx)} className="text-[9px] text-teal-500 hover:text-teal-400 font-bold flex items-center">
                                                {copiedIndex === idx ? <CheckCircleIcon className="w-3 h-3 mr-1"/> : <ClipboardDocumentIcon className="w-3 h-3 mr-1"/>}
                                                {copiedIndex === idx ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <input type="text" value={slide.title} onChange={(e) => updateSlideText(idx, 'title', e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-[10px] font-bold" />
                                        <textarea value={slide.caption} onChange={(e) => updateSlideText(idx, 'caption', e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-[10px] resize-none h-10" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="w-full flex flex-col items-center justify-center text-gray-400">
                            <ViewColumnsIcon className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-gray-300">Carousel Studio</h3>
                            <p className="text-sm">Create viral photo slides. Config on the right.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UGCCarouselStudio;