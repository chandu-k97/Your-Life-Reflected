import React, { useState, useEffect, useMemo } from 'react';
import {
  AvatarConfig,
  DominantEmotion,
  JournalEntry,
  Theme,
  WeeklyRecap,
} from '../types';
import { VisualStoryPanel } from './VisualStoryPanel';
import { getWeeklyRecaps, saveWeeklyRecap } from '../lib/firebase';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Layers,
  ChevronRight,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

interface WeeklyRecapViewProps {
  userId: string;
  entries: JournalEntry[];
  avatarConfig: AvatarConfig | null;
  onNavigateToWrite: () => void;
}

export const WeeklyRecapView: React.FC<WeeklyRecapViewProps> = ({
  userId,
  entries,
  avatarConfig,
  onNavigateToWrite,
}) => {
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([]);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeCaption, setNarrativeCaption] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isNewlySynthesized, setIsNewlySynthesized] = useState(false);

  /**
   * Group entries by ISO week (YYYY-Www) using entryDate (Directive 8)
   * Backdated entries land in their respective historical week.
   */
  const groupEntriesByWeek = (entriesList: JournalEntry[]) => {
    const map = new Map<string, JournalEntry[]>();

    entriesList.forEach((entry) => {
      // Must use entryDate, NOT createdAt
      const rawDate = entry.entryDate || entry.createdAt.split('T')[0];
      const d = new Date(rawDate + 'T12:00:00');

      // Calculate week start date (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);

      const year = monday.getFullYear();
      const firstJan = new Date(year, 0, 1);
      const weekNum = Math.ceil(
        ((monday.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7
      );
      const key = `${year}-W${String(weekNum).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(entry);
    });

    return map;
  };

  const weekGroups = useMemo(() => groupEntriesByWeek(entries), [entries]);
  const weekKeys = useMemo(() => Array.from(weekGroups.keys()), [weekGroups]);

  // Load existing recaps from Firestore
  useEffect(() => {
    const loadSavedRecaps = async () => {
      try {
        const saved = await getWeeklyRecaps(userId);
        setRecaps(saved);
      } catch (err) {
        console.warn('Failed to load saved weekly recaps:', err);
      }
    };
    if (userId) {
      loadSavedRecaps();
    }
  }, [userId]);

  // Set default selected week
  useEffect(() => {
    if (weekKeys.length > 0 && (!selectedWeekKey || !weekGroups.has(selectedWeekKey))) {
      setSelectedWeekKey(weekKeys[0]);
    }
  }, [weekKeys, selectedWeekKey, weekGroups]);

  // Update caption when selected week changes
  useEffect(() => {
    const existingRecap = recaps.find((r) => r.id === selectedWeekKey);
    if (existingRecap) {
      setNarrativeCaption(existingRecap.narrativeCaption);
    } else {
      setNarrativeCaption('');
    }
  }, [selectedWeekKey, recaps]);

  // Current week entries sorted chronologically by entryDate (Directive 8)
  const currentWeekEntries = useMemo(() => {
    if (!selectedWeekKey) return [];
    const list = weekGroups.get(selectedWeekKey) || [];
    return [...list].sort((a, b) => {
      const dateA = a.entryDate || a.createdAt.split('T')[0];
      const dateB = b.entryDate || b.createdAt.split('T')[0];
      const comp = dateA.localeCompare(dateB);
      if (comp !== 0) return comp;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }, [selectedWeekKey, weekGroups]);

  const existingRecap = recaps.find((r) => r.id === selectedWeekKey);

  /**
   * Directive 9: Weekly Recap Staleness Detection
   * Compares the entry set currently matching this week's entryDate range against
   * the entryIds array stored on the weeklyRecaps document at generation time.
   */
  const isRecapStale = useMemo(() => {
    if (!existingRecap) return false;

    const currentEntryIds = currentWeekEntries.map((e) => e.id);
    const savedEntryIds = existingRecap.entryIds || [];

    // Check if entries were added, backdated into, or deleted
    if (currentEntryIds.length !== savedEntryIds.length) {
      return true;
    }
    const savedSet = new Set(savedEntryIds);
    for (const id of currentEntryIds) {
      if (!savedSet.has(id)) {
        return true;
      }
    }

    // Check if any entry in this week was edited after the recap was generated
    const recapTimestamp = existingRecap.generatedAt || existingRecap.createdAt;
    if (recapTimestamp) {
      const recapTime = new Date(recapTimestamp).getTime();
      const anyEditedAfter = currentWeekEntries.some((e) => {
        if (!e.updatedAt) return false;
        return new Date(e.updatedAt).getTime() > recapTime;
      });
      if (anyEditedAfter) return true;
    }

    return false;
  }, [existingRecap, currentWeekEntries]);

  // Compute structured statistics for the selected week
  const computeWeekStats = (weekEntries: JournalEntry[]) => {
    const emotionsCount: Record<string, number> = {};
    const themesCount: Record<string, number> = {};
    let totalSentiment = 0;
    let sentimentCount = 0;

    weekEntries.forEach((e) => {
      if (e.analysis) {
        const em = e.analysis.dominantEmotion;
        emotionsCount[em] = (emotionsCount[em] || 0) + 1;

        e.analysis.themes?.forEach((th) => {
          themesCount[th] = (themesCount[th] || 0) + 1;
        });

        totalSentiment += e.analysis.sentimentScore;
        sentimentCount++;
      }
    });

    const dominantThemes = Object.entries(themesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k as Theme);

    const averageSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;

    return { emotionsCount, dominantThemes, averageSentiment };
  };

  const currentStats = computeWeekStats(currentWeekEntries);

  /**
   * Generates single Gemini narrative caption synthesizing the arc of the week
   * using structured data only (never raw text)
   * Updates entryIds + generatedAt (Directive 9)
   */
  const handleGenerateNarrative = async () => {
    if (currentWeekEntries.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Prepare structured summary (dates, emotions, themes, sentiment, top entities)
      const structuredSummary = currentWeekEntries.map((e) => {
        const rawDate = e.entryDate || e.createdAt.split('T')[0];
        return {
          date: new Date(rawDate + 'T12:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          dominantEmotion: e.analysis?.dominantEmotion || 'neutral',
          themes: e.analysis?.themes || [],
          sentimentScore: e.analysis?.sentimentScore ?? 0,
          entities: e.analysis?.entities || [],
        };
      });

      const res = await fetch('/api/generate-weekly-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          entries: structuredSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize weekly narrative');
      }

      const newCaption =
        data.narrativeCaption || 'Your week: an evolving arc of mindful self-discovery.';
      setNarrativeCaption(newCaption);

      const nowIso = new Date().toISOString();
      const firstEntryDate =
        currentWeekEntries[0]?.entryDate || currentWeekEntries[0]?.createdAt || nowIso;
      const lastEntryDate =
        currentWeekEntries[currentWeekEntries.length - 1]?.entryDate ||
        currentWeekEntries[currentWeekEntries.length - 1]?.createdAt ||
        nowIso;

      // Persist the WeeklyRecap object with entryIds + generatedAt
      const newRecap: WeeklyRecap = {
        id: selectedWeekKey,
        userId,
        weekStartDate: firstEntryDate,
        weekEndDate: lastEntryDate,
        entryIds: currentWeekEntries.map((e) => e.id),
        narrativeCaption: newCaption,
        createdAt: existingRecap?.createdAt || nowIso,
        generatedAt: nowIso,
        dominantThemes: currentStats.dominantThemes,
        emotionsDistribution: currentStats.emotionsCount,
        averageSentiment: currentStats.averageSentiment,
      };

      await saveWeeklyRecap(userId, newRecap);

      setIsNewlySynthesized(true);
      setRecaps((prev) => {
        const filtered = prev.filter((r) => r.id !== selectedWeekKey);
        return [newRecap, ...filtered];
      });
    } catch (err: any) {
      console.error('Narrative generation error:', err);
      setGenerationError(err?.message || 'Unable to generate narrative arc right now');
    } finally {
      setIsGenerating(false);
    }
  };

  if (entries.length === 0) {
    return (
      <div
        id="weekly-recap-empty-state"
        className="py-16 px-6 text-center bg-white rounded-3xl border border-stone-200 shadow-xs max-w-lg mx-auto"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto mb-4">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900">
          No Weekly Reflections Yet
        </h3>
        <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
          Write a few free-form journal entries throughout your week. As your reflections accumulate, they will be organized into an illustrated weekly storyboard.
        </p>
        <button
          type="button"
          onClick={onNavigateToWrite}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Write Your First Reflection</span>
        </button>
      </div>
    );
  }

  return (
    <div id="weekly-recap-container" className="space-y-8">
      {/* Header & Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-serif italic text-[#171410]/70 bg-[#F4EDE0] px-3 py-1 rounded-full border border-[#171410]/10">
            Aggregated Storyboard
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#171410] mt-2 tracking-tight">
            Weekly Arc & Narrative
          </h2>
          <p className="text-xs text-[#171410]/70 mt-0.5 font-sans">
            Grouped by entry date and synthesized across your saved visual panels.
          </p>
        </div>

        {/* Week Switcher */}
        {weekKeys.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#171410]/70 font-medium">Select Week:</span>
            <select
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#171410]/15 bg-[#FAF6EE] text-xs font-medium text-[#171410] shadow-xs focus:outline-none cursor-pointer"
            >
              {weekKeys.map((wk) => (
                <option key={wk} value={wk}>
                  Week {wk} ({weekGroups.get(wk)?.length || 0} reflections)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Non-Blocking Staleness Banner (Directive 9) */}
      {isRecapStale && existingRecap && (
        <div
          id="weekly-recap-stale-banner"
          className="p-4 rounded-2xl bg-[#F9F3E5] border border-[#C9962F]/40 text-[#5B4009] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#C9962F] shrink-0" />
            <div>
              <p className="text-xs font-serif font-bold text-[#171410]">
                This week changed — tap to refresh recap.
              </p>
              <p className="text-[11px] text-[#5B4009] mt-0.5 font-sans">
                Reflections in this week were added, backdated, edited, or removed since this narrative was created.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-refresh-stale-recap"
            onClick={handleGenerateNarrative}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#171410] hover:bg-[#2A231C] text-[#F1E9D8] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shrink-0 border border-[#C9962F]/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Refreshing Recap...' : 'Refresh Recap'}</span>
          </button>
        </div>
      )}

      {/* Synthesis Hero Banner with Signature Reveal Moment (Directive 13) */}
      <div
        id="weekly-narrative-banner"
        className={`relative overflow-hidden rounded-3xl bg-[#171410] text-[#F1E9D8] p-6 sm:p-8 border border-[#C9962F]/30 shadow-md ${
          isNewlySynthesized ? 'signature-reveal' : ''
        }`}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#C9962F]" />
            <span className="text-xs font-serif italic text-[#C9962F]">
              Narrative Synthesis
            </span>
          </div>

          {narrativeCaption ? (
            <blockquote className="text-lg sm:text-xl font-serif italic text-[#F1E9D8] leading-relaxed">
              "{narrativeCaption}"
            </blockquote>
          ) : (
            <p className="text-sm text-[#F1E9D8]/70 leading-relaxed font-sans">
              Synthesize the arc of your week based on your recorded emotional markers and themes.
            </p>
          )}

          {generationError && (
            <p className="mt-3 text-xs text-rose-300 bg-rose-950/50 p-2 rounded-xl border border-rose-800/60 font-sans">
              {generationError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-synthesize-narrative"
              onClick={handleGenerateNarrative}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9962F] hover:bg-[#B88525] text-[#171410] text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
              />
              <span>
                {isGenerating
                  ? 'Synthesizing Arc...'
                  : narrativeCaption
                  ? 'Re-Synthesize Arc'
                  : 'Generate Weekly Arc Caption'}
              </span>
            </button>
            <span className="text-[11px] text-[#F1E9D8]/50 font-sans">
              Analyzed over {currentWeekEntries.length} reflection {currentWeekEntries.length === 1 ? 'panel' : 'panels'}
            </span>
          </div>
        </div>

        {/* Subtle decorative motif */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Layers className="w-64 h-64 text-[#C9962F]" />
        </div>
      </div>

      {/* Structured Distribution Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#171410]/12 shadow-xs">
          <span className="text-xs font-serif italic text-[#171410]/60 block mb-1">
            Dominant themes
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {currentStats.dominantThemes.length > 0 ? (
              currentStats.dominantThemes.map((th) => (
                <span
                  key={th}
                  className="px-2.5 py-0.5 rounded-md bg-[#F4EDE0] text-[#171410] text-xs font-sans font-medium border border-[#171410]/10 capitalize"
                >
                  {th.replace('_', ' ')}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#171410]/40 font-serif italic">No themes recorded</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#171410]/12 shadow-xs">
          <span className="text-xs font-serif italic text-[#171410]/60 block mb-1">
            Reflected emotions
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(currentStats.emotionsCount).length > 0 ? (
              Object.entries(currentStats.emotionsCount).map(([em, count]) => (
                <span
                  key={em}
                  className="px-2.5 py-0.5 rounded-md bg-[#F4EDE0] text-[#171410] text-xs font-sans font-medium border border-[#171410]/10 capitalize"
                >
                  {em}: {count}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#171410]/40 font-serif italic">No emotions recorded</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#171410]/12 shadow-xs">
          <span className="text-xs font-serif italic text-[#171410]/60 block mb-1">
            Sentiment balance
          </span>
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C9962F]" />
            <span className="text-base font-bold text-[#171410] font-mono">
              {currentStats.averageSentiment > 0
                ? `+${currentStats.averageSentiment.toFixed(2)}`
                : currentStats.averageSentiment.toFixed(2)}
            </span>
            <span className="text-xs text-[#171410]/70 font-sans">
              {currentStats.averageSentiment > 0.2
                ? 'Warm & uplifting'
                : currentStats.averageSentiment < -0.2
                ? 'Introspective & deep'
                : 'Steady equilibrium'}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Panel Chronological Storyboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-serif font-bold text-[#171410]">
            Chronological Visual Panels ({currentWeekEntries.length})
          </h3>
          <span className="text-xs text-[#171410]/60 font-serif italic">
            Grouped by reflection date
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentWeekEntries.map((entry, index) => {
            const rawDate = entry.entryDate || entry.createdAt.split('T')[0];
            const dateStr = new Date(rawDate + 'T12:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={entry.id}
                className="bg-[#FAF6EE] rounded-2xl border-2 border-[#171410] p-3 shadow-[2.5px_2.5px_0px_#171410] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#171410]/70 mb-2 px-1">
                    <span className="font-serif font-bold text-[#171410]">
                      Panel {index + 1}
                    </span>
                    <span className="font-sans text-[11px] text-[#171410]/60 font-medium">{dateStr}</span>
                  </div>

                  {entry.panel ? (
                    <div className="relative">
                      <VisualStoryPanel
                        avatar={avatarConfig}
                        panel={entry.panel}
                        caption={entry.content}
                        size="sm"
                        dateLabel={dateStr}
                      />
                      {entry.panel.isStale && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#5B4009] border border-[#171410] text-[9px] font-sans font-medium shadow-[1px_1px_0px_#171410]">
                          Stale
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#F4EDE0] flex flex-col items-center justify-center p-4 text-center border-[2px] border-[#171410]">
                      <p className="text-xs text-[#171410]/70 font-serif mb-2">
                        Raw journal entry preserved
                      </p>
                      <div className="w-full bg-[#FDFBF7] border border-[#171410] rounded-md px-3 py-2 text-xs font-serif text-[#171410] line-clamp-3 italic shadow-[1px_1px_0px_#171410]">
                        "{entry.content}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
