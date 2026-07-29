import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HighlightEditor } from '@/components/HighlightEditor';
import { useJournalEntries, saveJournalEntry, deleteJournalEntry } from '@/db/hooks';
import { renderMarkdown } from '@/lib/markdown';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function JournalPage() {
  const entries = useJournalEntries();
  const today = new Date().toISOString().slice(0, 10);
  
  const [activeDate, setActiveDate] = useState<string>(today);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load entry when activeDate changes
  useEffect(() => {
    const entry = entries?.find(e => e.date === activeDate);
    if (entry) {
      setActiveEntryId(entry.id);
      setTitle(entry.title);
      setContent(entry.content);
    } else {
      setActiveEntryId(null);
      setTitle('');
      setContent('');
    }
  }, [activeDate, entries]);

  // Debounced auto-save
  useEffect(() => {
    if (!activeDate) return;
    
    // Only save if there's actual content or title, and it's not just the initial load
    const existingEntry = entries?.find(e => e.date === activeDate);
    if (title === (existingEntry?.title || '') && content === (existingEntry?.content || '')) {
      return;
    }

    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveJournalEntry({
        date: activeDate,
        title,
        content
      });
      setIsSaving(false);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, activeDate, entries]);

  const handleNewEntry = () => {
    setActiveDate(today);
    setIsPreview(false);
  };

  const handleDeleteEntry = async () => {
    if (activeEntryId === null) return;
    await deleteJournalEntry(activeEntryId);
    setActiveEntryId(null);
    setTitle('');
    setContent('');
    setIsPreview(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-7rem)] gap-6 lg:gap-10 max-w-7xl mx-auto">
      {/* Left Panel: Entry List */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 lg:pr-4">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Journal</h2>
          <Button variant="outline" size="sm" onClick={handleNewEntry}>
            Today
          </Button>
        </div>
        
        <ScrollArea className="max-h-48 lg:max-h-none lg:flex-1">
          <div className="space-y-2 lg:pr-4">
            {entries?.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setActiveDate(entry.date);
                  setIsPreview(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeDate === entry.date
                    ? 'bg-warm/20 border-warm/30 border'
                    : 'hover:bg-muted border border-transparent'
                }`}
              >
                <div className="font-medium text-sm text-foreground/80 mb-1">{formatDate(entry.date)}</div>
                <div className="text-sm truncate font-serif">{entry.title || 'Untitled Entry'}</div>
              </button>
            ))}
            
            {entries?.length === 0 && (
               <p className="text-sm text-muted-foreground text-center py-4">No entries yet.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Editor */}
      <div className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0 lg:h-full lg:pl-6">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            {formatDate(activeDate)}
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs text-muted-foreground transition-opacity duration-300">
               {isSaving ? 'Saving...' : 'Saved'}
             </span>
             <Button variant="ghost" size="sm" onClick={() => setIsPreview(!isPreview)}>
               {isPreview ? 'Edit' : 'Preview'}
             </Button>
             {activeEntryId !== null && (
               <Dialog>
                 {/* @ts-expect-error type issue with Radix */}
                 <DialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>Delete Journal Entry</DialogTitle>
                     <DialogDescription>
                       Are you sure you want to delete this journal entry? This action cannot be undone.
                     </DialogDescription>
                   </DialogHeader>
                   <DialogFooter>
                     <Button variant="destructive" onClick={() => void handleDeleteEntry()}>Delete</Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>
             )}
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry Title"
          className="w-full text-3xl sm:text-4xl display-heading bg-transparent border-none outline-none mb-6 placeholder:text-muted-foreground/30 text-foreground"
          disabled={isPreview}
        />

        <div className="flex-1 overflow-hidden relative">
          {isPreview ? (
            <ScrollArea className="h-full w-full pr-4">
               <div 
                 className="prose-content writing-area pb-20"
                 dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Empty entry*') }}
               />
            </ScrollArea>
          ) : (
            <HighlightEditor
              content={content}
              onContentChange={setContent}
              placeholder="Write your thoughts..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
