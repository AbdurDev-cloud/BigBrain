import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HighlightEditor } from '@/components/HighlightEditor';
import { useNotes, useNoteCategories, addNote, updateNote, deleteNote } from '@/db/hooks';
import { renderMarkdown } from '@/lib/markdown';
import { Trash2, Plus } from 'lucide-react';
import { MenuBackButton } from '@/components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_CATEGORIES = ['Java', 'DSA', 'SQL', 'React', 'Health', 'Career', 'Interview Notes'];

export function NotesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  
  const allNotes = useNotes();
  const dbCategories = useNoteCategories();
  
  // Merge default categories with db categories
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...((dbCategories as string[]) || [])])).sort();
  
  const notes = activeCategory === 'All' 
    ? allNotes 
    : allNotes?.filter(n => n.category === activeCategory);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load active note
  useEffect(() => {
    if (activeNoteId && allNotes) {
      const note = allNotes.find(n => n.id === activeNoteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setCategory(note.category);
      }
    } else {
      setTitle('');
      setContent('');
      setCategory(categories[0] || 'General');
    }
  }, [activeNoteId, allNotes]);

  // Auto-save logic
  useEffect(() => {
    if (!activeNoteId) return;
    
    const existingNote = allNotes?.find(n => n.id === activeNoteId);
    if (title === (existingNote?.title || '') && 
        content === (existingNote?.content || '') &&
        category === (existingNote?.category || '')) {
      return;
    }

    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await updateNote(activeNoteId, { title, content, category });
      setIsSaving(false);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, category, activeNoteId, allNotes]);

  const handleNewNote = async () => {
    const id = await addNote({
      title: 'New Note',
      category: activeCategory !== 'All' ? activeCategory : categories[0],
      content: ''
    });
    // Type assertion since Dexie add() returns the primary key which is number for notes
    setActiveNoteId(Number(id));
    setIsPreview(false);
  };

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id);
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-7rem)] gap-6 lg:gap-10 max-w-7xl mx-auto">
      {/* Left Sidebar */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 lg:pr-4">
        <div className="mb-6 flex justify-between items-center">
          <button type="button" onClick={() => navigate('/')} className="text-left text-xl font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm rounded-sm">Notes</button>
          <Button variant="ghost" size="icon" onClick={handleNewNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3"><MenuBackButton /><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</div></div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory('All')}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeCategory === 'All' ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-foreground/80'
              }`}
            >
              All Notes
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeCategory === cat ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-foreground/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex flex-col min-h-0 max-h-64 lg:flex-1 lg:max-h-none">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Notes</div>
          <ScrollArea className="h-56 min-h-0 lg:h-auto lg:flex-1">
            <div className="space-y-1 pr-3">
              {notes?.map(note => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    activeNoteId === note.id ? 'bg-warm/10 border-warm/30' : 'border-transparent hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium truncate text-sm mb-1">{note.title || 'Untitled'}</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{note.category}</span>
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </button>
              ))}
              {notes?.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4">No notes found.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0 lg:h-full lg:pl-6">
        {activeNoteId ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="text-sm font-medium text-warm-foreground bg-warm/10 px-3 py-1 rounded-full border-none outline-none hover:bg-warm/20 transition-colors w-40"
                placeholder="Category..."
              />
              <div className="flex items-center gap-4">
                 <span className="text-xs text-muted-foreground transition-opacity duration-300">
                   {isSaving ? 'Saving...' : 'Saved'}
                 </span>
                 <Button variant="ghost" size="sm" onClick={() => setIsPreview(!isPreview)}>
                   {isPreview ? 'Edit' : 'Preview'}
                 </Button>
                 
                 <Dialog>
                    {/* @ts-expect-error type issue with Radix */}
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Note</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this note? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="destructive" onClick={() => handleDeleteNote(activeNoteId)}>Delete</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="text-3xl sm:text-4xl display-heading bg-transparent border-none outline-none mb-6 placeholder:text-muted-foreground/30 text-foreground w-full"
              disabled={isPreview}
            />

            <div className="flex-1 overflow-hidden relative">
              {isPreview ? (
                <ScrollArea className="h-full w-full pr-4">
                   <div 
                     className="prose-content writing-area pb-20"
                     dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Empty note*') }}
                   />
                </ScrollArea>
              ) : (
                <HighlightEditor
                  content={content}
                  onContentChange={setContent}
                  placeholder="Start writing..."
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full bg-muted/5 rounded-xl border border-dashed">
             <StickyNoteIcon />
             <p className="mt-4 mb-4">Select a note or create a new one</p>
             <Button onClick={handleNewNote}>Create Note</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StickyNoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/>
      <path d="M15 3v4a2 2 0 0 0 2 2h4"/>
    </svg>
  )
}
