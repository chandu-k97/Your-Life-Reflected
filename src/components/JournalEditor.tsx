import React, { useState } from 'react';
import { AvatarConfig, JournalEntry, PanelConfig, AnalysisResult } from '../types';
import { saveRawJournalEntry, updateEntryAnalysis } from '../lib/firebase';
import { VisualStoryPanel } from './VisualStoryPanel';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Sparkles,
  ShieldCheck,
  Feather,
  Calendar,
} from 'lucide-react';

interface JournalEditorProps {
  userId: string;
  avatarConfig: AvatarConfig | null;
  onEntrySaved: (entry: JournalEntry) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  avatarConfig,
  onEntrySaved,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState<string>(todayStr);
  const [isSavingRaw, setIsSavingRaw] = useState(false);
  const [rawSaveSuccess, setRawSaveSuccess] = useState(false);
  const [rawSaveError, setRawSaveError] = useState<string | null>(null);

  // Decoupled analysis state for the active entry
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isNewlyGenerated, setIsNewlyGenerated] = useState(false);

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  /**
   * Triggers the asynchronous reflection extraction for a confirmed saved entry
   */
  const triggerAsyncReflection = async (savedEntry: JournalEntry) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/extract-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          text: savedEntry.content,
          userId: savedEntry.userId,
          entryDate: savedEntry.entryDate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Reflection extraction failed');
      }

      const updatedFields: Partial<JournalEntry> = {
        analysisStatus: 'completed',
        analysis: data.analysis as AnalysisResult,
        panel: data.panel as PanelConfig,
        analysisError: undefined,
      };

      // Persist analysis and panel updates to Firestore
      await updateEntryAnalysis(savedEntry.userId, savedEntry.id, updatedFields);

      const completedEntry: JournalEntry = {
        ...savedEntry,
        ...updatedFields,
      };

      setIsNewlyGenerated(true);
      setActiveEntry(completedEntry);
      onEntrySaved(completedEntry);
    } catch (err: any) {
      console.warn('Async reflection extraction failed:', err);
      const errorMsg = err?.message || 'AI reflection is currently unavailable';
      setAnalysisError(errorMsg);

      const failedUpdates: Partial<JournalEntry> = {
        analysisStatus: 'failed',
        analysisError: errorMsg,
      };

      await updateEntryAnalysis(savedEntry.userId, savedEntry.id, failedUpdates);

      const entryWithFailure: JournalEntry = {
        ...savedEntry,
        ...failedUpdates,
      };

      setActiveEntry(entryWithFailure);
      onEntrySaved(entryWithFailure);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Primary Save Action: Decoupled raw text persistence FIRST
   */
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSavingRaw(true);
    setRawSaveError(null);
    setRawSaveSuccess(false);

    // Directive 8: Validate entryDate does not exceed today
    let validDate = entryDate || todayStr;
    if (validDate > todayStr) {
      validDate = todayStr;
      setEntryDate(todayStr);
    }

    const entryId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const textToSave = content.trim();

    let savedEntry: JournalEntry | null = null;

    try {
      // Step 1: Raw entry saved to Firestore immediately with distinct entryDate
      savedEntry = await saveRawJournalEntry(userId, entryId, textToSave, validDate);

      // Confirm success to the user immediately
      setRawSaveSuccess(true);
      setActiveEntry(savedEntry);
      onEntrySaved(savedEntry);

      // Clear input buffer ONLY after guaranteed write confirmation
      setContent('');
    } catch (err: any) {
      console.error('Failed to save raw journal entry to Firestore:', err);
      setRawSaveError(
        'Unable to persist your journal entry to Cloud Firestore. Your text is kept in the editor so you can retry.'
      );
      setIsSavingRaw(false);
      return; // Do not proceed to analysis if save failed
    }

    setIsSavingRaw(false);

    // Step 2: Asynchronously trigger extraction independently
    if (savedEntry) {
      triggerAsyncReflection(savedEntry);
    }
  };

  /**
   * Manual retry specifically for reflection extraction (non-blocking)
   */
  const handleRetryReflection = () => {
    if (activeEntry) {
      triggerAsyncReflection(activeEntry);
    }
  };

  return (
    <div id="journal-editor-container" className="space-y-6">
      {/* Editor Card */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#171410]/12 shadow-xs overflow-hidden transition-all">
        {/* Editor Header */}
        <div className="px-6 py-4 border-b border-[#171410]/10 flex flex-wrap items-center justify-between gap-3 bg-[#F4EDE0]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#C9962F]" />
              <span className="text-xs font-serif font-bold text-[#171410]">
                Daily Writing
              </span>
            </div>

            {/* Backdating / Calendar Date Picker (Directive 8) */}
            <div className="flex items-center gap-2 bg-[#FAF6EE] hover:bg-[#F0E6D2] transition-colors px-3 py-1 rounded-xl border border-[#171410]/15">
              <Calendar className="w-3.5 h-3.5 text-[#171410]/70 shrink-0" />
              <label htmlFor="journal-entry-date" className="text-[11px] font-medium text-[#171410]/80">
                Date:
              </label>
              <input
                type="date"
                id="journal-entry-date"
                value={entryDate}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setEntryDate(val > todayStr ? todayStr : val);
                  }
                }}
                className="text-[11px] font-mono text-[#171410] bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer"
                title="Select entry date (past date or today)"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#171410]/70">
            <span className="hidden sm:inline font-mono text-[11px]">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <span className="hidden sm:inline text-[#171410]/30">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#171410] font-medium bg-[#E8DEC7]/70 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Private & Unaltered</span>
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveEntry} className="p-6">
          <textarea
            id="journal-input-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSavingRaw}
            placeholder="Write your reflections openly... What unfolded today? What weighed on your mind, or what brought a moment of stillness? (We never alter or rewrite your words)."
            rows={7}
            className="w-full text-[#171410] placeholder-[#171410]/40 bg-transparent text-sm sm:text-base font-serif leading-relaxed resize-none focus:outline-none focus:ring-0 border-none p-0 selection:bg-[#C9962F]/20"
          />

          {/* Error Banner for Raw Save Failure */}
          {rawSaveError && (
            <div
              id="raw-save-error-banner"
              className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rawSaveError}</span>
              </div>
              <button
                type="button"
                onClick={handleSaveEntry}
                className="px-3 py-1 bg-rose-700 text-white rounded-xl font-medium text-[11px] hover:bg-rose-800 shrink-0 cursor-pointer"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* Raw Save Success Confirmation Toast */}
          {rawSaveSuccess && !rawSaveError && (
            <div
              id="raw-save-success-banner"
              className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2 animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your journal entry was saved securely to your private storage.</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-5 pt-4 border-t border-[#171410]/10 flex items-center justify-between gap-4">
            <p className="text-xs text-[#171410]/65 font-serif italic">
              Your words remain unaltered. Silently mirrored into your visual storyboard.
            </p>

            <button
              type="submit"
              id="btn-save-journal-entry"
              disabled={isSavingRaw || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#C9962F] hover:bg-[#B88525] text-[#171410] font-sans text-xs font-semibold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSavingRaw ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#171410]/30 border-t-[#171410] rounded-full animate-spin" />
                  <span>Saving Entry...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Decoupled Asynchronous Reflection Section */}
      {activeEntry && (
        <div
          id="instant-reflection-card"
          className="bg-[#FAF6EE] rounded-3xl border border-[#171410]/12 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9962F]" />
              <h3 className="text-sm font-serif font-bold text-[#171410]">
                Visual Reflection
              </h3>
            </div>
            <span className="text-xs text-[#171410]/60 font-serif italic">
              Derived from silent analysis
            </span>
          </div>

          {/* State 1: Active Analysis in Progress */}
          {isAnalyzing && (
            <div
              id="reflection-analyzing-state"
              className="py-12 flex flex-col items-center justify-center text-center bg-[#FDFBF7] rounded-2xl border border-[#171410]/10"
            >
              <div className="w-10 h-10 rounded-full bg-[#C9962F]/15 border border-[#C9962F]/30 flex items-center justify-center text-[#C9962F] mb-3 animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <h4 className="text-sm font-serif font-bold text-[#171410]">
                Composing your visual storyboard...
              </h4>
              <p className="text-xs text-[#171410]/70 mt-1 max-w-sm font-sans">
                Mapping dominant emotion, thematic motifs, and recurring entities into your personal character panel.
              </p>
            </div>
          )}

          {/* State 2: Analysis Completed with Panel */}
          {!isAnalyzing && activeEntry.panel && (
            <div id="reflection-completed-panel" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Storyboard Panel with Signature Reveal Moment (Directive 13) */}
              <div
                className={`md:col-span-6 w-full max-w-md mx-auto ${
                  isNewlyGenerated ? 'signature-reveal' : ''
                }`}
              >
                <VisualStoryPanel
                  avatar={avatarConfig}
                  panel={activeEntry.panel}
                  caption={activeEntry.content}
                  dateLabel={
                    activeEntry.entryDate
                      ? new Date(activeEntry.entryDate + 'T12:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Today'
                  }
                />
              </div>

              {/* Reflection Insights */}
              <div className="md:col-span-6 space-y-4">
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#171410]/10">
                  <span className="text-xs font-serif italic text-[#171410]/60 block mb-1">
                    Reflected State
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-serif font-bold text-[#171410] capitalize">
                      {activeEntry.panel.dominantEmotion}
                    </span>
                    <span className="text-[#171410]/30">•</span>
                    <span className="text-xs font-sans text-[#171410]/70 capitalize">
                      {activeEntry.panel.primaryTheme}
                    </span>
                  </div>
                  <p className="text-xs text-[#171410]/80 leading-relaxed font-sans">
                    Your avatar adopted a pose reflecting{' '}
                    <strong>{activeEntry.panel.dominantEmotion}</strong> energy, framed by motifs of{' '}
                    <strong>{activeEntry.panel.primaryTheme}</strong>.
                  </p>
                </div>

                {/* Raw entry review */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#171410]/10">
                  <span className="text-xs font-serif italic text-[#171410]/60 block mb-1">
                    Your Recorded Words
                  </span>
                  <p className="text-xs text-[#171410]/80 italic line-clamp-4 leading-relaxed font-serif">
                    "{activeEntry.content}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* State 3: Analysis Failed with non-blocking retry */}
          {!isAnalyzing && !activeEntry.panel && analysisError && (
            <div
              id="reflection-failure-banner"
              className="p-5 bg-white rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 text-stone-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Reflection generation paused</span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Your journal entry is safely preserved. The visual analysis couldn't be generated immediately ({analysisError}).
                </p>
              </div>

              <button
                type="button"
                id="btn-retry-reflection"
                onClick={handleRetryReflection}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Reflection</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
