import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProjects, addProject, updateProject, deleteProject } from '@/db/hooks';
import type { ProjectTask } from '@/db/database';
import { Plus, Trash2, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProjectsPage() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const projects = useProjects();
  
  const handleNewProject = async () => {
    const id = await addProject({
      name: 'New Project',
      description: '',
      status: 'active',
      tasks: [],
      notes: '',
      problems: '',
      improvements: ''
    });
    setActiveProjectId(id as number);
  };

  if (activeProjectId) {
    return <ProjectDetail 
             id={activeProjectId} 
             onBack={() => setActiveProjectId(null)} 
             onDelete={() => { setActiveProjectId(null); }}
           />;
  }

  return (
    <div>
      <PageHeader 
        title="Projects" 
        description="Track your personal coding projects"
        action={<Button onClick={handleNewProject}><Plus className="h-4 w-4 mr-2" /> New Project</Button>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!projects || projects.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-20 text-center bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
            <p>No projects yet. Create one to get started.</p>
          </div>
        ) : (
          projects.map(project => {
            const completedTasks = project.tasks.filter(t => t.done).length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            
            return (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:border-warm/50 transition-colors group"
                onClick={() => setActiveProjectId(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="group-hover:text-warm-foreground transition-colors">{project.name}</CardTitle>
                    <Badge variant={project.status === 'completed' ? 'default' : project.status === 'active' ? 'secondary' : 'outline'}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px] mt-2">
                    {project.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tasks progress</span>
                      <span>{completedTasks} / {totalTasks} ({progress}%)</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Project Detail View
// -------------------------------------------------------------

function ProjectDetail({ id, onBack, onDelete }: { id: number, onBack: () => void, onDelete: () => void }) {
  const projects = useProjects();
  const project = projects?.find(p => p.id === id);
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [problems, setProblems] = useState('');
  const [improvements, setImprovements] = useState('');
  
  const [newTaskText, setNewTaskText] = useState('');
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    if (project) {
      setName(project.name);
      setStatus(project.status);
      setDescription(project.description);
      setNotes(project.notes);
      setProblems(project.problems);
      setImprovements(project.improvements);
    }
  }, [project?.id]); // Only run when project ID changes to allow editing without cursor jumping

  // Auto-save debounced
  useEffect(() => {
    if (!project) return;
    
    // Check if actually changed
    if (name === project.name && 
        status === project.status && 
        description === project.description && 
        notes === project.notes && 
        problems === project.problems && 
        improvements === project.improvements) {
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      updateProject(id, { name, status, description, notes, problems, improvements });
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [name, status, description, notes, problems, improvements, id, project]);

  if (!project) return <div>Loading...</div>;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      text: newTaskText,
      done: false
    };
    
    await updateProject(id, { tasks: [...project.tasks, newTask] });
    setNewTaskText('');
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    await updateProject(id, { tasks: updatedTasks });
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    await updateProject(id, { tasks: updatedTasks });
  };

  const handleDeleteProject = async () => {
    await deleteProject(id);
    onDelete();
  };

  const completedTasks = project.tasks.filter(t => t.done).length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="text-3xl font-semibold bg-transparent border-none outline-none flex-1 text-foreground"
          placeholder="Project Name"
        />
        
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="bg-muted px-3 py-1.5 rounded-md text-sm border-none outline-none cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
        
        <Dialog>
          {/* @ts-expect-error type issue with Radix */}
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete '{project.name}'? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="What is this project about?"
            className="min-h-[160px] writing-area p-5 rounded-xl"
          />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Tasks</CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} ({progress}%)</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6">
              {project.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 group">
                  <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-foreground">
                    {task.done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                    {task.text}
                  </span>
                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {project.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No tasks added yet.</p>
              )}
            </div>
            
            <form onSubmit={handleAddTask} className="flex gap-2">
              <Input 
                value={newTaskText} 
                onChange={e => setNewTaskText(e.target.value)} 
                placeholder="Add a new task..."
                className="flex-1"
              />
              <Button type="submit" variant="secondary">Add</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
             <Label>Notes & Ideas</Label>
             <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Jot down notes..."
                className="min-h-[280px] writing-area p-5 rounded-xl"
              />
           </div>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <Label>Problems Faced</Label>
               <Textarea 
                  value={problems} 
                  onChange={e => setProblems(e.target.value)} 
                  placeholder="What blockers did you hit?"
                  className="min-h-[180px] writing-area p-5 rounded-xl"
                />
             </div>
             
             <div className="space-y-2">
               <Label>Improvements</Label>
               <Textarea 
                  value={improvements} 
                  onChange={e => setImprovements(e.target.value)} 
                  placeholder="What could be done better next time?"
                  className="min-h-[180px] writing-area p-5 rounded-xl"
                />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
