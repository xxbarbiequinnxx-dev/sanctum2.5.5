const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "STRIKE",
  "UL",
  "OL",
  "LI",
  "SPAN",
  "DIV",
  "H1",
  "H2",
  "H3",
  "BLOCKQUOTE",
  "LABEL",
  "INPUT",
]);

const ALLOWED_ATTR = new Set([
  "style",
  "class",
  "data-type",
  "data-checked",
  "type",
  "checked",
  "disabled",
]);

const STYLE_OK = /^(font-family|font-size|font-weight|font-style|text-decoration)\s*:/i;

export function looksLikeHtml(value: string) {
  return /<\/?(p|br|strong|b|em|i|u|ul|ol|li|span|div|h[1-3]|blockquote)\b/i.test(value);
}

export function escapeText(value: string) {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

export function toEditorHtml(value: string) {
  if (!value.trim()) return "";
  if (looksLikeHtml(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeText(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function cleanStyle(style: string) {
  return style
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && STYLE_OK.test(part) && !/expression|url\s*\(/i.test(part))
    .join("; ");
}

function stripScripts(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function sanitizeNode(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === 8) {
      child.parentNode?.removeChild(child);
      continue;
    }
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    if (!ALLOWED_TAGS.has(el.tagName)) {
      const text = el.textContent ?? "";
      const textNode = el.ownerDocument.createTextNode(text);
      el.replaceWith(textNode);
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTR.has(name) && !name.startsWith("data-")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style") {
        const cleaned = cleanStyle(attr.value);
        if (cleaned) el.setAttribute("style", cleaned);
        else el.removeAttribute("style");
      }
      if (name === "type" && attr.value.toLowerCase() !== "checkbox") {
        el.removeAttribute("type");
      }
    }
    if (el.tagName === "INPUT") {
      el.setAttribute("type", "checkbox");
    }
    sanitizeNode(el);
  }
}

export function sanitizeRichHtml(html: string) {
  if (!html) return "";
  const stripped = stripScripts(html);
  if (typeof DOMParser === "undefined") return stripped;
  const doc = new DOMParser().parseFromString(stripped, "text/html");
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

export function toggleChecklistAt(html: string, index: number): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(sanitizeRichHtml(html), "text/html");
  const boxes = Array.from(doc.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]'));
  const box = boxes[index] as HTMLInputElement | undefined;
  if (!box) return html;
  const li = box.closest("li");
  const next = box.getAttribute("checked") == null;
  if (next) box.setAttribute("checked", "");
  else box.removeAttribute("checked");
  if (li) li.setAttribute("data-checked", next ? "true" : "false");
  return doc.body.innerHTML;
}

export function plainExcerpt(html: string, max = 220) {
  if (!html) return "";
  const text = looksLikeHtml(html)
    ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : html.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
