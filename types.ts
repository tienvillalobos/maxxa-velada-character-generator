
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

export const ANIMATION_SETS: Record<GeneratorType, string[]> = {
  BOXER: ['idle', 'walk', 'punch'],
  CROWD: ['idle', 'cheer', 'surprised']
};
