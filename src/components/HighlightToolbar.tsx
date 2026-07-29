const HIGHLIGHT_COLORS = [
  { name: 'yellow', label: 'Yellow', bg: 'oklch(0.95 0.12 95 / 0.6)' },
  { name: 'green', label: 'Green', bg: 'oklch(0.92 0.10 150 / 0.55)' },
  { name: 'blue', label: 'Blue', bg: 'oklch(0.92 0.08 245 / 0.5)' },
  { name: 'pink', label: 'Pink', bg: 'oklch(0.92 0.08 350 / 0.5)' },
  { name: 'purple', label: 'Purple', bg: 'oklch(0.92 0.08 300 / 0.5)' },
  { name: 'orange', label: 'Orange', bg: 'oklch(0.93 0.10 65 / 0.55)' },
];

interface HighlightToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onContentChange: (newContent: string) => void;
}

export function HighlightToolbar({ textareaRef, content, onContentChange }: HighlightToolbarProps) {
  const wrapSelection = (color: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return; // No selection

    const selectedText = content.slice(start, end);
    
    // Check if already highlighted — unwrap if so
    const beforeSlice = content.slice(Math.max(0, start - 20), start);
    const afterSlice = content.slice(end, end + 3);
    if (beforeSlice.includes('==') && afterSlice.includes('==')) {
      // Already wrapped, skip
      return;
    }

    const wrapped = color === 'yellow' 
      ? `==${selectedText}==` 
      : `==${color}:${selectedText}==`;
    
    const newContent = content.slice(0, start) + wrapped + content.slice(end);
    onContentChange(newContent);

    // Restore focus after a tick
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + wrapped.length);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground/50 font-mono mr-0.5 select-none">🖍️</span>
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => wrapSelection(color.name)}
            title={`Highlight ${color.label} — select text first`}
            className="w-6 h-6 rounded-full border-2 border-white/80 hover:scale-130 hover:border-foreground/30 transition-all duration-200 cursor-pointer shadow-sm"
            style={{ background: color.bg }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground/40 font-mono select-none">
        Select text → pick color → Preview to see
      </span>
    </div>
  );
}

export { HIGHLIGHT_COLORS };
