
import React, { useState } from 'react';
import type { AppName } from '../types';
import { 
    CameraIcon, ChatBubbleBottomCenterTextIcon, SparklesIcon, CubeIcon, 
    ArchiveBoxIcon, DocumentDuplicateIcon, UsersIcon, CoffeeIcon, 
    SwatchIcon, RocketLaunchIcon, VideoCameraIcon, FilmIcon, ArrowRightIcon, 
    XMarkIcon, CheckCircleIcon, QuestionMarkCircleIcon
} from './icons';
import { MENU_ITEMS } from '../constants';

interface HomepageProps {
    setActiveApp: (app: AppName) => void;
}

// Data Structure for App Details
const APP_DETAILS: Record<string, {
    tagline: string;
    modal: {
        problem: string;
        solution: string;
        howItWorks: string[];
        bestFor: string;
        input: string;
        output: string;
    }
}> = {
    "Hand-on Product Studio": {
        tagline: "Foto produk profesional tanpa sewa studio mahal.",
        modal: {
            problem: "Punya foto produk bagus tapi background berantakan atau membosankan? Sewa studio foto mahal.",
            solution: "Alat ini akan 'mengganti' background foto produkmu menjadi studio estetik, memegang produk dengan tangan model yang realistis, dan mengatur pencahayaan secara otomatis.",
            howItWorks: ["Upload foto produk polos.", "Pilih tema background & tipe tangan.", "AI akan memotret ulang produkmu secara digital."],
            bestFor: "Skincare, Gadget kecil, Aksesoris, Makanan kemasan.",
            input: "Foto produk polos (tanpa background rumit).",
            output: "Foto resolusi tinggi siap posting Instagram/Shopee."
        }
    },
    "UGC Creator": {
        tagline: "Sutradara pribadi untuk konten viral TikTok-mu.",
        modal: {
            problem: "Bingung mau ngomong apa di depan kamera? Atau videomu sepi penonton?",
            solution: "Alat ini membuatkan naskah video lengkap dengan psikologi marketing (hook, pain point, solusi) agar penonton betah nonton sampai habis.",
            howItWorks: ["Upload produk & model.", "Pilih gaya bahasa (Santai/Formal).", "AI menulis naskah & merancang adegan per adegan."],
            bestFor: "Affiliator TikTok, Reels Creator, Shopee Video.",
            input: "Foto produk & Foto Model.",
            output: "Naskah lengkap + Panduan visual setiap detik (Storyboard)."
        }
    },
    "One-Shot Video Ad": {
        tagline: "Satu foto jadi video iklan 15 detik.",
        modal: {
            problem: "Butuh video iklan cepat tapi cuma punya stok foto? Tidak punya skill edit video rumit.",
            solution: "Mengubah satu foto produk menjadi video pendek dengan naskah suara (Voiceover) dan efek visual yang bergerak.",
            howItWorks: ["Upload 1 foto terbaik.", "Pilih target audiens.", "AI membuat video bergerak + suara promosi."],
            bestFor: "Iklan Facebook/IG Ads, Story WhatsApp, Status promosi cepat.",
            input: "1 Foto Produk Utama.",
            output: "Video pendek + Audio Voiceover."
        }
    },
    "Storyselling Studio": {
        tagline: "Ubah jualan jadi cerita yang menyentuh hati.",
        modal: {
            problem: "Orang malas baca iklan yang isinya cuma jualan 'Hard Selling'.",
            solution: "Membuat narasi cerita (Storytelling) yang emosional sehingga audiens merasa terhubung sebelum membeli produkmu.",
            howItWorks: ["Upload produk.", "Tentukan 'musuh' (masalah) pelanggan.", "AI merangkai cerita perjalanan dari masalah ke solusi."],
            bestFor: "Brand Owner, Konten Edukasi, Soft Selling.",
            input: "Foto Produk.",
            output: "Script cerita panjang + Visual pendukung."
        }
    },
    "Fashion Studio": {
        tagline: "Ganti model & lokasi foto baju dalam sekejap.",
        modal: {
            problem: "Susah mencari model bule atau sewa lokasi outdoor untuk foto katalog baju?",
            solution: "Memakaikan baju jualanmu ke model AI dengan berbagai pose dan lokasi dunia, tanpa harus photoshoot ulang.",
            howItWorks: ["Upload foto baju (bisa digantung/flatlay).", "Pilih tipe model & lokasi.", "AI akan 'memakai' baju tersebut ke model."],
            bestFor: "Bisnis Fashion, Thrift Shop, Brand Clothing.",
            input: "Foto baju (Atasan/Bawahan/Dress).",
            output: "Foto Lookbook Fashion/OOTD."
        }
    },
    "FnB Studio": {
        tagline: "Bikin foto makanan jadi menggiurkan.",
        modal: {
            problem: "Foto makanan terlihat pucat dan tidak menggugah selera?",
            solution: "Menganalisis tekstur makanan dan membuat visual 'lezat' dengan pencahayaan dramatis atau suasana kafe.",
            howItWorks: ["Upload foto makanan.", "Pilih suasana (Panas/Dingin/Segar).", "AI menata ulang plating secara digital."],
            bestFor: "Kuliner, Cafe, Restoran, Reviewer Makanan.",
            input: "Foto Makanan/Minuman.",
            output: "Foto Menu/Promosi Makanan."
        }
    },
    "Background Changer Studio": {
        tagline: "Ganti latar belakang foto produk apa saja.",
        modal: {
            problem: "Butuh variasi background untuk 1 produk yang sama?",
            solution: "Menghapus background lama dan menggantinya dengan ratusan opsi background AI yang realistis.",
            howItWorks: ["Upload foto objek.", "Pilih preset background atau ketik keinginanmu.", "AI menggabungkan objek dengan latar baru."],
            bestFor: "Semua jenis produk fisik.",
            input: "Foto Produk apa saja.",
            output: "Foto dengan background baru."
        }
    },
    "Vibe Match Stylist": {
        tagline: "Asisten stylist untuk mix & match outfit.",
        modal: {
            problem: "Bingung baju ini cocoknya dipadukan dengan apa?",
            solution: "Menganalisis warna & gaya produkmu, lalu memberikan rekomendasi outfit lengkap pada model AI.",
            howItWorks: ["Upload produk utama (misal: Tas).", "Upload model.", "AI membuatkan outfit (baju/celana) yang cocok."],
            bestFor: "Fashion Influencer, Toko Aksesoris/Sepatu.",
            input: "Foto Produk Fashion & Model.",
            output: "Inspirasi OOTD lengkap."
        }
    },
    "Unboxing Estetik Studio": {
        tagline: "Video unboxing tanpa perlu syuting ulang.",
        modal: {
            problem: "Ingin konten unboxing tapi malas setup kamera dan lighting?",
            solution: "Mensimulasikan pengalaman membuka paket produk secara visual dan naratif.",
            howItWorks: ["Upload foto produk.", "Pilih jenis kemasan (Box/Plastik).", "AI membuat urutan scene unboxing."],
            bestFor: "Konten 'Racun' Shopee, Review Produk.",
            input: "Foto Produk.",
            output: "Storyboard Unboxing."
        }
    },
    "Product in Room Studio": {
        tagline: "Visualisasi produk di dalam ruangan nyata.",
        modal: {
            problem: "Pembeli ragu apakah furnitur/dekorasi cocok di ruangan mereka?",
            solution: "Menempatkan produk furnitur atau dekorasi ke dalam berbagai tipe ruangan interior (Minimalis, Mewah, dll).",
            howItWorks: ["Upload produk furnitur.", "Pilih tipe ruangan (Kamar/Ruang Tamu).", "AI meletakkan produk secara presisi."],
            bestFor: "Toko Furnitur, Dekorasi Rumah, Poster.",
            input: "Foto Furnitur/Dekorasi.",
            output: "Foto Interior Design."
        }
    },
    "AI Pose Generator": {
        tagline: "Cari inspirasi pose model tanpa batas.",
        modal: {
            problem: "Model kaku atau kehabisan gaya saat foto?",
            solution: "Menghasilkan variasi pose model manusia yang natural berdasarkan referensi wajah.",
            howItWorks: ["Upload wajah model.", "Pilih tema pose (Duduk/Berdiri/Jalan).", "AI generate pose tubuh baru."],
            bestFor: "Fotografer, Model Pemula, Katalog.",
            input: "Foto Wajah Model.",
            output: "Referensi Pose."
        }
    },
    "UGC Photo Studio": {
        tagline: "Foto review produk ala influencer.",
        modal: {
            problem: "Butuh testimoni foto yang terlihat natural tapi tetap estetik?",
            solution: "Membuat foto produk seolah-olah sedang dipegang atau digunakan oleh influencer di kehidupan sehari-hari.",
            howItWorks: ["Upload produk.", "Pilih gaya lifestyle.", "AI membuat foto candid."],
            bestFor: "Social Proof, Testimoni Web.",
            input: "Foto Produk.",
            output: "Foto Lifestyle."
        }
    }
};

const Homepage: React.FC<HomepageProps> = ({ setActiveApp }) => {
    const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

    const categories = [
        "Video & Storytelling"
    ];

    const getAppsByCategory = (category: string) => {
        return MENU_ITEMS.filter(item => item.group === category && item.active);
    };

    const handleInfoClick = (appName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDetail(appName);
    };

    const handleLaunch = (appName: any) => {
        setActiveApp(appName);
    };

    const getDetail = (name: string) => APP_DETAILS[name] || {
        tagline: "Solusi AI canggih untuk kebutuhan kontenmu.",
        modal: {
            problem: "Membutuhkan cara lebih cepat untuk membuat konten.",
            solution: "Menggunakan AI Generatif terbaru.",
            howItWorks: ["Pilih Tool", "Upload", "Generate"],
            bestFor: "Content Creator",
            input: "Gambar/Teks",
            output: "Konten Digital"
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#f0f0f0] relative font-sans">
            
            {/* Hero Section - v2.5 style */}
            <div className="relative pt-16 pb-12 px-6 md:px-12 lg:px-20 text-center">
                <div className="inline-block py-2 px-6 neo-border bg-neo-yellow neo-shadow mb-6 rounded-xl">
                    <span className="text-black text-xs font-black tracking-widest uppercase">
                        Pro Edition v2.5
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-logo text-black mb-6 tracking-tight uppercase leading-none">
                    Welcome to <br />
                    <span className="bg-neo-cyan px-4 neo-border neo-shadow inline-block transform rotate-[-1deg] rounded-2xl">Magic UGC Studio</span>
                </h1>
                <p className="text-sm md:text-lg text-black max-w-2xl mx-auto font-bold leading-relaxed">
                    Platform AI All-in-One untuk mengubah produk biasa menjadi konten penjualan yang luar biasa. 
                    Pilih studio di bawah ini sesuai kebutuhan kontenmu hari ini.
                </p>
            </div>

            {/* App Grid Sections */}
            <div className="px-6 md:px-12 lg:px-20 pb-20 space-y-16">
                {categories.map((category, catIdx) => {
                    const apps = getAppsByCategory(category);
                    if (apps.length === 0) return null;

                    return (
                        <div key={category} className="animate-fade-in">
                            <div className="inline-block px-6 py-2 neo-border bg-black mb-8 neo-shadow rounded-xl">
                                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                                    {category}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {apps.map((app, appIdx) => {
                                    const detail = getDetail(app.name);
                                    const Icon = app.icon;
                                    
                                    const colors = ['bg-neo-yellow', 'bg-neo-cyan', 'bg-green-400', 'bg-neo-pink', 'bg-neo-orange', 'bg-neo-purple'];
                                    const bgColor = colors[(catIdx * 3 + appIdx) % colors.length];

                                    return (
                                        <div 
                                            key={app.name}
                                            className={`group ${bgColor} neo-border p-6 neo-shadow hover:neo-shadow-lg hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden rounded-2xl`}
                                        >
                                            <div className="relative z-10">
                                                <div className="w-14 h-14 neo-border bg-white flex items-center justify-center text-black mb-6 neo-shadow-sm group-hover:rotate-6 transition-transform rounded-xl">
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-2xl font-black text-black mb-3 uppercase leading-tight">{app.name}</h3>
                                                <div className="bg-white neo-border p-3 mb-4 rounded-xl">
                                                    <p className="text-xs font-bold text-black leading-relaxed line-clamp-3">
                                                        {detail.tagline}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-4 relative z-10">
                                                <button 
                                                    onClick={() => handleLaunch(app.name)}
                                                    className="flex-1 py-3 px-4 bg-black text-white neo-border font-black text-xs uppercase neo-shadow-sm hover:bg-gray-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center rounded-xl"
                                                >
                                                    Launch <ArrowRightIcon className="w-4 h-4 ml-2" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleInfoClick(app.name, e)}
                                                    className="w-12 h-12 flex items-center justify-center neo-border bg-white text-black neo-shadow-sm hover:bg-gray-100 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all rounded-xl"
                                                    title="Info Detail"
                                                >
                                                    <QuestionMarkCircleIcon className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}></div>
                    <div className="relative bg-white neo-border w-full max-w-2xl neo-shadow-lg animate-fade-in flex flex-col max-h-[90vh] overflow-hidden rounded-2xl">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b-[3px] border-black flex justify-between items-center bg-neo-yellow">
                            <h3 className="text-2xl font-black text-black uppercase">{selectedDetail}</h3>
                            <button onClick={() => setSelectedDetail(null)} className="p-2 neo-border bg-white hover:bg-neo-pink hover:text-white transition-colors neo-shadow-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                            {(() => {
                                const info = getDetail(selectedDetail);
                                return (
                                    <>
                                        {/* Problem & Solution */}
                                        <div className="space-y-4">
                                            <div className="bg-neo-pink/20 neo-border p-4 neo-shadow-sm rounded-xl">
                                                <span className="text-xs font-black text-black uppercase tracking-widest block mb-2">Masalah</span>
                                                <p className="text-sm font-bold text-black">{info.modal.problem}</p>
                                            </div>
                                            <div className="bg-neo-cyan/30 neo-border p-4 neo-shadow-sm rounded-xl">
                                                <span className="text-xs font-black text-black uppercase tracking-widest block mb-2">Solusi Kami</span>
                                                <p className="text-sm font-black text-black">{info.modal.solution}</p>
                                            </div>
                                        </div>

                                        {/* How It Works */}
                                        <div>
                                            <h4 className="text-lg font-black text-black mb-4 flex items-center uppercase">
                                                <SparklesIcon className="w-5 h-5 mr-2" /> Cara Kerja
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {info.modal.howItWorks.map((step, idx) => (
                                                    <div key={idx} className="bg-white neo-border p-4 neo-shadow-sm text-center rounded-xl">
                                                        <div className="w-8 h-8 neo-border bg-neo-yellow text-black font-black text-sm flex items-center justify-center mx-auto mb-3 rounded-lg">
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-xs font-bold text-black">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Target Audience */}
                                        <div className="flex items-start gap-4 p-4 neo-border bg-neo-yellow neo-shadow-sm rounded-xl">
                                            <UsersIcon className="w-6 h-6 text-black flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-xs font-black text-black uppercase tracking-widest block mb-1">Cocok Untuk</span>
                                                <p className="text-sm font-bold text-black">{info.modal.bestFor}</p>
                                            </div>
                                        </div>

                                        {/* Input / Output */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white neo-border neo-shadow-sm rounded-xl">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Persiapan</span>
                                                <p className="text-xs font-black text-black flex items-center">
                                                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" /> {info.modal.input}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-white neo-border neo-shadow-sm rounded-xl">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Hasil Akhir</span>
                                                <p className="text-xs font-black text-black flex items-center">
                                                    <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" /> {info.modal.output}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t-[3px] border-black bg-gray-100">
                            <button 
                                onClick={() => {
                                    handleLaunch(selectedDetail);
                                    setSelectedDetail(null);
                                }}
                                className="w-full py-4 bg-black text-white neo-border font-black text-sm neo-shadow hover:bg-gray-800 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center uppercase tracking-widest rounded-xl"
                            >
                                <RocketLaunchIcon className="w-5 h-5 mr-3" />
                                Buka Studio Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Homepage;
