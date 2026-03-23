const RAW_HTML_BLOCK_TAG_RE = /<(table|tbody|thead|tfoot|tr|td|th|div|section|article|main|header|footer|nav|aside)\b/gi;

function removeScriptStyleBlocks(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function resolveAttributeUrl(value: string, baseUrl: string, allowDataUrl: boolean): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol === "javascript:" || resolved.protocol === "vbscript:") {
      return undefined;
    }
    if (resolved.protocol === "data:" && !allowDataUrl) {
      return undefined;
    }
    return resolved.toString();
  } catch {
    return undefined;
  }
}

function resolveSrcSet(srcset: string, baseUrl: string): string | undefined {
  const values = srcset
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [urlPart, descriptor] = entry.split(/\s+/, 2);
      const resolved = resolveAttributeUrl(urlPart, baseUrl, true);
      if (!resolved) return undefined;
      return descriptor ? `${resolved} ${descriptor}` : resolved;
    })
    .filter((entry): entry is string => Boolean(entry));

  return values.length > 0 ? values.join(", ") : undefined;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ");
}

function cleanupText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanupMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\[\s*\n+(#{1,6})\s+([^\n]+?)\s*\n+\s*\]\(([^)]+)\)/g, (_match, hashes: string, text: string, url: string) => {
      return `${hashes} [${text.trim()}](${url})`;
    })
    .replace(/^\[\]\([^)]+\)\n?/gm, "")
    .replace(/(\]\([^)]+\))(?=\[)/g, "$1 ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeHtml(rawHtml: string, baseUrl: string): string {
  let html = removeScriptStyleBlocks(rawHtml)
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
    .replace(/<(header|footer|nav|aside|dialog|menu)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "")
    .replace(/<(header|footer|nav|aside|dialog|menu)[^>]*>[\s\S]*?<\/\1>/gi, "");

  html = html.replace(/\b(href|src|poster)=(["'])([^"']+)\2/gi, (_match, attr: string, quote: string, value: string) => {
    const allowData = attr.toLowerCase() !== "href";
    const resolved = resolveAttributeUrl(value, baseUrl, allowData);
    if (!resolved) return "";
    return `${attr}=${quote}${resolved}${quote}`;
  });

  html = html.replace(/\bsrcset=(["'])([^"']+)\1/gi, (_match, quote: string, value: string) => {
    const resolved = resolveSrcSet(value, baseUrl);
    if (!resolved) return "";
    return `srcset=${quote}${resolved}${quote}`;
  });

  return `<div>${html}</div>`;
}

export function htmlToText(rawHtml: string, baseUrl: string): string {
  const sanitized = sanitizeHtml(rawHtml, baseUrl);

  const blockAware = sanitized
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(p|article|section|main|ul|ol|table|h1|h2|h3|h4|h5|h6)\b[^>]*>/gi, "\n\n")
    .replace(/<\/(p|article|section|main|ul|ol|table|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<\/(div|li|tr|td|th)>/gi, "\n");

  const plainText = stripTags(blockAware);
  return cleanupText(decodeHtmlEntities(plainText));
}

export function htmlToMarkdown(rawHtml: string, baseUrl: string): string {
  const sanitized = sanitizeHtml(rawHtml, baseUrl);

  const markdownish = sanitized
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>\s*<(h[1-6])[^>]*>([\s\S]*?)<\/\2>\s*<\/a>/gi, "<$2>[$3]($1)</$2>")
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n##### $1\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n###### $1\n")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, "*$2*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<(br|br\/)\s*>/gi, "\n")
    .replace(/<(p|div|section|article|header|footer|main)\b[^>]*>/gi, "\n\n")
    .replace(/<\/(p|div|section|article|header|footer|main)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  return cleanupMarkdown(decodeHtmlEntities(markdownish));
}

export function isPoorMarkdownConversion(markdown: string): boolean {
  const rawBlockTags = markdown.match(RAW_HTML_BLOCK_TAG_RE)?.length ?? 0;
  if (rawBlockTags >= 6) return true;
  if (/^\s*<(table|tbody|thead|tfoot|tr|td|th|div|section|article|main)\b/i.test(markdown)) return true;
  return false;
}
