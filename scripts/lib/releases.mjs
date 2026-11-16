import { escapeHtml } from "./html.mjs";

export const MAX_BULLETS = 3;
export const MAX_LENGTH = 320;

export const summarize = (notes) => {
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

export const releaseTag = (notes) => {
  const text = String(notes || "");
  if (/^#\s+\[\d+\.0\.0\]/m.test(text)) return "Major";
  if (/^###\s+Features\s*$/m.test(text)) return "Feature";
  return "Fix";
};

export const toRelease = (repo, release) => ({
  id: `${repo}-${release.tag_name}`,
  date: release.published_at.slice(0, 10),
  tag: releaseTag(release.body),
  title: escapeHtml(`${repo} ${release.tag_name}`),
  body: escapeHtml(summarize(release.body)),
  url: release.html_url,
});
