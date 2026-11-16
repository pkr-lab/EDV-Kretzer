import { readFileSync, writeFileSync } from "node:fs";
import { toRelease } from "./lib/releases.mjs";

const OWNER = "pkr-lab";
const COUNT = 10;

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

const releases = fetched
  .filter(({ release }) => !release.draft && !release.prerelease)
  .sort((a, b) => b.release.published_at.localeCompare(a.release.published_at))
  .slice(0, COUNT)
  .map(({ repo, release }) => toRelease(repo, release));

writeFileSync("data/releases.json", `${JSON.stringify(releases, null, 2)}\n`);
console.log(`${releases.length} Releases geschrieben`);

const versions = {};
for (const project of projects) {
  const latest = await fetch(`https://api.github.com/repos/${OWNER}/${project.repo}/releases/latest`, { headers });
  if (!latest.ok) continue;
  const release = await latest.json();
  versions[project.repo] = { tag: release.tag_name, date: release.published_at.slice(0, 10), url: release.html_url };
}
writeFileSync("data/versions.json", `${JSON.stringify(versions, null, 2)}\n`);
console.log(`${Object.keys(versions).length} Versionen geschrieben`);
