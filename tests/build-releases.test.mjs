import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_BULLETS, MAX_LENGTH, releaseTag, summarize, toRelease } from "../scripts/lib/releases.mjs";

const notes = [
  "## [1.4.0](https://github.com/pkr-lab/capulus-core/compare/v1.3.0...v1.4.0) (2026-11-15)",
  "",
  "### Features",
  "",
  "* **argocd:** Sync-Fenster ergänzen ([abc1234](https://github.com/pkr-lab/capulus-core/commit/abc1234))",
  "* Dashboard erweitern",
  "",
  "### Bug Fixes",
  "",
  "* **traefik:** Timeout erhöhen ([def5678](https://github.com/pkr-lab/capulus-core/commit/def5678))",
].join("\n");

test("summarize fasst Features und Bug Fixes zusammen", () => {
  assert.equal(summarize(notes), "Neu: argocd: Sync-Fenster ergänzen; Dashboard erweitern. Behoben: traefik: Timeout erhöhen");
});

test("summarize ignoriert andere Abschnitte", () => {
  assert.equal(summarize("### Miscellaneous Chores\n\n* Abhängigkeiten aktualisieren"), "Release veröffentlicht.");
});

test("summarize liefert ohne Notizen einen Standardtext", () => {
  assert.equal(summarize(""), "Release veröffentlicht.");
  assert.equal(summarize(null), "Release veröffentlicht.");
  assert.equal(summarize(undefined), "Release veröffentlicht.");
});

test("summarize zeigt höchstens MAX_BULLETS Punkte und zählt den Rest", () => {
  const items = Array.from({ length: MAX_BULLETS + 2 }, (_, index) => `* Punkt ${index + 1}`);
  const summary = summarize(`### Bug Fixes\n${items.join("\n")}`);
  assert.equal(summary, "Behoben: Punkt 1; Punkt 2; Punkt 3 und 2 weitere");
});

test("summarize kürzt auf MAX_LENGTH Zeichen", () => {
  const summary = summarize(`### Features\n* ${"x".repeat(MAX_LENGTH * 2)}`);
  assert.equal(summary.length, MAX_LENGTH);
  assert.ok(summary.endsWith("…"));
});

test("releaseTag erkennt Major, Feature und Fix", () => {
  assert.equal(releaseTag("# [2.0.0](https://example.org) (2026-11-15)\n### Features\n* neu"), "Major");
  assert.equal(releaseTag(notes), "Feature");
  assert.equal(releaseTag("### Bug Fixes\n* behoben"), "Fix");
  assert.equal(releaseTag(null), "Fix");
});

test("toRelease baut den Eintrag für releases.json und escaped Texte", () => {
  const release = toRelease("capulus-core", {
    tag_name: "v1.4.0",
    published_at: "2026-11-15T10:20:30Z",
    body: "### Features\n* <b>fett</b> & \"zitiert\"",
    html_url: "https://github.com/pkr-lab/capulus-core/releases/tag/v1.4.0",
  });
  assert.deepEqual(release, {
    id: "capulus-core-v1.4.0",
    date: "2026-11-15",
    tag: "Feature",
    title: "capulus-core v1.4.0",
    body: "Neu: &lt;b&gt;fett&lt;/b&gt; &amp; &quot;zitiert&quot;",
    url: "https://github.com/pkr-lab/capulus-core/releases/tag/v1.4.0",
  });
});
