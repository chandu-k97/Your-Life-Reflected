export type DominantEmotion =
  | 'joyful'
  | 'calm'
  | 'grateful'
  | 'stressed'
  | 'sad'
  | 'angry'
  | 'neutral';

export type Theme =
  | 'work'
  | 'relationships'
  | 'family'
  | 'health'
  | 'social'
  | 'hobbies'
  | 'finances'
  | 'personal_growth'
  | 'other';

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'place' | 'activity';
  mentionCount: number;
}

export interface AnalysisResult {
  dominantEmotion: DominantEmotion;
  themes: Theme[];
  sentimentScore: number;
  entities: ExtractedEntity[];
}

export interface PanelConfig {
  pose: string;
  motif: string;
  colorTint: string;
  dominantEmotion: DominantEmotion;
  primaryTheme: Theme;
  sentimentScore: number;
  entities: ExtractedEntity[];
  isStale?: boolean;
}

export interface AvatarConfig {
  skinTone: string; // 'fair' | 'light-warm' | 'golden-tan' | 'deep-bronze' | 'rich-espresso'
  hairStyle: string; // 'short-crop' | 'wavy-shoulder' | 'curly-afro' | 'high-top-bun' | 'soft-part' | 'braided-flow'
  hairColor: string; // 'jet-black' | 'dark-chestnut' | 'golden-blonde' | 'auburn-copper' | 'slate-silver'
  outfitColor: string; // 'terracotta' | 'sage' | 'ocean-navy' | 'mustard' | 'blush-rose' | 'charcoal'
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  entryDate: string; // YYYY-MM-DD (the date the user is journaling about)
  createdAt: string; // ISO string (system-set, immutable audit anchor)
  updatedAt?: string;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis?: AnalysisResult;
  panel?: PanelConfig;
  analysisError?: string;
}

export interface WeeklyRecap {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  entryIds: string[];
  narrativeCaption: string;
  createdAt: string;
  generatedAt?: string;
  dominantThemes: Theme[];
  emotionsDistribution: Record<string, number>;
  averageSentiment: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  avatarConfig: AvatarConfig | null;
  createdAt: string;
}
