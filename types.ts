
import type { ComponentType } from 'react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export type Language = 'ID' | 'EN' | 'MS' | 'TH' | 'VI';

export enum AppName {
  Home = "Home",
  HandOnProduct = "Hand-on Product Studio",
  BackgroundChanger = "Background Changer Studio",
  UGCReview = "UGC Photo Studio", 
  UGCCreator = "UGC Video Studio", 
  UGCCarousel = "UGC Carousel Studio", 
  Storyselling = "Storyselling Studio", 
  VibeMatch = "Vibe Match Stylist",
  OneShotVideo = "One-Shot Video Ad", 
  FashionReel = "Fashion Reel Studio", 
  Fashion = "Fashion Studio",
  FnB = "FnB Studio", 
  AIPose = "AI Pose Generator",
  ProductInRoom = "Product in Room Studio",
  CharacterLocking = "Character Locking Studio",
  SkincareStudio = "Skincare Studio Pro",
  ProblemSolver = "Problem-Solver Studio",
  Unboxing = "Unboxing Estetik Studio",
  Tutorial = "Tutorial & How-To Studio",
  DupeVsDupe = "Dupe vs Dupe Studio",
  DayInMyLife = "A Day in My Life Studio",
  Listicle = "Listicle / \"Racun\" Studio",
  MirrorSelfie = "Mirror Selfie Studio",
}

export interface MenuItem {
  name: AppName;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  group?: string; 
}

export type VideoMood = string; 

// --- SHARED CINEMATIC STRUCTURE (THE VEO BLUEPRINT) ---
export interface CinematicBlueprint {
    visual_direction: {
        subject_action: string;
        lighting_atmosphere: string;
        film_look: string;
        apparel_consistency?: string;
    };
    camera_direction: {
        movement: string;
        angle: string;
        focus: string;
        speed: string;
    };
    audio_direction: {
        voiceover_script: string;
        voice_emotion: string;
        sfx_cue: string;
    };
    technical_specs: {
        aspect_ratio: string;
        negative_prompt: string;
    };
}

// Hand-on Product Studio
export type HandSkinTone = 'Light' | 'Medium' | 'Dark';
export type HandGender = 'Female' | 'Male';
export type HandCount = '1 Hand' | '2 Hands';
export type LightingMode = string;
export type CameraAngle = string;
export type ShotDistance = string;

// Script
export type ScriptTone = string;
export type ScriptPlatform = string;

export interface ImageGenerationFormData {
  productName: string;
  productDescription: string;
  keyFeatures: string;
  adjectives: string;
  productImage: File | null;
  
  handSkinTone: HandSkinTone;
  handGender: HandGender;
  handCount: HandCount;
  lighting: LightingMode;
  cameraAngle: CameraAngle;
  shotDistance: ShotDistance;
  
  backgroundThemes: string[];
  backgroundReferenceImage?: File | null;
  imageCount: number;
  usePro?: boolean;
}

export interface ProductAnalysisResult {
    productName: string;
    productDescription: string;
    keyFeatures: string[];
    adjectives: string[];
    backgroundThemes: string[];
    suggestedCategory?: UGCCategory;
    suggestedShotType?: UGCCreatorShotType;
    suggestedShotTypeFull?: string;
    suggestedTargetAudience?: string;
    suggestedOutfits?: string[]; 
    suggestedEnvironments?: string[]; 
    
    painPoint?: string; 
    desiredState?: string; 
    
    usps?: string[];
    suggestedGreetings?: string[];
    suggestedHooks?: string[];

    // Skincare Specific
    texture?: string;
    ingredients?: string[];
}

export interface GeneratedImage {
    id: string;
    base64: string;
}

// UGC Review (Photo Studio)
export type UGCCategory = 'Fashion' | 'Skincare' | 'FNB' | 'Furniture' | 'Electronics';
export type UGCAspectRatio = '9:16' | '4:5' | '1:1';
export type UGCModelAge = string;

export interface UGCGeneratorFormData {
  productImages: (File | null)[];
  category: UGCCategory;
  style: string;
  aspectRatio: UGCAspectRatio;
  cameraAngle: string;
  location: string;
  colorTone: string;
  useModelReference: boolean;
  modelReferenceImage: File | null;
  modelGender: HandGender;
  modelEthnicity: string;
  modelAge: UGCModelAge;
  usePro?: boolean;
}

export interface UGCGeneratedResult {
  id: string;
  base64: string;
}

// UGC Creator (Video)
export type UGCCreatorShotType = string;
export type UGCContentStructure = string;
export type UGCScriptStyle = string;
export type UGCScriptDuration = string;
export type UGCSceneStrategy = string;

// Marketing Angle Type
export interface MarketingAngle {
    title: string; 
    description: string; 
    hook: string; 
}

export interface UGCAnalysisResult {
    productName: string;
    productDescription: string;
    targetAudience: string;
    marketingAngles: MarketingAngle[];
    usps: string[];
    suggestedOutfits?: string[]; 
    suggestedVibes?: string[]; 
}

// STORYSELLING SPECIFIC TYPES
export type StorysellingFramework = string;
export type StorysellingHook = string;
export type StoryMood = string;
export type StorySetting = string;

export interface UGCCreatorFormData {
    productImage: File | null;
    productName: string; 
    productDescription: string;
    modelImage: File | null;
    modelGender: HandGender;
    isHijabModel?: boolean; 
    modelOutfit: string; 
    category: UGCCategory;
    shotType: UGCCreatorShotType;
    targetAudience: string;
    
    backgroundMode: 'ai' | 'upload'; 
    customBackground: File | null; 
    environmentVibe: string; 

    scriptLanguage: string;
    contentStructure: UGCContentStructure | StorysellingFramework; 
    scriptStyle: UGCScriptStyle;
    scriptDuration: UGCScriptDuration;
    sceneStrategy: UGCSceneStrategy; 
    storyIdea?: string; 
    hookTemplate: string | StorysellingHook; 
    
    painPoint?: string; 
    desiredState?: string; 

    productContext?: string;
    usps?: string[];
    greeting?: string;

    usePro: boolean;
    projectName?: string; 
}

export interface StorysellingFormData {
    productImage: File | null;
    modelImage: File | null;
    productName: string;
    productDescription: string;

    modelGender: HandGender;
    isHijabModel: boolean;
    modelOutfit: string;
    storySetting: StorySetting;

    targetAudience: string;
    framework: StorysellingFramework;
    hookType: StorysellingHook;
    painPoint: string;
    desiredState: string;

    mood: StoryMood;
    language: string;
    duration: UGCScriptDuration;

    usePro: boolean;
    projectName: string;
}

// GLOBAL VISUAL SETTINGS (WORLD LOCK)
export interface GlobalVisualSettings {
    location_details: string; 
    lighting_anchor: string; 
}

export interface UGCScene extends CinematicBlueprint {
    id: string; 
    sceneNumber: number;
    type: string; 
    visualKeyframe?: string; 
    suggestedCut?: string; 
}

// --- SKINCARE STUDIO SPECIFIC ---
export type SkincareModeType = 'PROBLEM_SOLUTION' | 'HONEST_REVIEW' | 'BATTLE' | 'EDUCATIONAL' | 'AESTHETIC_ASMR' | 'PRO_COMMERCIAL';

export interface SkincareFormData {
    mode: SkincareModeType;
    productImage: File | null;
    productImageB: File | null; // For Battle Mode
    modelImage: File | null;
    
    productName: string;
    productNameB: string;
    
    skinType: string;
    targetProblem: string;
    
    location: string;
    backgroundMode: 'ai' | 'upload';
    customBackground: File | null;
    
    framing: string;
    language: string;
    usePro: boolean;
    projectName: string;

    // Pro Features
    vocalPersona: string;
    wardrobe: string;
    hairStyle: string;
    sceneCount: 5 | 8;

    // Dynamic Fields
    comparisonFocus?: string; // BATTLE
    productPhysics?: string; // PRO_COMMERCIAL
    lightingMood?: string; // PRO_COMMERCIAL
    ingredientFocus?: string; // EDUCATIONAL
    mythToDebunk?: string; // EDUCATIONAL
    audioFocus?: string; // AESTHETIC_ASMR
    authenticityLevel?: string; // HONEST_REVIEW
    
    // Problem Solution Fields
    problemIntensity?: string;
    dreamStateGoal?: string;
    emotionalHook?: string;

    // AI Analysis Data
    detectedTexture?: string;
    detectedIngredients?: string[];
}

export interface SkincareScene extends UGCScene {
    overlay_suggestion: string;
    intonation_guide: string;
}

// --- UGC CAROUSEL STUDIO ---
export type CarouselVibe = string;
export type CarouselHook = string;
export type CarouselSlideCount = number;

export interface UGCCarouselFormData {
    productImage: File | null;
    productName: string;
    productDescription: string;
    
    slideCount: CarouselSlideCount;
    vibe: CarouselVibe;
    hookType: CarouselHook;
    targetAudience: string;
    language: string;
    
    modelImage: File | null; 
    
    usePro: boolean;
    projectName?: string;
}

export interface CarouselSlide {
    id: string;
    slideNumber: number;
    title: string; 
    caption: string; 
    visualPrompt: string; 
    imageBase64?: string;
}

export interface SocialMediaPack {
    title: string;
    caption: string;
    hashtags: string[];
}

// Fashion Studio PRO
export type FashionMode = 'lookbook' | 'ugc_host' | 'cinematic';
export type FashionModelBodyType = string;
export type FashionGarmentType = string;
export type FashionPosePreset = string;
export type FashionFraming = string;
export type FashionClothingFit = string;
export type FashionTuckStyle = string;
export type FashionCinematicMove = string;

export interface FashionGarmentSlot {
    id: string;
    file: File | null;
    type: FashionGarmentType;
    description?: string; 
    isAnalyzing?: boolean; 
}

export interface FashionStudioFormData {
  garments: FashionGarmentSlot[]; 
  
  useModelReference?: boolean;
  modelReferenceImage?: File | null;
  modelGender: HandGender;
  modelEthnicity: string;
  modelAge: UGCModelAge;
  modelBodyType: FashionModelBodyType;
  
  location: string;
  
  posePreset: FashionPosePreset;
  framing: FashionFraming;
  clothingFit: FashionClothingFit;
  tuckStyle: FashionTuckStyle;
  aspectRatio: UGCAspectRatio;

  contentStructure: UGCContentStructure; 
  scriptStyle: UGCScriptStyle;
  targetAudience: string;
  scriptLanguage: string;

  cinematicMove: FashionCinematicMove;
  cinematicMood: VideoMood;
  
  usePro?: boolean;
}

export interface FashionScene {
    id: string;
    sceneType: 'photo' | 'video_clip' | 'talking_head';
    description: string; 
    visualPrompt: string; 
    motionPrompt?: string; 
    voiceover?: string; 
    imageBase64?: string;
}

// AI Pose Generator
export interface PoseJob {
    name: string;
    prompt: string;
    cameraAngleName: string;
}

export interface PoseGenerationResult {
    id: string;
    base64: string;
    job: PoseJob;
    backgroundPrompt: string;
}

// Character Locking Studio 
export type CharacterArtStyle = string;

export interface CharacterLockingFormData {
    referenceImage: File | null;
    characterName: string;
    characterDescription: string;
    outfitDescription: string;
    artStyle: CharacterArtStyle;
    usePro: boolean;
}

// Product In Room Studio
export type ProductPlacement = string;
export type RoomType = string;
export type InteriorStyle = string;

export interface ProductInRoomFormData {
    productImage: File | null;
    productName: string;
    productDescription: string;
    placement: ProductPlacement;
    roomType: RoomType;
    interiorStyle: InteriorStyle;
    customInteriorStyle: string; 
    lighting: LightingMode;
    backgroundMode: 'ai' | 'upload';
    backgroundReferenceImage: File | null;
    sceneCount: number; 
    usePro: boolean;
}

export interface CinematicShot {
    id: string;
    angleName: string; 
    imageBase64: string;
    motionPrompt: string; 
}

export type RoomSellingAngle = string;

export interface RoomScriptData {
    sellingAngle: RoomSellingAngle;
    targetPersona: string;
    scriptStyle: UGCScriptStyle;
    scriptTone: ScriptTone;
    language: Language;
}

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface SceneScriptItem {
    id: string;
    sceneNumber: number;
    visualDescription: string;
    voiceoverText: string; 
    audioBase64?: string; 
    isLoadingAudio?: boolean;
}

// --- UNBOXING AESTHETIC STUDIO ---
export type PackagingType = string;
export type UnboxingMood = string;
export type UnboxingScriptPace = string;
export type UnboxingOutfitStyle = string;

export type UnboxingFlowLength = string;
export type UnboxingProductSize = string;
export type UnboxingClosingStrategy = string;

export interface UnboxingFormData {
    productImage: File | null;
    modelImage?: File | null; 
    productName: string;
    productDescription: string;
    packagingType: PackagingType;
    mood: UnboxingMood;
    handSkinTone: HandSkinTone;
    handGender: HandGender;
    backgroundVibe: string;
    scriptPace: UnboxingScriptPace;
    outfitStyle: UnboxingOutfitStyle; 
    
    flowLength: UnboxingFlowLength;
    productSize: UnboxingProductSize;
    closingStrategy: UnboxingClosingStrategy; 

    language: Language;
    usePro: boolean;
    projectName?: string; 
}

export interface UnboxingScene extends CinematicBlueprint {
    id: string;
    sceneNumber: number;
    title: string;
    visualKeyframe?: string;
}

// --- FnB STUDIO ---
export type FnBTemperature = string;
export type FnBTexture = string;
export type FnBContentStrategy = string;
export type FnBModelPersona = string;
export type FnBScriptDensity = string;
export type FnBProductCategory = string;
export type FnBSceneCount = string;

export type FnBEnvironment = string;
export type FnBMotionFocus = string;
export type FnBPlatingStyle = string;

export interface FnBFormData {
    productImage: File | null;
    modelImage?: File | null; 
    modelGender: HandGender; 
    productName: string; 
    productDescription: string;
    
    productCategory: FnBProductCategory; 
    temperature: FnBTemperature;
    texture: FnBTexture;
    platingStyle: FnBPlatingStyle; 
    
    environment: FnBEnvironment; 
    lighting: LightingMode;
    
    sceneCount: FnBSceneCount; 
    strategy: FnBContentStrategy;
    modelPersona: FnBModelPersona;
    motionFocus: FnBMotionFocus; 
    
    scriptLanguage: string;
    scriptDensity: FnBScriptDensity; 
    usePro: boolean;
    projectName?: string; 
}

export interface FnBScene extends CinematicBlueprint {
    id: string;
    sceneNumber: number;
    title: string;
    visualKeyframe?: string;
}

// --- VIBE MATCH STYLIST ---
export type VibeMatchShotType = string;
export type VibeMatchProductVisibility = string;

export interface VibeMatchFormData {
    productImage: File | null;
    modelImage: File | null;
    modelGender: HandGender;
    shotType: VibeMatchShotType;
    productVisibility: VibeMatchProductVisibility;
    selectedColor: string; 
    detectedVibe?: string; 
    detectedMaterial?: string; 
    preferredGarment?: string; 
    customStyles: string[]; 
    usePro: boolean;
}

export interface VibeMatchPaletteItem {
    hex: string;
    name: string;
}

export interface VibeMatchResult {
    id: string;
    base64: string;
    styleCategory: string; 
    description: string; 
}

// --- ONE-SHOT VIDEO AD ---
export type OneShotMode = string;
export type OneShotPlatform = string;
export type OneShotCTA = string;
export type OneShotCameraMotion = string;
export type OneShotBackgroundVibe = string;

export interface OneShotFormData {
    productImage: File | null;
    modelImage?: File | null; 
    productName: string;
    productDescription: string;
    
    productContext?: string; 
    usps?: string[]; 
    greeting?: string; 
    hookTemplate?: string; 
    targetAudience: string;
    
    mode: OneShotMode;
    cameraMotion: OneShotCameraMotion; 
    backgroundVibe: OneShotBackgroundVibe;
    platform: OneShotPlatform;
    ctaStrategy: OneShotCTA;
    
    modelGender: HandGender; 
    sceneCount: 3 | 4 | 5;
    language: string;
    usePro: boolean;
    projectName?: string; 
}

export interface OneShotScene extends CinematicBlueprint {
    id: string;
    sceneNumber: number;
    title: string; 
    visualKeyframe?: string; 
}

// --- FASHION REEL STUDIO (AFFILIATE FOCUS) ---
export type FashionReelMode = string; 
export type FashionLighting = string; 
export type FashionKeyFeature = string; 
export type FashionHook = string; 
export type FashionEnvironment = string;

export interface FashionReelFormData {
    productImage: File | null;
    modelImage?: File | null; 
    productName: string;
    productDescription: string;
    
    showcaseMode: FashionReelMode;
    affiliateHook: FashionHook;
    gender: string; 
    targetAudience: string;
    language: string;
    sceneCount: 3 | 5 | 7;
    
    environment: FashionEnvironment; 
    backgroundMode: 'ai' | 'upload'; 
    customBackground: File | null; 
    lighting: FashionLighting;
    keyFeature: FashionKeyFeature;
    fidelityMode: 'standard' | 'high_fidelity'; 
    
    usps?: string[];
    
    usePro: boolean;
    projectName?: string; 
}

export interface FashionReelScene extends CinematicBlueprint {
    id: string;
    sceneNumber: number;
    title: string;
    visualKeyframe?: string;
}
