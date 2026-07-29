import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudySessions, useWeeklyStudyHours, useHealthLogs, useProjects, useHabitStreak, useTodayHabits } from '@/db/hooks';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Flame, TrendingUp } from 'lucide-react';

export function ProgressPage() {
  const studySessions = useStudySessions();
  const weeklyStudyHours = useWeeklyStudyHours();
  const healthLogs = useHealthLogs(30);
  const projects = useProjects();
  const todayHabits = useTodayHabits();

  // Habit Streaks
  const habitsList = [
    { key: 'study', label: 'Study', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
    { key: 'exercise', label: 'Exercise', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)' },
    { key: 'water', label: 'Water', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)' },
    { key: 'noSmoking', label: 'No Smoking', color: '#f43f5e', bgColor: 'rgba(244,63,94,0.1)' },
    { key: 'noWeed', label: 'No Weed', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
    { key: 'read', label: 'Read', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
    { key: 'code', label: 'Code', color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)' },
  ];

  // Colors based on warm/stone palette
  const COLORS = ['#c4956a', '#a07850', '#8b7355', '#d4b896', '#e8d5c0'];

  // Process data for Study by Subject Pie Chart
  const subjectTimeMap = new Map<string, number>();
  if (studySessions) {
    studySessions.forEach(session => {
      const current = subjectTimeMap.get(session.subject) || 0;
      subjectTimeMap.set(session.subject, current + session.timeSpent);
    });
  }
  const studyBySubjectData = Array.from(subjectTimeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  // Process data for Weekly Study Hours (Mon-Sun)
  const currentWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData = currentWeekDays.map(day => ({ day, hours: 0 }));
  
  if (studySessions) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMon);
    monday.setHours(0, 0, 0, 0);

    studySessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= monday && sessionDate <= today) {
        let dayIdx = sessionDate.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        weekData[dayIdx].hours += (session.timeSpent / 60);
      }
    });
  }

  // Weight Trend Data
  const weightData = healthLogs ? [...healthLogs].reverse().filter(log => log.weight !== null).map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium mb-1">{label || payload[0].name}</p>
          <p className="text-sm text-primary">
            <span className="font-semibold">{typeof payload[0].value === 'number' && !Number.isInteger(payload[0].value) ? payload[0].value.toFixed(1) : payload[0].value}</span> {payload[0].payload.value ? 'min' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <PageHeader title="Progress" description="Your journey at a glance" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         {/* Top Stats */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Hours</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl stat-number">{weeklyStudyHours || 0}</div>
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Topics Completed</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl stat-number">
               {studySessions ? new Set(studySessions.map(s => s.topic)).size : 0}
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Projects</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl stat-number">
               {projects ? projects.filter(p => p.status === 'active').length : 0}
             </div>
           </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Habit Streaks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Habit Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {habitsList.map(habit => (
                <HabitStreakCard key={habit.key} habitKey={habit.key} label={habit.label} isDoneToday={todayHabits?.habits?.[habit.key]} color={habit.color} bgColor={habit.bgColor} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Study Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Study</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="day" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" name="Hours" fill="#c4956a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Study by Subject Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Subjects (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            {studyBySubjectData.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studyBySubjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {studyBySubjectData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="absolute top-0 right-0 h-full flex flex-col justify-center gap-2 max-w-[40%]">
                  {studyBySubjectData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate" title={entry.name}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No study data yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b7355" strokeWidth={3} dot={{r: 4, fill: '#8b7355'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No weight data recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Helper component to cleanly fetch and display streak for a single habit
function HabitStreakCard({ habitKey, label, isDoneToday, color, bgColor }: { habitKey: string, label: string, isDoneToday?: boolean, color: string, bgColor: string }) {
  const streak = useHabitStreak(habitKey);
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-xl border border-transparent hover:border-warm/30 transition-all duration-300">
      <div 
        className="flex items-center justify-center h-12 w-12 rounded-full mb-3 transition-all duration-300"
        style={{ background: isDoneToday ? bgColor : 'var(--muted)', borderColor: isDoneToday ? color : 'transparent' }}
      >
        {streak !== undefined && streak > 0 ? (
          <Flame 
            className="h-6 w-6 transition-colors duration-300" 
            style={{ color: isDoneToday ? color : 'var(--muted-foreground)' }}
            fill={isDoneToday ? bgColor : 'none'}
          />
        ) : (
          <Flame className="h-6 w-6 opacity-30" />
        )}
      </div>
      <div className="text-2xl stat-number mb-1" style={{ color: streak && streak > 0 ? color : undefined }}>{streak || 0}</div>
      <div className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">{label}</div>
    </div>
  );
}
