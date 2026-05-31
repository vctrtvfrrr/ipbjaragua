import { marked } from 'marked';

/** Render a markdown string to block-level HTML (synchronous). Returns an empty string for empty input. */
export default function renderMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return '';
  return marked.parse(markdown, { async: false });
}
