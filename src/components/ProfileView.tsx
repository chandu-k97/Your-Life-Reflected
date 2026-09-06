import React, { useState } from 'react';
import { AvatarConfig, JournalEntry, UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { deleteUserDataAndAccount } from '../lib/firebase';
import {
  User,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  SKIN_OPTIONS,
  HAIR_STYLE_OPTIONS,
  OUTFIT_COLOR_OPTIONS,
} from '../utils/visualPresets';

interface ProfileViewProps {
  user: FirebaseUser;
  profile: UserProfile | null;
  entries: JournalEntry[];
  onBack: () => void;
  onEditAvatar: () => void;
  onAccountDeleted: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  entries,
  onBack,
  onEditAvatar,
  onAccountDeleted,
}) => {
  const avatarConfig = profile?.avatarConfig;

  // Delete Flow State (Directive 14)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Compute sentence-style stats live from entries (Directive 14)
  const totalReflections = entries.length;

  let earliestDateFormatted: string | null = null;
  if (entries.length > 0) {
    const dates = entries
      .map((e) => e.entryDate || e.createdAt.split('T')[0])
      .sort();
    const earliest = dates[0];
    if (earliest) {
      earliestDateFormatted = new Date(earliest + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  // Longest streak calculation based on consecutive days by entryDate
  let longestStreak = 0;
  if (entries.length > 0) {
    const uniqueDates = Array.from(
      new Set(entries.map((e) => e.entryDate || e.createdAt.split('T')[0]))
    ).sort();

    let currentStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1] + 'T12:00:00').getTime();
      const curr = new Date(uniqueDates[i] + 'T12:00:00').getTime();
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
  }

  // Preset labels for avatar display
  const skinPreset = SKIN_OPTIONS.find((p) => p.id === avatarConfig?.skinTone);
  const hairPreset = HAIR_STYLE_OPTIONS.find((p) => p.id === avatarConfig?.hairStyle);
  const outfitPreset = OUTFIT_COLOR_OPTIONS.find((p) => p.id === avatarConfig?.outfitColor);

  const handleDeleteData = async () => {
    if (confirmationInput.trim() !== 'DELETE MY DATA') {
      setDeleteError('Please type "DELETE MY DATA" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteUserDataAndAccount();

    if (result.success) {
      onAccountDeleted();
    } else {
      setIsDeleting(false);
      setDeleteError(
        result.error ||
          'Failed to complete account deletion. Please re-authenticate and try again.'
      );
    }
  };

  return (
    <div id="profile-view" className="max-w-3xl mx-auto space-y-8">
      {/* Top Navigation Back Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-profile-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#171410]/70 hover:text-[#171410] transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Journal</span>
        </button>

        <span className="text-xs text-[#171410]/50 font-serif italic">
          Account & Editorial Profile
        </span>
      </div>

      {/* Page Title & Story Identity */}
      <div className="space-y-1">
        <h2 className="text-3xl font-serif text-[#171410] tracking-tight">
          Your Story So Far
        </h2>
        <p className="text-xs text-[#171410]/70 font-serif italic">
          The personal identity and records anchoring your visual reflection chronicle.
        </p>
      </div>

      {/* Primary Profile Card */}
      <div className="p-7 rounded-2xl bg-[#FAF6EE] border border-[#171410]/12 space-y-7">
        {/* Avatar Presentation Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#171410]/10">
          <div className="flex items-center gap-4">
            {/* Avatar Visual Badge */}
            <div className="relative w-16 h-16 rounded-2xl bg-[#171410] flex items-center justify-center text-[#F1E9D8] overflow-hidden border border-[#C9962F]/30 shadow-xs">
              {avatarConfig ? (
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-7 h-7 rounded-full border border-black/20"
                    style={{ backgroundColor: avatarConfig.skinTone }}
                  />
                  <div
                    className="w-10 h-4 rounded-t-lg mt-1"
                    style={{ backgroundColor: avatarConfig.outfitColor }}
                  />
                </div>
              ) : (
                <User className="w-8 h-8 text-[#C9962F]" />
              )}
            </div>

            <div>
              <h3 className="text-base font-serif font-bold text-[#171410]">
                {user.displayName || user.email?.split('@')[0] || 'Reflective Author'}
              </h3>
              <p className="text-xs text-[#171410]/60 font-sans">
                {user.email}
              </p>

              {avatarConfig && (
                <p className="text-[11px] text-[#C9962F] font-sans mt-0.5 font-medium">
                  {skinPreset?.label || 'Custom'} tone · {hairPreset?.label || 'Custom'} hair · {outfitPreset?.label || 'Custom'} attire
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            id="btn-profile-edit-avatar"
            onClick={onEditAvatar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171410] hover:bg-[#25201A] text-[#F1E9D8] text-xs font-medium transition-colors cursor-pointer border border-[#C9962F]/30 w-fit"
          >
            <Pencil className="w-3.5 h-3.5 text-[#C9962F]" />
            <span>Edit Avatar Identity</span>
          </button>
        </div>

        {/* Sentence-Style Stats Section (Directive 14 Mandate) */}
        <div className="space-y-2">
          <p className="text-xs text-[#171410]/60 font-medium font-sans">
            Reflective Journey
          </p>

          <p
            id="sentence-style-stats"
            className="text-base sm:text-lg text-[#171410] font-serif leading-relaxed"
          >
            {totalReflections} {totalReflections === 1 ? 'reflection' : 'reflections'} written
            {earliestDateFormatted ? ` · journaling since ${earliestDateFormatted}` : ''}
            {` · longest streak: ${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}.`}
          </p>

          <p className="text-xs text-[#171410]/55 font-serif italic pt-1">
            Calculated live from your private entry chronicle. Each reflection preserves your unedited words.
          </p>
        </div>
      </div>

      {/* Data Sovereignty & Deletion Section (Directive 14) */}
      <div className="p-7 rounded-2xl bg-[#FAF6EE] border border-rose-200/80 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-serif text-[#171410] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Personal Data & Privacy Sovereignty</span>
            </h4>
            <p className="text-xs text-[#171410]/70 font-sans leading-relaxed max-w-xl">
              All reflections, generated visual panels, and weekly synthesis recaps reside strictly in your private owner-isolated partition. You may permanently delete your entire account and all associated data at any time.
            </p>
          </div>

          <button
            type="button"
            id="btn-init-delete-data"
            onClick={() => {
              setConfirmationInput('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100/60 border border-rose-300 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete My Data</span>
          </button>
        </div>
      </div>

      {/* Explicit Confirmation Modal for Data Deletion (Directive 14) */}
      {showDeleteModal && (
        <div
          id="delete-confirmation-modal"
          className="fixed inset-0 z-50 bg-[#171410]/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[#FAF6EE] rounded-3xl border border-rose-300 p-6 sm:p-7 space-y-5 shadow-xl animate-fade-in text-[#171410]">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-rose-950">
                  Permanently Delete All Data?
                </h3>
                <p className="text-xs text-rose-700 font-sans">
                  This action is irreversible.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#171410]/80 leading-relaxed font-sans">
              <p>
                Confirming will perform an immediate cascading deletion of:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#171410]/90 pl-1">
                <li>All {totalReflections} journal reflections and raw entry texts</li>
                <li>All generated visual storyboards and emotional extractions</li>
                <li>All weekly narrative recap summaries and synthesis models</li>
                <li>Your avatar configuration and Google authentication profile</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#171410]/10">
              <label
                htmlFor="input-delete-phrase"
                className="block text-xs font-semibold text-[#171410]"
              >
                Type <span className="font-mono text-rose-700 font-bold">DELETE MY DATA</span> to confirm:
              </label>
              <input
                type="text"
                id="input-delete-phrase"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="DELETE MY DATA"
                disabled={isDeleting}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#171410]/20 text-xs font-mono text-[#171410] focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs leading-normal">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                id="btn-cancel-delete"
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setConfirmationInput('');
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#171410]/20 text-xs font-medium text-[#171410] hover:bg-[#171410]/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-delete-data"
                onClick={handleDeleteData}
                disabled={isDeleting || confirmationInput.trim() !== 'DELETE MY DATA'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Purge Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
