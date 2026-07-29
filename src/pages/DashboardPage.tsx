import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStudySessionsByDate, useWeeklyStudyHours, useProjects, useTodayHabits, useHealthLogs, useRecentNotes, saveHabits } from '@/db/hooks';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function DashboardPage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const displayDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const studySessions = useStudySessionsByDate(today);
  const weeklyStudyHours = useWeeklyStudyHours();
  const projects = useProjects('active');
  const todayHabits = useTodayHabits();
  const healthLogs = useHealthLogs(2);
  const recentNotes = useRecentNotes(3);

  const activeProject = projects?.[0];
  
  const habitsList = [
    { key: 'study', label: 'Study', color: 'emerald', emoji: '📖', glowLight: 'rgba(74,222,128,0.4)', glowDark: 'rgba(34,197,94,0.2)', glowBorder: 'rgba(34,197,94,0.5)', glowShadow: 'rgba(34,197,94,0.25)' },
    { key: 'exercise', label: 'Exercise', color: 'blue', emoji: '💪', glowLight: 'rgba(96,165,250,0.4)', glowDark: 'rgba(59,130,246,0.2)', glowBorder: 'rgba(59,130,246,0.5)', glowShadow: 'rgba(59,130,246,0.25)' },
    { key: 'water', label: 'Water', color: 'cyan', emoji: '💧', glowLight: 'rgba(103,232,249,0.4)', glowDark: 'rgba(6,182,212,0.2)', glowBorder: 'rgba(6,182,212,0.5)', glowShadow: 'rgba(6,182,212,0.25)' },
    { key: 'noSmoking', label: 'No Smoking', color: 'rose', emoji: '🚭', glowLight: 'rgba(251,113,133,0.35)', glowDark: 'rgba(244,63,94,0.15)', glowBorder: 'rgba(244,63,94,0.5)', glowShadow: 'rgba(244,63,94,0.2)' },
    { key: 'noWeed', label: 'No Weed', color: 'violet', emoji: '🧘', glowLight: 'rgba(167,139,250,0.4)', glowDark: 'rgba(139,92,246,0.2)', glowBorder: 'rgba(139,92,246,0.5)', glowShadow: 'rgba(139,92,246,0.25)' },
    { key: 'read', label: 'Read', color: 'amber', emoji: '📚', glowLight: 'rgba(251,191,36,0.4)', glowDark: 'rgba(245,158,11,0.2)', glowBorder: 'rgba(245,158,11,0.5)', glowShadow: 'rgba(245,158,11,0.25)' },
    { key: 'code', label: 'Code', color: 'indigo', emoji: '💻', glowLight: 'rgba(129,140,248,0.4)', glowDark: 'rgba(99,102,241,0.2)', glowBorder: 'rgba(99,102,241,0.5)', glowShadow: 'rgba(99,102,241,0.25)' },
  ];

  const handleHabitToggle = (key: string, checked: boolean) => {
    const currentHabits = todayHabits?.habits || {};
    saveHabits(today, { ...currentHabits, [key]: checked });
  };

  const getWeightTrend = () => {
    if (!healthLogs || healthLogs.length < 2) return null;
    const current = healthLogs[0].weight;
    const previous = healthLogs[1].weight;
    if (current === null || previous === null) return null;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={greeting} description={displayDate} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Today's Study */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Today's Study</CardTitle>
          </CardHeader>
          <CardContent>
            {studySessions && studySessions.length > 0 ? (
              <div className="space-y-4">
                {studySessions.map((session) => (
                  <div key={session.id} className="flex justify-between items-center p-4 bg-muted/40 rounded-lg">
                    <div>
                      <h4 className="font-medium text-lg">{session.subject}</h4>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{session.timeSpent}</span>
                      <span className="text-xs text-muted-foreground ml-1">min</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg h-full">
                <p className="text-muted-foreground mb-4">No study sessions logged today.</p>
                <Link to="/study" className="text-sm font-medium text-primary hover:underline">Log a session</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Study Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Study</CardTitle>
            <CardDescription>Hours this week</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-6xl stat-number tracking-tighter text-primary">
              {weeklyStudyHours !== undefined ? weeklyStudyHours : '-'}
            </div>
          </CardContent>
        </Card>

        {/* Current Project */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Project</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <Link to="/projects" className="block p-5 bg-warm/10 rounded-xl hover:bg-warm/20 transition-all duration-300 border border-warm/20 hover:border-warm/40 hover:shadow-md">
                <h3 className="text-xl font-medium text-warm-foreground">{activeProject.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activeProject.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {activeProject.tasks.filter(t => t.done).length} / {activeProject.tasks.length} tasks completed
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-center py-8 text-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No active projects.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weight</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
             {healthLogs && healthLogs[0] && healthLogs[0].weight ? (
                <div className="flex items-center gap-2">
                  <span className="text-4xl stat-number">{healthLogs[0].weight}</span>
                  <span className="text-muted-foreground">kg</span>
                  {getWeightTrend()}
                </div>
             ) : (
               <p className="text-muted-foreground">No data</p>
             )}
          </CardContent>
        </Card>

        {/* Habit Completion */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Daily Habits</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5">
                {habitsList.map((habit) => {
                  const isActive = todayHabits?.habits?.[habit.key] || false;
                  return (
                    <button
                      key={habit.key}
                      onClick={() => handleHabitToggle(habit.key, !isActive)}
                      className="flex flex-col items-center gap-3 cursor-pointer group"
                    >
                      {/* Glass orb */}
                      <div
                        className="w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center transition-all duration-400 relative"
                        style={{
                          background: isActive 
                            ? `linear-gradient(135deg, ${habit.glowLight}, ${habit.glowDark})` 
                            : 'linear-gradient(135deg, rgba(250,250,248,0.9), rgba(235,235,230,0.7))',
                          boxShadow: isActive
                            ? `0 0 24px ${habit.glowShadow}, inset 0 1px 3px rgba(255,255,255,0.5)`
                            : '0 2px 10px rgba(0,0,0,0.08), inset 0 1px 3px rgba(255,255,255,0.7)',
                          border: isActive 
                            ? `2.5px solid ${habit.glowBorder}` 
                            : '2px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        <span className={`text-3xl transition-all duration-400 ${isActive ? 'scale-110' : 'scale-100 opacity-70'}`}>
                          {habit.emoji}
                        </span>
                        {/* Glass shine */}
                        <div className="absolute top-1.5 left-3 right-3 h-5 rounded-full bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {habit.label}
                      </span>
                    </button>
                  );
                })}
             </div>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotes && recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link key={note.id} to="/notes" className="block p-4 hover:bg-warm/10 rounded-xl transition-all duration-200 border border-transparent hover:border-warm/20">
                    <p className="font-medium truncate">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{note.category}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent notes.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
