import React, { useState } from 'react';
import { AvatarConfig } from '../types';
import {
  SKIN_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  OUTFIT_COLOR_OPTIONS,
  DEFAULT_AVATAR,
} from '../utils/visualPresets';
import { VisualStoryPanel } from './VisualStoryPanel';
import { Check, Sparkles, UserCheck, X } from 'lucide-react';

interface AvatarCustomizerModalProps {
  initialConfig?: AvatarConfig | null;
  onSave: (config: AvatarConfig) => Promise<void>;
  onCancel?: () => void;
  isFirstSetup?: boolean;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  initialConfig,
  onSave,
  onCancel,
  isFirstSetup = true,
}) => {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || DEFAULT_AVATAR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(config);
    } catch (err: any) {
      console.error('Failed to save avatar configuration:', err);
      setError(err?.message || 'Unable to save avatar configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="avatar-customizer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171410]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="avatar-customizer-dialog"
        className="w-full max-w-3xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#171410]/20 overflow-hidden flex flex-col md:flex-row my-8 relative text-[#171410]"
      >
        {/* Top-Right Dismiss Button (Directive 11) */}
        {onCancel && (
          <button
            type="button"
            id="btn-cancel-avatar-x"
            onClick={onCancel}
            disabled={saving}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#F4EDE0] hover:bg-[#E8DEC7] text-[#171410]/70 hover:text-[#171410] transition-colors cursor-pointer border border-[#171410]/10"
            title="Cancel without saving"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Left Side: Live Storyboard Preview */}
        <div className="w-full md:w-5/12 bg-[#F4EDE0]/70 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#171410]/10">
          <div className="text-center mb-4">
            <span className="text-xs font-serif italic text-[#171410]/70 bg-[#FAF6EE] px-3 py-1 rounded-full border border-[#171410]/10">
              Reflection preview
            </span>
            <h3 className="text-base font-serif font-bold text-[#171410] mt-2">
              Your Visual Character
            </h3>
            <p className="text-xs text-[#171410]/70 mt-1 max-w-[240px] font-sans">
              This character represents you across all your upcoming visual storyboards.
            </p>
          </div>

          <div className="w-full max-w-[270px]">
            <VisualStoryPanel
              avatar={config}
              emotion="calm"
              theme="personal_growth"
              sentiment={0.4}
              dateLabel="Live Preview"
              caption="Centered in stillness — ready to mirror your journey."
            />
          </div>
        </div>

        {/* Right Side: Options Selector */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-serif font-bold text-[#171410] tracking-tight">
                {isFirstSetup ? 'Craft Your Character' : 'Your Storyboard Avatar'}
              </h2>
              <p className="text-xs text-[#171410]/70 mt-1 font-sans">
                Choose the attributes that feel most like you. Once chosen, this character silently mirrors your journey.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Skin Tone */}
              <div>
                <label className="text-xs font-serif font-bold text-[#171410] block mb-2">
                  Skin tone
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SKIN_OPTIONS.map((skin) => {
                    const isSelected = config.skinTone === skin.id;
                    return (
                      <button
                        key={skin.id}
                        type="button"
                        id={`skin-option-${skin.id}`}
                        onClick={() => setConfig({ ...config, skinTone: skin.id })}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#171410] bg-[#171410] text-[#F1E9D8] shadow-xs'
                            : 'border-[#171410]/15 bg-[#FDFBF7] text-[#171410]/80 hover:border-[#171410]/30'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: skin.color }}
                        />
                        <span>{skin.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#C9962F]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <label className="text-xs font-serif font-bold text-[#171410] block mb-2">
                  Hair style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HAIR_STYLE_OPTIONS.map((style) => {
                    const isSelected = config.hairStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        id={`hair-style-${style.id}`}
                        onClick={() => setConfig({ ...config, hairStyle: style.id })}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#171410] bg-[#171410] text-[#F1E9D8] shadow-xs'
                            : 'border-[#171410]/15 bg-[#FDFBF7] text-[#171410]/80 hover:border-[#171410]/30'
                        }`}
                      >
                        <span>{style.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#C9962F]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="text-xs font-serif font-bold text-[#171410] block mb-2">
                  Hair color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {HAIR_COLOR_OPTIONS.map((color) => {
                    const isSelected = config.hairColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        id={`hair-color-${color.id}`}
                        onClick={() => setConfig({ ...config, hairColor: color.id })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#171410] bg-[#171410] text-[#F1E9D8] shadow-xs'
                            : 'border-[#171410]/15 bg-[#FDFBF7] text-[#171410]/80 hover:border-[#171410]/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: color.color }}
                        />
                        <span>{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outfit Color */}
              <div>
                <label className="text-xs font-serif font-bold text-[#171410] block mb-2">
                  Outfit color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {OUTFIT_COLOR_OPTIONS.map((outfit) => {
                    const isSelected = config.outfitColor === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        type="button"
                        id={`outfit-color-${outfit.id}`}
                        onClick={() => setConfig({ ...config, outfitColor: outfit.id })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#171410] bg-[#171410] text-[#F1E9D8] shadow-xs'
                            : 'border-[#171410]/15 bg-[#FDFBF7] text-[#171410]/80 hover:border-[#171410]/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: outfit.color }}
                        />
                        <span>{outfit.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#171410]/10 flex flex-col sm:flex-row items-center gap-3">
            {onCancel && (
              <button
                type="button"
                id="btn-cancel-avatar-bottom"
                onClick={onCancel}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#171410]/20 bg-[#FAF6EE] hover:bg-[#F4EDE0] text-[#171410] text-sm font-medium transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              id="btn-confirm-avatar"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#C9962F] hover:bg-[#B88525] text-[#171410] font-sans font-semibold text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#171410]/30 border-t-[#171410] rounded-full animate-spin" />
                  <span>Saving Your Character...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Save & Continue to Reflection Journal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
