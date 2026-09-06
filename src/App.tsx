/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  getUserProfile,
  saveUserProfile,
  saveUserAvatar,
  getUserJournalEntries,
  logOut,
} from './lib/firebase';
import { AvatarConfig, JournalEntry, UserProfile } from './types';
import { LandingPage } from './components/LandingPage';
import { AppHeader } from './components/AppHeader';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { JournalEditor } from './components/JournalEditor';
import { EntryCard } from './components/EntryCard';
import { WeeklyRecapView } from './components/WeeklyRecapView';
import { ProfileView } from './components/ProfileView';
import { BookOpen, Sparkles, Calendar, Layers, Plus } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);
  const [isFirstAvatarSetup, setIsFirstAvatarSetup] = useState(false);

  // Active dashboard tab: 'journal' | 'history' | 'recap' | 'profile'
  const [activeTab, setActiveTab] = useState<'journal' | 'history' | 'recap' | 'profile'>('journal');

  // Entries collection state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Load or initialize user profile from Firestore
          const existingProfile = await getUserProfile(currentUser.uid);
          if (existingProfile) {
            setProfile(existingProfile);
            if (!existingProfile.avatarConfig) {
              setIsFirstAvatarSetup(true);
              setShowAvatarSetup(true);
            }
          } else {
            // First time login: Create profile document and trigger avatar setup
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              avatarConfig: null,
              createdAt: new Date().toISOString(),
            };
            await saveUserProfile(newProfile);
            setProfile(newProfile);
            setIsFirstAvatarSetup(true);
            setShowAvatarSetup(true);
          }

          // Load user's journal entries from /users/{uid}/entries
          setLoadingEntries(true);
          const userEntries = await getUserJournalEntries(currentUser.uid);
          setEntries(userEntries);
        } catch (err) {
          console.error('Error during user profile initialization:', err);
        } finally {
          setLoadingEntries(false);
        }
      } else {
        setProfile(null);
        setEntries([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving avatar config
  const handleSaveAvatar = async (avatarConfig: AvatarConfig) => {
    if (!user) return;
    await saveUserAvatar(user.uid, avatarConfig);
    setProfile((prev) => (prev ? { ...prev, avatarConfig } : null));
    setShowAvatarSetup(false);
    setIsFirstAvatarSetup(false);
  };

  // Callback when a new entry is saved or updated
  const handleEntrySaved = (newOrUpdatedEntry: JournalEntry) => {
    setEntries((prev) => {
      const existsIndex = prev.findIndex((e) => e.id === newOrUpdatedEntry.id);
      let updatedList: JournalEntry[];
      if (existsIndex >= 0) {
        updatedList = [...prev];
        updatedList[existsIndex] = newOrUpdatedEntry;
      } else {
        updatedList = [newOrUpdatedEntry, ...prev];
      }
      return updatedList.sort((a, b) => {
        const dateA = a.entryDate || a.createdAt.split('T')[0];
        const dateB = b.entryDate || b.createdAt.split('T')[0];
        const comp = dateB.localeCompare(dateA);
        if (comp !== 0) return comp;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
    });
  };

  // Callback when an entry is deleted (Directive 10)
  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
  };

  // Sign out
  const handleSignOut = async () => {
    await logOut();
    setUser(null);
    setProfile(null);
    setEntries([]);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
          <p className="text-xs text-stone-600 font-serif italic">
            Your Life, Reflected...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render landing page with Google Sign-In
  if (!user) {
    return <LandingPage onSignedIn={() => {}} />;
  }

  return (
    <div id="app-root" className="min-h-screen bg-[#FAF6EE] text-[#171410] flex flex-col font-sans">
      {/* Header */}
      <AppHeader
        user={user}
        avatarConfig={profile?.avatarConfig || null}
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setActiveTab('profile')}
        onSignOut={handleSignOut}
        entryCount={entries.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Write Free-Form Journal & Instant Reflection */}
        {activeTab === 'journal' && (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center max-w-md mx-auto mb-2">
              <h2 className="text-2xl font-serif font-bold text-[#171410] tracking-tight">
                Daily Reflection
              </h2>
              <p className="text-xs text-[#171410]/70 mt-1 font-serif italic">
                Write freely. Your voice stays untouched; we simply hold up the mirror.
              </p>
            </div>

            <JournalEditor
              userId={user.uid}
              avatarConfig={profile?.avatarConfig || null}
              onEntrySaved={handleEntrySaved}
            />

            {/* Quick link to past storyboards if any exist */}
            {entries.length > 0 && (
              <div className="pt-6 border-t border-[#171410]/10 flex items-center justify-between text-xs text-[#171410]/70">
                <span>You have {entries.length} recorded {entries.length === 1 ? 'reflection' : 'reflections'}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="font-serif font-semibold text-[#171410] hover:text-[#C9962F] flex items-center gap-1 cursor-pointer"
                >
                  <span>View past storyboards</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Past Storyboards (History) */}
        {activeTab === 'history' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#171410] tracking-tight">
                  Your Storyboard Gallery
                </h2>
                <p className="text-xs text-[#171410]/70 mt-0.5 font-sans">
                  Each reflection visualizes the emotional and thematic imprint of your day.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171410] hover:bg-[#2A231C] text-[#F1E9D8] text-xs font-medium transition-all shadow-xs cursor-pointer border border-[#C9962F]/30"
              >
                <Plus className="w-3.5 h-3.5 text-[#C9962F]" />
                <span>Write Entry</span>
              </button>
            </div>

            {loadingEntries ? (
              <div className="py-16 text-center text-xs text-[#171410]/60 font-serif italic">
                Loading your storyboards...
              </div>
            ) : entries.length === 0 ? (
              <div className="py-16 px-6 text-center bg-[#FAF6EE] rounded-3xl border border-[#171410]/12 shadow-xs max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#F4EDE0] border border-[#171410]/10 flex items-center justify-center text-[#171410]/70 mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-[#C9962F]" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#171410]">
                  No Journal Reflections Yet
                </h3>
                <p className="text-xs text-[#171410]/70 mt-1 max-w-xs mx-auto font-sans">
                  When you write and save an entry, your personal visual storyboard panel will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('journal')}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9962F] hover:bg-[#B88525] text-[#171410] text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Write Your First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    avatarConfig={profile?.avatarConfig || null}
                    onEntryUpdated={handleEntrySaved}
                    onEntryDeleted={handleEntryDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Weekly Arc & Storyboard Recap */}
        {activeTab === 'recap' && (
          <div className="max-w-5xl mx-auto">
            <WeeklyRecapView
              userId={user.uid}
              entries={entries}
              avatarConfig={profile?.avatarConfig || null}
              onNavigateToWrite={() => setActiveTab('journal')}
            />
          </div>
        )}

        {/* Tab 4: Your Story So Far (Profile & Data Management - Directive 14) */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
            <ProfileView
              user={user}
              profile={profile}
              entries={entries}
              onBack={() => setActiveTab('journal')}
              onEditAvatar={() => {
                setIsFirstAvatarSetup(false);
                setShowAvatarSetup(true);
              }}
              onAccountDeleted={() => {
                setUser(null);
                setProfile(null);
                setEntries([]);
              }}
            />
          </div>
        )}
      </main>

      {/* One-Time Avatar Setup Modal on first login or profile settings */}
      {showAvatarSetup && (
        <AvatarCustomizerModal
          initialConfig={profile?.avatarConfig}
          onSave={handleSaveAvatar}
          onCancel={() => setShowAvatarSetup(false)}
          isFirstSetup={isFirstAvatarSetup}
        />
      )}
    </div>
  );
}
