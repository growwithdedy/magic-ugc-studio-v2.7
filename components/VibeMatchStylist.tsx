import React, { useState } from 'react';
import type { Language, VibeMatchFormData, VibeMatchResult, VibeMatchPaletteItem, VibeMatchShotType, VibeMatchProductVisibility } from '../types';
import { generateVibeMatchImages, analyzeProductVibe } from '../services/geminiService';
import { 
    SwatchIcon, SparklesIcon, PhotoIcon, ArrowPathIcon, ArrowDownTrayIcon, 
    UsersIcon, CheckCircleIcon, XMarkIcon, CubeIcon 
} from './icons';
import CyberDropdown from './CyberDropdown';
import { HAND_GENDERS, VIBE_MATCH_SHOT_TYPES, VIBE_MATCH_GARMENT_OPTIONS } from '../constants';

interface VibeMatchStylistProps {
    language: Language;
}

const VibeMatchStylist: React.FC<VibeMatchStylistProps> = ({ language }) => {
    const [formData, setFormData] = useState<VibeMatchFormData>({
        productImage: null,
        modelImage: null,
        modelGender: 'Female',
        shotType: 'Full Body (OOTD)', // Default
        productVisibility: 'Model Only (Vibe)', // Default per request
        selectedColor: '',
        detectedVibe: '', // Init
        detectedMaterial: '', // Init
        preferredGarment: 'No Preference (AI Decides)',
        customStyles: [],
        usePro: false
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedPalette, setDetectedPalette] = useState<VibeMatchPaletteItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<VibeMatchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Custom Style State
    const [newCustomStyle, setNewCustomStyle] = useState('');
    
    // Remix State
    const [isRemixing, setIsRemixing] = useState<string | null>(null); // ID of card being remixed

    const handleImageUpload = (type: 'product' | 'model', file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'product') {
                setFormData(prev => ({ ...prev, productImage: file, selectedColor: '' }));
                setProductPreview(reader.result as string);
                
                // AUTO ANALYZE PALETTE & VIBE
                setIsAnalyzing(true);
                setDetectedPalette([]);
                analyzeProductVibe(file).then(data => {
                    setDetectedPalette(data.palette);
                    setFormData(prev => ({ 
                        ...prev, 
                        selectedColor: data.palette[0]?.name || '',
                        detectedVibe: data.vibe, // Set the detected vibe
                        detectedMaterial: data.material // Set detected material
                    }));
                }).catch(e => console.error(e)).finally(() => setIsAnalyzing(false));

            } else {
                setFormData(prev => ({ ...prev, modelImage: file }));
                setModelPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const addCustomStyle = () => {
        if (!newCustomStyle.trim()) return;
        if (formData.customStyles.length >= 5) {
            setError("Maximum 5 custom styles allowed.");
            return;
        }
        setFormData(prev => ({ ...prev, customStyles: [...prev.customStyles, newCustomStyle.trim()] }));
        setNewCustomStyle('');
        setError(null);
    };

    const removeCustomStyle = (index: number) => {
        setFormData(prev => ({ ...prev, customStyles: prev.customStyles.filter((_, i) => i !== index) }));
    };

    const handleGenerate = async () => {
        if (!formData.productImage || !formData.modelImage) {
            setError("Please upload both Product and Model images.");
            return;
        }
        if (!formData.selectedColor) {
            setError("Please select a target color from the palette.");
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
             } catch (e) { console.error("API Key check failed", e); }
        }

        setIsGenerating(true);
        setError(null);
        setResults([]);

        try {
            const generated = await generateVibeMatchImages(formData);
            setResults(generated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate styles.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemix = async (result: VibeMatchResult) => {
        if (!formData.productImage || !formData.modelImage) return;
        
        setIsRemixing(result.id);
        setError(null);
        
        try {
            // Generate 4 variations based on this style
            const remixes = await generateVibeMatchImages(formData, { 
                style: result.styleCategory, 
                description: result.description 
            });
            
            // Prepend remixes to results (or append, user preference. Let's prepend to see them first)
            setResults(prev => [...remixes, ...prev]);
        } catch (err) {
            setError("Failed to remix style.");
        } finally {
            setIsRemixing(null);
        }
    };

    const downloadImage = (base64: string, id: string, desc: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `vibe_match_${desc.replace(/\s/g, '_')}_${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
    const CYBER_INPUT = "block w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs py-3 px-4 transition-all hover:border-brand-500/50 placeholder-gray-400";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right: Config (Input) -> Order 1 Mobile */}
            <div className="flex-shrink-0 lg:w-[420px] lg:flex-none order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Styling Config</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Pro Mode */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${formData.usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${formData.usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><SparklesIcon className="w-4 h-4" /></div>
                            <div>
                                <p className={`text-xs font-bold ${formData.usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode (Gemini 3)</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400">Better fashion accuracy</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePro: !prev.usePro }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    <section>
                        <label className={CYBER_LABEL}>1. Assets Upload</label>
                        <div className="space-y-4">
                            {/* Product */}
                            <label className={`block w-full aspect-[4/3] rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${productPreview ? 'border-teal-500' : 'border-gray-300 dark:border-white/20 hover:border-teal-400 bg-gray-50 dark:bg-white/5'}`}>
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
                                        <ArrowPathIcon className="w-6 h-6 text-teal-500 animate-spin mb-2"/>
                                        <span className="text-[9px] text-white font-bold">Extracting Colors & Material...</span>
                                    </div>
                                )}
                                {productPreview ? (
                                    <img src={productPreview} className="w-full h-full object-contain p-4" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <PhotoIcon className="w-8 h-8 mb-2" />
                                        <span className="text-[10px] font-bold uppercase">The Product</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload('product', e.target.files?.[0])} accept="image/*" />
                            </label>

                            {/* Palette Picker & Material Info */}
                            {detectedPalette.length > 0 && (
                                <div className="animate-fade-in p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Detected Palette</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {detectedPalette.map((color, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setFormData(prev => ({...prev, selectedColor: color.name}))}
                                                className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all relative overflow-hidden group ${
                                                    formData.selectedColor === color.name ? 'border-teal-500 scale-105 shadow-lg' : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            >
                                                {formData.selectedColor === color.name && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <CheckCircleIcon className="w-5 h-5 text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 text-center">
                                        Selected: <span className="font-bold text-teal-600 dark:text-teal-400">{formData.selectedColor}</span>
                                    </div>
                                    
                                    {/* DETECTED INFO */}
                                    <div className="mt-3 flex gap-2">
                                        {formData.detectedVibe && (
                                            <div className="flex-1 px-2 py-1.5 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 rounded-lg flex flex-col">
                                                <span className="text-[8px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest">Context</span>
                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate" title={formData.detectedVibe}>{formData.detectedVibe}</span>
                                            </div>
                                        )}
                                        {formData.detectedMaterial && (
                                            <div className="flex-1 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-lg flex flex-col">
                                                <span className="text-[8px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest">Material</span>
                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate" title={formData.detectedMaterial}>{formData.detectedMaterial}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Model */}
                            <label className={`block w-full aspect-[4/3] rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${modelPreview ? 'border-teal-500' : 'border-gray-300 dark:border-white/20 hover:border-teal-400 bg-gray-50 dark:bg-white/5'}`}>
                                {modelPreview ? (
                                    <img src={modelPreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <UsersIcon className="w-8 h-8 mb-2" />
                                        <span className="text-[10px] font-bold uppercase">The Model</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload('model', e.target.files?.[0])} accept="image/*" />
                            </label>
                        </div>
                    </section>

                    <section>
                        <label className={CYBER_LABEL}>2. Model & Composition</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <CyberDropdown label="Gender" value={formData.modelGender} options={HAND_GENDERS} onChange={(val) => setFormData(prev => ({...prev, modelGender: val as any}))} />
                            <CyberDropdown label="Framing / Shot Type" value={formData.shotType} options={VIBE_MATCH_SHOT_TYPES} onChange={(val) => setFormData(prev => ({...prev, shotType: val as VibeMatchShotType}))} />
                        </div>
                        
                        <div className="mb-3">
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Preferred Garment (Lock)</label>
                            <CyberDropdown 
                                value={formData.preferredGarment || 'No Preference (AI Decides)'}
                                options={VIBE_MATCH_GARMENT_OPTIONS}
                                onChange={(val) => setFormData(prev => ({...prev, preferredGarment: val}))}
                            />
                        </div>

                        <div>
                            <label className="text-[9px] text-gray-500 font-bold mb-1 block">Interaction</label>
                            <CyberDropdown 
                                value={formData.productVisibility}
                                options={['Model Only (Vibe)', 'Holding Product']}
                                onChange={(val) => setFormData(prev => ({...prev, productVisibility: val as VibeMatchProductVisibility}))}
                            />
                        </div>
                    </section>

                    {/* Custom Styles */}
                    <section>
                        <label className={CYBER_LABEL}>3. Custom Styles (Optional)</label>
                        <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                value={newCustomStyle}
                                onChange={(e) => setNewCustomStyle(e.target.value)}
                                className={CYBER_INPUT} 
                                placeholder="e.g. Batik Modern, Futuristic Cyberpunk..."
                                onKeyDown={(e) => e.key === 'Enter' && addCustomStyle()}
                            />
                            <button 
                                onClick={addCustomStyle} 
                                className="px-4 py-2 bg-teal-600 rounded-xl text-white font-bold text-lg hover:bg-teal-500 transition-colors shadow-lg"
                            >
                                +
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.customStyles.map((style, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10 animate-fade-in">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{style}</span>
                                    <button onClick={() => removeCustomStyle(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <XMarkIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                            {formData.customStyles.length === 0 && (
                                <p className="text-[9px] text-gray-400 italic">No custom styles added. Using 10 default presets.</p>
                            )}
                        </div>
                    </section>

                    <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                        <div className="flex items-start gap-3">
                            <CubeIcon className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-teal-800 dark:text-teal-200 mb-1">Texture Intelligence</h4>
                                <p className="text-[10px] text-teal-700 dark:text-teal-300 leading-relaxed">
                                    AI now detects the product material (e.g. {formData.detectedMaterial || 'Leather, Silk'}) and suggests fabrics that match the texture, not just color.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !formData.productImage || !formData.modelImage || !formData.selectedColor}
                        className="w-full py-4 bg-gradient-to-r from-teal-600 to-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/30 hover:from-teal-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center transform active:scale-[0.98] tracking-wide uppercase"
                    >
                        {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2"/>}
                        {isGenerating ? 'Designing Outfits...' : 'Style My Model'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-transparent">
                    <h3 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                         <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-teal-500/20 flex items-center justify-center mr-2 lg:mr-3 text-teal-500 dark:text-teal-400">
                            <SwatchIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </span>
                        Style Gallery
                        {results.length > 0 && <span className="ml-3 text-[10px] font-bold text-teal-500 bg-teal-500/10 px-2 py-1 rounded-full uppercase tracking-wider border border-teal-500/20">{results.length} Looks</span>}
                    </h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center"><span className="font-medium">{error}</span></div>}

                    {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 lg:py-0">
                             <div className="relative w-16 h-16 lg:w-24 lg:h-24"><div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-teal-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-green-500 animate-spin animation-delay-150"></div></div>
                             <div>
                                <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500 text-xl font-display">Mixing & Matching...</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Using selected color: <span className="text-teal-400 font-bold">{formData.selectedColor}</span></p>
                                {formData.detectedVibe && <p className="text-xs text-gray-500 mt-1">Context: {formData.detectedVibe}</p>}
                                {formData.detectedMaterial && <p className="text-xs text-gray-500 mt-1">Material: {formData.detectedMaterial}</p>}
                             </div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {results.map((res) => (
                                <div key={res.id} className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg transition-all hover:shadow-xl hover:border-teal-500/50">
                                    <div className="aspect-[9/16] relative overflow-hidden">
                                        <img src={`data:image/png;base64,${res.base64}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={res.description} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 block mb-1">{res.styleCategory}</span>
                                            <p className="text-xs text-white font-medium line-clamp-2">{res.description}</p>
                                        </div>
                                        
                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <button 
                                                onClick={() => downloadImage(res.base64, res.id, res.description)}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center"
                                            >
                                                <ArrowDownTrayIcon className="w-3 h-3 mr-1.5" /> Save
                                            </button>
                                            <button 
                                                onClick={() => handleRemix(res)}
                                                disabled={isRemixing !== null}
                                                className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:bg-teal-500 transition-colors flex items-center"
                                            >
                                                {isRemixing === res.id ? <ArrowPathIcon className="w-3 h-3 mr-1.5 animate-spin" /> : <SparklesIcon className="w-3 h-3 mr-1.5" />}
                                                {isRemixing === res.id ? 'Remixing...' : 'Remix This Look'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 shadow-inner rotate-3 group hover:rotate-0 transition-transform duration-300">
                                <SwatchIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:text-teal-500 transition-colors" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Vibe Match Stylist</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Upload a product and a model. AI will generate 10 perfectly coordinated outfits.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VibeMatchStylist;