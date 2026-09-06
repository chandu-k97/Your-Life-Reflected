import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { VisualStoryPanel } from './VisualStoryPanel';
import { Sparkles, Shield, BookOpen, Layers, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSignedIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignedIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onSignedIn();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      // Handle popup closed or blocked
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again when ready.');
      } else {
        setError(err?.message || 'Authentication encountered an error. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Your Life, Reflected
            </h1>
          </div>
        </div>

        <div>
          <button
            type="button"
            id="btn-nav-sign-in"
            onClick={handleSignIn}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
          </button>
        </div>
      </nav>

      {/* Main Hero & Promise */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/80 text-amber-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>A Mindful Journaling Experience</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-stone-900 leading-tight">
              "We don't write your story; <br />
              <span className="italic font-normal text-stone-600">
                we help you see it."
              </span>
            </h2>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl font-normal">
              Most AI apps want to write for you, autocomplete your thoughts, or summarize your feelings. <strong>Your Life, Reflected</strong> honors your unedited, raw voice. Write freely, and watch your inner journey mirror back as an illustrated visual storyboard.
            </p>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs max-w-md">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                id="btn-hero-sign-in"
                onClick={handleSignIn}
                disabled={loading}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Continue with Google Sign-In</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Encrypted & owner-isolated storage</span>
              </div>
            </div>

            {/* Core Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-stone-700" />
                  <span>Your Unedited Voice</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  No prompts, autocomplete, or AI rewrites. Your writing remains strictly your own.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                  <span>Visual Storyboards</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Silent emotional classification turns each entry into an empathetic visual panel.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mb-1">
                  <Layers className="w-3.5 h-3.5 text-stone-700" />
                  <span>Weekly Narrative Arc</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  End-of-week storyboards synthesize your personal emotional arc into a one-line reflection.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Storyboard Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-white p-3 rounded-3xl border border-stone-200/90 shadow-md">
                <VisualStoryPanel
                  emotion="grateful"
                  theme="relationships"
                  sentiment={0.65}
                  dateLabel="Today's Reflection"
                  entities={[
                    { name: 'Sarah', type: 'person', mentionCount: 2 },
                    { name: 'Riverfront', type: 'place', mentionCount: 1 },
                  ]}
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200 text-stone-700 text-xs flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">
                    "Held space for a quiet walk today..."
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Emotion: Grateful • Theme: Relationships • +0.65 Tone
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Saved
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-stone-200 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Your Life, Reflected. A quiet sanctuary for your real thoughts.</p>
        <div className="flex items-center gap-4">
          <span>Google Cloud Firestore</span>
          <span>•</span>
          <span>Gemini 3.6 Flash</span>
          <span>•</span>
          <span>Firebase Auth</span>
        </div>
      </footer>
    </div>
  );
};
