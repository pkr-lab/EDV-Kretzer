import { readFileSync, writeFileSync } from "node:fs";

const OWNER = "pkr-lab";
const COUNT = 10;
const MAX_BULLETS = 3;
const MAX_LENGTH = 320;

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const projects = JSON.parse(readFileSync("data/projects.json", "utf8"));
const capulusRepos = projects.map((project) => project.repo).filter((repo) => repo.startsWith("capulus-"));

const fetched = [];
for (const repo of capulusRepos) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases?per_page=${COUNT}`, { headers });
  if (!response.ok) {
    console.error(`GitHub-API (${repo}): HTTP ${response.status}`);
    process.exit(1);
  }
  for (const release of await response.json()) fetched.push({ repo, release });
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

const releases = fetched
  .filter(({ release }) => !release.draft && !release.prerelease)
  .sort((a, b) => b.release.published_at.localeCompare(a.release.published_at))
  .slice(0, COUNT)
  .map(({ repo, release }) => {
    const hasFeature = /^###\s+Features\s*$/m.test(release.body || "");
    const major = /^#\s+\[\d+\.0\.0\]/m.test(release.body || "");
    return {
      id: `${repo}-${release.tag_name}`,
      date: release.published_at.slice(0, 10),
      tag: major ? "Major" : hasFeature ? "Feature" : "Fix",
      title: escapeHtml(`${repo} ${release.tag_name}`),
      body: escapeHtml(summarize(release.body)),
      url: release.html_url,
    };
  });

writeFileSync("data/releases.json", `${JSON.stringify(releases, null, 2)}\n`);
console.log(`${releases.length} Releases geschrieben`);

const versions = {};
for (const project of projects) {
  const latest = await fetch(`https://api.github.com/repos/pkr-lab/${project.repo}/releases/latest`, { headers });
  if (!latest.ok) continue;
  const release = await latest.json();
  versions[project.repo] = { tag: release.tag_name, date: release.published_at.slice(0, 10), url: release.html_url };
}
writeFileSync("data/versions.json", `${JSON.stringify(versions, null, 2)}\n`);
console.log(`${Object.keys(versions).length} Versionen geschrieben`);
