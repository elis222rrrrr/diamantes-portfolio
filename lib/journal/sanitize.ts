import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Every article's `content` goes through this before it's stored — the
 * editor's own output is trusted no more than any other user input, since a
 * compromised or careless EDITOR-role account (or a future paste-raw-HTML
 * feature) could otherwise inject a stored XSS payload rendered via
 * `dangerouslySetInnerHTML` on the public article page. The allowlist below
 * covers exactly what the Tiptap editor (components/journal/Editor.tsx) can
 * actually produce — nothing more.
 */
export function sanitizeArticleContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "pre",
      "code",
      "hr",
      "div",
      "span",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title", "width", "height", "class"],
      iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "class"],
      div: ["class", "data-variant", "data-callout"],
      span: ["class"],
      code: ["class"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // The Youtube embed extension is the only iframe source this editor can
    // produce — restricting the hostname is what actually makes allowing
    // `iframe` at all safe (an arbitrary iframe src is a real risk otherwise).
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"],
    // Strips `javascript:`/`data:` hrefs and any other scheme not listed above.
    disallowedTagsMode: "discard",
  });
}
