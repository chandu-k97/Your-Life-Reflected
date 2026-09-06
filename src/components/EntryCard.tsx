import React, { useState } from 'react';
import { AvatarConfig, JournalEntry, PanelConfig, AnalysisResult } from '../types';
import { VisualStoryPanel } from './VisualStoryPanel';
import {
  updateEntryAnalysis,
  updateJournalEntryContent,
  deleteJournalEntry,
} from '../lib/firebase';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface EntryCardProps {
  entry: JournalEntry;
  avatarConfig: AvatarConfig | null;
  onEntryUpdated?: (updated: JournalEntry) => void;
  onEntryDeleted?: (deletedId: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  avatarConfig,
  onEntryUpdated,
  onEntryDeleted,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Edit Mode State (Directive 10)
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editDate, setEditDate] = useState(entry.entryDate || entry.createdAt.split('T')[0]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation State (Directive 10)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Derive date to display: prioritize user-specified entryDate (Directive 8)
  const activeEntryDateStr = entry.entryDate || entry.createdAt.split('T')[0];
  const formattedEntryDate = new Date(activeEntryDateStr + 'T12:00:00').toLocaleDateString(
    undefined,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const formattedCreatedTime = new Date(entry.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isStale = Boolean(entry.panel?.isStale);

  /**
   * Re-runs the extraction call and clears the stale flag (Directive 9)
   */
  const handleRefreshReflection = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch('/api/extract-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          text: entry.content,
          userId: entry.userId,
          entryDate: entry.entryDate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Reflection generation failed');
      }

      const freshPanel: PanelConfig = {
        ...(data.panel as PanelConfig),
        isStale: false,
      };

      const updates: Partial<JournalEntry> = {
        analysisStatus: 'completed',
        analysis: data.analysis as AnalysisResult,
        panel: freshPanel,
        analysisError: undefined,
      };

      await updateEntryAnalysis(entry.userId, entry.id, updates);

      if (onEntryUpdated) {
        onEntryUpdated({
          ...entry,
          ...updates,
        });
      }
    } catch (err: any) {
      console.error('Failed to generate reflection:', err);
      setRetryError(err?.message || 'Failed to generate reflection');
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Saves edited text and marks panel as stale (Directive 9 & 10)
   */
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    setIsSavingEdit(true);
    setEditError(null);

    let validDate = editDate || todayStr;
    if (validDate > todayStr) {
      validDate = todayStr;
      setEditDate(todayStr);
    }

    try {
      await updateJournalEntryContent(
        entry.userId,
        entry.id,
        editContent.trim(),
        validDate,
        entry.panel
      );

      const updatedEntry: JournalEntry = {
        ...entry,
        content: editContent.trim(),
        entryDate: validDate,
        updatedAt: new Date().toISOString(),
        ...(entry.panel ? { panel: { ...entry.panel, isStale: true } } : {}),
      };

      setIsEditing(false);
      if (onEntryUpdated) {
        onEntryUpdated(updatedEntry);
      }
    } catch (err: any) {
      console.error('Failed to save edited entry:', err);
      setEditError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  /**
   * Confirmed Delete Action (Directive 10)
   */
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteJournalEntry(entry.userId, entry.id);
      if (onEntryDeleted) {
        onEntryDeleted(entry.id);
      }
    } catch (err: any) {
      console.error('Failed to delete journal entry:', err);
      setDeleteError(err?.message || 'Failed to delete entry');
      setIsDeleting(false);
    }
  };

  return (
    <article
      id={`entry-card-${entry.id}`}
      className="bg-[#FAF6EE] rounded-3xl border border-[#171410]/12 overflow-hidden transition-all shadow-xs"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Left Column: Storyboard Panel */}
        <div className="md:col-span-5 p-5 bg-[#F4EDE0]/50 border-b md:border-b-0 md:border-r border-[#171410]/10 flex flex-col justify-center">
          {/* Stale Warning Banner (Directive 9) */}
          {isStale && entry.panel && (
            <div
              id={`stale-panel-banner-${entry.id}`}
              className="mb-3 p-3 rounded-2xl bg-[#F9F3E5] border border-[#C9962F]/40 text-[#5B4009] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#C9962F] shrink-0" />
                <span className="font-medium text-[11px]">
                  Text edited — reflection is stale
                </span>
              </div>
              <button
                type="button"
                id={`btn-refresh-reflection-${entry.id}`}
                onClick={handleRefreshReflection}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-[#171410] hover:bg-[#2A231C] text-[#F1E9D8] text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer shrink-0 border border-[#C9962F]/30"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`}
                />
                <span>{isRetrying ? 'Refreshing...' : 'Refresh reflection'}</span>
              </button>
            </div>
          )}

          {entry.panel ? (
            <div className="relative">
              <VisualStoryPanel
                avatar={avatarConfig}
                panel={entry.panel}
                dateLabel={formattedEntryDate}
                caption={entry.content}
              />
              {isStale && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-[#FAF6EE] text-[#5B4009] border border-[#171410] text-[10px] font-sans font-medium shadow-[1px_1px_0px_#171410]">
                  Stale reflection
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-dashed border-[#171410]/20 bg-[#FDFBF7] p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF6EE] flex items-center justify-center text-[#C9962F] mb-3 border border-[#C9962F]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-serif font-bold text-[#171410]">
                No Reflection Panel Yet
              </p>
              <p className="text-[11px] text-[#171410]/60 mt-1 max-w-[200px] font-sans">
                {entry.analysisError
                  ? `Analysis paused: ${entry.analysisError}`
                  : 'Your raw words were preserved without reflection.'}
              </p>

              {retryError && (
                <div className="mt-2 text-[10px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                  {retryError}
                </div>
              )}

              <button
                type="button"
                id={`btn-retry-entry-${entry.id}`}
                onClick={handleRefreshReflection}
                disabled={isRetrying}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#171410] hover:bg-[#2A231C] text-[#F1E9D8] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer border border-[#C9962F]/30"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`}
                />
                <span>{isRetrying ? 'Analyzing...' : 'Generate Reflection'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: User Raw Words & Timeline Details */}
        <div className="md:col-span-7 p-6 flex flex-col justify-between bg-[#FAF6EE]">
          <div>
            {/* Header info & CRUD Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-[#171410]/70 pb-2 border-b border-[#171410]/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 font-serif font-bold text-[#171410]">
                  <Calendar className="w-3.5 h-3.5 text-[#C9962F]" />
                  {formattedEntryDate}
                </span>
                <span className="text-[#171410]/20">•</span>
                <span className="flex items-center gap-1 text-[11px] text-[#171410]/60 font-sans" title="Created timestamp">
                  <Clock className="w-3 h-3 text-[#171410]/40" />
                  {formattedCreatedTime}
                </span>

                {entry.updatedAt && (
                  <span className="text-[10px] text-[#171410]/50 font-serif italic">
                    (edited)
                  </span>
                )}
              </div>

              {/* Action Controls: Edit & Delete (Directive 10) */}
              <div className="flex items-center gap-1.5">
                {entry.analysis?.dominantEmotion && !isEditing && (
                  <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#F4EDE0] text-[#171410] text-[11px] font-sans font-medium border border-[#171410]/15 mr-1">
                    {entry.analysis.dominantEmotion}
                  </span>
                )}

                {!isEditing && (
                  <>
                    <button
                      type="button"
                      id={`btn-edit-entry-${entry.id}`}
                      onClick={() => {
                        setIsEditing(true);
                        setEditContent(entry.content);
                        setEditDate(entry.entryDate || entry.createdAt.split('T')[0]);
                        setEditError(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[#171410]/80 hover:text-[#171410] hover:bg-[#F4EDE0] transition-colors text-xs font-medium cursor-pointer"
                      title="Edit entry text"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-entry-${entry.id}`}
                      onClick={() => setIsConfirmingDelete(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[#171410]/60 hover:text-rose-700 hover:bg-rose-50 transition-colors text-xs font-medium cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Confirm Delete Warning Banner (Directive 10) */}
            {isConfirmingDelete && (
              <div
                id={`confirm-delete-banner-${entry.id}`}
                className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-950">
                      Permanently delete this journal reflection?
                    </p>
                    <p className="text-rose-700 text-[11px] mt-0.5">
                      This action will remove your raw entry and its visual storyboard from your private storage. This cannot be undone.
                    </p>

                    {deleteError && (
                      <p className="text-rose-800 text-[11px] font-medium mt-1">
                        {deleteError}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        id={`btn-confirm-delete-${entry.id}`}
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-medium text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Reflection'}
                      </button>

                      <button
                        type="button"
                        id={`btn-cancel-delete-${entry.id}`}
                        onClick={() => setIsConfirmingDelete(false)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode vs Read Mode */}
            {isEditing ? (
              <div id={`edit-form-${entry.id}`} className="space-y-3">
                {/* Date Picker for Backdating/Editing Date */}
                <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 w-fit">
                  <Calendar className="w-3.5 h-3.5 text-stone-600" />
                  <label htmlFor={`edit-date-${entry.id}`} className="text-[11px] text-stone-600 font-medium">
                    Entry Date:
                  </label>
                  <input
                    type="date"
                    id={`edit-date-${entry.id}`}
                    value={editDate}
                    max={todayStr}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="text-[11px] font-mono text-stone-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer"
                  />
                </div>

                <textarea
                  id={`edit-textarea-${entry.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full text-sm text-stone-800 font-serif leading-relaxed p-3 bg-stone-50/70 rounded-2xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-800 resize-none"
                  placeholder="Edit your reflection text..."
                />

                {editError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {editError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-stone-500 italic">
                    Saving marks reflection panel as stale until refreshed.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-cancel-edit-${entry.id}`}
                      onClick={() => setIsEditing(false)}
                      disabled={isSavingEdit}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      id={`btn-save-edit-${entry.id}`}
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit || !editContent.trim()}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingEdit ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Unaltered text content in Read Mode */
              <div className="relative">
                <div
                  className={`text-sm text-stone-800 leading-relaxed font-serif ${
                    !isExpanded ? 'line-clamp-6' : ''
                  }`}
                >
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                </div>

                {entry.content.length > 300 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-xs font-semibold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Show less' : 'Read full entry'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Themes and Entities */}
          {entry.analysis && !isEditing && (
            <div className="mt-5 pt-4 border-t border-[#171410]/10 flex flex-wrap items-center gap-2">
              <span className="text-xs font-serif italic text-[#171410]/60">
                Reflected themes:
              </span>
              {entry.analysis.themes?.map((th) => (
                <span
                  key={th}
                  className="px-2.5 py-0.5 rounded-md bg-[#F4EDE0] text-[#171410] text-[11px] font-sans font-medium border border-[#171410]/10 capitalize"
                >
                  {th.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
