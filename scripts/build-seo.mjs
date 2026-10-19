import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SITE = "https://www.edv-kretzer.de";
const SITE_NAME = "EDV-Kretzer";
const CHECK_ONLY = process.argv.includes("--check");

const PERSON = {
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: "Peter Kretzer",
  url: `${SITE}/`,
  email: "info@edv-kretzer.de",
  description: "Entwickler von capulus-core, einem offenen GitOps-Homelab auf k3s, ArgoCD und Tailscale.",
  sameAs: ["https://github.com/pkr-lab/capulus-core"],
};

const PAGES = {
  "index.html": { priority: "1.0", changefreq: "weekly", image: "screenshot-argocd.png" },
  "projekt.html": { crumb: "Projekt", priority: "0.9", changefreq: "monthly", image: "screenshot-argocd.png" },
  "capulus.html": { crumb: "capulus im Überblick", priority: "0.9", changefreq: "weekly", image: "screenshot-argocd.png", deps: ["data/projects.json", "data/versions.json", "data/releases.json"], group: "projekt.html" },
  "anwendungen.html": { crumb: "Anwendungen", priority: "0.9", changefreq: "monthly", image: "screenshot-uptime-kuma.png", deps: ["data/apps.json"], group: "projekt.html" },
  "mediamtx-drohnenstream.html": { crumb: "Drohnenstream-Anleitung", priority: "0.7", changefreq: "yearly", group: "projekt.html" },
  "app.html": { crumb: "App", priority: "0.8", changefreq: "monthly", image: "app-uebersicht.png" },
  "updates.html": { crumb: "Updates", priority: "0.6", changefreq: "daily", deps: ["data/releases.json"] },
  "ueber-mich.html": { crumb: "Über mich", priority: "0.6", changefreq: "yearly", image: "peter-kretzer.jpg" },
  "kontakt.html": { crumb: "Kontakt", priority: "0.7", changefreq: "yearly" },
  "sitemap.html": { crumb: "Sitemap", priority: "0.3", changefreq: "monthly" },
  "impressum.html": { crumb: "Impressum", priority: "0.2", changefreq: "yearly" },
  "datenschutz.html": { crumb: "Datenschutz", priority: "0.2", changefreq: "yearly" },
};

const errors = [];
const warnings = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null);
const escapeAttr = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const jsonLd = (data) => JSON.stringify(data, null, 2).replace(/</g, "\\u003c");

const lastCommitDate = (files) => {
  let latest = "";
  for (const file of files.filter((candidate) => existsSync(candidate))) {
    let date = "";
    try {
      const dirty = execFileSync("git", ["status", "--porcelain", "--", file], { encoding: "utf8" }).trim();
      date = dirty ? new Date().toISOString().slice(0, 10) : execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { encoding: "utf8" }).trim();
    } catch {
      date = "";
    }
    if (!date) date = statSync(file).mtime.toISOString().slice(0, 10);
    if (date > latest) latest = date;
  }
  return latest;
};

const files = readdirSync(".").filter((name) => name.endsWith(".html")).sort();
for (const file of files) if (!PAGES[file]) fail(file, "Seite fehlt in der Tabelle PAGES von scripts/build-seo.mjs");
for (const file of Object.keys(PAGES)) if (!files.includes(file)) fail(file, "steht in PAGES, die Datei gibt es nicht");

const projects = readJson("data/projects.json") || [];
const versions = readJson("data/versions.json") || {};
const apps = readJson("data/apps.json") || [];

const canonicalOf = (file) => (file === "index.html" ? `${SITE}/` : `${SITE}/${file}`);

const buildGraph = (file, meta) => {
  const url = canonicalOf(file);
  const website = { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: SITE_NAME, inLanguage: "de-DE", publisher: { "@id": `${SITE}/#person` } };
  if (file === "index.html") {
    return [PERSON, website, { "@type": "WebPage", "@id": `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: "de-DE", isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#person` } }];
  }
  const trail = [{ name: "Home", url: `${SITE}/` }];
  const group = PAGES[file].group;
  if (group && existsSync(group)) trail.push({ name: "Projekt", url: canonicalOf(group) });
  trail.push({ name: meta.shortTitle, url });
  const graph = [
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: "de-DE", isPartOf: { "@id": `${SITE}/#website` } },
    { "@type": "BreadcrumbList", itemListElement: trail.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) },
  ];
  if (file === "capulus.html") {
    graph.push({
      "@type": "ItemList",
      name: "Projekte",
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SoftwareSourceCode",
          name: project.name,
          description: project.summary,
          codeRepository: `https://github.com/pkr-lab/${project.repo}`,
          programmingLanguage: (project.stack || [])[0],
          ...(versions[project.repo] ? { version: versions[project.repo].tag } : {}),
          author: { "@id": `${SITE}/#person` },
        },
      })),
    });
  }
  if (file === "anwendungen.html") {
    graph.push({
      "@type": "ItemList",
      name: "Anwendungen",
      itemListElement: apps.map((app, index) => ({ "@type": "ListItem", position: index + 1, name: app.name, ...(app.url ? { url: app.url } : {}) })),
    });
  }
  return graph;
};

const GENERATED = [
  /[ \t]*<meta property="og:[^>]*>\n?/g,
  /[ \t]*<meta name="twitter:[^>]*>\n?/g,
  /[ \t]*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\n?/g,
  /[ \t]*<!--\s*Open Graph\s*-->\n?/g,
  /\n{3,}(?=\s*<link rel="stylesheet")/g,
];

const checkLinks = (file, html) => {
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/.test(target)) continue;
    const clean = target.split("#")[0].split("?")[0];
    if (clean && !existsSync(path.normalize(clean))) fail(file, `interner Verweis ohne Ziel: ${target}`);
  }
};

const sitemapEntries = [];

for (const file of files.filter((name) => PAGES[name])) {
  const meta = PAGES[file];
  let html = readFileSync(file, "utf8");

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((match) => match[1]);
  if (!title) fail(file, "kein <title>");
  if (!description) fail(file, "keine Meta-Description");
  if (canonicals.length !== 1) fail(file, `${canonicals.length} Canonical-Links statt einem`);
  else if (canonicals[0] !== canonicalOf(file)) fail(file, `Canonical ${canonicals[0]} statt ${canonicalOf(file)}`);
  if (!title || !description) continue;
  const plainTitle = decode(title.trim());
  const plainDescription = decode(description.trim());
  if (plainTitle.length > 80) warn(file, `Titel hat ${plainTitle.length} Zeichen (empfohlen bis 80)`);
  if (plainDescription.length < 50 || plainDescription.length > 220) warn(file, `Description hat ${plainDescription.length} Zeichen (empfohlen 50 bis 220)`);

  const shortTitle = plainTitle.replace(/\s*\|\s*EDV-Kretzer\s*$/, "");
  const page = { title: shortTitle, shortTitle: meta.crumb || shortTitle, description: plainDescription };

  const tags = [
    `<meta property="og:type" content="website" data-seo>`,
    `<meta property="og:site_name" content="${SITE_NAME}" data-seo>`,
    `<meta property="og:title" content="${escapeAttr(page.title)}" data-seo>`,
    `<meta property="og:description" content="${escapeAttr(page.description)}" data-seo>`,
    `<meta property="og:url" content="${canonicalOf(file)}" data-seo>`,
    `<meta property="og:locale" content="de_DE" data-seo>`,
  ];
  if (meta.image) {
    if (!existsSync(`assets/images/${meta.image}`)) fail(file, `Vorschaubild fehlt: assets/images/${meta.image}`);
    tags.push(`<meta property="og:image" content="${SITE}/assets/images/${meta.image}" data-seo>`);
  }
  tags.push(
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" data-seo>`,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}" data-seo>`,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}" data-seo>`,
  );
  const block = `  ${tags.join("\n  ")}\n  <script type="application/ld+json" data-seo>\n${jsonLd({ "@context": "https://schema.org", "@graph": buildGraph(file, page) })}\n  </script>\n`;

  let cleaned = html;
  for (const pattern of GENERATED) cleaned = cleaned.replace(pattern, "\n".repeat(pattern.source.startsWith("\\n{3,}") ? 2 : 0));
  cleaned = cleaned.replace(/<\/head>/, `${block}</head>`);
  checkLinks(file, cleaned);
  if (cleaned !== html && !CHECK_ONLY) writeFileSync(file, cleaned);

  const lastmod = lastCommitDate([file, ...(meta.deps || [])]);
  sitemapEntries.push({ loc: canonicalOf(file), lastmod, changefreq: meta.changefreq, priority: meta.priority });
}

sitemapEntries.sort((a, b) => Number(b.priority) - Number(a.priority) || a.loc.localeCompare(b.loc));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries
  .map((entry) => `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`)
  .join("\n")}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /automation/\nDisallow: /scripts/\nDisallow: /.github/\n\nSitemap: ${SITE}/sitemap.xml\n`;

if (!CHECK_ONLY) {
  writeFileSync("sitemap.xml", sitemap);
  writeFileSync("robots.txt", robots);
}

for (const message of warnings) console.warn(`Warnung  ${message}`);
for (const message of errors) console.error(`Fehler   ${message}`);
console.log(`${files.length} Seiten geprüft, ${errors.length} Fehler, ${warnings.length} Warnungen${CHECK_ONLY ? " (nur Prüfung)" : ", Dateien geschrieben"}`);
process.exit(errors.length ? 1 : 0);
