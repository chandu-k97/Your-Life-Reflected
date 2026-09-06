import React from 'react';
import {
  AvatarConfig,
  DominantEmotion,
  ExtractedEntity,
  PanelConfig,
  Theme,
} from '../types';
import {
  DEFAULT_AVATAR,
  getEmotionMetadata,
  getHairHex,
  getOutfitHex,
  getSkinHex,
  getThemeMetadata,
} from '../utils/visualPresets';
import {
  User as UserIcon,
  MapPin,
  Sparkles,
  Heart,
  Briefcase,
  Users,
  Smile,
} from 'lucide-react';

interface VisualStoryPanelProps {
  avatar?: AvatarConfig | null;
  panel?: PanelConfig | null;
  emotion?: DominantEmotion;
  theme?: Theme;
  sentiment?: number;
  entities?: ExtractedEntity[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  dateLabel?: string;
  caption?: string;
}

export const VisualStoryPanel: React.FC<VisualStoryPanelProps> = ({
  avatar = DEFAULT_AVATAR,
  panel,
  emotion: propEmotion,
  theme: propTheme,
  sentiment: propSentiment,
  entities: propEntities,
  className = '',
  size = 'md',
  dateLabel,
  caption,
}) => {
  const activeAvatar = avatar || DEFAULT_AVATAR;

  // Resolve values prioritizing panel config if available
  const emotion: DominantEmotion =
    panel?.dominantEmotion || propEmotion || 'neutral';
  const primaryTheme: Theme =
    panel?.primaryTheme || (panel?.motif as Theme) || propTheme || 'other';
  const sentimentScore =
    typeof panel?.sentimentScore === 'number'
      ? panel.sentimentScore
      : typeof propSentiment === 'number'
      ? propSentiment
      : 0.0;
  const entities = panel?.entities || propEntities || [];

  const skinColor = getSkinHex(activeAvatar.skinTone);
  const hairColor = getHairHex(activeAvatar.hairColor);
  const outfitColor = getOutfitHex(activeAvatar.outfitColor);
  const hairStyle = activeAvatar.hairStyle || 'short-crop';

  const emotionMeta = getEmotionMetadata(emotion);
  const themeMeta = getThemeMetadata(primaryTheme);

  // Derive atmospheric color palette based on sentiment (-1.0 to 1.0)
  const getAtmosphere = (score: number) => {
    if (score > 0.2) {
      // Warm, hopeful golden sunlight
      return {
        bgGradient: 'from-[#FAF6EE] via-[#F5EBD6]/60 to-[#FAF6EE]',
        borderColor: 'border-[#C9962F]/40',
        motifStroke: '#C9962F',
        motifOpacity: 0.25,
        ambientGlow: 'rgba(201, 150, 47, 0.15)',
        toneLabel: 'Warm & uplifting',
      };
    } else if (score < -0.2) {
      // Introspective, twilight cool slate
      return {
        bgGradient: 'from-[#FAF6EE] via-[#E8ECEE]/60 to-[#FAF6EE]',
        borderColor: 'border-[#5F6E7A]/35',
        motifStroke: '#5F6E7A',
        motifOpacity: 0.22,
        ambientGlow: 'rgba(95, 110, 122, 0.14)',
        toneLabel: 'Introspective & deep',
      };
    } else {
      // Balanced, grounded calm
      return {
        bgGradient: 'from-[#FAF6EE] via-[#EBEFEA]/60 to-[#FAF6EE]',
        borderColor: 'border-[#7C9885]/35',
        motifStroke: '#7C9885',
        motifOpacity: 0.2,
        ambientGlow: 'rgba(124, 152, 133, 0.12)',
        toneLabel: 'Steady equilibrium',
      };
    }
  };

  const atmosphere = getAtmosphere(sentimentScore);
  const sentimentLabel = atmosphere.toneLabel;

  // SVG Hair path rendering
  const renderHair = () => {
    switch (hairStyle) {
      case 'short-crop':
        return (
          <path
            d="M 124 100 C 124 75 140 60 160 60 C 180 60 196 75 196 100 C 196 85 186 70 160 70 C 134 70 124 85 124 100 Z"
            fill={hairColor}
          />
        );
      case 'wavy-shoulder':
        return (
          <path
            d="M 122 108 C 120 72 136 56 160 56 C 184 56 200 72 198 108 C 205 130 196 150 190 156 C 182 144 190 120 188 105 C 186 72 176 68 160 68 C 144 68 134 72 132 105 C 130 120 138 144 130 156 C 124 150 115 130 122 108 Z"
            fill={hairColor}
          />
        );
      case 'curly-afro':
        return (
          <ellipse
            cx="160"
            cy="96"
            rx="46"
            ry="44"
            fill={hairColor}
          />
        );
      case 'high-top-bun':
        return (
          <g>
            <circle cx="160" cy="46" r="18" fill={hairColor} />
            <path
              d="M 125 98 C 125 76 140 64 160 64 C 180 64 195 76 195 98 C 195 86 182 72 160 72 C 138 72 125 86 125 98 Z"
              fill={hairColor}
            />
          </g>
        );
      case 'soft-part':
        return (
          <path
            d="M 124 102 C 124 72 140 58 160 58 C 185 58 198 75 196 108 C 192 90 182 70 162 70 C 140 70 130 85 124 102 Z"
            fill={hairColor}
          />
        );
      case 'braided-flow':
        return (
          <g fill={hairColor}>
            <path d="M 124 100 C 122 68 140 58 160 58 C 180 58 198 68 196 100 C 196 82 184 68 160 68 C 136 68 124 82 124 100 Z" />
            <path d="M 126 95 Q 120 130 126 160 Q 131 162 133 158 Q 128 130 133 98 Z" />
            <path d="M 194 95 Q 200 130 194 160 Q 189 162 187 158 Q 192 130 187 98 Z" />
          </g>
        );
      default:
        return (
          <path
            d="M 124 100 C 124 75 140 60 160 60 C 180 60 196 75 196 100 Z"
            fill={hairColor}
          />
        );
    }
  };

  // SVG Pose rendering based on emotion
  const renderPose = () => {
    switch (emotion) {
      case 'joyful':
        // Arms lifted in celebration, head tilted up, joyful posture
        return (
          <g id="pose-joyful">
            {/* Arms up */}
            <path
              d="M 134 140 Q 100 110 88 80 Q 94 76 100 82 Q 112 110 138 134 Z"
              fill={outfitColor}
            />
            <path
              d="M 186 140 Q 220 110 232 80 Q 226 76 220 82 Q 208 110 182 134 Z"
              fill={outfitColor}
            />
            {/* Hands */}
            <circle cx="88" cy="78" r="7" fill={skinColor} />
            <circle cx="232" cy="78" r="7" fill={skinColor} />
            {/* Torso */}
            <path
              d="M 134 135 L 186 135 L 194 210 L 126 210 Z"
              fill={outfitColor}
            />
            {/* Neck */}
            <rect x="154" y="118" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head */}
            <circle cx="160" cy="100" r="26" fill={skinColor} />
            {/* Facial Expression (Joyful curved eyes & open smile) */}
            <path
              d="M 150 97 Q 154 94 157 97"
              stroke="#2e1065"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 163 97 Q 166 94 170 97"
              stroke="#2e1065"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 153 108 Q 160 118 167 108 Z"
              fill="#e11d48"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'calm':
        // Centered meditative pose, hands resting on lap, peaceful closed eyes
        return (
          <g id="pose-calm">
            {/* Folded legs / base */}
            <ellipse cx="160" cy="208" rx="60" ry="16" fill={outfitColor} opacity={0.9} />
            {/* Torso */}
            <path
              d="M 136 138 L 184 138 L 190 205 L 130 205 Z"
              fill={outfitColor}
            />
            {/* Arms resting inward */}
            <path
              d="M 136 142 Q 116 170 144 196 Q 148 190 134 170 Q 142 152 144 144 Z"
              fill={outfitColor}
            />
            <path
              d="M 184 142 Q 204 170 176 196 Q 172 190 186 170 Q 178 152 176 144 Z"
              fill={outfitColor}
            />
            {/* Rested hands */}
            <circle cx="152" cy="194" r="6" fill={skinColor} />
            <circle cx="168" cy="194" r="6" fill={skinColor} />
            {/* Neck */}
            <rect x="154" y="118" width="12" height="20" fill={skinColor} rx="2" />
            {/* Head */}
            <circle cx="160" cy="100" r="26" fill={skinColor} />
            {/* Serene closed curved eyes & gentle closed smile */}
            <path
              d="M 149 98 Q 153 101 157 98"
              stroke="#1e293b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 163 98 Q 167 101 171 98"
              stroke="#1e293b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 155 109 Q 160 113 165 109"
              stroke="#1e293b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'grateful':
        // Hand over heart, subtle bow, warm smile
        return (
          <g id="pose-grateful">
            {/* Torso */}
            <path
              d="M 134 135 L 186 135 L 192 215 L 128 215 Z"
              fill={outfitColor}
            />
            {/* Right Arm hanging naturally */}
            <path
              d="M 186 140 Q 200 175 198 200 Q 192 200 188 175 Q 182 150 180 142 Z"
              fill={outfitColor}
            />
            <circle cx="196" cy="202" r="6" fill={skinColor} />
            {/* Left Arm bending over chest (hand over heart) */}
            <path
              d="M 134 140 Q 112 170 152 165 Q 152 158 128 152 Q 132 145 138 140 Z"
              fill={outfitColor}
            />
            {/* Hand over heart */}
            <circle cx="156" cy="162" r="7" fill={skinColor} />
            {/* Neck with slight gentle tilt */}
            <rect x="154" y="118" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head */}
            <circle cx="160" cy="100" r="26" fill={skinColor} />
            {/* Warm soft eyes & smiling lips */}
            <circle cx="153" cy="98" r="2" fill="#1e293b" />
            <circle cx="167" cy="98" r="2" fill="#1e293b" />
            <path
              d="M 154 108 Q 160 114 166 108"
              stroke="#e11d48"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'stressed':
        // Head resting in hands, forward slump
        return (
          <g id="pose-stressed">
            {/* Slumped torso */}
            <path
              d="M 130 145 L 190 145 L 186 215 L 134 215 Z"
              fill={outfitColor}
            />
            {/* Arms reaching to head */}
            <path
              d="M 132 150 Q 110 135 136 105 Q 140 110 126 138 Q 134 145 138 150 Z"
              fill={outfitColor}
            />
            <path
              d="M 188 150 Q 210 135 184 105 Q 180 110 194 138 Q 186 145 182 150 Z"
              fill={outfitColor}
            />
            {/* Hands pressed against temples */}
            <circle cx="136" cy="104" r="7" fill={skinColor} />
            <circle cx="184" cy="104" r="7" fill={skinColor} />
            {/* Neck */}
            <rect x="154" y="122" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head slightly lowered */}
            <circle cx="160" cy="104" r="25" fill={skinColor} />
            {/* Stressed brow and tight mouth */}
            <path
              d="M 148 97 L 156 100"
              stroke="#475569"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 172 97 L 164 100"
              stroke="#475569"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 155 113 Q 160 109 165 113"
              stroke="#475569"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'sad':
        // Head tilted down, curled posture, contemplative gaze
        return (
          <g id="pose-sad">
            {/* Rounded posture */}
            <path
              d="M 132 142 L 188 142 L 184 215 L 136 215 Z"
              fill={outfitColor}
            />
            {/* Arms resting closely in front */}
            <path
              d="M 134 146 Q 128 180 152 188 Q 152 180 138 168 Q 140 152 142 146 Z"
              fill={outfitColor}
            />
            <path
              d="M 186 146 Q 192 180 168 188 Q 168 180 182 168 Q 180 152 178 146 Z"
              fill={outfitColor}
            />
            <circle cx="160" cy="188" r="6" fill={skinColor} />
            {/* Neck */}
            <rect x="154" y="124" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head tilted down */}
            <circle cx="160" cy="106" r="25" fill={skinColor} />
            {/* Downward eyes and gentle sorrow line */}
            <path
              d="M 150 103 Q 154 106 157 104"
              stroke="#334155"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 163 104 Q 166 106 170 103"
              stroke="#334155"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 156 116 Q 160 113 164 116"
              stroke="#334155"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'angry':
        // Squared shoulders, crossed arms, determined stance
        return (
          <g id="pose-angry">
            {/* Squared torso */}
            <path
              d="M 126 136 L 194 136 L 190 215 L 130 215 Z"
              fill={outfitColor}
            />
            {/* Crossed arms banner */}
            <path
              d="M 126 140 Q 160 178 194 140 L 186 156 Q 160 190 134 156 Z"
              fill={outfitColor}
            />
            <rect x="146" y="160" width="28" height="12" rx="4" fill={outfitColor} />
            {/* Firm neck */}
            <rect x="154" y="118" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head */}
            <circle cx="160" cy="100" r="26" fill={skinColor} />
            {/* Determined brows & firm straight mouth */}
            <path
              d="M 148 94 L 156 97"
              stroke="#1e293b"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 172 94 L 164 97"
              stroke="#1e293b"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="152" cy="99" r="1.8" fill="#1e293b" />
            <circle cx="168" cy="99" r="1.8" fill="#1e293b" />
            <line
              x1="154"
              y1="110"
              x2="166"
              y2="110"
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );

      case 'neutral':
      default:
        // Balanced, comfortable standing resting posture
        return (
          <g id="pose-neutral">
            {/* Torso */}
            <path
              d="M 134 136 L 186 136 L 190 215 L 130 215 Z"
              fill={outfitColor}
            />
            {/* Natural side arms */}
            <path
              d="M 134 140 Q 120 175 124 198 Q 130 198 136 175 Q 140 152 140 142 Z"
              fill={outfitColor}
            />
            <circle cx="124" cy="200" r="6" fill={skinColor} />
            <path
              d="M 186 140 Q 200 175 196 198 Q 190 198 184 175 Q 180 152 180 142 Z"
              fill={outfitColor}
            />
            <circle cx="196" cy="200" r="6" fill={skinColor} />
            {/* Neck */}
            <rect x="154" y="118" width="12" height="18" fill={skinColor} rx="2" />
            {/* Head */}
            <circle cx="160" cy="100" r="26" fill={skinColor} />
            {/* Pleasant neutral eyes & gentle relaxed line */}
            <circle cx="153" cy="98" r="2" fill="#1e293b" />
            <circle cx="167" cy="98" r="2" fill="#1e293b" />
            <path
              d="M 156 109 Q 160 111 164 109"
              stroke="#1e293b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hair */}
            {renderHair()}
          </g>
        );
    }
  };

  // Background thematic silhouettes (Directive 15: simple low-opacity silhouette per theme)
  const renderBackgroundMotif = () => {
    const stroke = atmosphere.motifStroke;

    switch (primaryTheme) {
      case 'work':
        return (
          <g>
            {/* Desk surface & laptop silhouette behind character */}
            <rect x="30" y="175" width="260" height="10" rx="2" fill={stroke} fillOpacity={0.15} />
            <rect x="65" y="130" width="55" height="42" rx="2" fill={stroke} fillOpacity={0.16} />
            <polygon points="55,175 130,175 122,171 62,171" fill={stroke} fillOpacity={0.2} />
            {/* Desk lamp & organizer silhouette */}
            <path d="M 235 175 L 245 125 L 225 130 L 220 115 L 250 115 L 245 130 Z" fill={stroke} fillOpacity={0.18} />
            <rect x="250" y="155" width="16" height="20" rx="2" fill={stroke} fillOpacity={0.15} />
            {/* Soft architectural window silhouette */}
            <rect x="40" y="55" width="65" height="65" rx="3" fill="none" stroke={stroke} strokeWidth="1.5" strokeOpacity={0.2} strokeDasharray="4 4" />
          </g>
        );

      case 'relationships':
        return (
          <g>
            {/* Two overlapping companion figure silhouettes & uniting heart */}
            <circle cx="115" cy="95" r="16" fill={stroke} fillOpacity={0.16} />
            <path d="M 88 185 C 88 135 142 135 142 185 Z" fill={stroke} fillOpacity={0.15} />
            <circle cx="205" cy="95" r="16" fill={stroke} fillOpacity={0.16} />
            <path d="M 178 185 C 178 135 232 135 232 185 Z" fill={stroke} fillOpacity={0.15} />
            <path
              d="M 160 110 C 148 88 126 92 126 112 C 126 134 160 155 160 155 C 160 155 194 134 194 112 C 194 92 172 88 160 110 Z"
              fill={stroke}
              fillOpacity={0.2}
            />
          </g>
        );

      case 'family':
        return (
          <g>
            {/* Hearth & home house silhouette with chimney and warm roof */}
            <polygon points="75,140 160,65 245,140" fill={stroke} fillOpacity={0.18} />
            <rect x="90" y="140" width="140" height="75" rx="2" fill={stroke} fillOpacity={0.14} />
            <rect x="202" y="75" width="18" height="35" rx="1" fill={stroke} fillOpacity={0.2} />
            {/* Welcoming arched doorway and windows */}
            <path d="M 145 215 L 145 175 C 145 165 175 165 175 175 L 175 215 Z" fill="#FAF6EE" fillOpacity={0.65} />
            <rect x="106" y="152" width="22" height="22" rx="2" fill="#FAF6EE" fillOpacity={0.65} />
            <rect x="192" y="152" width="22" height="22" rx="2" fill="#FAF6EE" fillOpacity={0.65} />
          </g>
        );

      case 'health':
        return (
          <g>
            {/* Vital botanical leaves and wellness pulse wave silhouette */}
            <path
              d="M 160 155 C 122 108 86 82 122 48 C 146 28 160 62 160 62 C 160 62 174 28 198 48 C 234 82 198 108 160 155 Z"
              fill={stroke}
              fillOpacity={0.13}
            />
            {/* Twin botanical sprouting leaves */}
            <path d="M 160 180 C 115 155 85 105 95 70 C 125 75 155 120 160 180 Z" fill={stroke} fillOpacity={0.16} />
            <path d="M 160 180 C 205 155 235 105 225 70 C 195 75 165 120 160 180 Z" fill={stroke} fillOpacity={0.16} />
            {/* Gentle lifeline rhythm */}
            <path d="M 30 185 L 85 185 L 105 155 L 125 205 L 145 170 L 165 185 L 290 185" stroke={stroke} strokeWidth="1.8" strokeOpacity="0.25" fill="none" />
          </g>
        );

      case 'social':
        return (
          <g>
            {/* Gathering circle silhouettes and conversation bubbles */}
            <circle cx="75" cy="110" r="15" fill={stroke} fillOpacity={0.15} />
            <path d="M 50 185 C 50 145 100 145 100 185 Z" fill={stroke} fillOpacity={0.15} />
            <circle cx="245" cy="110" r="15" fill={stroke} fillOpacity={0.15} />
            <path d="M 220 185 C 220 145 270 145 270 185 Z" fill={stroke} fillOpacity={0.15} />
            {/* Speech bubble silhouettes */}
            <rect x="58" y="55" width="48" height="30" rx="8" fill={stroke} fillOpacity={0.17} />
            <polygon points="76,85 84,95 88,85" fill={stroke} fillOpacity={0.17} />
            <rect x="212" y="50" width="52" height="32" rx="8" fill={stroke} fillOpacity={0.17} />
            <polygon points="230,82 225,92 240,82" fill={stroke} fillOpacity={0.17} />
          </g>
        );

      case 'hobbies':
        return (
          <g>
            {/* Creative artist palette and musical acoustic silhouette */}
            <path
              d="M 90 145 C 55 145 45 100 75 75 C 105 50 145 65 135 100 C 130 115 118 115 108 125 C 100 133 108 145 90 145 Z"
              fill={stroke}
              fillOpacity={0.17}
            />
            <circle cx="75" cy="95" r="5" fill="#FAF6EE" fillOpacity={0.8} />
            <circle cx="95" cy="80" r="4" fill={stroke} fillOpacity={0.3} />
            <circle cx="115" cy="90" r="4" fill={stroke} fillOpacity={0.3} />
            {/* Acoustic instrument body */}
            <path
              d="M 230 70 L 236 98 C 225 104 220 118 228 130 C 215 142 218 175 238 175 C 258 175 262 142 248 130 C 256 118 252 104 240 98 L 245 70 Z"
              fill={stroke}
              fillOpacity={0.17}
            />
          </g>
        );

      case 'finances':
        return (
          <g>
            {/* Balance scales & steady coin stack silhouette */}
            <rect x="157" y="55" width="6" height="135" rx="2" fill={stroke} fillOpacity={0.18} />
            <rect x="65" y="68" width="190" height="6" rx="2" fill={stroke} fillOpacity={0.18} />
            <path d="M 60 125 Q 90 155 120 125 Z" fill={stroke} fillOpacity={0.16} />
            <line x1="90" y1="74" x2="60" y2="125" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.25" />
            <line x1="90" y1="74" x2="120" y2="125" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.25" />
            <path d="M 200 125 Q 230 155 260 125 Z" fill={stroke} fillOpacity={0.16} />
            <line x1="230" y1="74" x2="200" y2="125" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.25" />
            <line x1="230" y1="74" x2="260" y2="125" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.25" />
            {/* Coin stacks */}
            <rect x="80" y="195" width="35" height="9" rx="3" fill={stroke} fillOpacity={0.18} />
            <rect x="82" y="184" width="31" height="9" rx="3" fill={stroke} fillOpacity={0.18} />
            <rect x="85" y="173" width="25" height="9" rx="3" fill={stroke} fillOpacity={0.18} />
          </g>
        );

      case 'personal_growth':
        return (
          <g>
            {/* Mountain summit with radiant rising sunburst silhouette */}
            <circle cx="160" cy="75" r="30" fill={stroke} fillOpacity={0.16} />
            <path
              d="M 160 30 L 160 40 M 125 45 L 132 52 M 195 45 L 188 52 M 110 75 L 120 75 M 210 75 L 200 75"
              stroke={stroke}
              strokeWidth="2"
              strokeOpacity="0.28"
              strokeLinecap="round"
            />
            {/* Twin mountain peaks */}
            <polygon points="20,215 110,115 190,215" fill={stroke} fillOpacity={0.14} />
            <polygon points="130,215 215,130 300,215" fill={stroke} fillOpacity={0.16} />
            {/* Sprouting seedling */}
            <path d="M 160 215 Q 158 185 160 170 C 150 165 140 170 142 178 C 145 182 155 180 160 175" stroke={stroke} strokeWidth="2" strokeOpacity="0.3" fill="none" />
          </g>
        );

      case 'other':
      default:
        return (
          <g>
            {/* Compass rose & winding pathway silhouette */}
            <circle cx="235" cy="75" r="26" fill={stroke} fillOpacity={0.12} stroke={stroke} strokeWidth="1" strokeOpacity="0.2" />
            <polygon points="235,52 240,71 259,75 240,79 235,98 230,79 211,75 230,71" fill={stroke} fillOpacity={0.22} />
            {/* Winding horizon road */}
            <path d="M 160 130 Q 120 170 190 200 L 250 218 L 70 218 Q 140 180 155 130 Z" fill={stroke} fillOpacity={0.14} />
          </g>
        );
    }
  };

  const getEntityIcon = (type: 'person' | 'place' | 'activity') => {
    switch (type) {
      case 'person':
        return <UserIcon className="w-3 h-3 text-indigo-600 inline" />;
      case 'place':
        return <MapPin className="w-3 h-3 text-emerald-600 inline" />;
      case 'activity':
      default:
        return <Sparkles className="w-3 h-3 text-amber-600 inline" />;
    }
  };

  const displayCaption = caption?.trim() || emotionMeta.tagline;

  return (
    <div
      id="visual-story-panel"
      className={`relative overflow-hidden rounded-xl border-[2.5px] border-[#171410] bg-gradient-to-b ${atmosphere.bgGradient} shadow-[3px_3px_0px_#171410] transition-all duration-300 ${className}`}
    >
      {/* Atmosphere header pill */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 text-xs pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-md font-sans text-[11px] font-semibold border border-[#171410] shadow-[1px_1px_0px_#171410] ${emotionMeta.badgeBg}`}
          >
            {emotionMeta.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#FAF6EE] text-[#171410] border border-[#171410] font-sans font-medium text-[11px] shadow-[1px_1px_0px_#171410]">
            {themeMeta.label}
          </span>
        </div>

        {dateLabel && (
          <span className="text-[11px] font-sans font-medium text-[#171410] bg-[#FAF6EE] px-2.5 py-0.5 rounded-md border border-[#171410] shadow-[1px_1px_0px_#171410]">
            {dateLabel}
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full aspect-[4/3] flex items-center justify-center pt-5 pb-1">
        <svg
          viewBox="0 0 320 240"
          className="w-full h-full max-w-full drop-shadow-xs select-none"
        >
          <defs>
            <linearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={atmosphere.motifStroke} stopOpacity="0.14" />
              <stop offset="100%" stopColor={atmosphere.motifStroke} stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Aura behind character */}
          <circle cx="160" cy="140" r="75" fill="url(#centerAura)" />

          {/* Thematic Background Silhouette (Directive 15) */}
          {renderBackgroundMotif()}

          {/* Grounding shadow */}
          <ellipse cx="160" cy="216" rx="42" ry="6" fill="url(#groundGlow)" />

          {/* Character in emotional pose */}
          {renderPose()}
        </svg>
      </div>

      {/* Distinct Comic-Style Caption Box (Directive 15) */}
      <div className="border-t-[2.5px] border-[#171410] bg-[#FAF6EE] p-3">
        {/* Bordered Caption Box */}
        <div
          id="comic-caption-box"
          className="bg-[#FDFBF7] border-[1.5px] border-[#171410] rounded-md px-3 py-2 shadow-[1.5px_1.5px_0px_#171410]"
        >
          <p className="text-xs font-serif text-[#171410] leading-snug line-clamp-3 italic">
            "{displayCaption}"
          </p>
        </div>

        {/* Panel Meta Footer: Recurring entities & sentiment descriptor */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
            {entities && entities.length > 0 ? (
              entities.slice(0, 3).map((ent, i) => (
                <span
                  key={`${ent.name}-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4EDE0] text-[#171410] text-[10px] font-medium border border-[#171410]/30 shrink-0"
                  title={`${ent.name} (${ent.type}, mentioned ${ent.mentionCount}x)`}
                >
                  {getEntityIcon(ent.type)}
                  <span>{ent.name}</span>
                  {ent.mentionCount > 1 && (
                    <span className="text-[9px] text-[#171410]/70 bg-[#171410]/10 px-1 rounded-full font-sans">
                      ×{ent.mentionCount}
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#171410]/60 font-serif italic">
                {emotionMeta.tagline}
              </span>
            )}
          </div>

          <div className="shrink-0 text-[11px] text-[#171410] flex items-center gap-1.5 font-sans font-medium">
            <span className="font-mono font-bold">
              {sentimentScore > 0 ? `+${sentimentScore.toFixed(2)}` : sentimentScore.toFixed(2)}
            </span>
            <span className="text-[#171410]/80">{sentimentLabel}</span>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-[#171410]/30"
              style={{ backgroundColor: emotionMeta.ringColor }}
              title={`${emotionMeta.label}: ${sentimentLabel}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
