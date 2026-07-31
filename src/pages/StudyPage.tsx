import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useStudySessions, addStudySession, updateStudySession, deleteStudySession } from '@/db/hooks';
import { Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionEditValues {
  date: string;
  subject: string;
  topic: string;
  timeSpent: number | '';
  practiceQuestions: number | '';
  confidence: number;
  understood: string;
  notUnderstood: string;
}

export function StudyPage() {
  const sessions = useStudySessions(20);
  
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [timeSpent, setTimeSpent] = useState<number | ''>('');
  const [understood, setUnderstood] = useState('');
  const [notUnderstood, setNotUnderstood] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState<number | ''>('');
  const [confidence, setConfidence] = useState([5]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<SessionEditValues | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !timeSpent) return;

    await addStudySession({
      date,
      subject,
      topic,
      timeSpent: Number(timeSpent),
      understood,
      notUnderstood,
      practiceQuestions: Number(practiceQuestions) || 0,
      confidence: confidence[0]
    });

    setTopic('');
    setTimeSpent('');
    setUnderstood('');
    setNotUnderstood('');
    setPracticeQuestions('');
    setConfidence([5]);
  };

  const handleDeleteSession = async () => {
    if (deleteSessionId === null) return;
    await deleteStudySession(deleteSessionId);
    if (expandedId === deleteSessionId) {
      setExpandedId(null);
    }
    setDeleteSessionId(null);
  };

  const startEditingSession = (session: NonNullable<typeof sessions>[number]) => {
    setEditingSessionId(session.id);
    setExpandedId(session.id);
    setEditValues({
      date: session.date,
      subject: session.subject,
      topic: session.topic,
      timeSpent: session.timeSpent,
      practiceQuestions: session.practiceQuestions,
      confidence: session.confidence,
      understood: session.understood,
      notUnderstood: session.notUnderstood,
    });
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditValues(null);
  };

  const saveEditedSession = async () => {
    if (editingSessionId === null || !editValues || !editValues.subject || !editValues.topic || !editValues.timeSpent) return;

    await updateStudySession(editingSessionId, {
      date: editValues.date,
      subject: editValues.subject,
      topic: editValues.topic,
      timeSpent: Number(editValues.timeSpent),
      practiceQuestions: Number(editValues.practiceQuestions) || 0,
      confidence: editValues.confidence,
      understood: editValues.understood,
      notUnderstood: editValues.notUnderstood,
    });
    cancelEditingSession();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Study" description="Log and track your study sessions" />

      {/* Log Session — spacious, full-width form */}
      <div className="mb-16">
        <h3 className="text-lg font-medium mb-8 text-muted-foreground uppercase tracking-wider text-sm">Log a Session</h3>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Row 1: Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g. Java, DSA" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" placeholder="e.g. Binary Trees" value={topic} onChange={e => setTopic(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeSpent">Time (min)</Label>
                <Input type="number" id="timeSpent" min="1" value={timeSpent} onChange={e => setTimeSpent(e.target.value ? Number(e.target.value) : '')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="practiceQuestions">Questions</Label>
                <Input type="number" id="practiceQuestions" min="0" value={practiceQuestions} onChange={e => setPracticeQuestions(e.target.value ? Number(e.target.value) : '')} />
              </div>
            </div>
          </div>

          {/* Row 2: Writing areas — large, prominent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <Label htmlFor="understood" className="text-base">What I understood</Label>
              <Textarea 
                id="understood" 
                className="writing-area min-h-[220px] max-h-[400px] overflow-y-auto p-5 rounded-xl border-muted" 
                style={{ fieldSizing: 'fixed' } as React.CSSProperties} 
                placeholder="Write freely about what clicked today..."
                value={understood} 
                onChange={e => setUnderstood(e.target.value)} 
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="notUnderstood" className="text-base">What I didn't understand</Label>
              <Textarea 
                id="notUnderstood" 
                className="writing-area min-h-[220px] max-h-[400px] overflow-y-auto p-5 rounded-xl border-muted" 
                style={{ fieldSizing: 'fixed' } as React.CSSProperties} 
                placeholder="What needs more time, practice, or a different approach..."
                value={notUnderstood} 
                onChange={e => setNotUnderstood(e.target.value)} 
              />
            </div>
          </div>

          {/* Row 3: Confidence + Submit */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-12">
            <div className="flex-1 max-w-md space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full transition-colors duration-300"
                    style={{ background: confidence[0] < 4 ? 'oklch(0.63 0.21 25)' : confidence[0] < 7 ? 'oklch(0.75 0.18 75)' : 'oklch(0.62 0.19 145)' }}
                  />
                  <Label className="text-base">Confidence</Label>
                </div>
                <span 
                  className="text-2xl stat-number transition-colors duration-300"
                  style={{ color: confidence[0] < 4 ? 'oklch(0.63 0.21 25)' : confidence[0] < 7 ? 'oklch(0.75 0.18 75)' : 'oklch(0.62 0.19 145)' }}
                >
                  {confidence[0]}
                </span>
              </div>
              <div 
                className="transition-all duration-300"
                style={{ 
                  '--slider-accent': confidence[0] < 4 ? 'oklch(0.63 0.21 25)' : confidence[0] < 7 ? 'oklch(0.75 0.18 75)' : 'oklch(0.62 0.19 145)'
                } as React.CSSProperties}
              >
                <Slider 
                  value={confidence} 
                  onValueChange={(val) => setConfidence(Array.isArray(val) ? [...val] : [val as number])} 
                  max={10} 
                  min={1} 
                  step={1} 
                  className="[&_[data-slot=slider-range]]:bg-[var(--slider-accent)] [&_[data-slot=slider-thumb]]:border-[var(--slider-accent)] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5" 
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto px-10">Save Session</Button>
          </div>
        </form>
      </div>

      <Separator className="mb-10" />

      {/* Recent Sessions */}
      <div>
        <h3 className="text-sm font-medium mb-6 text-muted-foreground uppercase tracking-wider">Recent Sessions</h3>
        
        {!sessions || sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-16 bg-muted/10 rounded-2xl border border-dashed text-lg">
            No sessions logged yet. Start your first one above.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <Card key={session.id} className="overflow-hidden">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-semibold">{session.subject}</h4>
                        <span className="text-sm text-muted-foreground">— {session.topic}</span>
                      </div>
                      <div className="flex items-center gap-5 text-sm text-muted-foreground">
                        <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>⏱ {session.timeSpent} min</span>
                        {session.practiceQuestions > 0 && <span>📝 {session.practiceQuestions} questions</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Confidence indicator */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(session.confidence / 10) * 100}%`,
                            background: session.confidence < 4 ? 'oklch(0.70 0.20 25)' : session.confidence < 7 ? 'oklch(0.80 0.16 80)' : 'oklch(0.68 0.18 150)'
                          }} 
                        />
                      </div>
                      <span 
                        className="text-sm stat-number w-8 transition-colors"
                        style={{ color: session.confidence < 4 ? 'oklch(0.63 0.21 25)' : session.confidence < 7 ? 'oklch(0.75 0.18 75)' : 'oklch(0.62 0.19 145)' }}
                      >
                        {session.confidence}/10
                      </span>
                    </div>
                    
                    {(session.understood || session.notUnderstood) && (
                      expandedId === session.id 
                        ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setDeleteSessionId(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit session"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        startEditingSession(session);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Expanded content */}
                {expandedId === session.id && editingSessionId === session.id && editValues && (
                  <div className="px-4 sm:px-6 pb-6 pt-5 border-t space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Edit Session</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEditingSession}>Cancel</Button>
                        <Button type="button" size="sm" onClick={() => void saveEditedSession()}>Save Changes</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={editValues.date} onChange={e => setEditValues({ ...editValues, date: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={editValues.subject} onChange={e => setEditValues({ ...editValues, subject: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input value={editValues.topic} onChange={e => setEditValues({ ...editValues, topic: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Minutes</Label>
                          <Input type="number" min="1" value={editValues.timeSpent} onChange={e => setEditValues({ ...editValues, timeSpent: e.target.value ? Number(e.target.value) : '' })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Questions</Label>
                          <Input type="number" min="0" value={editValues.practiceQuestions} onChange={e => setEditValues({ ...editValues, practiceQuestions: e.target.value ? Number(e.target.value) : '' })} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>What I understood</Label>
                        <Textarea className="min-h-32" value={editValues.understood} onChange={e => setEditValues({ ...editValues, understood: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>What I didn&apos;t understand</Label>
                        <Textarea className="min-h-32" value={editValues.notUnderstood} onChange={e => setEditValues({ ...editValues, notUnderstood: e.target.value })} />
                      </div>
                    </div>
                    <div className="max-w-md space-y-2">
                      <div className="flex justify-between"><Label>Confidence</Label><span className="text-sm font-medium">{editValues.confidence}/10</span></div>
                      <Slider value={[editValues.confidence]} onValueChange={value => setEditValues({ ...editValues, confidence: Array.isArray(value) ? value[0] : Number(value) })} min={1} max={10} step={1} />
                    </div>
                  </div>
                )}
                {expandedId === session.id && editingSessionId !== session.id && (session.understood || session.notUnderstood) && (
                  <div className="px-6 pb-6 pt-2 border-t space-y-6">
                    {session.understood && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider block mb-3">Understood</span>
                        <p className="writing-area text-foreground/80 leading-relaxed whitespace-pre-wrap">{session.understood}</p>
                      </div>
                    )}
                    {session.notUnderstood && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider block mb-3">Needs Review</span>
                        <p className="writing-area text-foreground/80 leading-relaxed whitespace-pre-wrap">{session.notUnderstood}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={deleteSessionId !== null} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this study session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => void handleDeleteSession()}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
