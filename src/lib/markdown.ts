/**
 * Lightweight markdown renderer — no external dependencies.
 *
 * Converts a subset of Markdown to HTML that pairs with the `.prose-content`
 * CSS class defined in index.css.
 *
 * Supported syntax:
 *   # H1 / ## H2 / ### H3, **bold**, *italic*, `code`, ```code blocks```,
 *   - / * unordered lists, 1. ordered lists, > blockquotes, --- / *** hr,
 *   [text](url), double-newline paragraphs.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape HTML-special characters so user content is safe to embed. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Apply inline formatting rules to a single line of text.
 * Order matters — code spans are handled first so their contents aren't
 * processed by later rules.
 */
function processInline(text: string): string {
  // Inline code — must come first so content inside backticks stays literal
  text = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>',
  );

  // Bold: **text** or __text__  (process before italic)
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");

  // Handle both highlight syntaxes in one pass. A second replacement pass
  // would see the == markers in HTML created by the first pass.
  text = text.replace(
    /==(?:(yellow|green|blue|pink|purple|orange):)?(.+?)==/g,
    (_match, color: string | undefined, inner: string) =>
      `<span class="highlight-${color || "yellow"}">${inner}</span>`,
  );

  return text;
}

// ---------------------------------------------------------------------------
// Block-level parsing
// ---------------------------------------------------------------------------

interface BlockToken {
  type:
    | "heading"
    | "hr"
    | "codeblock"
    | "blockquote"
    | "ul"
    | "ol"
    | "paragraph";
  html: string;
}

/**
 * Tokenise the source text into an ordered list of block-level tokens,
 * then join their HTML representations.
 */
function parseBlocks(source: string): string {
  const tokens: BlockToken[] = [];

  // Normalise line endings
  const raw = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // --- Extract fenced code blocks first (``` … ```) ---
  // We split around them so they don't interfere with other parsing.
  const codeBlockRegex = /^```(\w*)\n([\s\S]*?)^```$/gm;
  const segments: { text: string; isCode: boolean; lang?: string }[] = [];
  let lastIdx = 0;

  for (const match of raw.matchAll(codeBlockRegex)) {
    const start = match.index!;
    if (start > lastIdx) {
      segments.push({ text: raw.slice(lastIdx, start), isCode: false });
    }
    segments.push({
      text: match[2],
      isCode: true,
      lang: match[1] || undefined,
    });
    lastIdx = start + match[0].length;
  }
  if (lastIdx < raw.length) {
    segments.push({ text: raw.slice(lastIdx), isCode: false });
  }

  for (const seg of segments) {
    if (seg.isCode) {
      const langAttr = seg.lang ? ` class="language-${escapeHtml(seg.lang)}"` : "";
      tokens.push({
        type: "codeblock",
        html: `<pre><code${langAttr}>${escapeHtml(seg.text.replace(/\n$/, ""))}</code></pre>`,
      });
      continue;
    }

    // Split remaining text into blocks separated by blank lines
    const blocks = seg.text.split(/\n{2,}/);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      // --- Horizontal rule ---
      if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
        tokens.push({ type: "hr", html: "<hr />" });
        continue;
      }

      // --- Heading ---
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/m);
      if (headingMatch && trimmed.split("\n").length === 1) {
        const level = headingMatch[1].length;
        tokens.push({
          type: "heading",
          html: `<h${level}>${processInline(escapeHtml(headingMatch[2]))}</h${level}>`,
        });
        continue;
      }

      // --- Blockquote ---
      if (/^>\s?/.test(trimmed)) {
        const lines = trimmed
          .split("\n")
          .map((l) => l.replace(/^>\s?/, ""))
          .map((l) => processInline(escapeHtml(l)));
        tokens.push({
          type: "blockquote",
          html: `<blockquote><p>${lines.join("<br />")}</p></blockquote>`,
        });
        continue;
      }

      // --- Unordered list ---
      if (/^[-*]\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter((l) => /^[-*]\s/.test(l));
        if (items.length > 0) {
          const lis = items
            .map((l) => l.replace(/^[-*]\s+/, ""))
            .map((l) => `<li>${processInline(escapeHtml(l))}</li>`)
            .join("");
          tokens.push({ type: "ul", html: `<ul>${lis}</ul>` });
          continue;
        }
      }

      // --- Ordered list ---
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l));
        if (items.length > 0) {
          const lis = items
            .map((l) => l.replace(/^\d+\.\s+/, ""))
            .map((l) => `<li>${processInline(escapeHtml(l))}</li>`)
            .join("");
          tokens.push({ type: "ol", html: `<ol>${lis}</ol>` });
          continue;
        }
      }

      // --- Multi-line block: each line may be its own heading / hr etc. ---
      // If the block contains multiple lines that individually look like
      // different block-level elements, split them out.
      const lines = trimmed.split("\n");
      if (lines.length > 1 && lines.some((l) => /^#{1,3}\s/.test(l))) {
        // Re-process each line as its own block
        for (const line of lines) {
          const lineTokens = parseBlocks(line);
          tokens.push({ type: "paragraph", html: lineTokens });
        }
        continue;
      }

      // --- Paragraph (default) ---
      const processed = lines
        .map((l) => processInline(escapeHtml(l)))
        .join("<br />");
      tokens.push({ type: "paragraph", html: `<p>${processed}</p>` });
    }
  }

  return tokens.map((t) => t.html).join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a markdown string to an HTML string.
 *
 * The returned markup is designed to be used inside an element with the
 * `.prose-content` class.
 *
 * @example
 * ```tsx
 * <div
 *   className="prose-content"
 *   dangerouslySetInnerHTML={{ __html: renderMarkdown(note) }}
 * />
 * ```
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";
  return parseBlocks(text);
}

/**
 * Strip all markdown formatting and return plain text.
 * Useful for generating previews, search excerpts, or meta descriptions.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";

  let result = text;

  // Remove fenced code block markers (keep content)
  result = result.replace(/^```\w*\n?/gm, "");
  result = result.replace(/^```$/gm, "");

  // Remove inline code backticks
  result = result.replace(/`([^`]+)`/g, "$1");

  // Remove links — keep link text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove bold / italic markers
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/__(.+?)__/g, "$1");
  result = result.replace(/\*(.+?)\*/g, "$1");
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1");

  // Remove headings markers
  result = result.replace(/^#{1,3}\s+/gm, "");

  // Remove blockquote markers
  result = result.replace(/^>\s?/gm, "");

  // Remove list markers
  result = result.replace(/^[-*]\s+/gm, "");
  result = result.replace(/^\d+\.\s+/gm, "");

  // Remove horizontal rules
  result = result.replace(/^(-{3,}|\*{3,})$/gm, "");

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}
