import React from 'react';
import { ChevronLeft, ChevronRight, X, Compass, Radio } from 'lucide-react';
import { STORY_CHAPTERS } from '../data/locations';
import { audioSystem } from '../services/audioSystem';

interface StoryTourOverlayProps {
  currentChapter: number;
  onSetChapter: (chapterId: number) => void;
  onExitStory: () => void;
  onShowToast: (msg: string) => void;
}

export const StoryTourOverlay: React.FC<StoryTourOverlayProps> = ({
  currentChapter,
  onSetChapter,
  onExitStory,
  onShowToast,
}) => {
  const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapter) || STORY_CHAPTERS[0];

  const handleNext = () => {
    if (currentChapter < STORY_CHAPTERS.length) {
      audioSystem.playWarp();
      onSetChapter(currentChapter + 1);
      onShowToast(`STORY TOUR: JUMPED TO CHAPTER ${currentChapter + 1}`);
    } else {
      audioSystem.playWarp();
      onSetChapter(1);
    }
  };

  const handlePrev = () => {
    if (currentChapter > 1) {
      audioSystem.playWarp();
      onSetChapter(currentChapter - 1);
      onShowToast(`STORY TOUR: JUMPED TO CHAPTER ${currentChapter - 1}`);
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-8 md:p-12">
      {/* Top Bar for Story Mode */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        <div className="hud-panel px-4 py-2 rounded-full border border-[#ff007f]/50 flex items-center gap-3">
          <Compass className="w-4 h-4 text-[#ff007f] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="font-orbitron font-bold text-xs tracking-wider text-white">
            CINEMATIC STORY TOUR
          </span>
          <span className="text-xs font-mono text-[#ff007f]">
            [{currentChapter} / {STORY_CHAPTERS.length}]
          </span>
        </div>

        <button
          onClick={onExitStory}
          className="hud-panel px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:border-[#00f0ff] transition flex items-center gap-2 text-xs font-mono cursor-pointer"
        >
          <span>EXIT TO MANUAL FLIGHT</span>
          <X className="w-4 h-4 text-[#00f0ff]" />
        </button>
      </div>

      {/* Main Chapter Narrative Card (Positioned mid-lower left, unobtrusive) */}
      <div className="max-w-xl w-full hud-panel p-6 sm:p-7 rounded-xl corner-brackets border border-[#ff007f]/40 box-glow-magenta pointer-events-auto my-auto self-start mt-auto mb-20">
        <div className="flex items-center gap-2 font-mono text-xs text-[#ff007f] tracking-widest uppercase mb-1.5">
          <Radio className="w-3.5 h-3.5 text-[#ff007f] animate-pulse" />
          <span>{chapter.subtitle}</span>
        </div>

        <h2 className="font-orbitron text-xl sm:text-2xl md:text-3xl font-black text-white glow-magenta uppercase tracking-wide mb-3">
          {chapter.title}
        </h2>

        <p className="font-rajdhani text-base sm:text-lg text-slate-200 leading-relaxed mb-6">
          {chapter.narrative}
        </p>

        {/* Chapter Steps & Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {STORY_CHAPTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  audioSystem.playWarp();
                  onSetChapter(c.id);
                }}
                className={`w-7 h-7 rounded text-xs font-mono transition cursor-pointer flex items-center justify-center ${
                  c.id === currentChapter
                    ? 'bg-[#ff007f] text-white font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                0{c.id}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentChapter === 1}
              className={`p-2 rounded hud-panel transition cursor-pointer ${
                currentChapter === 1
                  ? 'opacity-40 cursor-not-allowed text-slate-600'
                  : 'text-slate-200 hover:text-[#ff007f]'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded bg-[#ff007f] text-white font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#030712] transition flex items-center gap-1.5 cursor-pointer box-glow-magenta"
            >
              <span>{currentChapter === STORY_CHAPTERS.length ? 'REPLAY TOUR' : 'NEXT SECTOR'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
