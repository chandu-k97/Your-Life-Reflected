import React from 'react';
import { User } from 'firebase/auth';
import { AvatarConfig } from '../types';
import { getHairHex, getSkinHex } from '../utils/visualPresets';
import { BookOpen, Sparkles, Calendar, LogOut, Sliders } from 'lucide-react';

interface AppHeaderProps {
  user: User | null;
  avatarConfig: AvatarConfig | null;
  currentTab: 'journal' | 'history' | 'recap' | 'profile';
  onTabChange: (tab: 'journal' | 'history' | 'recap') => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  entryCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  avatarConfig,
  currentTab,
  onTabChange,
  onOpenProfile,
  onSignOut,
  entryCount = 0,
}) => {
  const skinColor = avatarConfig ? getSkinHex(avatarConfig.skinTone) : '#f2cbaf';
  const hairColor = avatarConfig ? getHairHex(avatarConfig.hairColor) : '#44281b';

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-[#171410] text-[#F1E9D8] border-b border-[#C9962F]/20 transition-colors shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Philosophy */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#28221B] border border-[#C9962F]/30 flex items-center justify-center text-[#C9962F] shadow-xs">
              <Sparkles className="w-4 h-4 text-[#C9962F]" />
            </div>
            <div>
              <h1 className="text-base font-serif font-bold text-[#F1E9D8] tracking-tight leading-tight">
                Your Life, Reflected
              </h1>
              <p className="text-[11px] text-[#F1E9D8]/60 hidden sm:block font-serif italic">
                We don't write your story; we help you see it.
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 bg-[#231F1A] p-1 rounded-xl border border-[#3D352C] text-xs">
            <button
              type="button"
              id="nav-tab-journal"
              onClick={() => onTabChange('journal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentTab === 'journal'
                  ? 'bg-[#FAF6EE] text-[#171410] font-semibold shadow-xs'
                  : 'text-[#F1E9D8]/70 hover:text-[#F1E9D8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>

            <button
              type="button"
              id="nav-tab-history"
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-[#FAF6EE] text-[#171410] font-semibold shadow-xs'
                  : 'text-[#F1E9D8]/70 hover:text-[#F1E9D8]'
              }`}
            >
              <span>Past Storyboards</span>
              {entryCount > 0 && (
                <span className="text-[10px] bg-[#C9962F]/20 text-[#C9962F] px-1.5 py-0.2 rounded-full font-mono font-medium">
                  {entryCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-recap"
              onClick={() => onTabChange('recap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentTab === 'recap'
                  ? 'bg-[#FAF6EE] text-[#171410] font-semibold shadow-xs'
                  : 'text-[#F1E9D8]/70 hover:text-[#F1E9D8]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Arc</span>
            </button>
          </nav>

          {/* User Profile & Actions (Directive 14) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-header-profile"
              onClick={onOpenProfile}
              title="Your Story So Far (Profile & Settings)"
              className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border transition-colors text-xs cursor-pointer ${
                currentTab === 'profile'
                  ? 'border-[#C9962F] bg-[#2A231C] text-[#C9962F]'
                  : 'border-[#3D352C] bg-[#231F1A] hover:bg-[#2D2721] text-[#F1E9D8]'
              }`}
            >
              {/* Mini Avatar Pill */}
              <div className="w-6 h-6 rounded-full overflow-hidden relative border border-[#C9962F]/40 bg-[#171410] flex items-center justify-center shrink-0">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: skinColor }}
                />
                <div
                  className="absolute top-0 w-3.5 h-1.5 rounded-t-full"
                  style={{ backgroundColor: hairColor }}
                />
              </div>
              <span className="hidden md:inline font-sans text-xs">
                Story So Far
              </span>
              <Sliders className="w-3 h-3 text-[#C9962F]" />
            </button>

            <button
              type="button"
              id="btn-sign-out"
              onClick={onSignOut}
              title="Sign Out"
              className="p-2 rounded-xl border border-[#3D352C] bg-[#231F1A] hover:bg-[#2D2721] text-[#F1E9D8]/70 hover:text-[#F1E9D8] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
