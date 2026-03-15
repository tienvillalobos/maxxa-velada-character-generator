
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateCharacterSprites = async (
  base64Image: string, 
  mimeType: string,
  config: GenerationConfig
): Promise<string> => {
  const model = 'gemini-2.5-flash-image';
  
  const isBoxer = config.type === 'BOXER';
  
  const boxerSpecifics = isBoxer ? `
    Character Details (Boxer):
    - Outfit: ${config.hasShorts ? `${config.shortsColor} boxing shorts` : 'no boxing shorts (bare legs or different bottom)'}, ${config.hasGloves ? `${config.glovesColor} boxing gloves` : 'no boxing gloves (bare hands)'}${config.hasShoes ? ', and athletic boxing boots' : ', and barefoot'}.
    - STANCE: ${config.hasGloves ? 'The character MUST keep their boxing gloves up in a defensive "guard" position (protecting the face) during IDLE and WALKING.' : 'The character should have a natural fighting stance with hands up but no gloves.'}
  ` : `
    Character Details (Crowd/Public):
    - Outfit: Casual modern clothes based on the reference photo or the description.
    - STANCE: Natural relaxed stance for IDLE.
  `;

  const animationPrompt = isBoxer ? `
    Animation Sequence Details (BOXER):
    Row 1: IDLE (Breathing/Bobbing) - 4 frames, use first 3 for export:
    - Character in boxing guard. Head bobs up and down subtly.
    Row 2: WALK (Footwork) - 4 frames:
    - Walking cycle with gloves up in guard. Clear alternating leg movement.
    Row 3: ATTACK (Punch) - 4 frames, use first 3 for export:
    - Wind up, full impact (straight punch), recovery.
  ` : `
    Animation Sequence Details (CROWD/PUBLIC):
    Row 1: IDLE (Breathing/Waiting) - 4 frames:
    - Natural subtle movement, blinking or shifting weight slightly.
    Row 2: CHEERING (Excited) - 4 frames:
    - Character jumps or raises arms high, waving them in excitement.
    Row 3: SURPRISED (Shocked) - 4 frames:
    - Sharp reaction, mouth opening, hands to face or chest, recoiling slightly.
  `;

  const prompt = `
    Task: Create a professional 16-bit pixel art character grid (4x3) that looks EXACTLY like the person in the photo.
    
    Likeness & Orientation Requirements:
    - Priority #1: Capture the exact facial features, expression, hair, and distinct head shape.
    - ORIENTATION: In EVERY single frame, the character MUST be facing toward the RIGHT.
    
    ${boxerSpecifics}
    
    - Additional Customization: ${config.additionalDescription || "Style consistent with photo"}.
    - Style: Sharp 16-bit pixel art, no blur, no gradients. Consistent character size.
    
    ${animationPrompt}
    
    Technical Specs:
    - Layout: 4 columns wide, 3 rows high (4x3 grid).
    - Background: Solid flat gray (#808080) only. No shadows.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt
          }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se generó ninguna imagen.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
