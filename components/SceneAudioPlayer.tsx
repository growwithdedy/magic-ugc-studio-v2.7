import React, { useState } from 'react';
import { generateVoiceover } from '../services/geminiService';
import { TTS_VOICES, TTS_TONES } from '../constants';
import { ArrowPathIcon, ArrowDownTrayIcon } from './icons';

interface SceneAudioPlayerProps {
    script: string;
    sceneNumber: number;
    productName?: string;
}

const SceneAudioPlayer: React.FC<SceneAudioPlayerProps> = ({ script, sceneNumber, productName }) => {
    const [voiceName, setVoiceName] = useState(TTS_VOICES[0].id);
    const [tone, setTone] = useState(TTS_TONES[0].value);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleGenerate = async () => {
        if (!script.trim()) return;
        setIsGenerating(true);
        setError(null);
        setAudioUrl(null);
        try {
            const url = await generateVoiceover(script, voiceName, tone);
            setAudioUrl(url);
        } catch (e) {
            setError('Gagal generate audio. Coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `VO_Scene${sceneNumber}_${productName || 'audio'}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="border-t-2 border-black mt-3 pt-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-black hover:text-purple-700 transition-colors"
            >
                <span className="flex items-center gap-2">
                    🎙️ Voice Over Scene {sceneNumber}
                    {audioUrl && <span className="text-green-600">✓ Audio Ready</span>}
                </span>
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3 bg-gray-50 border-2 border-black p-3">
                    {/* Script preview */}
                    <div>
                        <p className="text-[9px] font-black text-black/40 uppercase mb-1">Naskah Voiceover</p>
                        <p className="text-[10px] font-bold text-black/70 italic leading-relaxed">
                            "{script || 'Tidak ada naskah'}"
                        </p>
                    </div>

                    {/* Voice & Tone selectors */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-[9px] font-black text-black/40 uppercase mb-1">Karakter Suara</p>
                            <select
                                value={voiceName}
                                onChange={e => setVoiceName(e.target.value)}
                                className="w-full border-2 border-black bg-white text-[10px] font-bold text-black px-2 py-1.5 appearance-none"
                            >
                                {TTS_VOICES.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-black/40 uppercase mb-1">Nada / Emosi</p>
                            <select
                                value={tone}
                                onChange={e => setTone(e.target.value)}
                                className="w-full border-2 border-black bg-white text-[10px] font-bold text-black px-2 py-1.5 appearance-none"
                            >
                                {TTS_TONES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-[10px] font-black text-red-600 border-2 border-red-400 bg-red-50 px-2 py-1">{error}</p>
                    )}

                    {/* Audio player */}
                    {audioUrl && (
                        <div className="border-2 border-black bg-white p-2 space-y-2">
                            <audio controls src={audioUrl} className="w-full h-8" />
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 py-1.5 border-2 border-black bg-black text-white text-[10px] font-black uppercase hover:bg-gray-800 transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-3 h-3" /> Download WAV
                            </button>
                        </div>
                    )}

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !script.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-black bg-purple-400 text-black text-[10px] font-black uppercase hover:bg-purple-300 disabled:opacity-50 transition-colors active:translate-y-[1px]"
                    >
                        {isGenerating
                            ? <><ArrowPathIcon className="w-3 h-3 animate-spin" /> Generating Audio...</>
                            : <><span>🎙️</span> {audioUrl ? 'Re-Generate Audio' : 'Generate Audio VO'}</>
                        }
                    </button>
                </div>
            )}
        </div>
    );
};

export default SceneAudioPlayer;
