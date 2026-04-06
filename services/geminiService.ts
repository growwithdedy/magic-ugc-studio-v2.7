
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { 
    ImageGenerationFormData, ProductAnalysisResult, UGCGeneratorFormData, 
    FashionStudioFormData, FashionScene, PoseGenerationResult, 
    UGCCreatorFormData, UGCScene, SocialMediaPack, ProductInRoomFormData, 
    CinematicShot, RoomScriptData, SceneScriptItem, UnboxingFormData, 
    UnboxingScene, FnBFormData, FnBScene, VibeMatchFormData, VibeMatchResult,
    GeminiVoiceName, VibeMatchPaletteItem, OneShotFormData, OneShotScene,
    FashionReelFormData, FashionReelScene, StorysellingFormData,
    UGCCarouselFormData, CarouselSlide, UGCAnalysisResult, MarketingAngle,
    GlobalVisualSettings, CharacterLockingFormData, SkincareFormData, SkincareScene
} from '../types';
import { SKINCARE_VOCAL_PERSONAS } from '../constants';

// --- UTILITIES ---

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 2000,
    onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try { return await operation(); } 
        catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
                if (onRetry) onRetry(attempt, error);
                await delay(delayMs);
            }
        }
    }
    throw lastError;
};

const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            if (!base64Data) { reject(new Error("Failed to read file")); return; }
            resolve({ inlineData: { data: base64Data.split(',')[1], mimeType: file.type } });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const extractJSON = (text: string) => {
    try {
        let json: any = null;
        try { json = JSON.parse(text); } catch (e) {
            const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (jsonBlock) { try { json = JSON.parse(jsonBlock[1]); } catch (e2) { } } 
            else {
                const firstOpen = text.indexOf('{');
                const lastClose = text.lastIndexOf('}');
                if (firstOpen !== -1 && lastClose !== -1) { try { json = JSON.parse(text.substring(firstOpen, lastClose + 1)); } catch (e3) { } }
                else {
                    const firstOpenArr = text.indexOf('[');
                    const lastCloseArr = text.lastIndexOf(']');
                    if (firstOpenArr !== -1 && lastCloseArr !== -1) { try { json = JSON.parse(text.substring(firstOpenArr, lastCloseArr + 1)); } catch (e4) { } }
                }
            }
        }
        
        if (json && json.scenes && json.globalSettings) return json;
        if (json && !Array.isArray(json) && json.scenes && Array.isArray(json.scenes)) return json.scenes;
        if (json && !Array.isArray(json) && json.slides && Array.isArray(json.slides)) return json.slides;
        
        return json || {}; 
    } catch (e) { return {}; }
};

const ensureStringArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'number') return String(item);
        if (typeof item === 'object' && item !== null) {
            return item.value || item.label || item.text || item.content || item.name || item.title || item.description || JSON.stringify(item);
        }
        return String(item);
    });
};

const mapToCinematicScene = (s: any, i: number, typeOverride?: string) => ({
    id: (Date.now() + i).toString(),
    sceneNumber: s.sceneNumber || i + 1,
    type: typeOverride || s.type || 'Scene',
    suggestedCut: s.suggestedCut || '0s - 2.5s',
    visual_direction: {
        subject_action: s.visual_direction?.subject_action || 'Display Product',
        lighting_atmosphere: s.visual_direction?.lighting_atmosphere || 'Natural Light',
        film_look: s.visual_direction?.film_look || 'Standard',
        apparel_consistency: s.visual_direction?.apparel_consistency || ''
    },
    camera_direction: {
        movement: s.camera_direction?.movement || 'Static',
        angle: s.camera_direction?.angle || 'Eye Level',
        focus: s.camera_direction?.focus || 'Product',
        speed: s.camera_direction?.speed || 'Normal'
    },
    audio_direction: {
        voiceover_script: s.audio_direction?.voiceover_script || '',
        voice_emotion: s.audio_direction?.voice_emotion || 'Neutral',
        sfx_cue: s.audio_direction?.sfx_cue || ''
    },
    technical_specs: {
        aspect_ratio: s.technical_specs?.aspect_ratio || '9:16',
        negative_prompt: s.technical_specs?.negative_prompt || ''
    },
    overlay_suggestion: s.overlay_suggestion || '',
    intonation_guide: s.intonation_guide || ''
});

// --- SKINCARE STUDIO ---

export const analyzeSkincareProduct = async (file: File): Promise<ProductAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze this skincare product image for a professional studio.
    1. Product Name & Brand.
    2. Primary Category (e.g. Serum, Moisturizer, Cleanser).
    3. TEXTURE ANALYSIS: Detect texture (Gel, Cream, Liquid, Foam, Clay).
    4. INGREDIENTS: Extract key active ingredients.
    5. MARKETING: Suggest target audience and main benefit.
    
    Return JSON: { 
        productName, productDescription, suggestedCategory, 
        texture, ingredients: [], suggestedTargetAudience
    }`;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: 'application/json' } });
        const result = extractJSON(response.text || "{}");
        return {
            productName: result.productName || "Skincare Product",
            productDescription: result.productDescription || "",
            keyFeatures: [],
            adjectives: [],
            backgroundThemes: [],
            suggestedCategory: result.suggestedCategory || "Beauty",
            texture: result.texture || "Cream",
            ingredients: ensureStringArray(result.ingredients || []),
            suggestedTargetAudience: result.suggestedTargetAudience || "General"
        };
    } catch (e) { throw new Error("Skincare analysis failed"); }
};

export const generateSkincareStoryboard = async (formData: SkincareFormData): Promise<{scenes: SkincareScene[], globalSettings: GlobalVisualSettings}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if (formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if (formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    if (formData.productImageB) parts.push(await fileToGenerativePart(formData.productImageB));

    const isAsmr = formData.mode === 'AESTHETIC_ASMR';
    const personaObj = SKINCARE_VOCAL_PERSONAS.find(p => p.value === formData.vocalPersona);

    const prompt = `
    ROLE: Professional Beauty Content Director & Marketing Strategist.
    TASK: Create a scene-by-scene storyboard for a ${formData.mode} skincare video.
    
    DIRECTOR'S VOICE (VOCAL PERSONA):
    - Selected Persona: ${formData.vocalPersona}
    - Behavior: ${personaObj?.behavioralInstruction || 'Natural and helpful'}
    - Pace: ${personaObj?.pace || 'Medium'}
    - Language Complexity: ${personaObj?.complexity || 'Medium'}

    CONTEXT:
    - Main Product: ${formData.productName}
    - Competitor Product (if BATTLE): ${formData.productNameB}
    - Comparison Focus: ${formData.comparisonFocus}
    - Product Physics: ${formData.productPhysics}
    - Lighting Style: ${formData.lightingMood}
    - Audio Focus (ASMR): ${formData.audioFocus}
    - Skin Type: ${formData.skinType}
    - Concern: ${formData.targetProblem}
    - Problem Intensity: ${formData.problemIntensity}
    - Dream State Goal: ${formData.dreamStateGoal}
    - Emotional Hook Type: ${formData.emotionalHook}
    - Location: ${formData.location}
    - Texture: ${formData.detectedTexture}
    - Ingredients Highlight: ${formData.ingredientFocus || formData.detectedIngredients?.join(', ')}
    - Myth to Debunk: ${formData.mythToDebunk}
    - Authenticity: ${formData.authenticityLevel}
    - Language: ${formData.language}

    SCENE COUNT: EXACTLY ${formData.sceneCount} SCENES.

    STORYBOARD RULES:
    1. Scene 1: VIRAL HOOK. Must match the persona's style and the emotional hook: ${formData.emotionalHook}.
    2. Scene 3 DYNAMIC HERO SHOT:
       - PROBLEM_SOLUTION: Show the immediate effect of the product on a problem area with intensity ${formData.problemIntensity}, moving towards ${formData.dreamStateGoal}.
       - PRO_COMMERCIAL: Focus on ${formData.productPhysics}. Use macro shots of drips/ripples.
       - AESTHETIC_ASMR: Focus on ${formData.audioFocus}. SFX cues are mandatory.
       - BATTLE: Side-by-side comparison of texture or results.
    3. MODEL CONSISTENCY: Model wears ${formData.wardrobe} with ${formData.hairStyle}.
    4. NO MEDICAL CLAIMS. Use beauty-industry standard terminology.
    ${isAsmr ? "5. ASMR MODE: Keep voiceover script extremely minimal or silent. Focus 100% on SFX cues." : ""}

    OUTPUT JSON:
    {
      "globalSettings": { "location_details": "...", "lighting_anchor": "..." },
      "scenes": [
        {
          "sceneNumber": 1,
          "visual_direction": { "subject_action": "...", "lighting_atmosphere": "..." },
          "audio_direction": { "voiceover_script": "...", "voice_emotion": "...", "sfx_cue": "..." },
          "camera_direction": { "angle": "...", "movement": "..." },
          "overlay_suggestion": "...",
          "intonation_guide": "..."
        },
        ...
      ]
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: formData.usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
            contents: { parts: [...parts, { text: prompt }] },
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: formData.usePro ? { thinkingBudget: 32768 } : undefined
            }
        });
        const json = extractJSON(response.text || "{}");
        const list = Array.isArray(json.scenes) ? json.scenes : [];
        return {
            scenes: list.map((s: any, i: number) => mapToCinematicScene(s, i, formData.mode) as SkincareScene),
            globalSettings: json.globalSettings || { location_details: formData.location, lighting_anchor: formData.lightingMood || "Professional beauty lighting" }
        };
    } catch (e) { throw new Error("Storyboard generation failed"); }
};

export const generateSkincareKeyframe = async (formData: SkincareFormData, scene: SkincareScene, globalSettings?: GlobalVisualSettings): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if(formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    if(formData.productImageB) parts.push(await fileToGenerativePart(formData.productImageB));
    if(formData.backgroundMode === 'upload' && formData.customBackground) parts.push(await fileToGenerativePart(formData.customBackground));

    const personaObj = SKINCARE_VOCAL_PERSONAS.find(p => p.value === formData.vocalPersona);
    const visualPersonaPrompt = `Model ID Preservation: EXACT SAME PERSON as Image 2. Wardrobe: ${formData.wardrobe}. Hair: ${formData.hairStyle}. Expression: ${personaObj?.visual_cue || 'Neutral and pleasant'}.`;
    const physicsPrompt = formData.mode === 'PRO_COMMERCIAL' ? `Focus on ${formData.productPhysics} physical properties.` : "";
    const problemPrompt = formData.mode === 'PROBLEM_SOLUTION' ? `The skin area should show ${formData.targetProblem} with ${formData.problemIntensity} intensity, transforming to ${formData.dreamStateGoal}.` : "";

    const prompt = `
    Skincare Studio Keyframe. Aspect Ratio 9:16.
    SCENE ACTION: ${scene.visual_direction.subject_action}.
    ${visualPersonaPrompt}
    ${physicsPrompt}
    ${problemPrompt}
    ENVIRONMENT: ${globalSettings?.location_details || formData.location}.
    LIGHTING: ${globalSettings?.lighting_anchor || formData.lightingMood || "High-end soft beauty lighting"}.
    TEXTURE: ${formData.detectedTexture}.
    CAMERA: ${scene.camera_direction.angle}, ${scene.camera_direction.movement}.
    STYLE: Photorealistic, Cinematic Beauty TVC, 8K, Masterpiece.
    `;

    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

// ... (Other services unchanged)
export const analyzeProductImage = async (file: File): Promise<ProductAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze this product image as a Direct Response Copywriter.
    1. Physical: Name, Description, Key Features.
    2. Visual Context: Suggest 3 fashionable outfits & 7 distinct background settings.
    3. MARKETING PSYCHOLOGY:
       - "painPoint": Deep emotional frustration.
       - "desiredState": Emotional victory.
    4. USP EXTRACTION: Identify 5 Unique Selling Points.
    5. TARGET & GREETING: Identify audience and suggest greetings.
    6. HOOK IDEAS: Suggest 3 viral hooks.
    
    Return JSON: { 
        productName, productDescription, keyFeatures: [], adjectives: [], 
        backgroundThemes: [], suggestedCategory, suggestedShotType, 
        suggestedTargetAudience, suggestedOutfits: [], suggestedEnvironments: [],
        painPoint, desiredState,
        usps: ["USP 1", ...],
        suggestedGreetings: ["Sapaan 1", ...],
        suggestedHooks: ["Hook 1", ...]
    }`;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: 'application/json' } });
        const result = extractJSON(response.text || "{}");
        return {
            productName: result.productName || "Detected Product",
            productDescription: result.productDescription || "",
            keyFeatures: ensureStringArray(result.keyFeatures),
            adjectives: ensureStringArray(result.adjectives),
            backgroundThemes: ensureStringArray(result.backgroundThemes),
            suggestedCategory: result.suggestedCategory,
            suggestedShotType: result.suggestedShotType,
            suggestedTargetAudience: result.suggestedTargetAudience,
            suggestedOutfits: ensureStringArray(result.suggestedOutfits),
            suggestedEnvironments: ensureStringArray(result.suggestedEnvironments),
            painPoint: result.painPoint,
            desiredState: result.desiredState,
            usps: ensureStringArray(result.usps),
            suggestedGreetings: ensureStringArray(result.suggestedGreetings),
            suggestedHooks: ensureStringArray(result.suggestedHooks)
        };
    } catch (e) { console.error(e); throw new Error("Analysis failed"); }
};

export const generateCarouselPlan = async (formData: UGCCarouselFormData): Promise<CarouselSlide[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    ROLE: Viral Social Media Strategist.
    TASK: Create a ${formData.slideCount}-slide Instagram/TikTok Carousel plan for a product.
    PRODUCT: ${formData.productName}
    DESCRIPTION: ${formData.productDescription}
    TARGET AUDIENCE: ${formData.targetAudience}
    VIBE: ${formData.vibe}
    HOOK: ${formData.hookType}
    LANGUAGE: ${formData.language}
    REQUIREMENTS:
    - Return exactly ${formData.slideCount} slides.
    - Slide 1 must be the Hook (Stop Scroll).
    - Last Slide must be a CTA (Call to Action).
    - "visualPrompt": detailed description for an AI image generator (photorealistic).
    - "title": Short, punchy text overlay (max 5 words).
    - "caption": Engaging body text for the slide (max 15 words).
    OUTPUT FORMAT: JSON Array with keys: slideNumber, title, caption, visualPrompt.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(response.text || "[]");
        if (Array.isArray(json)) {
            return json.map((item: any, index: number) => ({
                id: Date.now().toString() + index,
                slideNumber: item.slideNumber || index + 1,
                title: item.title || "",
                caption: item.caption || "",
                visualPrompt: item.visualPrompt || `Product photo of ${formData.productName}`,
            }));
        }
        return [];
    } catch (e) {
        console.error("Carousel Plan Error", e);
        throw new Error("Failed to generate carousel plan.");
    }
};

export const generateCarouselSlideImage = async (formData: UGCCarouselFormData, slide: CarouselSlide): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if (formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if (formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    const prompt = `
    ROLE: Professional Product Photographer.
    TASK: Generate an image for Slide ${slide.slideNumber}.
    VISUAL PROMPT: ${slide.visualPrompt}
    STYLE: ${formData.vibe}
    PRODUCT CONTEXT: ${formData.productName}
    CONSTRAINTS: Aspect Ratio 9:16. Photorealistic 4K. NO TEXT ON IMAGE.
    `;
    const response = await ai.models.generateContent({
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: '9:16' } }
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generateCharacterSheet = async (formData: CharacterLockingFormData): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if (formData.referenceImage) parts.push(await fileToGenerativePart(formData.referenceImage));
    const prompt = `
    ROLE: Concept Artist. TASK: Create a Character Reference Sheet (12 panels).
    IDENTITY SOURCE: Use the face in image 1.
    DETAILS: ${formData.characterName}, ${formData.characterDescription}, ${formData.outfitDescription}.
    STYLE: ${formData.artStyle}.
    OUTPUT: Grid layout (4x3). High Res.
    `;
    const response = await ai.models.generateContent({
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: '4:3' } }
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generateCharacterPose = async (formData: CharacterLockingFormData, poseDescription: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if (formData.referenceImage) parts.push(await fileToGenerativePart(formData.referenceImage));
    const prompt = `
    ROLE: Concept Artist. TASK: Draw ONE specific panel.
    IDENTITY LOCK: Match face from image 1 EXACTLY.
    POSE: ${poseDescription}
    STYLE: ${formData.artStyle}, Background White.
    DETAILS: ${formData.characterName}, ${formData.characterDescription}, ${formData.outfitDescription}.
    `;
    const response = await ai.models.generateContent({
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: '1:1' } }
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generateProductImages = async (formData: ImageGenerationFormData): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const productPart = await fileToGenerativePart(formData.productImage!);
    let bgPart = null; if(formData.backgroundReferenceImage) bgPart = await fileToGenerativePart(formData.backgroundReferenceImage);
    const model = formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const parts: any[] = [productPart, { text: `Product Photography. ${formData.lighting}. ${formData.handCount} ${formData.handGender} hands (${formData.handSkinTone}). Setting: ${formData.backgroundThemes[0]}` }];
    if (bgPart) { parts.push(bgPart); parts.push({text: "Use as background style ref"}); }
    const response = await ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: '1:1' } } });
    return [response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || ""];
};

// --- HAND-ON PRODUCT STORYBOARD ---
export const generateHandOnProductStoryboard = async (
    productName: string,
    productDescription: string,
    handGender: string,
    handSkinTone: string,
    background: string,
    sceneCount: number,
    language: string
): Promise<any[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
    ROLE: POV Product Content Director & First-Person Video Strategist.
    TASK: Create a ${sceneCount}-scene storyboard for a POV Hand Product Review video (TikTok/Reels).
    
    CONTEXT:
    - Product: ${productName} (${productDescription})
    - Hand Model: ${handGender}, ${handSkinTone} skin tone
    - Setting: ${background}
    - Language: ${language}
    
    POV HAND REVIEW CREATIVE DIRECTION:
    Scene 1: HOOK — First-person unboxing or picking up the product. Camera is the viewer's eyes.
    Scene 2: EXPLORE — Hands rotating/examining the product, showing textures and details.
    Scene 3: HERO SHOT — The main interaction moment. Hands demonstrating the product's key feature.
    Scene 4 (if applicable): DETAIL — Ultra close-up of hands highlighting a specific feature or texture.
    Scene 5 (if applicable): CTA — Hands placing product down with satisfied gesture, or showing before/after.
    
    POV RULES:
    1. NO FACE visible — this is entirely first-person perspective
    2. iPhone 0.5x ultra-wide lens, looking DOWN at the scene
    3. Hands must be NATURALLY interacting with the product
    4. Keep it raw — like someone filming their own hands with their phone
    5. Product scale must be realistic relative to hands
    6. Voiceover should describe what hands are doing, casual tone
    
    OUTPUT JSON:
    {
      "scenes": [
        {
          "sceneNumber": 1,
          "visual_direction": {
            "subject_action": "Detailed description of hand interaction with product",
            "lighting_atmosphere": "Natural lighting description",
            "hand_action": "Specific hand movement/gesture"
          },
          "audio_direction": {
            "voiceover_script": "Casual voiceover in ${language}",
            "voice_emotion": "Curious/Excited/Impressed...",
            "sfx_cue": "Package rustling, product click, etc."
          },
          "camera_direction": {
            "movement": "Static/Slow pan down/Zoom in...",
            "angle": "First-person overhead/Side POV...",
            "focus": "Product detail/Hands interaction/Both"
          },
          "overlay_suggestion": "Text overlay suggestion"
        }
      ]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(response.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'POV Hand'));
    } catch (e) { throw new Error("POV storyboard generation failed"); }
};

export const generateHandOnProductKeyframe = async (
    productImage: File,
    productName: string,
    scene: any,
    handGender: string,
    handSkinTone: string,
    background: string,
    lighting: string,
    usePro: boolean
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [await fileToGenerativePart(productImage)];

    const prompt = `RAW IPHONE PHOTOGRAPHY: 100% authentic first-person POV photo. NO FACE visible. Camera is the viewer's eyes looking down.
PRODUCT CLONE: Product MUST be an exact replica of the reference image. Identical color, texture, branding, shape, scale.

STYLE: First-person POV. Camera is the user's eyes. NO FACES VISIBLE.
CAMERA: iPhone 0.5x ultra-wide lens, looking down at the scene.
HANDS: ${handGender} hands, ${handSkinTone} skin tone.
SCENE ACTION: ${scene.visual_direction?.subject_action || 'Hands interacting with product'}.
HAND ACTION: ${scene.visual_direction?.hand_action || 'Natural grip'}.
LIGHTING: ${lighting || scene.visual_direction?.lighting_atmosphere || 'Natural ambient'}.
SETTING: ${background}.
PRODUCT: ${productName} — correctly sized in environment.
CAMERA MOVEMENT: ${scene.camera_direction?.movement || 'Static overhead'}.

NEGATIVE PROMPT: Face, head, hair, eyes, mouth, professional studio, 3D render, text, overlay, watermark, CGI.`;

    const response = await ai.models.generateContent({
        model: usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE], 
            imageConfig: { aspectRatio: '9:16' } 
        }
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generateBackgroundVariations = async (file: File, count: number, pro: boolean) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const model = pro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({ model, contents: { parts: [part, {text: "Change background to something creative and viral."}] }, config: { responseModalities: [Modality.IMAGE] } });
    return [response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || ""];
};

export const analyzeProductVibe = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze product. Return JSON: { "palette": [{"hex": "#...", "name": "..."}], "vibe": "...", "material": "..." }`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: 'application/json' } });
        const res = extractJSON(response.text || "{}");
        return { palette: Array.isArray(res.palette) ? res.palette : [], vibe: res.vibe || "Modern", material: res.material || "Unknown" };
    } catch { return { palette: [], vibe: "Unknown", material: "Unknown" }; }
};

export const generateVibeMatchImages = async (formData: VibeMatchFormData, remixStyle?: {style: string, description: string}): Promise<VibeMatchResult[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if(formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    let targetStyles = remixStyle ? Array(4).fill(remixStyle) : (formData.customStyles.length > 0 ? formData.customStyles.map(s => ({style: "Custom", description: s})) : [{style: "Chic", description: "Trendy"}]);
    if(targetStyles.length === 1 && !remixStyle) targetStyles = Array(4).fill(targetStyles[0]);
    const results = await Promise.all(targetStyles.slice(0, 4).map(async (s: any, i: number) => {
        const prompt = `Fashion Photo. Style: ${s.style}. Color: ${formData.selectedColor}.`;
        const res = await ai.models.generateContent({ 
            model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
            contents: { parts: [...parts, { text: prompt }] }, 
            config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: '9:16' } } 
        });
        return { id: i.toString(), base64: res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "", styleCategory: s.style, description: s.description };
    }));
    return results.filter(r => r.base64);
};

export const generateCustomBackgroundThemes = async (prompt: string, count: number) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const finalPrompt = `Generate ${count} distinct, creative background theme descriptions based on this concept: "${prompt}". Return JSON: { "themes": ["theme1", "theme2", ...] }`;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: finalPrompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        return ensureStringArray(json.themes || []);
    } catch { return []; }
};

export const generateUGCVariations = async (data: UGCGeneratorFormData) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if(data.productImages[0]) parts.push(await fileToGenerativePart(data.productImages[0]));
    if(data.useModelReference && data.modelReferenceImage) parts.push(await fileToGenerativePart(data.modelReferenceImage));
    
    const prompt = `UGC Lifestyle Photo. Category: ${data.category}. Style: ${data.style}. Setting: ${data.location}. Model: ${data.modelGender}, ${data.modelAge}, ${data.modelEthnicity}. Photorealistic.`;
    
    const res = await ai.models.generateContent({ 
        model: data.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: data.aspectRatio } }
    });
    return [res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || ""];
};

export const analyzeFashionItem = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [part, { text: "Analyze this fashion item. Describe color, pattern, material, and type (e.g. Graphic Tee, Leather Jacket)." }] }
    });
    return res.text || "Analyzed Item";
};

export const generateFashionVariations = async (formData: FashionStudioFormData) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.garments[0]?.file) parts.push(await fileToGenerativePart(formData.garments[0].file));
    if(formData.useModelReference && formData.modelReferenceImage) parts.push(await fileToGenerativePart(formData.modelReferenceImage));
    
    const prompt = `Fashion Editorial Lookbook. 
    Garment: ${formData.garments[0].type}. 
    Model: ${formData.modelGender}, ${formData.modelEthnicity}.
    Location: ${formData.location}.
    Pose: ${formData.posePreset}.
    Framing: ${formData.framing}.
    High Fashion Photography.`;

    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: formData.aspectRatio} }
    });
    return [res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || ""];
};

export const generateFashionUGC = async (formData: FashionStudioFormData): Promise<FashionScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create a 3-scene UGC Video Plan for a Fashion Item.
    Garment Type: ${formData.garments[0].type}.
    Target Audience: ${formData.targetAudience}.
    Script Style: ${formData.scriptStyle}.
    Language: ${formData.scriptLanguage}.
    
    Return JSON: { "scenes": [ { "description": "Scene header", "visualPrompt": "Detailed visual description for AI image generator", "voiceover": "Script spoken by model" } ] }
    `;
    
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const scenes = Array.isArray(json) ? json : json.scenes || [];
        return scenes.map((s: any, i: number) => ({ ...s, id: i.toString(), sceneType: 'video_clip' }));
    } catch { return []; }
};

export const generateFashionCinematic = async (formData: FashionStudioFormData): Promise<FashionScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create a 3-scene Cinematic Fashion Video Plan.
    Mood: ${formData.cinematicMood}.
    Move: ${formData.cinematicMove}.
    Location: ${formData.location}.
    
    Return JSON: { "scenes": [ { "description": "Scene name", "visualPrompt": "Detailed cinematic visual description", "motionPrompt": "Camera movement description" } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const scenes = Array.isArray(json) ? json : json.scenes || [];
        return scenes.map((s: any, i: number) => ({ ...s, id: i.toString(), sceneType: 'video_clip' }));
    } catch { return []; }
};

export const regenerateFashionSceneImage = async (formData: FashionStudioFormData, scene: FashionScene) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.garments[0]?.file) parts.push(await fileToGenerativePart(formData.garments[0].file));
    if(formData.useModelReference && formData.modelReferenceImage) parts.push(await fileToGenerativePart(formData.modelReferenceImage));
    
    const prompt = `Fashion Scene: ${scene.visualPrompt}. Model: ${formData.modelGender}. Location: ${formData.location}. Photorealistic.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: formData.aspectRatio} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generatePoseVariations = async (file: File, theme: string, prompt: string, pro: boolean) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const poses = ["Front Full Body", "Side Profile Close Up", "Walking Motion", "Sitting Casual"];
    
    const results = await Promise.all(poses.map(async (poseName, idx) => {
        const finalPrompt = `Fashion Portrait. Theme: ${theme}. Pose: ${poseName}. ${prompt}. Photorealistic.`;
        const res = await ai.models.generateContent({ 
            model: pro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
            contents: { parts: [part, {text: finalPrompt}] }, 
            config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '3:4'} }
        });
        return {
            id: idx.toString(),
            base64: res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "",
            job: { name: `Pose ${idx+1}`, prompt: finalPrompt, cameraAngleName: poseName },
            backgroundPrompt: theme
        };
    }));
    
    return results.filter(r => r.base64);
};

export const analyzeProductForRoom = async (file: File): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const prompt = `Analyze this furniture/decor item. Return JSON: { "productName": "...", "productDescription": "...", "suggestedPlacement": "Table Top/Floor...", "suggestedRoomType": "Living Room...", "suggestedInteriorStyle": "Modern..." }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [part, {text: prompt}] }, config: { responseMimeType: 'application/json' } });
        return extractJSON(res.text || "{}");
    } catch { return { productName: "Product" }; }
};

export const generateProductInRoomScenes = async (formData: ProductInRoomFormData): Promise<CinematicShot[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if(formData.backgroundMode === 'upload' && formData.backgroundReferenceImage) parts.push(await fileToGenerativePart(formData.backgroundReferenceImage));
    
    const angles = ["Wide Shot (Room Context)", "Medium Shot (Placement)", "Close Up (Detail)", "Creative Angle (Low/High)"];
    const results = await Promise.all(angles.slice(0, formData.sceneCount).map(async (angle, idx) => {
        const prompt = `Interior Design Photography. Product: ${formData.productName} in ${formData.roomType}. Style: ${formData.interiorStyle}. Placement: ${formData.placement}. Lighting: ${formData.lighting}. Shot: ${angle}. Photorealistic 8k.`;
        const res = await ai.models.generateContent({
            model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
            contents: { parts: [...parts, {text: prompt}] },
            config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
        });
        return {
            id: idx.toString(),
            angleName: angle,
            imageBase64: res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "",
            motionPrompt: `Slow cinematic pan showing ${formData.productName} in ${formData.roomType}`
        };
    }));
    return results.filter(r => r.imageBase64);
};

export const generateProductInRoomScript = async (productName: string, context: string, scriptData: RoomScriptData, count: number): Promise<SceneScriptItem[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Write a ${count}-scene video script for selling furniture/decor.
    Product: ${productName}. Context: ${context}.
    Angle: ${scriptData.sellingAngle}. Tone: ${scriptData.scriptTone}.
    Language: ${scriptData.language}.
    Return JSON: { "scenes": [ { "sceneNumber": 1, "visualDescription": "...", "voiceoverText": "..." } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((item: any, i: number) => ({ ...item, id: i.toString() }));
    } catch { return []; }
};

export const generateTextToSpeech = async (text: string, voice: string, speed: number): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateScriptFromImage = async (img: string, name: string, lang: string, tone: string, plat: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `Write a ${plat} caption/script for this product image. Product: ${name}. Tone: ${tone}. Language: ${lang}. Include Hook, Body, and CTA.`;
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{inlineData: {data: img, mimeType: 'image/png'}}, {text: prompt}] }
    });
    return res.text || "";
};

export const analyzeOneShotInput = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const prompt = `Analyze this product. Return JSON: { "productName": "...", "productDescription": "...", "suggestedAudience": "...", "usps": ["...", "..."], "suggestedGreetings": ["..."] }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [part, {text: prompt}] }, config: { responseMimeType: 'application/json' } });
        return extractJSON(res.text || "{}");
    } catch { return { productName: "Product" }; }
};

export const generateOneShotPlan = async (formData: OneShotFormData): Promise<OneShotScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create a ${formData.sceneCount}-scene script for a One-Shot Video Ad.
    Product: ${formData.productName}. Mode: ${formData.mode}. Platform: ${formData.platform}.
    Target: ${formData.targetAudience}. USPs: ${formData.usps?.join(', ')}.
    Language: ${formData.language}.
    
    Structure:
    1. Hook (Visual + Verbal)
    2. Value/Demo
    3. CTA
    
    Return JSON: { "scenes": [ { "sceneNumber": 1, "visual_direction": { "subject_action": "...", "lighting_atmosphere": "..." }, "audio_direction": { "voiceover_script": "..." }, "camera_direction": { "movement": "..." } } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'Hook'));
    } catch { return []; }
};

export const generateOneShotKeyframe = async (formData: OneShotFormData, scene: OneShotScene): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if(formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    
    const prompt = `Scene Visual: ${scene.visual_direction.subject_action}. Mood: ${scene.visual_direction.lighting_atmosphere}. Mode: ${formData.mode}. Photorealistic 4K.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generateStorysellingContent = async (formData: StorysellingFormData): Promise<UGCScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Write a viral Storyselling Script.
    Product: ${formData.productName}. Framework: ${formData.framework}. Hook: ${formData.hookType}.
    Pain Point: ${formData.painPoint}. Desired State: ${formData.desiredState}.
    Setting: ${formData.storySetting}. Mood: ${formData.mood}.
    Language: ${formData.language}.
    
    Create 5-7 scenes. Return JSON: { "scenes": [ { "sceneNumber": 1, "visual_direction": { "subject_action": "..." }, "audio_direction": { "voiceover_script": "..." } } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'Story'));
    } catch { return []; }
};

export const generateStorySceneImage = async (formData: StorysellingFormData, scene: UGCScene): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if(formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    
    const prompt = `Cinematic Story Scene. Setting: ${formData.storySetting}. Action: ${scene.visual_direction.subject_action}. Mood: ${formData.mood}. Photorealistic.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const analyzeUnboxingContext = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const prompt = `Analyze product for unboxing. Return JSON: { "productName": "...", "suggestedBackgrounds": ["Cozy Desk", "Floor", "Bed"] }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [part, {text: prompt}] }, config: { responseMimeType: 'application/json' } });
        return extractJSON(res.text || "{}");
    } catch { return { productName: "Product", suggestedBackgrounds: ["Table"] }; }
};

export const generateUnboxingContent = async (formData: UnboxingFormData): Promise<UnboxingScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create an Unboxing Video Plan.
    Product: ${formData.productName}. Packaging: ${formData.packagingType}. Mood: ${formData.mood}.
    Length: ${formData.flowLength}.
    Language: ${formData.language}.
    
    Return JSON: { "scenes": [ { "sceneNumber": 1, "visual_direction": { "subject_action": "..." }, "audio_direction": { "voiceover_script": "..." } } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'Unboxing'));
    } catch { return []; }
};

export const regenerateUnboxingSceneImage = async (formData: UnboxingFormData, scene: UnboxingScene): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    
    const prompt = `Unboxing POV Shot. Action: ${scene.visual_direction.subject_action}. Product: ${formData.productName}. Background: ${formData.backgroundVibe}. Hands: ${formData.handGender}, ${formData.handSkinTone}. Photorealistic.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const analyzeFnBProduct = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const prompt = `Analyze food/drink. Return JSON: { "productName": "...", "productDescription": "...", "temperature": "Hot/Cold...", "texture": "Crispy/Soft..." }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [part, {text: prompt}] }, config: { responseMimeType: 'application/json' } });
        return extractJSON(res.text || "{}");
    } catch { return { productName: "Food" }; }
};

export const generateFnBContent = async (formData: FnBFormData): Promise<FnBScene[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create a Food Porn / Commercial Video Plan.
    Product: ${formData.productName}. Temp: ${formData.temperature}. Texture: ${formData.texture}.
    Strategy: ${formData.strategy}. Motion: ${formData.motionFocus}.
    Language: ${formData.scriptLanguage}.
    
    Return JSON: { "scenes": [ { "sceneNumber": 1, "visual_direction": { "subject_action": "...", "lighting_atmosphere": "..." }, "audio_direction": { "voiceover_script": "..." } } ] }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'FnB'));
    } catch { return []; }
};

export const regenerateFnBSceneImage = async (formData: FnBFormData, scene: FnBScene): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    
    const prompt = `Food Commercial Shot. Product: ${formData.productName}. Action: ${scene.visual_direction.subject_action}. Lighting: ${formData.lighting}. Environment: ${formData.environment}. Delicious, 4k macro.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const analyzeFashionReelInput = async (file: File) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const part = await fileToGenerativePart(file);
    const prompt = `Analyze fashion item. Return JSON: { "productName": "...", "productDescription": "..." }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [part, {text: prompt}] }, config: { responseMimeType: 'application/json' } });
        return extractJSON(res.text || "{}");
    } catch { return { productName: "Fashion Item" }; }
};

export const generateFashionReelPlan = async (formData: FashionReelFormData): Promise<{scenes: FashionReelScene[], globalSettings: GlobalVisualSettings}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `
    Create a ${formData.sceneCount}-scene Fashion Reel Script.
    Product: ${formData.productName}. Mode: ${formData.showcaseMode}. Hook: ${formData.affiliateHook}.
    Audience: ${formData.targetAudience}. Language: ${formData.language}.
    
    Define Global Visuals: Environment (${formData.environment}), Lighting (${formData.lighting}).
    
    Return JSON: { 
        "globalSettings": { "location_details": "...", "lighting_anchor": "..." },
        "scenes": [ { "sceneNumber": 1, "visual_direction": { "subject_action": "..." }, "audio_direction": { "voiceover_script": "..." } } ] 
    }
    `;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(res.text || "{}");
        const list = Array.isArray(json.scenes) ? json.scenes : [];
        const globalSettings = json.globalSettings || { location_details: formData.environment, lighting_anchor: formData.lighting };
        
        return {
            scenes: list.map((s: any, i: number) => mapToCinematicScene(s, i, 'Reel')),
            globalSettings
        };
    } catch { 
        return { scenes: [], globalSettings: { location_details: "", lighting_anchor: "" } }; 
    }
};

export const generateFashionReelKeyframe = async (formData: FashionReelFormData, scene: FashionReelScene, globalSettings?: GlobalVisualSettings): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts = [];
    if(formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if(formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    if(formData.backgroundMode === 'upload' && formData.customBackground) parts.push(await fileToGenerativePart(formData.customBackground));
    
    const locationPrompt = formData.backgroundMode === 'upload' ? "Use uploaded background reference." : `Location: ${globalSettings?.location_details || formData.environment}.`;
    
    const prompt = `Fashion Reel Frame. Action: ${scene.visual_direction.subject_action}. ${locationPrompt} Lighting: ${globalSettings?.lighting_anchor || formData.lighting}. Model: ${formData.gender} style. Photorealistic 4K.`;
    
    const res = await ai.models.generateContent({ 
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image', 
        contents: { parts: [...parts, {text: prompt}] }, 
        config: { responseModalities: [Modality.IMAGE], imageConfig: {aspectRatio: '9:16'} }
    });
    return res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const analyzeUGCContext = async (file: File): Promise<UGCAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const imagePart = await fileToGenerativePart(file);
    
    const prompt = `
    Analyze this product for a Viral UGC Video Strategy.
    
    CRITICAL: ALL OUTPUT MUST BE IN INDONESIAN LANGUAGE (BAHASA INDONESIA).

    Tasks:
    1. Identify Product Name & Description.
    2. Determine best Target Audience (in Indonesian).
    3. List 3 Unique Selling Points (USPs) (in Indonesian).
    4. Create 4 Distinct Marketing Angles (Psychological Hooks) (in Indonesian).
       For each angle, provide: 
       - "title": A catchy name for the angle (e.g. "Si Skeptis", "Estetik Abis").
       - "description": Why this angle works (in Indonesian).
       - "hook": A specific first-sentence script hook (in Indonesian).
    5. Visual Suggestions:
       - "suggestedOutfits": 3 outfit styles for the model that match the product vibe (in Indonesian).
       - "suggestedVibes": 3 environment/lighting vibes (e.g. "Kamar Golden Hour", "Neon Cyberpunk") (in Indonesian).

    Return JSON:
    {
        "productName": "...",
        "productDescription": "...",
        "targetAudience": "...",
        "usps": ["...", "..."],
        "marketingAngles": [
            { "title": "...", "description": "...", "hook": "..." }
        ],
        "suggestedOutfits": ["...", "..."],
        "suggestedVibes": ["...", "..."]
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        
        const result = extractJSON(response.text || "{}");
        
        return {
            productName: result.productName || "Product",
            productDescription: result.productDescription || "",
            targetAudience: result.targetAudience || "General Audience",
            usps: ensureStringArray(result.usps),
            marketingAngles: Array.isArray(result.marketingAngles) ? result.marketingAngles : [],
            suggestedOutfits: ensureStringArray(result.suggestedOutfits),
            suggestedVibes: ensureStringArray(result.suggestedVibes)
        };
    } catch (e) {
        console.error("UGC Analysis Failed", e);
        return {
            productName: "Product",
            productDescription: "",
            targetAudience: "Gen Z",
            usps: [],
            marketingAngles: [],
            suggestedOutfits: [],
            suggestedVibes: []
        };
    }
};

export const generateUGCScriptAndStoryboard = async (formData: UGCCreatorFormData, angle?: MarketingAngle): Promise<{scenes: UGCScene[], globalSettings: GlobalVisualSettings}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const parts: any[] = [];
    if (formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if (formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    if (formData.backgroundMode === 'upload' && formData.customBackground) {
        parts.push(await fileToGenerativePart(formData.customBackground));
    }

    const angleContext = angle 
        ? `MARKETING ANGLE: ${angle.title}\nANGLE HOOK: ${angle.hook}\nANGLE STRATEGY: ${angle.description}`
        : `HOOK TEMPLATE: ${formData.hookTemplate}`;

    const sceneMatch = formData.sceneStrategy.match(/(\d+)/);
    const strictSceneCount = sceneMatch ? parseInt(sceneMatch[0]) : 3;

    const prompt = `
    ROLE: Viral TikTok Video Director & Scriptwriter.
    TASK: Create a scene-by-scene script and visual direction for a UGC video.
    
    PRODUCT: ${formData.productName}
    DESCRIPTION: ${formData.productDescription}
    TARGET AUDIENCE: ${formData.targetAudience}
    SCRIPT STYLE: ${formData.scriptStyle}
    LANGUAGE: ${formData.scriptLanguage} (MUST BE USED FOR VOICEOVER)
    
    ${angleContext}
    
    CONTEXT:
    - Model Gender: ${formData.modelGender}
    - Outfit Style: ${formData.modelOutfit}
    - Environment Vibe: ${formData.environmentVibe}
    
    SCENE COUNT: EXACTLY ${strictSceneCount} scenes.
    
    OUTPUT FORMAT: JSON with keys:
    {
      "globalSettings": {
        "location_details": "...",
        "lighting_anchor": "..."
      },
      "scenes": [
        {
          "sceneNumber": 1,
          "visual_direction": { "subject_action": "...", "lighting_atmosphere": "..." },
          "audio_direction": { "voiceover_script": "...", "voice_emotion": "..." },
          "camera_direction": { "angle": "...", "movement": "..." }
        }
      ]
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: formData.usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
            contents: { parts: [...parts, { text: prompt }] },
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: formData.usePro ? { thinkingBudget: 32768 } : undefined
            }
        });

        const text = response.text || "{}";
        let json: any = extractJSON(text);

        let scenesRaw = Array.isArray(json.scenes) ? json.scenes : [];
        if (scenesRaw.length === 0 && Array.isArray(json)) scenesRaw = json;

        const scenes = scenesRaw.map((s: any, i: number) => mapToCinematicScene(s, i));
        const globalSettings = json.globalSettings || { location_details: formData.environmentVibe, lighting_anchor: 'Soft Natural Light' };

        return { scenes, globalSettings };
    } catch (e) {
        throw new Error("Failed to generate script.");
    }
};

export const generateUGCSceneImage = async (formData: UGCCreatorFormData, scene: UGCScene, globalSettings?: GlobalVisualSettings): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];
    if (formData.productImage) parts.push(await fileToGenerativePart(formData.productImage));
    if (formData.modelImage) parts.push(await fileToGenerativePart(formData.modelImage));
    
    let worldLockPrompt = globalSettings ? `
    CRITICAL VISUAL CONSISTENCY:
    - The environment MUST BE EXACTLY: ${globalSettings.location_details}.
    - The lighting MUST BE EXACTLY: ${globalSettings.lighting_anchor}.
    ` : `Vibe: ${formData.environmentVibe}`;

    const prompt = `
    ID PRESERVATION MODE: The character in this image MUST be the EXACT SAME person as the first reference image provided. 
    ${worldLockPrompt}
    SCENE ACTION: ${scene.visual_direction.subject_action}.
    STYLE: RAW UGC / TIKTOK AMATEUR.
    DETAILS: Model Outfit: ${formData.modelOutfit}.
    `;

    const response = await ai.models.generateContent({
        model: formData.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE], 
            imageConfig: { aspectRatio: '9:16' } 
        }
    });

    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

// --- MIRROR SELFIE STUDIO ---
export const generateMirrorSelfieStoryboard = async (
    productName: string,
    pose: string,
    background: string,
    sceneCount: number,
    language: string
): Promise<any[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
    ROLE: Viral Content Strategist & Mirror Selfie Director.
    TASK: Create a ${sceneCount}-scene storyboard for a Mirror Selfie product showcase video (TikTok/Reels).
    
    CONTEXT:
    - Product: ${productName}
    - Mirror Location: ${background}
    - Starting Pose: ${pose}
    - Language: ${language}
    
    CREATIVE DIRECTION:
    Scene 1: HOOK — A striking first selfie shot that stops the scroll. Model walks up to mirror, phone in hand.
    Scene 2: REVEAL — Close-up mirror reflection showing the product. Model showcases product naturally.
    Scene 3: HERO SHOT — The money shot. Full body or 3/4 mirror selfie with product visible. Candid and aesthetic.
    Scene 4 (if applicable): DETAIL — Close angle showing product texture/detail through mirror reflection.
    Scene 5 (if applicable): CTA — Final pose, confident smile, product highlighted.
    
    MIRROR SELFIE RULES:
    1. Phone MUST be visible in every scene (held by model, pointing at mirror)
    2. Mirror reflection MUST be the main visual
    3. Keep it raw/authentic — like a real TikTok creator, NOT a studio shoot
    4. Natural room lighting only
    5. Voiceover must be casual, like talking to a friend
    
    OUTPUT JSON:
    {
      "scenes": [
        {
          "sceneNumber": 1,
          "visual_direction": { 
            "subject_action": "Detailed description of what model does in mirror",
            "lighting_atmosphere": "Natural lighting description",
            "mirror_pose": "Specific mirror pose description"
          },
          "audio_direction": { 
            "voiceover_script": "Casual voiceover text in ${language}",
            "voice_emotion": "Excited/Calm/Confident...",
            "sfx_cue": "Mirror tap, phone shutter, etc."
          },
          "camera_direction": { 
            "movement": "Static/Slow zoom/Tilt...",
            "angle": "Mirror reflection angle",
            "focus": "Product/Face/Full body"
          },
          "overlay_suggestion": "Text overlay suggestion"
        }
      ]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        const json = extractJSON(response.text || "{}");
        const list = Array.isArray(json) ? json : json.scenes || [];
        return list.map((s: any, i: number) => mapToCinematicScene(s, i, 'Mirror Selfie'));
    } catch (e) { throw new Error("Mirror Selfie storyboard generation failed"); }
};

export const generateMirrorSelfieKeyframe = async (
    productImage: File,
    modelImage: File | null,
    productName: string,
    scene: any,
    background: string,
    aspectRatio: string,
    usePro: boolean
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const parts: any[] = [];

    if (modelImage) parts.push(await fileToGenerativePart(modelImage));
    parts.push(await fileToGenerativePart(productImage));

    const REALISM = "RAW IPHONE PHOTOGRAPHY: 100% authentic handheld photo. Capture raw skin textures, visible pores, natural imperfections. NATURAL LIGHTING ONLY. NO AI smoothness, NO beauty filters, NO CGI. Realistic lens artifacts and image grain. Must look like a genuine social media snapshot.";
    const IDENTITY = modelImage 
        ? "IDENTITY CLONE: The person MUST be an exact clone of REFERENCE IMAGE 1. Match gender, face, hair, body EXACTLY. NO facial re-imagining."
        : "Generate a natural-looking Indonesian young adult model.";
    const PRODUCT = "PRODUCT CLONE: Product MUST be an exact replica of the PRODUCT REFERENCE IMAGE. Identical color, texture, branding, shape, scale. NO variations.";

    const prompt = `${REALISM}
${IDENTITY}
${PRODUCT}

STYLE: Mirror Selfie — Subject holding phone, pointing at a mirror.
MIRROR LOCATION: ${background}.
SCENE ACTION: ${scene.visual_direction?.subject_action || 'Mirror selfie with product'}.
MIRROR POSE: ${scene.visual_direction?.mirror_pose || 'Casual selfie pose'}.
LIGHTING: ${scene.visual_direction?.lighting_atmosphere || 'Natural room light'}.
CAMERA: ${scene.camera_direction?.angle || 'Mirror reflection'}, ${scene.camera_direction?.movement || 'Static'}.
PRODUCT: ${productName} — must be visible and realistically positioned.
Phone screen should show camera interface naturally.

NEGATIVE PROMPT: No phone missing, no mirror missing, professional studio, perfect symmetry, text, overlay, watermark, CGI, 3D render.`;

    const response = await ai.models.generateContent({
        model: usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE], 
            imageConfig: { aspectRatio: aspectRatio as any } 
        }
    });

    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

// --- VOICE OVER / TTS STUDIO ---

// Convert raw PCM base64 to a WAV Blob URL playable in <audio>
export const base64PCMToWavUrl = (base64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16): string => {
    const raw = atob(base64);
    const rawLen = raw.length;
    const pcmBytes = new Uint8Array(rawLen);
    for (let i = 0; i < rawLen; i++) pcmBytes[i] = raw.charCodeAt(i);

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmBytes.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);        // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, pcmBytes.length, true);

    const wavBlob = new Blob([wavHeader, pcmBytes], { type: 'audio/wav' });
    return URL.createObjectURL(wavBlob);
};

export const generateVoiceover = async (
    script: string,
    voiceName: string,
    tone: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const toneInstructions: Record<string, string> = {
        'Energik': 'Speak with high energy, enthusiasm, and excitement. Fast pace.',
        'Santai': 'Speak in a relaxed, casual, friendly tone. Natural conversational pace.',
        'Profesional': 'Speak clearly and professionally. Measured, confident pace.',
        'Hangat': 'Speak with warmth, empathy, and gentle enthusiasm.',
        'Dramatis': 'Speak dramatically with dynamic range, pauses for effect.',
    };

    const instruction = toneInstructions[tone] || 'Speak naturally and clearly.';
    const fullScript = `${instruction}\n\n${script}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: fullScript }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            }
        }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!base64) throw new Error('TTS generation failed: no audio data returned');
    return base64PCMToWavUrl(base64);
};

