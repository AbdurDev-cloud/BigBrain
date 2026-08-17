import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MenuBackButton } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useGuitarProgress, saveGuitarProgress, toggleGuitarItem, resetGuitarProgress, useGuitarLogs, addGuitarLog, deleteGuitarLog } from '@/db/hooks';
import type { GuitarLevel } from '@/db/database';
import { Check, ChevronDown, RotateCcw, Plus, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static progression data — never stored in DB
// ---------------------------------------------------------------------------

const GUITAR_STAGES = [
  {
    name: 'Getting Started',
    items: ['Set up your guitar', 'Learn to hold it properly', 'Understand string names', 'Pick vs fingers basics'],
  },
  {
    name: 'Tuning',
    items: ['Standard tuning (EADGBE)', 'Using a digital tuner', 'Tuning by ear basics', 'Alternate tunings awareness'],
  },
  {
    name: 'First Chords',
    items: ['Em chord', 'Am chord', 'C chord', 'G chord', 'D chord'],
  },
  {
    name: 'Chord Changes',
    items: ['Em → Am transitions', 'C → G transitions', 'G → D transitions', 'Smooth chord switching', '1-minute chord change drill'],
  },
  {
    name: 'Basic Strumming',
    items: ['Downstroke pattern', 'Down-up pattern', 'Muted strumming', 'Rhythm consistency', 'Strumming with a metronome'],
  },
  {
    name: 'Basic Scales',
    items: ['Pentatonic minor scale', 'Major scale pattern', 'Chromatic exercises', 'Scale speed practice'],
  },
  {
    name: 'Songs',
    items: ['First easy song', 'Play along with recording', 'Sing and play together', 'Learn 3 full songs'],
  },
  {
    name: 'Barre Chords',
    items: ['F barre chord', 'B barre chord', 'Barre chord transitions', 'Barre with strumming patterns'],
  },
  {
    name: 'Fingerstyle',
    items: ['Basic fingerpicking pattern', 'Travis picking intro', 'Fingerstyle with chords', 'Learn a fingerstyle piece'],
  },
  {
    name: 'Improvisation',
    items: ['Improvise over backing track', 'Use pentatonic for solos', 'Bending and vibrato', 'Create your own riffs'],
  },
];

const LEVEL_START_INDEX: Record<GuitarLevel, number> = {
  beginner: 0,
  basics: 3,
  advanced: 6,
};

const LEVEL_OPTIONS: { level: GuitarLevel; label: string }[] = [
  { level: 'beginner', label: "I'm starting from zero" },
  { level: 'basics', label: 'I know the basics' },
  { level: 'advanced', label: 'I want to get better' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuitarPage() {
  const progress = useGuitarProgress();
  const [isChoosingLevel, setIsChoosingLevel] = useState(false);
  const [showMusicLog, setShowMusicLog] = useState(false);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  // Loading state
  if (progress === undefined) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader title="Learn Guitar" description="Loading..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Level selection (first visit)
  // ---------------------------------------------------------------------------
  if (progress === null) {
    if (showMusicLog) return <MusicLogPage onBack={() => setShowMusicLog(false)} />;
    return <LevelSelection onBack={() => window.dispatchEvent(new Event('bigbrain:open-menu'))} onOpenLog={() => setShowMusicLog(true)} />;
  }

  if (isChoosingLevel) {
    if (showMusicLog) return <MusicLogPage onBack={() => setShowMusicLog(false)} />;
    return <LevelSelection
      onBack={() => setIsChoosingLevel(false)}
      onOpenLog={() => setShowMusicLog(true)}
      onSelect={async (level) => {
        await saveGuitarProgress(level, progress.completedItems);
        setIsChoosingLevel(false);
      }}
    />;
  }

  // ---------------------------------------------------------------------------
  // Timeline view
  // ---------------------------------------------------------------------------
  const startIndex = LEVEL_START_INDEX[progress.level];
  const activeStages = GUITAR_STAGES.slice(startIndex);
  const completed = progress.completedItems;

  // Calculate total progress
  const totalItems = activeStages.reduce((sum, s) => sum + s.items.length, 0);
  const completedCount = activeStages.reduce((sum, stage, si) => {
    const stageIndex = si + startIndex;
    return sum + stage.items.filter((_, ii) => completed[`${stageIndex}-${ii}`]).length;
  }, 0);
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Find the first incomplete stage
  const currentStageRelative = activeStages.findIndex((stage, si) => {
    const stageIndex = si + startIndex;
    return stage.items.some((_, ii) => !completed[`${stageIndex}-${ii}`]);
  });

  const handleToggle = (itemKey: string) => {
    toggleGuitarItem(itemKey);
  };

  const handleReset = async () => {
    await resetGuitarProgress();
  };


  return (
    <div className="max-w-3xl mx-auto pb-20">
      <PageHeader
        title="Learn Guitar"
        description={`${progressPercent}% complete`}
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsChoosingLevel(true)} className="text-muted-foreground hover:text-foreground">
              Change path
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Start Over
            </Button>
          </div>
        }
      />

      {/* Editorial-style progress slider */}
      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest text-muted-foreground/60">
          <span>{String(Math.max(1, currentStageRelative + 1)).padStart(2, '0')} / {String(activeStages.length).padStart(2, '0')}</span>
          <div className="flex flex-1 items-center gap-2">
            {activeStages.map((stage, index) => {
              const stageIndex = index + startIndex;
              const done = stage.items.filter((_, ii) => completed[`${stageIndex}-${ii}`]).length;
              const fill = done === stage.items.length ? 'bg-warm' : index === currentStageRelative ? 'bg-warm/70' : 'bg-muted-foreground/20';
              return <span key={stageIndex} className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${fill}`} />;
            })}
          </div>
        </div>
      </div>

      {/* Musical Timeline */}
      <div className="relative">
        {activeStages.map((stage, si) => {
          const stageIndex = si + startIndex;
          const stageCompleted = stage.items.filter((_, ii) => completed[`${stageIndex}-${ii}`]).length;
          const stageTotal = stage.items.length;
          const isComplete = stageCompleted === stageTotal;
          const isCurrent = si === currentStageRelative;
          const isExpanded = expandedStage === stageIndex;
          const isLast = si === activeStages.length - 1;

          return (
            <div key={stageIndex} className="guitar-stage-enter relative" style={{ animationDelay: `${si * 55}ms` }}>
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className="absolute left-[19px] top-[44px] w-[2px] transition-colors duration-500"
                  style={{
                    height: isExpanded ? `calc(100% - 20px)` : 'calc(100% - 20px)',
                    background: isComplete
                      ? 'oklch(0.75 0.08 65)'
                      : 'oklch(0.88 0.005 75)',
                  }}
                />
              )}

              {/* Stage node + label */}
              <button
                type="button"
                onClick={() => setExpandedStage(isExpanded ? null : stageIndex)}
                className="flex items-center gap-5 w-full text-left py-3 group cursor-pointer"
              >
                {/* Node dot */}
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isComplete
                      ? 'bg-warm text-white shadow-md'
                      : isCurrent
                        ? 'bg-background border-[2.5px] border-warm shadow-lg shadow-warm/20'
                        : 'bg-background border-2 border-muted-foreground/20'
                  }`}
                  style={isCurrent ? { animation: 'pulse-ring 2s ease-in-out infinite' } : undefined}
                >
                  {isComplete ? (
                    <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
                  ) : (
                    <span className={`text-sm font-mono font-bold ${isCurrent ? 'text-warm' : 'text-muted-foreground/50'}`}>
                      {String(stageIndex + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Label + count */}
                <div className="flex-1 min-w-0">
                  <div className={`text-base font-medium transition-colors ${
                    isComplete ? 'text-foreground' : isCurrent ? 'text-foreground' : 'text-muted-foreground/60'
                  }`}>
                    {stage.name}
                  </div>
                  <div className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                    {stageCompleted}/{stageTotal}
                  </div>
                  <div className="mt-2 h-px max-w-40 bg-muted-foreground/10">
                    <div className="h-full bg-warm/70 transition-[width] duration-500" style={{ width: `${(stageCompleted / stageTotal) * 100}%` }} />
                  </div>
                </div>

                {/* Expand arrow */}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  } group-hover:text-muted-foreground/70`}
                />
              </button>

              {/* Checklist (expandable) */}
              <div
                className={`overflow-hidden transition-all duration-400 ease-out ${
                  isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-[19px] pl-8 border-l-[2px] border-muted/50 pb-4 pt-1">
                  {stage.items.map((item, ii) => {
                    const itemKey = `${stageIndex}-${ii}`;
                    const isDone = !!completed[itemKey];

                    return (
                      <button
                        key={itemKey}
                        type="button"
                        onClick={() => handleToggle(itemKey)}
                        className="guitar-checklist-item flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors group/item cursor-pointer"
                        style={{ animationDelay: `${ii * 55}ms` }}
                      >
                        {/* Mini timeline node */}
                        <div
                          className={`relative w-3.5 h-3.5 rounded-full shrink-0 transition-all duration-300 ${
                            isDone
                              ? 'bg-warm shadow-sm'
                              : 'bg-background border-2 border-muted-foreground/25 group-hover/item:border-warm/60 group-hover/item:bg-warm/10'
                          }`}
                        >
                          {isDone && <span className="absolute inset-[3px] rounded-full bg-white/80" />}
                        </div>

                        {/* Label */}
                        <span
                          className={`text-sm transition-all duration-300 ${
                            isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Level Selection Screen
// ---------------------------------------------------------------------------

function LevelSelection({ onBack, onSelect, onOpenLog }: { onBack: () => void; onSelect?: (level: GuitarLevel) => Promise<void>; onOpenLog: () => void }) {
  const [selected, setSelected] = useState<GuitarLevel | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = async (level: GuitarLevel) => {
    if (isAnimating) return;
    setSelected(level);
    setIsAnimating(true);

    // Brief delay for visual feedback
    await new Promise((r) => setTimeout(r, 400));
    if (onSelect) await onSelect(level);
    else await saveGuitarProgress(level);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <div onClick={onBack}><MenuBackButton /></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/80">Where are you starting?</h1>
        </div>
      </div>

      <div className="space-y-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              type="button"
              onClick={() => handleSelect(opt.level)}
              disabled={isAnimating}
              className={`guitar-level-option group flex w-full items-center gap-5 rounded-2xl px-5 py-5 text-left transition-all duration-300 cursor-pointer ${
                selected === opt.level
                  ? 'bg-warm/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              } ${isAnimating && selected !== opt.level ? 'opacity-40 scale-[0.98]' : ''}`}
              style={{ animationDelay: `${LEVEL_OPTIONS.indexOf(opt) * 90}ms` }}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors ${selected === opt.level ? 'border-warm bg-warm text-white' : 'border-muted-foreground/25 group-hover:border-warm/60'}`}>
                {String(LEVEL_OPTIONS.indexOf(opt) + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1"><span className="block text-xl sm:text-2xl font-medium text-foreground/70">{opt.label}</span></span>
            </button>
          ))}
          <button type="button" onClick={onOpenLog} className="guitar-level-option group flex w-full items-center gap-5 rounded-2xl px-5 py-5 text-left text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground" style={{ animationDelay: '270ms' }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 font-mono text-sm font-bold group-hover:border-warm/60">04</span>
            <span className="min-w-0 flex-1"><span className="block text-xl sm:text-2xl font-medium text-foreground/70">My Music Log</span></span>
          </button>
      </div>
      <MusicLog />
      </div>
  );
}

function MusicLog() {
  const logs = useGuitarLogs();
  const [logText, setLogText] = useState('');
  const handleAddLog = async () => {
    const text = logText.trim();
    if (!text) return;
    await addGuitarLog(text);
    setLogText('');
  };
  return <section className="mt-14 border-t border-border/50 pt-8">
    <div className="mb-5"><h2 className="text-xl font-medium tracking-tight">My Music Log</h2><p className="mt-1 text-sm text-muted-foreground">Record guitar, songs, theory, or anything else you learn.</p></div>
    <div className="flex gap-2"><input value={logText} onChange={(event) => setLogText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleAddLog(); }} placeholder="What did you practice or learn?" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-warm" /><Button type="button" onClick={() => void handleAddLog()} disabled={!logText.trim()}><Plus className="mr-1.5 h-4 w-4" />Add</Button></div>
    {logs && logs.length > 0 && <div className="mt-5 space-y-2">{logs.map((log) => <div key={log.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3"><div className="min-w-0 flex-1"><p className="text-sm">{log.text}</p><p className="mt-1 text-xs font-mono text-muted-foreground/60">{log.date}</p></div><button type="button" onClick={() => void deleteGuitarLog(log.id)} aria-label="Delete log" className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
  </section>;
}

function MusicLogPage({ onBack }: { onBack: () => void }) {
  return <div className="max-w-3xl mx-auto pb-20"><PageHeader title="My Music Log" description="Record anything you practice or learn" action={<Button variant="ghost" size="sm" onClick={onBack}>Back</Button>} /><MusicLog /></div>;
}
