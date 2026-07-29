import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHealthLogs, useHealthLog, saveHealthLog } from '@/db/hooks';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function HealthPage() {
  const today = new Date().toISOString().slice(0, 10);
  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const todayLog = useHealthLog(today);
  const allLogs = useHealthLogs(30); // Last 30 days for charts

  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>(() => localStorage.getItem('bigbrain-height') || '');
  const [water, setWater] = useState<string>('');
  const [exercise, setExercise] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState<string>('');
  const [sleep, setSleep] = useState<string>('');
  const [smoking, setSmoking] = useState(false);
  const [weed, setWeed] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);

  // Pre-fill form if log exists for today
  useEffect(() => {
    if (todayLog) {
      setWeight(todayLog.weight ? String(todayLog.weight) : '');
      setWater(todayLog.water ? String(todayLog.water) : '');
      setExercise(todayLog.exercise || '');
      setExerciseMinutes(todayLog.exerciseMinutes ? String(todayLog.exerciseMinutes) : '');
      setSleep(todayLog.sleep ? String(todayLog.sleep) : '');
      setSmoking(todayLog.smoking);
      setWeed(todayLog.weed);
    }
  }, [todayLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await saveHealthLog({
      date: today,
      weight: weight === '' ? null : Number(weight),
      water: water === '' ? null : Number(water),
      exercise,
      exerciseMinutes: exerciseMinutes === '' ? null : Number(exerciseMinutes),
      sleep: sleep === '' ? null : Number(sleep),
      smoking,
      weed
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const bmi = weight && height ? (Number(weight) / ((Number(height)/100) ** 2)).toFixed(1) : null;

  const getBmiCategory = (bmiStr: string) => {
    const val = Number(bmiStr);
    if (val < 18.5) return { category: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (val < 25) return { category: 'Normal', color: 'text-green-500', bg: 'bg-green-500' };
    if (val < 30) return { category: 'Overweight', color: 'text-amber-500', bg: 'bg-amber-500' };
    return { category: 'Obese', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const bmiInfo = bmi ? getBmiCategory(bmi) : null;

  // Prepare chart data (reverse to show chronological order left-to-right)
  const chartData = allLogs ? [...allLogs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight,
    sleep: log.sleep,
    exerciseMinutes: log.exerciseMinutes || 0
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-sm text-primary">
            {payload[0].name}: <span className="font-semibold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Save height to localStorage when it changes
  const handleHeightSave = (val: string) => {
    setHeight(val);
    if (val) {
      localStorage.setItem('bigbrain-height', val);
    } else {
      localStorage.removeItem('bigbrain-height');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Health" description={displayDate} />

      <div className="space-y-8">

        {/* Body Profile + BMI — persistent, not daily */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-warm/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Body Profile</CardTitle>
              <p className="text-xs text-muted-foreground/60">Set once — updates automatically</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    id="height" 
                    value={height} 
                    onChange={e => handleHeightSave(e.target.value)} 
                    placeholder="e.g. 170"
                  />
                </div>
                {height && (
                  <div className="pb-2">
                    <span className="text-2xl stat-number">{(Number(height) / 100).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground ml-1">m</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BMI Card */}
          <Card className={`border-warm/20 ${bmi ? '' : 'flex items-center justify-center'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">BMI</CardTitle>
            </CardHeader>
            <CardContent>
              {bmi && bmiInfo ? (
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-5xl stat-number">{bmi}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-3 h-3 rounded-full ${bmiInfo.bg}`} />
                      <span className={`text-lg font-semibold ${bmiInfo.color}`}>
                        {bmiInfo.category}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Number(bmi) < 18.5 ? '< 18.5' : Number(bmi) < 25 ? '18.5 – 24.9' : Number(bmi) < 30 ? '25 – 29.9' : '≥ 30'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  {!height ? 'Set your height to see BMI' : 'Log today\'s weight to see BMI'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Today's Log Form — daily things only */}
        <Card className="border-warm/20">
          <CardHeader>
            <CardTitle>Daily Log</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input type="number" step="0.1" id="weight" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water (glasses)</Label>
                  <Input type="number" id="water" value={water} onChange={e => setWater(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep">Sleep (hours)</Label>
                  <Input type="number" step="0.5" id="sleep" value={sleep} onChange={e => setSleep(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="exercise">Exercise Description</Label>
                  <Input id="exercise" placeholder="e.g. Gym, Running 5k" value={exercise} onChange={e => setExercise(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exerciseMinutes">Duration (min)</Label>
                  <Input type="number" id="exerciseMinutes" value={exerciseMinutes} onChange={e => setExerciseMinutes(e.target.value)} />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                 <button
                   type="button"
                   onClick={() => setSmoking(!smoking)}
                   className="toggle-tile rounded-xl px-6 py-3 flex items-center gap-3 cursor-pointer"
                   data-active={smoking}
                   data-color="rose"
                 >
                   <span className={`text-xl transition-all duration-300 ${smoking ? 'scale-110' : 'opacity-40'}`}>🚬</span>
                   <span className="text-sm font-medium">Smoking</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setWeed(!weed)}
                   className="toggle-tile rounded-xl px-6 py-3 flex items-center gap-3 cursor-pointer"
                   data-active={weed}
                   data-color="violet"
                 >
                   <span className={`text-xl transition-all duration-300 ${weed ? 'scale-110' : 'opacity-40'}`}>🌿</span>
                   <span className="text-sm font-medium">Weed</span>
                 </button>
              </div>
              
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                 <Button type="submit" className="w-full sm:w-40">Save Log</Button>
                 {isSaved && <span className="text-sm text-green-600 font-medium transition-opacity">Saved successfully</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* BMI Card */}
        {bmi && bmiInfo && (
          <Card className="border-warm/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Body Mass Index (BMI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl stat-number">{bmi}</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${bmiInfo.bg}`} />
                  <span className={`text-base font-semibold ${bmiInfo.color}`}>
                    {bmiInfo.category}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Weight Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#c4956a" strokeWidth={3} dot={{r: 4, fill: '#c4956a'}} activeDot={{r: 6}} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Sleep Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b7355" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b7355" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 'dataMax + 2']} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#8b7355" strokeWidth={3} fillOpacity={1} fill="url(#colorSleep)" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Exercise Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="exerciseMinutes" name="Minutes" fill="#a07850" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
