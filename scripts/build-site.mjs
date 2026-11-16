/*
  Erzeugt aus den flachen Quellen den auslieferbaren Ordner dist/ mit sauberen URLs:
  projekt.html -> dist/projekt/index.html (erreichbar als /projekt/), index.html bleibt an der Wurzel.
  Interne Links und Asset-Pfade werden dabei auf absolute Pfade umgeschrieben.
  Die Quellen im Repo bleiben unverändert und lokal weiter direkt per http.server nutzbar.
  Aufruf: node scripts/build-site.mjs
*/
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRewriter, findLinkErrors, outputFile } from "./lib/site.mjs";

const OUT = "dist";
const COPY = ["css", "js", "assets", "data", "robots.txt", "sitemap.xml"];

const pages = readdirSync(".").filter((name) => name.endsWith(".html"));
if (!pages.includes("index.html")) {
  console.error("Fehler   index.html fehlt");
  process.exit(1);
}

const rewrite = createRewriter(pages);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

for (const entry of COPY) {
  if (!existsSync(entry)) continue;
  cpSync(entry, path.join(OUT, entry), { recursive: true });
}

for (const file of readdirSync(path.join(OUT, "js")).filter((name) => name.endsWith(".js"))) {
  const target = path.join(OUT, "js", file);
  writeFileSync(target, rewrite.js(readFileSync(target, "utf8")));
}

for (const file of pages) {
  const target = outputFile(OUT, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, rewrite.html(readFileSync(file, "utf8")));
}

// Prüfung: jeder interne Verweis in dist/ muss auf eine vorhandene Datei zeigen
const errors = [];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

for (const file of walk(OUT).filter((name) => name.endsWith(".html"))) {
  for (const message of findLinkErrors(readFileSync(file, "utf8"), OUT, existsSync)) errors.push(`${file}: ${message}`);
}

for (const message of errors) console.error(`Fehler   ${message}`);
console.log(`${pages.length} Seiten nach ${OUT}/ geschrieben, ${errors.length} Fehler`);
process.exit(errors.length ? 1 : 0);
