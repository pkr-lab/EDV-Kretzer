import path from "node:path";

export const ASSET_DIRS = "css|js|assets|data";

export const pageUrl = (file) => (file === "index.html" ? "/" : `/${file.slice(0, -".html".length)}/`);

export const outputFile = (outDir, file) =>
  file === "index.html" ? path.join(outDir, "index.html") : path.join(outDir, file.slice(0, -".html".length), "index.html");

export const createRewriter = (pages) => {
  const rewritePages = (text) =>
    text.replace(/(["'])([A-Za-z0-9_-]+\.html)([#?][^"']*)?\1/g, (match, quote, file, rest = "") =>
      pages.includes(file) ? `${quote}${pageUrl(file)}${rest}${quote}` : match,
    );
  return {
    html: (text) => rewritePages(text).replace(new RegExp(`\\b(href|src)="(${ASSET_DIRS})/`, "g"), '$1="/$2/'),
    js: (text) => rewritePages(text).replace(new RegExp(`(["'])(${ASSET_DIRS})/`, "g"), "$1/$2/"),
  };
};

export const findLinkErrors = (html, outDir, exists) => {
  const errors = [];
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith("/") || target.startsWith("//")) {
      if (/^[A-Za-z0-9_-]+\.html([#?]|$)/.test(target)) errors.push(`Link ohne saubere URL: ${target}`);
      continue;
    }
    const clean = decodeURIComponent(target.split("#")[0].split("?")[0]);
    const onDisk = path.join(outDir, clean.endsWith("/") ? `${clean}index.html` : clean);
    if (!exists(onDisk)) errors.push(`interner Verweis ohne Ziel: ${target}`);
  }
  return errors;
};
