import React, { useState, useEffect } from 'react';
import type { Language, UGCGeneratorFormData, UGCCategory, UGCGeneratedResult } from '../types';
import { 
    UGC_CATEGORIES, UGC_STYLE_OPTIONS, UGC_ASPECT_RATIOS, 
    UGC_LOCATIONS, UGC_COLOR_TONES, UGC_CAMERA_ANGLES_OPT, 
    UGC_MODEL_AGES, UGC_MODEL_ETHNICITIES, HAND_GENDERS 
} from '../constants';
import { generateUGCVariations, retryOperation } from '../services/geminiService';
import { PhotoIcon, SparklesIcon, ArrowPathIcon, ArrowDownTrayIcon, XMarkIcon, UsersIcon } from './icons';
import CyberDropdown from './CyberDropdown';

interface UGCReviewStudioProps {
    language: Language;
    globalModel?: File | null;
    globalModelPreview?: string | null;
}

const UGCReviewStudio: React.FC<UGCReviewStudioProps> = ({ language, globalModel, globalModelPreview }) => {
    // ... existing state ...
    const [formData, setFormData] = useState<UGCGeneratorFormData>({
        productImages: [null, null, null],
        category: 'Fashion',
        style: UGC_STYLE_OPTIONS['Fashion'][0].value,
        aspectRatio: '9:16',
        cameraAngle: '',
        location: '',
        colorTone: '',
        useModelReference: false,
        modelReferenceImage: null,
        modelGender: 'Female',
        modelEthnicity: 'Asian (Indonesian)',
        modelAge: 'Young Adult',
        usePro: false,
    });

    const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
    const [modelRefPreview, setModelRefPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<UGCGeneratedResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);

    // Auto-inject Global Cast
    useEffect(() => {
        if (globalModel && globalModelPreview && !formData.modelReferenceImage) {
            setFormData(prev => ({ 
                ...prev, 
                useModelReference: true, 
                modelReferenceImage: globalModel 
            }));
            setModelRefPreview(globalModelPreview);
        }
    }, [globalModel, globalModelPreview]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            style: UGC_STYLE_OPTIONS[prev.category][0].value
        }));
    }, [formData.category]);

    const handleProductImageChange = (index: number, file: File | undefined) => {
        if (file) {
            const newImages = [...formData.productImages];
            newImages[index] = file;
            setFormData(prev => ({ ...prev, productImages: newImages }));

            const reader = new FileReader();
            reader.onloadend = () => {
                const newPreviews = [...imagePreviews];
                newPreviews[index] = reader.result as string;
                setImagePreviews(newPreviews);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProductImage = (index: number) => {
        const newImages = [...formData.productImages];
        newImages[index] = null;
        setFormData(prev => ({ ...prev, productImages: newImages }));

        const newPreviews = [...imagePreviews];
        newPreviews[index] = null;
        setImagePreviews(newPreviews);
    };

    const handleModelRefChange = (file: File | undefined) => {
        if (file) {
            setFormData(prev => ({ ...prev, modelReferenceImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setModelRefPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!formData.productImages[0]) {
            setError("Minimal upload 1 foto produk utama.");
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
        setRetryStatus(null);
        setGeneratedResults([]);

        try {
            await retryOperation(async () => {
                const images = await generateUGCVariations(formData);
                setGeneratedResults(images.map((base64, idx) => ({
                    id: Date.now().toString() + idx,
                    base64
                })));
            }, 3, 2000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal membuat variasi foto UGC.");
        } finally {
            setIsGenerating(false);
            setRetryStatus(null);
        }
    };

    const downloadImage = (base64: string, index: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `ugc_photo_${formData.category}_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right Column: Configuration (Input) -> Order 1 Mobile */}
            <div className="flex-1 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">
                        Config
                    </h3>
                </div>
                
                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6 lg:space-y-8">
                    
                    {/* Pro Mode Toggle */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400">Gemini 3 Pro</p>
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

                    {/* 1. Upload Produk */}
                    <section>
                        <label className={CYBER_LABEL}>1. Products (Max 3)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((index) => (
                                <div key={index} className="relative group">
                                    <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all ${
                                        imagePreviews[index] 
                                        ? 'border-brand-500 bg-white dark:bg-white/5' 
                                        : 'border-gray-300 dark:border-white/20 hover:border-brand-400 bg-gray-50 dark:bg-white/5'
                                    }`}>
                                        {imagePreviews[index] ? (
                                            <img src={imagePreviews[index]!} alt={`Prod ${index+1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                <PhotoIcon className="w-6 h-6 mb-1" />
                                                <span className="text-[9px] font-bold uppercase">{index === 0 ? 'Main' : 'Add'}</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" onChange={(e) => handleProductImageChange(index, e.target.files?.[0])} accept="image/*" />
                                    </label>
                                    {imagePreviews[index] && (
                                        <button 
                                            onClick={(e) => { e.preventDefault(); handleRemoveProductImage(index); }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Kategori & Gaya */}
                    <section className="space-y-4">
                        <label className={CYBER_LABEL}>2. Category & Style</label>
                        <CyberDropdown 
                            value={formData.category}
                            options={UGC_CATEGORIES}
                            onChange={(val) => setFormData(prev => ({ ...prev, category: val as UGCCategory }))}
                        />
                        <CyberDropdown 
                            value={formData.style}
                            options={UGC_STYLE_OPTIONS[formData.category]}
                            onChange={(val) => setFormData(prev => ({ ...prev, style: val }))}
                        />
                    </section>

                    {/* 3. Konfigurasi Visual */}
                    <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                        <label className={CYBER_LABEL}>3. Visual Details</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold mb-1 block">Color Tone</label>
                                <CyberDropdown 
                                    value={formData.colorTone}
                                    options={[{label: 'Auto / Default', value: ''}, ...UGC_COLOR_TONES]}
                                    onChange={(val) => setFormData(prev => ({ ...prev, colorTone: val }))}
                                    placeholder="Auto"
                                />
                            </div>
                             <div>
                                <label className="text-[9px] text-gray-500 font-bold mb-1 block">Angle</label>
                                <CyberDropdown 
                                    value={formData.cameraAngle}
                                    options={[{label: 'Auto / Default', value: ''}, ...UGC_CAMERA_ANGLES_OPT]}
                                    onChange={(val) => setFormData(prev => ({ ...prev, cameraAngle: val }))}
                                    placeholder="Auto"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Location</label>
                            <CyberDropdown 
                                value={formData.location}
                                options={[{label: 'Auto (Match Style)', value: ''}, ...UGC_LOCATIONS]}
                                onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                                placeholder="Auto (Match Style)"
                            />
                        </div>
                    </section>

                    {/* 4. Model Config */}
                    <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <label className={CYBER_LABEL}>4. Model & Face</label>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="useModelRef" 
                                    checked={formData.useModelReference} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, useModelReference: e.target.checked }))}
                                    className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 mr-2 bg-gray-700 border-transparent"
                                />
                                <label htmlFor="useModelRef" className="text-xs font-bold text-gray-400">Custom Face</label>
                            </div>
                        </div>

                        {formData.useModelReference ? (
                            <div className="animate-fade-in">
                                <label className="block w-full rounded-xl border border-dashed border-brand-500/50 bg-brand-500/10 p-4 cursor-pointer hover:bg-brand-500/20 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        {modelRefPreview ? (
                                            <img src={modelRefPreview} alt="Ref" className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                                                <UsersIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-brand-200">Upload Face Reference</p>
                                            <p className="text-[10px] text-brand-400/70">AI will maintain consistency</p>
                                        </div>
                                    </div>
                                    <input type="file" className="hidden" onChange={(e) => handleModelRefChange(e.target.files?.[0])} accept="image/*" />
                                </label>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold mb-1 block">Gender</label>
                                    <CyberDropdown 
                                        value={formData.modelGender}
                                        options={HAND_GENDERS}
                                        onChange={(val) => setFormData(prev => ({ ...prev, modelGender: val as any }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold mb-1 block">Age</label>
                                    <CyberDropdown 
                                        value={formData.modelAge}
                                        options={UGC_MODEL_AGES}
                                        onChange={(val) => setFormData(prev => ({ ...prev, modelAge: val as any }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 font-bold mb-1 block">Ethnicity</label>
                                    <CyberDropdown 
                                        value={formData.modelEthnicity}
                                        options={UGC_MODEL_ETHNICITIES}
                                        onChange={(val) => setFormData(prev => ({ ...prev, modelEthnicity: val }))}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !formData.productImages[0]}
                        className="w-full py-4 bg-gradient-to-r from-brand-600 to-accent-purple text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/30 hover:from-brand-500 hover:to-accent-pink disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center transform active:scale-[0.98] tracking-wide uppercase"
                    >
                        {isGenerating ? (
                            <>
                                <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/>
                                {retryStatus || 'Generating...'}
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 mr-2"/>
                                Create Photos
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Left Column: Result Grid (Output) -> Order 2 Mobile */}
             <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-transparent">
                    <h3 className="text-sm lg:text-lg font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                         <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-brand-500/20 flex items-center justify-center mr-2 lg:mr-3 text-brand-500 dark:text-brand-400">
                            <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </span>
                        Gallery
                         {generatedResults.length > 0 && <span className="ml-3 text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full uppercase tracking-wider border border-brand-500/20">{generatedResults.length}</span>}
                    </h3>
                    <div className="flex items-center space-x-2 lg:space-x-3 bg-gray-100 dark:bg-white/5 rounded-full p-1">
                        {UGC_ASPECT_RATIOS.map(r => (
                            <button 
                                key={r}
                                onClick={() => setFormData(prev => ({ ...prev, aspectRatio: r }))}
                                className={`px-2 lg:px-3 py-1 lg:py-1.5 text-[9px] lg:text-[10px] rounded-full font-bold transition-all ${formData.aspectRatio === r ? 'bg-white dark:bg-brand-600 shadow text-brand-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && (
                         <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center backdrop-blur-sm">
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {isGenerating ? (
                         <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                            <div className="relative w-16 h-16 lg:w-20 lg:h-20">
                                <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-brand-500 animate-spin"></div>
                                <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-accent-purple animate-spin animation-delay-150"></div>
                            </div>
                            <div>
                                <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple text-lg lg:text-xl font-display">{retryStatus || 'Generating Photos...'}</p>
                            </div>
                        </div>
                    ) : generatedResults.length > 0 ? (
                        <div className={`grid gap-4 ${formData.aspectRatio === '9:16' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3'}`}>
                            {generatedResults.map((result, index) => (
                                <div key={result.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-gray-200 dark:ring-white/10 transition-all">
                                    <div className={`w-full ${formData.aspectRatio === '9:16' ? 'aspect-[9/16]' : formData.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-square'}`}>
                                        <img src={`data:image/png;base64,${result.base64}`} alt="Result" className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                        <button 
                                            onClick={() => downloadImage(result.base64, index)}
                                            className="bg-white text-gray-900 rounded-lg px-4 py-2 text-xs font-bold shadow-lg flex items-center hover:bg-brand-50 hover:text-brand-600 transition-colors transform hover:scale-105"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 border border-gray-200 dark:border-white/10 shadow-inner">
                                <PhotoIcon className="w-8 h-8 lg:w-10 lg:h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Empty Canvas</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UGCReviewStudio;