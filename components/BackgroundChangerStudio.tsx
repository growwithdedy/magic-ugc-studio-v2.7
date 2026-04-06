import React, { useState } from 'react';
import type { Language } from '../types';
import { generateBackgroundVariations, retryOperation } from '../services/geminiService';
import { ArrowPathIcon, PhotoIcon, SparklesIcon, ArrowDownTrayIcon } from './icons';

interface BackgroundChangerStudioProps {
    language: Language;
}

const BackgroundChangerStudio: React.FC<BackgroundChangerStudioProps> = ({ language }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageCount, setImageCount] = useState<number>(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [usePro, setUsePro] = useState(false);
    const [retryStatus, setRetryStatus] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setGeneratedImages([]);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadedFile) {
            setError('Silakan unggah gambar latar belakang terlebih dahulu.');
            return;
        }

        if (usePro) {
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
        setGeneratedImages([]);
        setRetryStatus(null);

        try {
            await retryOperation(async () => {
                const results = await generateBackgroundVariations(uploadedFile, imageCount, usePro);
                setGeneratedImages(results);
            }, 3, 2000, (attempt) => setRetryStatus(`Retrying... (${attempt}/3)`));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat variasi background.');
        } finally {
            setIsGenerating(false);
            setRetryStatus(null);
        }
    };

    const downloadImage = (base64: string, index: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `background_changed_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CYBER_LABEL = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";

    return (
        <div className="flex flex-col lg:flex-row h-full relative overflow-y-auto lg:overflow-hidden">
            
            {/* Right: Config (Now Input) -> Order 1 Mobile */}
            <div className="w-full lg:w-[420px] flex-shrink-0 order-1 lg:order-2 bg-white dark:bg-space-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col lg:overflow-hidden lg:h-full z-10 shadow-lg lg:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg font-display tracking-tight">Configuration</h3>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Pro Mode Toggle */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${usePro ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${usePro ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/40' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className={`text-xs font-bold ${usePro ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>Pro Mode</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setUsePro(!usePro)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${usePro ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${usePro ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    </div>

                    {/* Upload */}
                    <section>
                        <label className={CYBER_LABEL}>Image Upload</label>
                        <label className={`block w-full aspect-square rounded-xl border border-dashed cursor-pointer overflow-hidden relative transition-all group ${imagePreview ? 'border-teal-500' : 'border-gray-300 dark:border-white/20 hover:border-teal-400 bg-gray-50 dark:bg-white/5'}`}>
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <PhotoIcon className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-bold uppercase">Click to Upload</span>
                                </div>
                            )}
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </section>

                    {/* Image Count */}
                    <section>
                        <label className={CYBER_LABEL}>Number of Variations</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setImageCount(num)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${imageCount === num ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-space-900 z-10 pb-20 lg:pb-6">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isGenerating || !uploadedFile}
                        className="w-full py-4 bg-gradient-to-r from-teal-600 to-green-500 text-white rounded-xl font-bold text-sm shadow-lg hover:from-teal-500 hover:to-green-400 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-wide"
                    >
                        {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> : <SparklesIcon className="w-5 h-5 mr-2"/>}
                        {isGenerating ? 'Processing...' : 'Generate Backgrounds'}
                    </button>
                </div>
            </div>

            {/* Left: Results (Now Output) -> Order 2 Mobile */}
            <div className="flex-none min-h-[50vh] lg:h-full lg:flex-1 order-2 lg:order-1 min-w-0 bg-gray-50 dark:bg-transparent flex flex-col relative border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-white/5">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent flex justify-between items-center">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-900 dark:text-white flex items-center font-display tracking-tight">
                        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-teal-500/20 flex items-center justify-center mr-2 lg:mr-3 text-teal-500 dark:text-teal-400">
                            <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </span>
                        Background Studio
                    </h2>
                </div>

                <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-gray-50/50 dark:bg-black/20">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center backdrop-blur-sm">
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 lg:py-0">
                            <div className="relative w-16 h-16 lg:w-24 lg:h-24">
                                <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-teal-500 animate-spin"></div>
                                <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-green-500 animate-spin animation-delay-150"></div>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white font-display">{retryStatus || 'Generating Variations...'}</p>
                        </div>
                    ) : generatedImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-white/10 aspect-square">
                                    <img src={`data:image/png;base64,${img}`} alt={`Result ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => downloadImage(img, idx)}
                                            className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-0">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 shadow-inner">
                                <PhotoIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1 font-display text-lg">Empty Canvas</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image to start generating backgrounds.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BackgroundChangerStudio;