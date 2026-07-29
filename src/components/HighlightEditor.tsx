import { useEffect, useRef } from 'react';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', label: 'Yellow', bg: '#fef08a' },
  { name: 'green', label: 'Green', bg: '#bbf7d0' },
  { name: 'blue', label: 'Blue', bg: '#bfdbfe' },
  { name: 'pink', label: 'Pink', bg: '#fecdd3' },
  { name: 'purple', label: 'Purple', bg: '#e9d5ff' },
  { name: 'orange', label: 'Orange', bg: '#fed7aa' },
];

interface HighlightEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const HIGHLIGHT_PATTERN = /==(?:(yellow|green|blue|pink|purple|orange):)?([\s\S]*?)==/g;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Converts the stored highlight syntax into editable, marker-free HTML. */
function renderHighlighted(text: string): string {
  return escapeHtml(text)
    .replace(HIGHLIGHT_PATTERN, (_match, color: string | undefined, inner: string) => {
      return `<span data-highlight-color="${color || 'yellow'}">${inner}</span>`;
    })
    .replace(/\n/g, '<br>');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  if (element.tagName === 'BR') return '\n';

  const inner = Array.from(element.childNodes).map(serializeNode).join('');
  const color = element.dataset.highlightColor;
  if (color) return `==${color === 'yellow' ? '' : `${color}:`}${inner}==`;

  // Browsers may create divs when pasting or pressing Enter in contenteditable.
  return element.tagName === 'DIV' ? `${inner}\n` : inner;
}

function serializeEditor(editor: HTMLDivElement): string {
  const text = Array.from(editor.childNodes).map(serializeNode).join('');
  // Browsers use a lone <br> as the empty contenteditable placeholder.
  return text === '\n' ? '' : text;
}

/**
 * A contenteditable highlighter. Unlike a transparent textarea/backdrop pair,
 * the stored == markers never take up visual width, so text spacing is natural.
 */
export function HighlightEditor({ content, onContentChange, placeholder, disabled }: HighlightEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Do not overwrite the editor during normal typing; only sync externally
  // loaded content (for example, when switching journal entries).
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && serializeEditor(editor) !== content) {
      editor.innerHTML = renderHighlighted(content);
    }
  }, [content]);

  const emitContent = () => {
    if (editorRef.current) onContentChange(serializeEditor(editorRef.current));
  };

  const wrapSelection = (color: string) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    // Replacing the selected fragment with its plain text intentionally makes
    // the newly chosen color authoritative if an existing highlight is selected.
    const selectedText = range.toString();
    if (!selectedText) return;

    range.deleteContents();
    const highlight = document.createElement('span');
    highlight.dataset.highlightColor = color;
    highlight.textContent = selectedText;
    range.insertNode(highlight);

    // Put the caret in an unstyled text node after the highlight. Without
    // this, browsers continue typing inside the new span and unintentionally
    // apply the last selected color to all following text.
    const trailingText = document.createTextNode('');
    highlight.after(trailingText);
    const nextRange = document.createRange();
    nextRange.setStart(trailingText, 0);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    emitContent();
    editor.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {!disabled && (
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border/30">
          <span className="text-xs text-muted-foreground/50 font-mono select-none">🖍️</span>
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => wrapSelection(color.name)}
              title={`Highlight ${color.label}`}
              className="w-6 h-6 rounded-full border-2 border-white/80 hover:scale-125 hover:border-foreground/30 transition-all duration-200 cursor-pointer shadow-sm"
              style={{ background: color.bg }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground/40 font-mono select-none ml-1">
            Select text → click color
          </span>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitContent}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            document.execCommand('insertLineBreak');
          }
        }}
        spellCheck={false}
        className="highlight-editor flex-1 overflow-y-auto border-none outline-none writing-area whitespace-pre-wrap break-words leading-[1.8]"
        style={{ wordBreak: 'break-word' }}
      />
    </div>
  );
}

export { HIGHLIGHT_COLORS };
