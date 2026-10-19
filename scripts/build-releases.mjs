import { writeFileSync } from "node:fs";

const REPO = "pkr-lab/capulus-core";
const COUNT = 10;
const MAX_BULLETS = 3;
const MAX_LENGTH = 320;

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=${COUNT}`, { headers });
if (!response.ok) {
  console.error(`GitHub-API: HTTP ${response.status}`);
  process.exit(1);
}

const summarize = (notes) => {
  const sections = { Features: [], "Bug Fixes": [] };
  let current = null;
  for (const line of String(notes || "").split("\n")) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      current = sections[heading[1]] ? heading[1] : null;
      continue;
    }
    const bullet = line.match(/^\*\s+(.*)$/);
    if (bullet && current) {
      const text = bullet[1]
        .replace(/\s*\(\[[0-9a-f]{7,}\]\([^)]*\)\)\s*$/, "")
        .replace(/\*\*([^*]+):\*\*\s*/, "$1: ")
        .trim();
      if (text) sections[current].push(text);
    }
  }
  const parts = [];
  for (const [name, label] of [["Features", "Neu"], ["Bug Fixes", "Behoben"]]) {
    const items = sections[name];
    if (!items.length) continue;
    const shown = items.slice(0, MAX_BULLETS).join("; ");
    const rest = items.length > MAX_BULLETS ? ` und ${items.length - MAX_BULLETS} weitere` : "";
    parts.push(`${label}: ${shown}${rest}`);
  }
  let summary = parts.join(". ");
  if (summary.length > MAX_LENGTH) summary = `${summary.slice(0, MAX_LENGTH - 1).trimEnd()}…`;
  return summary || "Release veröffentlicht.";
};

const releases = (await response.json())
  .filter((release) => !release.draft && !release.prerelease)
  .slice(0, COUNT)
  .map((release) => {
    const hasFeature = /^###\s+Features\s*$/m.test(release.body || "");
    const major = /^#\s+\[\d+\.0\.0\]/m.test(release.body || "");
    return {
      id: release.tag_name,
      date: release.published_at.slice(0, 10),
      tag: major ? "Major" : hasFeature ? "Feature" : "Fix",
      title: escapeHtml(`capulus-core ${release.tag_name}`),
      body: escapeHtml(summarize(release.body)),
      url: release.html_url,
    };
  });

writeFileSync("data/releases.json", `${JSON.stringify(releases, null, 2)}\n`);
console.log(`${releases.length} Releases geschrieben`);
