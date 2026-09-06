import { AvatarConfig, DominantEmotion, Theme } from '../types';

export interface SkinOption {
  id: string;
  label: string;
  color: string;
}

export interface HairStyleOption {
  id: string;
  label: string;
}

export interface HairColorOption {
  id: string;
  label: string;
  color: string;
}

export interface OutfitColorOption {
  id: string;
  label: string;
  color: string;
}

export const SKIN_OPTIONS: SkinOption[] = [
  { id: 'fair', label: 'Fair', color: '#fbe2d3' },
  { id: 'light-warm', label: 'Warm Beige', color: '#f2cbaf' },
  { id: 'golden-tan', label: 'Golden Tan', color: '#dca074' },
  { id: 'deep-bronze', label: 'Deep Bronze', color: '#9e5e34' },
  { id: 'rich-espresso', label: 'Rich Espresso', color: '#56311c' },
];

export const HAIR_STYLE_OPTIONS: HairStyleOption[] = [
  { id: 'short-crop', label: 'Short Crop' },
  { id: 'wavy-shoulder', label: 'Wavy Shoulder' },
  { id: 'curly-afro', label: 'Curly Volume' },
  { id: 'high-top-bun', label: 'High Bun' },
  { id: 'soft-part', label: 'Soft Part' },
  { id: 'braided-flow', label: 'Braided Flow' },
];

export const HAIR_COLOR_OPTIONS: HairColorOption[] = [
  { id: 'jet-black', label: 'Jet Black', color: '#1f2024' },
  { id: 'dark-chestnut', label: 'Dark Chestnut', color: '#44281b' },
  { id: 'golden-blonde', label: 'Warm Blonde', color: '#cca25b' },
  { id: 'auburn-copper', label: 'Auburn Copper', color: '#883720' },
  { id: 'slate-silver', label: 'Slate Silver', color: '#68717d' },
];

export const OUTFIT_COLOR_OPTIONS: OutfitColorOption[] = [
  { id: 'terracotta', label: 'Terracotta', color: '#c3552e' },
  { id: 'sage', label: 'Sage', color: '#4a755e' },
  { id: 'ocean-navy', label: 'Ocean Navy', color: '#27475f' },
  { id: 'mustard', label: 'Mustard', color: '#c98e20' },
  { id: 'blush-rose', label: 'Blush Rose', color: '#ae5c6c' },
  { id: 'charcoal', label: 'Charcoal', color: '#383a42' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: 'light-warm',
  hairStyle: 'short-crop',
  hairColor: 'dark-chestnut',
  outfitColor: 'ocean-navy',
};

export function getSkinHex(tone: string): string {
  const found = SKIN_OPTIONS.find((s) => s.id === tone);
  return found ? found.color : '#f2cbaf';
}

export function getHairHex(color: string): string {
  const found = HAIR_COLOR_OPTIONS.find((h) => h.id === color);
  return found ? found.color : '#44281b';
}

export function getOutfitHex(color: string): string {
  const found = OUTFIT_COLOR_OPTIONS.find((o) => o.id === color);
  return found ? found.color : '#27475f';
}

export const EMOTION_COLOR_PALETTE: Record<DominantEmotion, string> = {
  stressed: '#B5674A',
  calm: '#7C9885',
  joyful: '#D9A441',
  grateful: '#A98B4E',
  sad: '#5F6E7A',
  angry: '#9B4B3E',
  neutral: '#8C8478',
};

export function getEmotionMetadata(emotion: DominantEmotion) {
  switch (emotion) {
    case 'joyful':
      return {
        label: 'Joyful',
        tagline: 'Lifting upwards in celebration',
        color: '#D9A441',
        badgeBg: 'bg-[#D9A441]/15 text-[#5B4009] border-[#D9A441]/35',
        ringColor: '#D9A441',
      };
    case 'calm':
      return {
        label: 'Calm',
        tagline: 'Centered in stillness',
        color: '#7C9885',
        badgeBg: 'bg-[#7C9885]/15 text-[#2A3E30] border-[#7C9885]/35',
        ringColor: '#7C9885',
      };
    case 'grateful':
      return {
        label: 'Grateful',
        tagline: 'Holding appreciation close',
        color: '#A98B4E',
        badgeBg: 'bg-[#A98B4E]/15 text-[#4D3D1A] border-[#A98B4E]/35',
        ringColor: '#A98B4E',
      };
    case 'stressed':
      return {
        label: 'Stressed',
        tagline: 'Carrying heavy tension',
        color: '#B5674A',
        badgeBg: 'bg-[#B5674A]/15 text-[#5C2A18] border-[#B5674A]/35',
        ringColor: '#B5674A',
      };
    case 'sad':
      return {
        label: 'Sad',
        tagline: 'Quiet, reflective solitude',
        color: '#5F6E7A',
        badgeBg: 'bg-[#5F6E7A]/15 text-[#232F38] border-[#5F6E7A]/35',
        ringColor: '#5F6E7A',
      };
    case 'angry':
      return {
        label: 'Angry',
        tagline: 'Firm, determined resistance',
        color: '#9B4B3E',
        badgeBg: 'bg-[#9B4B3E]/15 text-[#4D1C16] border-[#9B4B3E]/35',
        ringColor: '#9B4B3E',
      };
    case 'neutral':
    default:
      return {
        label: 'Neutral',
        tagline: 'Balanced, observational rest',
        color: '#8C8478',
        badgeBg: 'bg-[#8C8478]/15 text-[#3D3934] border-[#8C8478]/35',
        ringColor: '#8C8478',
      };
  }
}

export function getThemeMetadata(theme: Theme) {
  switch (theme) {
    case 'work':
      return { label: 'Work & Craft', iconName: 'Briefcase' };
    case 'relationships':
      return { label: 'Relationships', iconName: 'HeartHandshake' };
    case 'family':
      return { label: 'Family & Home', iconName: 'Home' };
    case 'health':
      return { label: 'Health & Vitality', iconName: 'Activity' };
    case 'social':
      return { label: 'Social Circle', iconName: 'Users' };
    case 'hobbies':
      return { label: 'Passions & Play', iconName: 'Palette' };
    case 'finances':
      return { label: 'Finances', iconName: 'Coins' };
    case 'personal_growth':
      return { label: 'Personal Growth', iconName: 'Sparkles' };
    case 'other':
    default:
      return { label: 'Daily Life', iconName: 'Compass' };
  }
}
