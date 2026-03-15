
export interface SpriteResult {
  imageUrl: string;
  prompt: string;
  type: GeneratorType;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type GeneratorType = 'BOXER' | 'CROWD';

export interface GenerationConfig {
  type: GeneratorType;
  glovesColor?: string;
  hasGloves?: boolean;
  shortsColor?: string;
  hasShorts?: boolean;
  hasShoes?: boolean;
  additionalDescription: string;
}

/** Animation folder name -> number of frames */
export const ANIMATION_SETS: Record<GeneratorType, { folder: string; frames: number }[]> = {
  BOXER: [
    { folder: 'idle', frames: 3 },
    { folder: 'walk', frames: 4 },
    { folder: 'attack', frames: 3 }
  ],
  CROWD: [
    { folder: 'idle', frames: 3 },
    { folder: 'cheer', frames: 4 },
    { folder: 'surprised', frames: 3 }
  ]
};

/** Target frame dimensions (matches public/example) */
export const FRAME_WIDTH = 209;
export const FRAME_HEIGHT = 262;
