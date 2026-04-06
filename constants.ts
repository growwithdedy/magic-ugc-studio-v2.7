
import type { MenuItem, Language, VideoMood, HandSkinTone, HandGender, HandCount, LightingMode, CameraAngle, ShotDistance, ScriptTone, ScriptPlatform, UGCCategory, UGCAspectRatio, UGCModelAge, FashionModelBodyType, UGCCreatorShotType, UGCScriptStyle, UGCScriptDuration, ProductPlacement, RoomType, InteriorStyle, RoomSellingAngle, GeminiVoiceName, PackagingType, UnboxingMood, UnboxingScriptPace, UnboxingOutfitStyle, UnboxingFlowLength, UnboxingProductSize, UnboxingClosingStrategy, UGCContentStructure, FashionGarmentType, FashionPosePreset, FashionFraming, FashionClothingFit, FashionTuckStyle, FashionCinematicMove, FnBTemperature, FnBTexture, FnBContentStrategy, FnBModelPersona, FnBScriptDensity, FnBProductCategory, FnBSceneCount, UGCSceneStrategy, VibeMatchShotType, StorysellingFramework, StorysellingHook, OneShotMode, OneShotPlatform, OneShotCTA, OneShotCameraMotion, OneShotBackgroundVibe, FashionEnvironment, FashionReelMode, FashionLighting, FashionKeyFeature, FashionHook, StoryMood, StorySetting, FnBEnvironment, FnBMotionFocus, FnBPlatingStyle, CarouselVibe, CarouselHook } from './types';
import { AppName } from './types';
import { 
    CameraIcon, ChatBubbleBottomCenterTextIcon, SparklesIcon, CubeIcon, PuzzlePieceIcon, 
    ArchiveBoxIcon, QuestionMarkCircleIcon, DocumentDuplicateIcon, SunIcon, UsersIcon,
    LeafIcon, CoffeeIcon, BuildingOfficeIcon, SwatchIcon, TruckIcon, BuildingLibraryIcon, 
    GlobeAltIcon, RocketLaunchIcon, CurrencyDollarIcon, PencilIcon, VideoCameraIcon, FilmIcon, HomeIcon,
    ViewColumnsIcon, FireIcon, CakeIcon, BoltIcon, DocumentTextIcon
} from './components/icons';

const createOption = (label: string, value: string) => ({ label, value });

export const MENU_ITEMS: MenuItem[] = [
  // GROUP 0: DASHBOARD
  { name: AppName.Home, icon: HomeIcon, active: true, group: 'Menu Utama' },

  // GROUP 1: VIDEO & STORYTELLING
  { name: AppName.SkincareStudio, icon: SparklesIcon, active: true, group: 'Video & Storytelling' },
  { name: AppName.OneShotVideo, icon: FilmIcon, active: true, group: 'Video & Storytelling' },
  { name: AppName.FashionReel, icon: VideoCameraIcon, active: true, group: 'Video & Storytelling' }, 
  { name: AppName.UGCCreator, icon: VideoCameraIcon, active: true, group: 'Video & Storytelling' },
  { name: AppName.Storyselling, icon: RocketLaunchIcon, active: true, group: 'Video & Storytelling' }, 
  { name: AppName.Unboxing, icon: ArchiveBoxIcon, active: true, group: 'Video & Storytelling' }, 
  { name: AppName.FnB, icon: CoffeeIcon, active: true, group: 'Video & Storytelling' },
  { name: AppName.HandOnProduct, icon: CameraIcon, active: true, group: 'Video & Storytelling' },
  { name: AppName.MirrorSelfie, icon: CameraIcon, active: true, group: 'Video & Storytelling' },
];

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'ID', name: 'Bahasa Indonesia' },
  { code: 'EN', name: 'English' },
  { code: 'MS', name: 'Bahasa Melayu' },
  { code: 'TH', name: 'ภาษาไทย' },
  { code: 'VI', name: 'Tiếng Việt' },
];

export const VIDEO_MOODS = [
  createOption('Tenang & Rileks', 'Tenang & Rileks'),
  createOption('Mewah & Elegan', 'Mewah & Elegan'),
  createOption('Ceria & Enerjik', 'Ceria & Enerjik'),
  createOption('ASMR & Memuaskan', 'ASMR & Satisfying'),
];

// Skincare Constants
export const SKINCARE_MODES = [
    { 
        id: 'PRO_COMMERCIAL', 
        label: 'Professional Commercial', 
        icon: SparklesIcon, 
        color: 'text-black', 
        bg: 'bg-yellow-400',
        border: 'border-black',
        description: 'High-end TVC style with product physics, macro textures, and clinical models.' 
    },
    { 
        id: 'PROBLEM_SOLUTION', 
        label: 'Problem & Solution', 
        icon: FireIcon, 
        color: 'text-black', 
        bg: 'bg-cyan-400',
        border: 'border-black',
        description: 'Focus on pain points (acne, redness) and showing the rescue product.' 
    },
    { 
        id: 'HONEST_REVIEW', 
        label: 'Honest UGC Review', 
        icon: UsersIcon, 
        color: 'text-black', 
        bg: 'bg-green-400',
        border: 'border-black',
        description: 'Raw, honest, and high-trust content from a users perspective.' 
    },
    { 
        id: 'BATTLE', 
        label: 'The Battle (VS)', 
        icon: BoltIcon, 
        color: 'text-black', 
        bg: 'bg-pink-400',
        border: 'border-black',
        description: 'Compare two products head-to-head. Steal traffic from competitors.' 
    },
    { 
        id: 'EDUCATIONAL', 
        label: 'Science & Routine', 
        icon: DocumentTextIcon, 
        color: 'text-black', 
        bg: 'bg-orange-400',
        border: 'border-black',
        description: 'Educate on ingredients (Retinol, Niacidamide) and proper layering.' 
    },
    { 
        id: 'AESTHETIC_ASMR', 
        label: 'Aesthetic / ASMR', 
        icon: SparklesIcon, 
        color: 'text-black', 
        bg: 'bg-purple-400',
        border: 'border-black',
        description: 'Cinematic texture shots, satisfy visuals and sound (macro focus).' 
    }
];

export const SKINCARE_VOCAL_PERSONAS = [
    { 
        label: 'The Scientific Skeptic', 
        value: 'Scientific Skeptic', 
        desc: 'Otoritas dermatologi yang kritis. Fokus pada data klinis, bahan aktif, dan bukti ilmiah.',
        example: '"Barrier kulit tidak bisa diperbaiki dengan janji manis. Kita butuh Ceramide dengan rasio yang tepat."',
        pace: 'Controlled',
        complexity: 'High',
        visual_cue: 'Serious, focused, neutral professional expression. Steady eye contact.',
        behavioralInstruction: 'Use complex sentences, dermatological terminology, and a serious, analytical tone. Debunk myths with facts.'
    },
    { 
        label: 'The Viral Hype-Friend', 
        value: 'Viral Hype-Friend', 
        desc: 'Sangat ekspresif dan akrab. Menggunakan slang TikTok/IG untuk membangun kedekatan instan.',
        example: '"Jujurly ini serum tergila yang pernah aku coba! No gatekeeping ya, kalian wajib punya ini!"',
        pace: 'Fast',
        complexity: 'Low',
        visual_cue: 'Joyful, excited, highly expressive facial movements. Dynamic hand gestures.',
        behavioralInstruction: 'Use short, punchy sentences, lots of exclamation marks, and social media slang. Focus on emotional urgency.'
    },
    { 
        label: 'The Persuasive Challenger', 
        value: 'Persuasive Challenger', 
        desc: 'Komparatif dan tajam. Ahli dalam membedah kenapa satu produk lebih unggul dari yang lain.',
        example: '"Ngapain bayar sejuta kalau produk ini punya kandungan yang sama dengan harga sepertiganya?"',
        pace: 'Dynamic',
        complexity: 'Medium',
        visual_cue: 'Confident, slightly intense, knowing smile. Direct and challenging eye contact.',
        behavioralInstruction: 'Focus on direct comparisons, value-for-money arguments, and rhetorical questions that challenge the viewer.'
    },
    { 
        label: 'The Zen Minimalist', 
        value: 'Zen Minimalist', 
        desc: 'Tenang, mahal, dan puitis. Menggunakan kata-kata sensorik yang minim namun sangat bermakna.',
        example: '"Embun dalam botol. Rasakan ketenangan yang meresap hingga ke lapisan terdalam."',
        pace: 'Very Slow',
        complexity: 'Low',
        visual_cue: 'Serene, peaceful expression. Soft gaze, slow blinking, graceful movements.',
        behavioralInstruction: 'Use very few words. Focus on sensory adjectives like "velvety", "luminous", and "weightless". Keep it atmospheric.'
    },
    { 
        label: 'Clinical Honest', 
        value: 'Clinical Honest', 
        desc: 'Faktual dan to-the-point. Seperti beauty consultant yang bicara transparan tanpa majas.',
        example: '"5% Niacinamide terbukti secara klinis mencerahkan dalam 14 hari. Tanpa pewangi tambahan."',
        pace: 'Medium',
        complexity: 'Medium',
        visual_cue: 'Polished, trustworthy, clean professional look. Helpful and direct expression.',
        behavioralInstruction: 'Be direct and transparent. Use specific numbers (percentages, days). Avoid hyperbole.'
    }
];

export const SKINCARE_WARDROBES = [
    { 
        label: 'Home Reality', 
        value: 'Home Reality', 
        desc: 'Kaos katun oversized atau hoodie tipis. Kesan "Saya pakai ini di rumah".',
        visual: 'Oversized ribbed cotton t-shirt or basic hoodie, soft fabric folds, high trust UGC vibe.'
    },
    { 
        label: 'Skin-First Minimal', 
        value: 'Skin-First Minimal', 
        desc: 'Atasan tali tipis atau handuk melilit bahu. Fokus 100% pada kulit.',
        visual: 'Spaghetti strap top or towel wrap, bare shoulders and neck exposed, focus on skin texture.'
    },
    { 
        label: 'Modern Pioneer', 
        value: 'Modern Pioneer', 
        desc: 'Smart casual, turtleneck atau kemeja tanpa kerah. Kesan cerdas & modern.',
        visual: 'Slim-fit turtleneck or collarless structured shirt, clean modern aesthetics, smart professional look.'
    },
    { 
        label: 'The Neutral Judge', 
        value: 'The Neutral Judge', 
        desc: 'Atasan fitted warna abu-abu/hitam polos. Cocok untuk adu produk.',
        visual: 'Solid dark grey or black fitted top, minimalist non-distracting fabric, focus on product colors.'
    }
];

export const SKINCARE_HAIR_STYLES = [
    createOption('Skincare Headband (Bandana)', 'Wearing a fluffy skincare headband with cat ears or soft material.'),
    createOption('Hair Clip (Jepit)', 'Hair styled with professional salon clips on the sides, forehead exposed.'),
    createOption('Sleek Back / Wet Look', 'Sleek back hair, clean polished look, forehead and face fully visible.'),
    createOption('Messy Bun / Natural', 'Simple messy bun or natural hair tied back loosely.')
];

export const SKINCARE_PRODUCT_PHYSICS = [
    createOption('Liquid / Watery (Cair)', 'Liquid and watery physics, fast splashes, droplets.'),
    createOption('Thick Creamy (Kental)', 'Thick and creamy consistency, slow spreads, soft peaks.'),
    createOption('Oil / Honey-like (Berminyak)', 'Viscous oil or honey-like texture, golden reflections, slow drips.'),
    createOption('Gel / Jelly (Kenyal)', 'Clear gel or bouncy jelly texture, refractive light, smooth slide.')
];

export const SKINCARE_LIGHTING_MOODS = [
    createOption('High-End Luxury (Mewah)', 'High-end luxury lighting with soft shadows and golden highlights.'),
    createOption('Minimalist Soft (Bersih)', 'Minimalist soft clinical lighting, bright white tones, even spread.'),
    createOption('Moody Cinematic (Dramatis)', 'Moody cinematic lighting with refractive caustics and high contrast.')
];

export const SKINCARE_AUDIO_FOCUS = [
    createOption('Tapping Botol (Ketukan)', 'Focus on the sound of finger tapping on a glass bottle.'),
    createOption('Squishing Texture (Lumer)', 'Focus on the squishing sound of thick cream or gel texture.'),
    createOption('Skin Application (Usapan)', 'Focus on the soft sliding sound of product being applied to skin.')
];

export const SKINCARE_AUTHENTICITY = [
    createOption('Ultra Realistic (Messy)', 'Authentic messy home setting, real everyday vibe.'),
    createOption('Aesthetic UGC (Cantik)', 'Relatable but aesthetic home setting, balanced lighting.'),
    createOption('Polished Review (Rapi)', 'Clean and organized setting for a professional review feel.')
];

export const SKINCARE_SKIN_TYPES = [
    createOption('Semua Tipe Kulit', 'All Skin Types'),
    createOption('Berminyak (Oily)', 'Oily / Shiny Skin'),
    createOption('Kering (Dry)', 'Dry / Flaky Skin'),
    createOption('Berjerawat (Acne-prone)', 'Acne-prone / Troubled Skin'),
    createOption('Kusam (Dull)', 'Dull / Tired Skin'),
    createOption('Sensitif / Merah', 'Sensitive / Redness-prone Skin'),
    createOption('Kombinasi', 'Combination Skin')
];

export const SKINCARE_LOCATIONS = [
    createOption('Kamar Mandi Modern', 'Modern Minimalist Bathroom'),
    createOption('Meja Rias Estetik', 'Aesthetic Vanity Table'),
    createOption('Rak Skincare (Shelfie)', 'Skincare Shelf (Shelfie)'),
    createOption('Jendela Sinar Pagi', 'Morning Sunlight near Window'),
    createOption('Laboratorium Bersih', 'Clean Clinical Laboratory'),
    createOption('Outdoor (Sinar Matahari)', 'Outdoor Natural Sunlight')
];

export const SKINCARE_FRAMINGS = [
    createOption('Extreme Close-up (Macro)', 'Extreme Close-up (Macro) focus on texture and pores'),
    createOption('Close-up (Wajah)', 'Close-up (Face Focus)'),
    createOption('Medium Shot', 'Medium Shot (Waist Up)'),
    createOption('Hand Point of View (POV)', 'Hand POV Holding Product')
];

// Problem & Solution Mode Constants
export const SKINCARE_PROBLEM_INTENSITIES = [
    createOption('Ringan / Samar (Subtle)', 'Mild, slightly visible skin concern.'),
    createOption('Standar / Jelas (Standard)', 'Standard visible skin concern, clearly noticeable.'),
    createOption('Akut / Meradang (Severe)', 'Severe, inflamed, or intense skin concern for high impact contrast.')
];

export const SKINCARE_DREAM_GOALS = [
    createOption('Glass Skin Finish (Kilau)', 'Glass skin finish, ultra radiant and smooth.'),
    createOption('Matte & Pores Clear (Bersih)', 'Matte finish, zero visible pores, smooth texture.'),
    createOption('Calm & Redness Gone (Tenang)', 'Calmed skin, all redness and irritation disappeared.'),
    createOption('Hydrated & Plump (Kenyal)', 'Deeply hydrated, bouncy and plump skin appearance.')
];

export const SKINCARE_EMOTIONAL_HOOKS = [
    createOption('Empati (Sama-sama Berjuang)', 'Empathy-driven, relatable struggle hook.'),
    createOption('Urgensi (Bahaya Penuaan/Jerawat)', 'Urgency-driven, warning about consequences of neglect.'),
    createOption('Edukasi (Fakta vs Mitos)', 'Educational, fact-based debunking hook.')
];

// Character Locking Styles
export const CHARACTER_ART_STYLES = [
    createOption('Hyper Realistic (Foto)', 'Hyper Realistic Photography'),
    createOption('Anime Modern (Cel Shaded)', 'Modern Anime Cel Shaded'),
    createOption('3D Disney/Pixar Style', '3D Disney Pixar Style'),
    createOption('Sketch / Konsep Kasar', 'Rough Concept Sketch'),
    createOption('Cyberpunk Illustration', 'Cyberpunk Illustration'),
    createOption('Oil Painting', 'Classical Oil Painting'),
    createOption('Comic Book (American)', 'American Comic Book')
];

// Hand-on Product Studio Constants
export const HAND_SKIN_TONES = [
    createOption('Terang (Light)', 'Light'),
    createOption('Sawo Matang (Medium)', 'Medium'),
    createOption('Gelap (Dark)', 'Dark')
];
export const HAND_GENDERS = [
    createOption('Wanita', 'Female'),
    createOption('Pria', 'Male')
];
export const HAND_COUNTS = [
    createOption('1 Tangan', '1 Hand'),
    createOption('2 Tangan', '2 Hands')
];
export const LIGHTING_MODES = [
    createOption('Studio Halus (Softbox)', 'Softbox Studio'),
    createOption('Sinar Matahari (Golden Hour)', 'Sunlight / Golden Hour'),
    createOption('Neon / Cyberpunk', 'Neon / Cyberpunk'),
    createOption('Tegas & Kontras (Hard Light)', 'Hard Light / Bold')
];
export const CAMERA_ANGLES = [
    createOption('Sejajar Mata (Eye Level)', 'Eye Level'),
    createOption('Dari Bawah (Low Angle)', 'Low Angle'),
    createOption('Sudut Pandang Orang (POV)', 'POV (Point of View)')
];
export const SHOT_DISTANCES = [
    createOption('Sangat Dekat (Macro)', 'Close-up (Macro)'),
    createOption('Jarak Sedang (Medium)', 'Medium Shot'),
    createOption('Jarak Jauh (Wide)', 'Wide Shot (Far)')
];

export const BACKGROUND_PRESETS = [
    "Meja marmer putih minimalis dengan cahaya pagi lembut",
    "Kain linen beige aesthetic dengan bunga kering",
    "Permukaan beton modern dengan bayangan tegas (Industrial)",
    "Latar belakang dedaunan tropis hijau segar (Nature)",
    "Podium pink pastel dengan gelembung melayang (Playful)",
    "Kain sutra hitam mewah dengan aksen emas",
    "Meja piknik kayu disinari matahari taman",
    "Meja kafe estetik dengan kopi dan majalah",
    "Langit biru dengan awan putih lembut (Dreamy)",
    "Jalanan kota neon di malam hari (Cyberpunk)",
    "Meja wastafel kamar mandi bersih dengan pantulan cermin",
    "Pasir pantai saat matahari terbenam (Sunset)",
    "Latar kertas geometris warna pastel",
    "Lantai kayu rustic dengan karpet bulu",
    "Permukaan air jernih dengan riak (Fresh)",
    "Sprei putih kasur dengan suasana pagi (Cozy)",
    "Tekstur batu teraso warna-warni",
    "Latar studio gradasi (Biru ke Ungu)",
    "Lampu kota bokeh malam hari",
    "Meja dapur dengan bahan-bahan segar"
];

export const SCRIPT_TONES = [
    createOption('Jualan Langsung (Hard Selling)', 'Hard Selling'),
    createOption('Bercerita (Soft Selling)', 'Soft Selling / Storytelling'),
    createOption('Review Jujur', 'Review Jujur')
];
export const SCRIPT_PLATFORMS = [
    createOption('TikTok', 'TikTok'),
    createOption('Shopee Video', 'Shopee Video'),
    createOption('Instagram Reels', 'Instagram Reels')
];

// UGC Review Constants
export const UGC_CATEGORIES = [
    createOption('Fashion & Baju', 'Fashion'),
    createOption('Skincare & Beauty', 'Skincare'),
    createOption('Makanan & Minuman', 'FNB'),
    createOption('Perabot & Dekorasi', 'Furniture'),
    createOption('Elektronik & Gadget', 'Electronics')
];
export const UGC_ASPECT_RATIOS = ['9:16', '4:5', '1:1']; 
export const UGC_MODEL_AGES = [
    createOption('Remaja (Teen)', 'Teenager'),
    createOption('Dewasa Muda (20-an)', 'Young Adult'),
    createOption('Dewasa (30-40an)', 'Adult'),
    createOption('Matang (50+)', 'Mature')
];
export const UGC_MODEL_ETHNICITIES = [
    createOption('Asia (Indonesia)', 'Asian (Indonesian)'),
    createOption('Asia (Korea/Jepang)', 'Asian (Korean/Japanese)'),
    createOption('Kaukasia (Bule)', 'Caucasian'),
    createOption('Timur Tengah', 'Middle Eastern'),
    createOption('Afrika', 'African')
];

export const UGC_LOCATIONS = [
    createOption('Kafe Estetik', 'Cafe Aesthetic'),
    createOption('Studio Minimalis', 'Minimalist Studio'),
    createOption('Taman / Outdoor', 'Outdoor / Park'),
    createOption('Pantai / Resort', 'Beach / Resort'),
    createOption('Ruang Tamu Mewah', 'Luxury Living Room'),
    createOption('Kamar Mandi Modern', 'Modern Bathroom'),
    createOption('Jalanan Kota', 'Urban Street'),
    createOption('Gym / Fitness', 'Gym / Fitness Center')
];

export const UGC_COLOR_TONES = [
    createOption('Hangat & Bumi (Warm)', 'Warm & Earthy'),
    createOption('Sejuk & Segar (Cool)', 'Cool & Fresh'),
    createOption('Pastel & Lembut', 'Pastel & Soft'),
    createOption('Cerah & Pop', 'Vibrant & Pop'),
    createOption('Gelap & Moody', 'Moody & Dark'),
    createOption('Putih Bersih (High Key)', 'Clean White (High Key)')
];

export const UGC_CAMERA_ANGLES_OPT = [
    createOption('Sejajar Mata', 'Eye Level'),
    createOption('Dari Bawah (Hero)', 'Low Angle (Hero)'),
    createOption('Dari Atas', 'High Angle'),
    createOption('Close Up (Detail)', 'Close Up (Detail)'),
    createOption('Jarak Jauh (Lingkungan)', 'Wide Shot (Environment)')
];

export const UGC_STYLE_OPTIONS: Record<UGCCategory, {label: string, value: string}[]> = {
  'Fashion': [
      createOption('Foto Lifestyle (Jalanan)', 'Lifestyle Shot (Street)'),
      createOption('Mirror Selfie OOTD', 'OOTD Mirror Selfie'),
      createOption('Flatlay (Baju Digelar)', 'Flatlay Outfit Grid'),
      createOption('Manekin', 'Mannequin Display'),
      createOption('Katalog Studio', 'Studio Catalog')
  ],
  'Skincare': [
      createOption('Rak Kamar Mandi (Shelfie)', 'Bathroom Shelfie'),
      createOption('Tekstur Produk (Smear)', 'Texture Shot (Smear)'),
      createOption('Dipegang Tangan (POV)', 'Hand Holding (POV)'),
      createOption('Efek Air/Splash', 'Water/Splash Effect'),
      createOption('Podium Minimalis', 'Minimalist Podium')
  ],
  'FNB': [
      createOption('Meja Kafe (Table Top)', 'Table Top (Cafe)'),
      createOption('Dipegang Tangan', 'Hand Holding Drink'),
      createOption('Piknik di Taman', 'Picnic Spread'),
      createOption('Gelap & Mewah (Fine Dining)', 'Dark & Moody (Fine Dining)'),
      createOption('Dapur Rumah', 'Kitchen Counter')
  ],
  'Furniture': [
      createOption('Sudut Ruangan (Cozy)', 'Cozy Corner'),
      createOption('Konteks Ruangan Luas', 'Room Context (Wide)'),
      createOption('Detail Tekstur Bahan', 'Detail Texture'),
      createOption('Digunakan Model', 'In Use by Model')
  ],
  'Electronics': [
      createOption('Setup Meja Kerja', 'Desk Setup (Tech)'),
      createOption('Dalam Genggaman', 'In Hand (Gadget)'),
      createOption('Lifestyle Luar Ruangan', 'Outdoor Lifestyle'),
      createOption('Background Neon/Cyber', 'Neon/Cyberpunk Background')
  ]
};

// UGC Creator Constants
export const UGC_CREATOR_SHOT_TYPES = [
    createOption('Fokus Tangan', 'Hand Focus'),
    createOption('Wajah & Produk', 'Face & Product'),
    createOption('Seluruh Badan / OOTD', 'Full Body / OOTD'),
    createOption('Lingkungan / Lifestyle', 'Environment / Lifestyle')
];

export const UGC_TARGET_AUDIENCES = [
    createOption('Gen Z (Kekinian)', 'Gen Z (Trendy & Youthful)'),
    createOption('Millennials (Profesional)', 'Millennials (Professional & Aesthetic)'),
    createOption('Ibu-ibu / Keluarga', 'Parents / Family Oriented'),
    createOption('Pelajar / Hemat Budget', 'Students / Budget Conscious'),
    createOption('Pencari Barang Mewah', 'Luxury & High-end Seekers'),
    createOption('Pecinta Gadget & Tech', 'Tech Enthusiasts & Gamers'),
    createOption('Beauty & Skincare', 'Beauty & Skincare Junkies'),
    createOption('Kesehatan & Fitness', 'Fitness & Health Enthusiasts'),
    createOption('Dekorasi Rumah', 'Homeowners & Decor Lovers'),
    createOption('Pecinta Kuliner', 'Foodies & Culinary Fans')
];

// --- FASHION TARGET AUDIENCES (SPECIFIC & MAPPED) ---
export const FASHION_GENDERS = [
    createOption('👩 Wanita (Women)', 'WOMEN'),
    createOption('👨 Pria (Men)', 'MEN'),
    createOption('👫 Unisex / Couple', 'UNISEX')
];

export const FASHION_AUDIENCE_MAP: Record<string, {label: string, value: string}[]> = {
    'WOMEN': [
        createOption('Hijabers Modern (Stylish & Syar\'i)', 'Hijabers Modern (Stylish & Syar\'i)'),
        createOption('Cewek Bumi (Earth Tones/Minimalis)', 'Cewek Bumi (Earth Tones/Minimalist)'),
        createOption('Cewek Mamba (Edgy/Streetwear)', 'Cewek Mamba (Edgy/Streetwear)'),
        createOption('Cewek Kue (Colorful/Pop)', 'Cewek Kue (Colorful/Pop)'),
        createOption('Office Lady / Career Woman', 'Office Lady / Career Woman'),
        createOption('Mahasiswa / Kampus Friendly', 'Mahasiswa / Campus Friendly'),
        createOption('Party / Kondangan Goers', 'Party / Formal Event Goers'),
        createOption('Bumil / Busui Friendly', 'Maternity / Nursing Friendly')
    ],
    'MEN': [
        createOption('Cowok Bumi (Clean / Uniqlo Style)', 'Cowok Bumi (Clean / Minimalist)'),
        createOption('Starboy / Edgy (Leather/Dark)', 'Starboy / Edgy (Streetwear)'),
        createOption('Office Man / Eksekutif Muda', 'Office Man (Professional)'),
        createOption('Koko Modern / Religious', 'Koko Modern (Religious Casual)'),
        createOption('Skena / Anak Konser (Arts)', 'Skena / Artsy (Oversized)'),
        createOption('Gym Bro / Sporty', 'Gym Bro (Activewear)')
    ],
    'UNISEX': [
        createOption('Streetwear Hypebeast', 'Streetwear Hypebeast'),
        createOption('Couple Goals (Sarimbit)', 'Couple Goals (Matching Outfit)'),
        createOption('Basic Daily Wear (Kaos Polos)', 'Basic Daily Wear')
    ]
};

export const FASHION_TARGET_AUDIENCES = FASHION_AUDIENCE_MAP['WOMEN'];

export const UGC_CONTENT_STRUCTURES = [
    createOption('🔍 Review Detail & Edukasi', '🔍 In-Depth Review / Demo (Edukatif)'),
    createOption('📖 Storytelling / Vlog', '📖 Storytelling / Vlog (Relatable)'),
    createOption('🔥 Promo Hard Selling', '🔥 Hard Selling / Promo (Urgency)'),
    createOption('✨ Sinematik Estetik', '✨ Aesthetic / Cinematic (Visuals)'),
    createOption('⚠️ Masalah & Solusi', '⚠️ Problem-Agitation-Solution (Psychology)'),
    createOption('🆚 Bandingkan Produk (Dupe)', '🆚 The "Dupe" Battle / Comparison (Value)'),
    createOption('🛠️ Tutorial / Cara Pakai', '🛠️ Tutorial / How-To (Utility)'),
    createOption('🤥 Membuktikan Mitos', '🤥 "Skeptic to Believer" (Trust)')
];

export const UGC_SCRIPT_STYLES = [
    createOption('Santai & Akrab (Bestie)', 'Santai & Akrab (Bestie Vibe)'),
    createOption('Profesional & Ahli', 'Profesional & Edukatif (Expert Vibe)'),
    createOption('Mewah & Elegan', 'Mewah & Elegan (Luxury Vibe)'),
    createOption('Emosional / Curhat', 'Storytelling & Emosional (Curhat Vibe)'),
    createOption('To The Point (Sales)', 'Hard Selling & Promo (Sales Vibe)')
];

export const UGC_SCRIPT_DURATIONS = [
    createOption('Singkat & Padat', 'Snappy (Short)'),
    createOption('Seimbang (Standar)', 'Balanced (Standard)'),
    createOption('Detail & Panjang', 'Detailed (Long)')
];

export const UGC_SCENE_STRATEGIES = [
    createOption('Cepat (3 Scene)', 'Snappy (3 Scenes)'),
    createOption('Persuasi (5 Scene)', 'Persuasion (5 Scenes)'),
    createOption('Bercerita (7 Scene)', 'Storytelling (7 Scenes)')
];

export const UGC_HOOK_TEMPLATES = [
    { label: "AI Tentukan Sendiri (Otomatis)", value: "" },
    { label: "⛔ Negative Hook (Jangan Beli...)", value: "Negative Hook: 'Jangan beli produk ini kalau kamu gak mau...'" },
    { label: "🛑 Stop Scrolling (3 Detik)", value: "Stop Scrolling Hook: 'Kasih aku 3 detik buat nyelamatin...'" },
    { label: "🤫 Rahasia / Gatekeeping", value: "Gatekeeping Hook: 'Aku nyesel baru tau produk ini sekarang...'" },
    { label: "🆚 Bandingkan (Mahal vs Murah)", value: "Comparison Hook: 'Ngapain beli yang mahal kalau ada yang ini...'" },
    { label: "📉 Turun Harga / Promo", value: "Promo Hook: 'Harganya lagi anjlok banget!'" },
    { label: "🤯 Fakta Mengejutkan", value: "Educational Hook: 'Ternyata selama ini cara kita salah loh...'" },
    { label: "🤩 Transformasi (Before/After)", value: "Transformation Hook: 'Liat bedanya cuma dalam 1 minggu!'" }
];

export const UGC_MODEL_OUTFITS = [
    createOption('✨ Casual Basic (Kaos Putih + Jeans)', 'White t-shirt and blue jeans, minimalist clean look'),
    createOption('🏠 Rumahan / Piyama (Cozy)', 'Silk pajamas or cozy loungewear, messy bun hair'),
    createOption('👗 Cewek Bumi (Earth Tone)', 'Beige cardigan, brown trousers, aesthetic earth tone outfit'),
    createOption('😎 Streetwear / Oversized (Gen Z)', 'Oversized graphic tee, cargo pants, cool street style'),
    createOption('💼 Smart Casual (Ngantor)', 'Blazer over t-shirt, smart casual office look'),
    createOption('🏋️ Sporty / Gym Set', 'Yoga set or gym activewear'),
    createOption('🧕 Hijab Casual (Modern)', 'Modern hijab style, loose tunic, pastel colors'),
    createOption('⚫ All Black (Mamba)', 'All black outfit, leather jacket, edgy look'),
    createOption('✏️ Kustom (Tulis Sendiri)', 'Custom')
];

export const UGC_ENVIRONMENT_VIBES = [
    createOption('📸 Gen Z Flash (Kamar Gelap)', 'Dark room, shot with direct camera flash, hard shadows, chaotic energy'),
    createOption('☀️ Golden Hour (Jendela Kamar)', 'Bedroom window, natural golden hour sunlight hitting the face, aesthetic shadows'),
    createOption('🛌 Messy Bedroom (Relatable)', 'Messy unmade bed in background, clothes on chair, authentic lived-in bedroom'),
    createOption('🚗 Car Interior (Vlog Mobil)', 'Inside a car, daytime, dashboard visible, authentic car vlog angle'),
    createOption('🧼 Bathroom Mirror (Kamar Mandi)', 'Clean bathroom mirror selfie, tiles background, bright white lighting'),
    createOption('🌿 Outdoor / Taman (Segar)', 'Outdoor park, greenery blurred background, natural daylight'),
    createOption('🏠 Ruang Tamu (Keluarga)', 'Cozy living room, warm lamp lighting, comfortable sofa background'),
    createOption('💡 Neon Gaming (Cyberpunk)', 'Dark room with purple/blue neon led lights background'),
    createOption('✏️ Kustom (Tulis Sendiri)', 'Custom')
];

// --- UGC CAROUSEL CONSTANTS ---
export const CAROUSEL_VIBES = [
    createOption('📸 Raw / Authentic (Messy Room, Flash)', 'Raw / Authentic (Messy Room, Flash)'),
    createOption('✨ Clean / Aesthetic (Minimalist)', 'Clean / Aesthetic (Minimalist)'),
    createOption('🔥 Chaos / Review Jujur (High Contrast)', 'Chaos / Review Jujur (High Contrast)')
];

export const CAROUSEL_HOOKS = [
    createOption('⛔ "Jangan Beli Ini..." (Negative)', 'Negative Hook (Stop Scroll)'),
    createOption('🤫 "Nyesel Baru Tau..." (Gatekeeping)', 'Gatekeeping Hook (Curiosity)'),
    createOption('📉 "Harganya Anjlok!" (Promo)', 'Price Drop Hook (Urgency)'),
    createOption('🆚 "Mahal vs Murah" (Dupe)', 'Comparison Hook (Value)'),
    createOption('🤡 "Korban Iklan..." (Relatable)', 'Victim Hook (Relatable Story)')
];

// STORYSELLING CONSTANTS
export const STORYSELLING_FRAMEWORKS = [
    createOption('🦸 Perjalanan Pahlawan (Struggle -> Sukses)', '🦸 The Hero\'s Journey (Struggle -> Guide -> Victory)'),
    createOption('🤫 Penemuan Rahasia', '🤫 The Secret Discovery (Gatekeeping -> Reveal)'),
    createOption('🥊 Kita vs Mereka (Cara Lama vs Baru)', '🥊 Us vs Them (Old Way vs New Way)'),
    createOption('💭 "Bayangkan Jika..." (Mimpi)', '💭 The "Imagine If" (Dream State Visualization)'),
    createOption('📉 Bangkit dari Keterpurukan', '📉 From Rock Bottom (Vulnerable Comeback)')
];

export const STORYSELLING_HOOKS = [
    createOption('💔 Curhat Emosional ("Aku hampir nyerah...")', '💔 Emotional Vulnerability ("Aku hampir nyerah...")'),
    createOption('🛑 Larangan Keras ("Stop lakukan ini...")', '🛑 Counter-Intuitive ("Stop lakukan ini...")'),
    createOption('🤔 Bikin Penasaran ("Ada satu hal...")', '🤔 Curiosity Gap ("Ada satu hal yang orang gak tau...")'),
    createOption('😡 Musuh Bersama ("Aku benci banget...")', '😡 Common Enemy ("Aku benci banget sama...")'),
    createOption('✨ Kepuasan Visual (ASMR)', '✨ Aesthetic Satisfaction (Visual ASMR)')
];

export const STORY_MOOD = [
    createOption('😢 Sedih ke Bahagia (Healing)', '😢 Melancholic to Happy (Healing)'),
    createOption('🔥 Semangat Tinggi / Motivasi', '🔥 High Energy / Motivasi'),
    createOption('😨 Tegang / Thriller', '😨 Suspense / Thriller'),
    createOption('🧘 Tenang & Merenung', '🧘 Calm & Contemplative'),
    createOption('😂 Humoris / Lucu', '😂 Humorous / Self-Deprecating')
];

export const STORY_SETTINGS = [
    createOption('🏠 Kamar Tidur Nyaman (Hujan)', '🏠 Cozy Bedroom (Rainy)'),
    createOption('🏢 Kantor Sibuk / Chaos', '🏢 Busy Office / Chaos'),
    createOption('🌅 Atap Gedung Sunset', '🌅 Sunset Rooftop / Reflective'),
    createOption('🚗 Interior Mobil (Curhat)', '🚗 Car Interior (Confession)'),
    createOption('🌳 Taman Alam (Bebas)', '🌳 Nature / Park (Freedom)'),
    createOption('☕ Kafe Estetik', '☕ Aesthetic Cafe'),
    createOption('🛋️ Ruang Keluarga', '🛋️ Living Room (Family)')
];

// Fashion Studio Constants
export const FASHION_BODY_TYPES = [
    createOption('Langsing / Petite', 'Slim / Petite'),
    createOption('Atletis / Fit', 'Athletic / Fit'),
    createOption('Standar', 'Standard'),
    createOption('Berisi / Curvy', 'Curvy'),
    createOption('Plus Size', 'Plus Size')
];

export const FASHION_GARMENT_TYPES = [
    createOption('Atasan (Top)', 'Top (Atasan)'),
    createOption('Bawahan (Bottom)', 'Bottom (Bawahan)'),
    createOption('Luaran (Outerwear)', 'Outerwear (Luaran)'),
    createOption('Terusan (Dress)', 'Dress (Terusan)'),
    createOption('Sepatu (Footwear)', 'Footwear (Sepatu)'),
    createOption('Aksesoris (Tas/Topi)', 'Accessory (Tas/Topi)')
];

export const FASHION_POSE_PRESETS = [
    createOption('Katalog Depan (Standar)', 'Catalog Front (Standar)'),
    createOption('Berjalan (Street Style)', 'Walking (Street Style)'),
    createOption('Duduk Santai', 'Sitting (Santai)'),
    createOption('Bersandar', 'Leaning (Sandaran)'),
    createOption('Tampak Belakang', 'Back View (Belakang)'),
    createOption('Dinamis / Aksi', 'Dynamic / Action')
];

export const FASHION_FRAMING = [
    createOption('Seluruh Badan (Full Body)', 'Full Body'),
    createOption('Lutut ke Atas', 'Knee Up (Lutut ke Atas)'),
    createOption('Pinggang ke Atas', 'Waist Up (Pinggang ke Atas)'),
    createOption('Close Up (Detail)', 'Close Up (Detail)')
];

export const FASHION_CLOTHING_FITS = [
    createOption('Regular Fit', 'Regular Fit'),
    createOption('Oversized / Baggy', 'Oversized / Baggy'),
    createOption('Ketat / Slim Fit', 'Tight / Slim Fit')
];

export const FASHION_TUCK_STYLES = [
    createOption('Dikeluarkan (Untucked)', 'Untucked (Keluar)'),
    createOption('Dimasukkan (Tucked In)', 'Tucked In (Masuk)'),
    createOption('Sebagian (French Tuck)', 'French Tuck (Sebagian)')
];

export const FASHION_LOCATIONS = [
    createOption('Studio Polos (White)', 'Studio Polos (White Cyclorama)'),
    createOption('Jalanan Kota (Street)', 'Jalanan Kota (Street Style)'),
    createOption('Taman / Alam', 'Taman / Alam (Nature)'),
    createOption('Pantai / Resort', 'Pantai / Resort'),
    createOption('Kafe Indoor', 'Cafe / Indoor Aesthetic'),
    createOption('Runway Fashion Show', 'Runway / Fashion Show')
];

export const FASHION_CINEMATIC_MOVES = [
    createOption('Jalan Slow Motion', 'Slow Motion Walk'),
    createOption('Putaran 360 Derajat', '360 Spin / Twirl'),
    createOption('Detail Kain (Macro)', 'Fabric Detail (Macro Pan)'),
    createOption('Kibas Rambut / Dinamis', 'Hair Flip / Dynamic'),
    createOption('Berjalan Percaya Diri', 'Confident Approach')
];

// FnB Studio Constants
export const FNB_PRODUCT_CATEGORIES = [
    createOption('🍔 Makanan (Food)', '🍔 Makanan (Food)'),
    createOption('🥤 Minuman (Drink)', '🥤 Minuman (Drink)'),
    createOption('🍿 Cemilan (Snack)', '🍿 Cemilan (Snack)')
];

export const FNB_SCENE_COUNTS = [
    createOption('3 Scene (Teaser)', '3 Scenes (Teaser)'),
    createOption('5 Scene (Standar)', '5 Scenes (Standard)'),
    createOption('7 Scene (Vlog)', '7 Scenes (Vlog)')
];

export const FNB_TEMPERATURES = [
    createOption('🔥 Panas Berasap', '🔥 Steamy / Hot'),
    createOption('❄️ Dingin / Es', '❄️ Frosty / Icy'),
    createOption('🌡️ Suhu Ruangan', '🌡️ Room Temp'),
    createOption('💨 Asap Bakaran', '💨 Smoky / Grilled')
];

export const FNB_TEXTURES = [
    createOption('Renyah (Crunchy)', 'Crunchy / Crispy'),
    createOption('Lumer / Creamy', 'Creamy / Gooey'),
    createOption('Berminyak / Juicy', 'Juicy / Greasy'),
    createOption('Lembut / Fluffy', 'Fluffy / Airy'),
    createOption('Halus / Silky', 'Smooth / Silky'),
    createOption('Segar / Mentah', 'Fresh / Raw')
];

export const FNB_STRATEGIES = [
    createOption('🍔 Mukbang / Makan Besar', '🍔 Mukbang / Big Appetite'),
    createOption('✨ Vlog Kafe Estetik', '✨ Aesthetic Cafe Vlog'),
    createOption('🌶️ ASMR (Suara Makan)', '🌶️ ASMR / Sensory Focus'),
    createOption('🍳 Resep / Dibalik Layar', '🍳 Recipe / Behind The Scenes'),
    createOption('🤫 Hidden Gem / Kaki Lima', '🤫 Hidden Gem / Street Food')
];

export const FNB_PERSONAS = [
    createOption('Wajah "Eargasm" (Nikmat)', 'The "Eargasm" Face'),
    createOption('Gigitan Besar', 'The Big Bite'),
    createOption('Anggukan Setuju', 'The "Nod of Approval"'),
    createOption('Mencium Aroma', 'The "Scent" Sniffer'),
    createOption('Pemakan Santai', 'Casual Eater')
];

export const FNB_SCRIPT_DENSITIES = [
    createOption('⚡ Singkat & Padat', '⚡ Bite-Sized (Short)'),
    createOption('⚖️ Seimbang (Medium)', '⚖️ Balanced (Medium)'),
    createOption('📖 Bercerita Penuh', '📖 Deep Storytelling (Full)')
];

export const FNB_ENVIRONMENTS = [
    createOption('Piknik Outdoor', 'Picnic / Outdoor'),
    createOption('Studio Gelap', 'Dark Studio'),
    createOption('Kafe Cerah', 'Sunny Cafe'),
    createOption('Dapur Rumah', 'Kitchen Counter'),
    createOption('Restoran Mewah', 'Luxury Dining'),
    createOption('Warung / Kaki Lima', 'Street Food Stall')
];

export const FNB_MOTION_FOCUS = [
    createOption('Tarikan Keju (Cheese Pull)', 'Cheese Pull'),
    createOption('Tuang Slow Motion', 'Slow Mo Pour'),
    createOption('Cipratan Segar', 'Explosive Splash'),
    createOption('Uap Panas Naik', 'Steam Rising'),
    createOption('Mendesis (Sizzle)', 'Sizzle / Sear'),
    createOption('Diam Terpata (Static)', 'Static / Plated')
];

export const FNB_PLATING_STYLES = [
    createOption('Berantakan (Street Food)', 'Messy / Street Food'),
    createOption('Bersih Minimalis', 'Clean / Minimalist'),
    createOption('Fine Dining / Artistik', 'Fine Dining / Artistic'),
    createOption('Rumahan (Rustic)', 'Rustic / Homestyle')
];

// Product In Room Constants
export const PRODUCT_PLACEMENTS = [
    createOption('Di Atas Meja', 'Table Top'),
    createOption('Di Lantai (Berdiri)', 'Floor Standing'),
    createOption('Tempel Dinding', 'Wall Mounted'),
    createOption('Gantung Langit-langit', 'Ceiling'),
    createOption('Permukaan Bertekstur (Kasur/Karpet)', 'Textured Surface (Rug/Bed)')
];

export const ROOM_TYPES = [
    createOption('Ruang Tamu', 'Living Room'),
    createOption('Kamar Tidur', 'Bedroom'),
    createOption('Dapur', 'Kitchen'),
    createOption('Ruang Makan', 'Dining Room'),
    createOption('Kantor Rumah', 'Home Office'),
    createOption('Kamar Mandi', 'Bathroom'),
    createOption('Teras / Outdoor', 'Outdoor / Patio'),
    createOption('Toko Ritel', 'Retail Store'),
    createOption('Garasi', 'Garage')
];

export const INTERIOR_STYLES = [
    createOption('Minimalis', 'Minimalist'),
    createOption('Industrial Modern', 'Modern Industrial'),
    createOption('Scandinavian (Japandi)', 'Scandinavian (Japandi)'),
    createOption('Mewah Klasik', 'Luxury Classic'),
    createOption('Bohemian', 'Bohemian'),
    createOption('Cyberpunk / Neon', 'Cyberpunk / Neon'),
    createOption('Rustic / Vintage', 'Rustic / Vintage'),
    createOption('Mid-Century Modern', 'Mid-Century Modern'),
    createOption('Tropis / Pantai', 'Coastal / Hamptons'),
    createOption('Farmhouse', 'Farmhouse'),
    createOption('Art Deco', 'Art Deco'),
    createOption('Zen / Asia', 'Zen / Asian'),
    createOption('Glamour', 'Glamour / Luxury'),
    createOption('Kustom (Tulis Sendiri)', 'Custom')
];

// Room Selling Angles
export const ROOM_SELLING_ANGLES = [
    createOption('Hardselling', 'Hardselling'),
    createOption('Softselling', 'Softselling'),
    createOption('Solusi Masalah', 'Pain Solution'),
    createOption('Manfaat Masa Depan', 'Future Benefit')
];

// Gemini Voices
export const GEMINI_VOICES = [
    { label: 'Puck (Pria - Berat & Bercerita)', value: 'Puck' },
    { label: 'Charon (Pria - Berwibawa)', value: 'Charon' },
    { label: 'Kore (Wanita - Tenang)', value: 'Kore' },
    { label: 'Fenrir (Pria - Bersemangat)', value: 'Fenrir' },
    { label: 'Zephyr (Wanita - Ramah)', value: 'Zephyr' }
];

// Unboxing Constants
export const PACKAGING_TYPES = [
    createOption('Kardus Coklat Polos', 'Brown Cardboard Box'),
    createOption('Polymailer / Plastik', 'Polymailer / Plastik'),
    createOption('Kotak Kado Mewah', 'Luxury Gift Box'),
    createOption('Peti Kayu', 'Wooden Crate'),
    createOption('Bubble Wrap Saja', 'Bubble Wrap Only')
];
export const UNBOXING_MOODS = [
    createOption('ASMR / Hening', 'ASMR / Silent'),
    createOption('Hype / Bersemangat', 'Hype / Excited'),
    createOption('Estetik / Lambat', 'Aesthetic / Slow')
];
export const UNBOXING_SCRIPT_PACES = [
    createOption('⚡ Cepat (TikTok Style)', '⚡ Snappy (Fast / TikTok)'),
    createOption('⚖️ Seimbang (Standar)', '⚖️ Balanced (Standard)'),
    createOption('🤫 ASMR / Minimalis', '🤫 ASMR / Minimalist')
];
export const UNBOXING_OUTFIT_STYLES = [
    createOption('Sesuai Foto Model (Auto)', 'Match Model Photo (Auto-Detect)'),
    createOption('Santai Rumahan (Piyama)', 'Cozy / Home (Loungewear)'),
    createOption('Kasual Rapi (Kaos Putih)', 'Casual Chic (White Tee & Jeans)'),
    createOption('Fashion / Trendy', 'Fashion / Trendy (Stylish)')
];
export const UNBOXING_FLOW_LENGTHS = [
    createOption('Pendek (3 Scene)', 'Short (3 Scenes)'),
    createOption('Sedang (5 Scene)', 'Medium (5 Scenes)'),
    createOption('Panjang (7 Scene)', 'Long (7 Scenes)')
];
export const UNBOXING_PRODUCT_SIZES = [
    createOption('Kecil (Cincin/Lipstik)', 'Tiny (Ring/Lipstick)'),
    createOption('Genggaman (HP/Skincare)', 'Handheld (Phone/Skincare)'),
    createOption('Besar (Laptop/Tas)', 'Large (Laptop/Bag)'),
    createOption('Sangat Besar (Furnitur)', 'Furniture/Boxy')
];
export const UNBOXING_CLOSING_STRATEGIES = [
    createOption('Tidak Ada', 'None'),
    createOption('Ajakan Halus (Tunjuk Bawah)', 'Soft Invitation (Point Down)'),
    createOption('Jualan Keras (Dorong Produk)', 'Hard Selling (Push Product)'),
    createOption('Puas (Jempol)', 'Satisfaction (Thumbs Up)')
];

// AI Pose Generator Constants
export const POSE_THEMES = [
    { id: 'Minimalist & Japandi', label: 'Minimalis', icon: SparklesIcon, color: 'text-gray-500' },
    { id: 'Street & Urban', label: 'Jalanan', icon: BuildingOfficeIcon, color: 'text-orange-500' },
    { id: 'Nature & Outdoor', label: 'Alam', icon: LeafIcon, color: 'text-green-500' },
    { id: 'Luxury & Elegant', label: 'Mewah', icon: SparklesIcon, color: 'text-purple-500' },
    { id: 'Studio & Solid', label: 'Studio', icon: CameraIcon, color: 'text-blue-500' },
    { id: 'Neon & Cyberpunk', label: 'Neon', icon: SparklesIcon, color: 'text-pink-500' },
    { id: 'Beach & Tropical', label: 'Pantai', icon: SunIcon, color: 'text-yellow-500' },
    { id: 'Cafe & Lifestyle', label: 'Kafe', icon: CoffeeIcon, color: 'text-brown-500' }
];

// Vibe Match Constants
export const VIBE_MATCH_SHOT_TYPES = [
    createOption('Fokus Wajah (Portrait)', 'Face Focus (Portrait)'),
    createOption('Setengah Badan', 'Half Body (Waist Up)'),
    createOption('Seluruh Badan (OOTD)', 'Full Body (OOTD)')
];

export const VIBE_MATCH_GARMENT_OPTIONS = [
    createOption('Bebas (AI Tentukan)', 'No Preference (AI Decides)'),
    createOption('Gaun / Terusan', 'Dress / Gown (Terusan)'),
    createOption('Jas / Formal', 'Suit / Blazer (Formal)'),
    createOption('Kaos & Jeans', 'T-Shirt & Jeans (Casual)'),
    createOption('Hoodie / Sporty', 'Hoodie / Sportswear (Athleisure)'),
    createOption('Sopan / Hijab Friendly', 'Modest / Hijab Friendly'),
    createOption('Rok & Atasan', 'Skirt & Top (Feminine)'),
    createOption('Celana Pendek / Musim Panas', 'Shorts / Summer Wear'),
    createOption('Jaket Kulit / Edgy', 'Leather Jacket / Edgy'),
    createOption('Rajut / Cozy', 'Knitwear / Cozy')
];

// One Shot Video
export const ONE_SHOT_MODES = [
    createOption('Mode Reviewer (Vlog)', 'Mode Reviewer (Vlog)'),
    createOption('Mode Sinematik (B-Roll)', 'Mode Sinematik (B-Roll)')
];
export const ONE_SHOT_PLATFORMS = [
    createOption('TikTok', 'TikTok'),
    createOption('Shopee Video', 'Shopee Video'),
    createOption('Instagram Reels', 'Instagram Reels')
];
export const ONE_SHOT_CTA_OPTIONS = [
    createOption('Jualan Langsung (Hard Sell)', 'Jualan Langsung (Hard Sell)'),
    createOption('Pancing Komentar (Engagement)', 'Pancing Komentar (Engagement)'),
    createOption('Cek Bio/Profil (Traffic)', 'Cek Bio/Profil (Traffic)')
];
export const ONE_SHOT_CAMERA_MOTIONS = [
    createOption('🎥 Zoom Dinamis', '🎥 Dynamic Zoom'),
    createOption('➡️ Geser Kanan (Pan)', '➡️ Pan Right'),
    createOption('⬅️ Geser Kiri (Pan)', '⬅️ Pan Left'),
    createOption('🔄 Memutar (Orbit)', '🔄 Orbit / Spin'),
    createOption('🫨 Goyang (Handheld)', '🫨 Handheld / Shake'),
    createOption('✨ Diam (Statik)', '✨ Static / Clean')
];
export const ONE_SHOT_BACKGROUND_VIBES = [
    createOption('AI Tentukan Sendiri', 'AI Decides'),
    createOption('Studio Polos (Bersih)', 'Studio Polos (Clean)'),
    createOption('Ruang Tamu Mewah', 'Luxury Living Room'),
    createOption('Alam Terbuka', 'Outdoor Nature'),
    createOption('Neon Cyberpunk', 'Neon Cyberpunk'),
    createOption('Kafe Estetik', 'Cafe Aesthetic')
];

// --- FASHION REEL (AFFILIATE EDITION) ---
export const FASHION_SHOWCASE_MODES = [
    createOption('🔍 Honest Review (Jujur)', 'Honest Review / Fit Check'),
    createOption('⚡ Try-On Haul (Cepat)', 'Fast Try-On Haul'),
    createOption('✨ Aesthetic Vlog (Silent)', 'Silent Aesthetic Vlog'),
    createOption('🔎 Detail & Texture (Macro)', 'Fabric Detail & Texture Focus')
];

export const FASHION_ENVIRONMENTS = [
    createOption('🏠 Kamar Kos Aesthetic', 'Aesthetic Bedroom (Mirror Selfie)'),
    createOption('🏢 Studio Polos (Katalog)', 'Clean Studio White'),
    createOption('🌳 Taman Outdoor', 'Natural Outdoor Park'),
    createOption('🛍️ Fitting Room Mall', 'Mall Fitting Room'),
    createOption('☕ Cafe Indoor', 'Indoor Cafe')
];

export const FASHION_LIGHTING_REALITY = [
    createOption('☀️ Sinar Matahari (True Color)', 'Natural Daylight (True Color)'),
    createOption('💡 Lampu Kamar (Soft)', 'Indoor Soft Lighting'),
    createOption('🔦 Flash (Pesta/Malam)', 'Flash Photography (Night/Party)'),
    createOption('🏢 Lampu Toko (Terang)', 'Bright Retail Lighting')
];

export const FASHION_KEY_FEATURES = [
    createOption('👗 Flowy / Jatuhnya Kain', 'Show Fabric Flow & Movement'),
    createOption('⏳ Slimming / Fit Badan', 'Show Slimming Effect & Waist Fit'),
    createOption('🧶 Tekstur & Bahan', 'Show Fabric Texture (Zoom)'),
    createOption('👖 Styling (Dimasukkan/Keluar)', 'Show Styling Versatility (Tuck/Untuck)')
];

export const FASHION_HOOKS = [
    createOption('⛔ "Jangan Beli Kalau..."', 'Negative Hook: "Jangan beli ini kalau..."'),
    createOption('🤩 "Akhirnya Nemu!"', 'Excitement Hook: "Akhirnya nemu yang pas!"'),
    createOption('📉 "Harganya Anjlok!"', 'Price Hook: "Harganya lagi turun banget!"'),
    createOption('🆚 "Mahal vs Murah"', 'Comparison Hook: "Kualitas jutaan harga ribuan"')
];

export const FASHION_FIDELITY_MODES = [
    createOption('🎨 Standard (Creative Flow)', 'standard'),
    createOption('🔒 High Fidelity (Strict Texture Lock)', 'high_fidelity'),
];


// --- MIRROR SELFIE STUDIO ---
export const MIRROR_SELFIE_POSES = [
    createOption('Berdiri Lurus (Full Body)', 'standing straight, mirror reflection, full body visible'),
    createOption('Condong Samping (Leaning)', 'leaning side, checking product in mirror, casual pose'),
    createOption('Tangan di Saku (Santai)', 'one hand in pocket, mirror selfie, relaxed confident pose'),
    createOption('Miring 3/4 (3/4 Turn)', '3/4 turn mirror reflection, showing side profile'),
    createOption('Full Body OOTD', 'full-body mirror selfie, outfit of the day pose'),
    createOption('Duduk Santai', 'sitting casually near mirror, relaxed aesthetic pose'),
    createOption('Angkat Produk (Show Off)', 'holding product up to mirror, showing off the item'),
];

export const MIRROR_SELFIE_BACKGROUNDS = [
    createOption('Kaca Lemari Kayu (Kamar Tidur)', 'Kaca Lemari Pakaian Kayu (Kamar Tidur)'),
    createOption('Kaca Toilet SPBU (Terang)', 'Kaca Toilet SPBU (Bersih & Terang)'),
    createOption('Kaca Fitting Room (Retail)', 'Kaca Fitting Room Toko Retail Lokal'),
    createOption('Kaca Lift Kantor', 'Kaca Lift Kantor di Jakarta Selatan'),
    createOption('Kaca Wastafel Restoran', 'Kaca Wastafel Restoran (Nuansa Bambu/Kayu)'),
    createOption('Kaca Full Body Studio', 'Kaca Full Body di Studio Foto (Background Polos)'),
    createOption('Kaca Toilet Mall (Aesthetic)', 'Kaca Toilet Mall (Pencahayaan Aesthetic)'),
    createOption('Kaca Jendela Kafe (Sore)', 'Pantulan Kaca Jendela Kafe (Sore Hari)'),
    createOption('Kaca Rias Meja Tolet', 'Kaca Rias Meja Tolet (Ada Lampu Bohlam)'),
    createOption('Kaca Lobby Hotel (Mewah)', 'Kaca Lobby Hotel (Mewah & Megah)'),
    createOption('Cermin Gym / Fitness', 'Kaca besar di gym / studio fitness'),
    createOption('Cermin Koridor Apartemen', 'Kaca di koridor apartemen modern'),
];

export const MIRROR_SELFIE_ASPECTS = [
    createOption('Potret (9:16)', '9:16'),
    createOption('Kotak (1:1)', '1:1'),
    createOption('Foto (4:5)', '4:5'),
];

// --- VOICE OVER STUDIO ---
export const TTS_VOICES = [
    { id: 'Kore', name: '🎙️ Kore (Tegas & Profesional)' },
    { id: 'Aoede', name: '🌸 Aoede (Hangat & Feminin)' },
    { id: 'Charon', name: '🎭 Charon (Dramatis & Dalam)' },
    { id: 'Fenrir', name: '⚡ Fenrir (Energik & Dinamis)' },
    { id: 'Puck', name: '😊 Puck (Santai & Friendly)' },
];

export const TTS_TONES = [
    createOption('⚡ Energik', 'Energik'),
    createOption('😌 Santai', 'Santai'),
    createOption('💼 Profesional', 'Profesional'),
    createOption('🤗 Hangat', 'Hangat'),
    createOption('🎭 Dramatis', 'Dramatis'),
];

