/*
  Erzeugt aus den flachen Quellen den auslieferbaren Ordner dist/ mit sauberen URLs:
  projekt.html -> dist/projekt/index.html (erreichbar als /projekt/), index.html bleibt an der Wurzel.
  Interne Links und Asset-Pfade werden dabei auf absolute Pfade umgeschrieben.
  Die Quellen im Repo bleiben unverändert und lokal weiter direkt per http.server nutzbar.
  Aufruf: node scripts/build-site.mjs
*/
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "dist";
const COPY = ["css", "js", "assets", "data", "robots.txt", "sitemap.xml"];
const ASSET_DIRS = "css|js|assets|data";

const pages = readdirSync(".").filter((name) => name.endsWith(".html"));
if (!pages.includes("index.html")) {
  console.error("Fehler   index.html fehlt");
  process.exit(1);
}

const pageUrl = (file) => (file === "index.html" ? "/" : `/${file.slice(0, -".html".length)}/`);

// "projekt.html#x" -> "/projekt/#x" (nur ganze Zeichenketten in Anführungszeichen, bekannte Seiten)
const rewritePages = (text) =>
  text.replace(/(["'])([A-Za-z0-9_-]+\.html)([#?][^"']*)?\1/g, (match, quote, file, rest = "") =>
    pages.includes(file) ? `${quote}${pageUrl(file)}${rest}${quote}` : match,
  );

const rewriteHtml = (text) => rewritePages(text).replace(new RegExp(`\\b(href|src)="(${ASSET_DIRS})/`, "g"), '$1="/$2/');
const rewriteJs = (text) => rewritePages(text).replace(new RegExp(`(["'])(${ASSET_DIRS})/`, "g"), "$1/$2/");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

for (const entry of COPY) {
  if (!existsSync(entry)) continue;
  cpSync(entry, path.join(OUT, entry), { recursive: true });
}

for (const file of readdirSync(path.join(OUT, "js")).filter((name) => name.endsWith(".js"))) {
  const target = path.join(OUT, "js", file);
  writeFileSync(target, rewriteJs(readFileSync(target, "utf8")));
}

for (const file of pages) {
  const target = file === "index.html" ? path.join(OUT, "index.html") : path.join(OUT, file.slice(0, -".html".length), "index.html");
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, rewriteHtml(readFileSync(file, "utf8")));
}

// Prüfung: jeder interne Verweis in dist/ muss auf eine vorhandene Datei zeigen
const errors = [];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

for (const file of walk(OUT).filter((name) => name.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith("/") || target.startsWith("//")) {
      if (/^[A-Za-z0-9_-]+\.html([#?]|$)/.test(target)) errors.push(`${file}: Link ohne saubere URL: ${target}`);
      continue;
    }
    const clean = decodeURIComponent(target.split("#")[0].split("?")[0]);
    const onDisk = path.join(OUT, clean.endsWith("/") ? `${clean}index.html` : clean);
    if (!existsSync(onDisk)) errors.push(`${file}: interner Verweis ohne Ziel: ${target}`);
  }
}

for (const message of errors) console.error(`Fehler   ${message}`);
console.log(`${pages.length} Seiten nach ${OUT}/ geschrieben, ${errors.length} Fehler`);
process.exit(errors.length ? 1 : 0);
