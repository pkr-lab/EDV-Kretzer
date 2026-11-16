import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const loadUtils = (fetchImpl) => {
  const context = { window: {}, fetch: fetchImpl };
  vm.runInNewContext(readFileSync(new URL("../js/utils.js", import.meta.url), "utf8"), context);
  return context.window.EDV;
};

const EDV = loadUtils();

test("escapeHtml maskiert HTML-Sonderzeichen", () => {
  assert.equal(EDV.escapeHtml('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  assert.equal(EDV.escapeHtml(null), "");
  assert.equal(EDV.escapeHtml(undefined), "");
  assert.equal(EDV.escapeHtml(42), "42");
});

test("safeUrl lässt nur https bzw. das angegebene Präfix zu", () => {
  assert.equal(EDV.safeUrl("https://example.org/"), "https://example.org/");
  assert.equal(EDV.safeUrl("  https://example.org/  "), "https://example.org/");
  assert.equal(EDV.safeUrl("http://example.org/"), "");
  assert.equal(EDV.safeUrl("javascript:alert(1)"), "");
  assert.equal(EDV.safeUrl(undefined), "");
  assert.equal(EDV.safeUrl("https://github.com/pkr-lab/capulus-core", "https://github.com/pkr-lab/capulus-"), "https://github.com/pkr-lab/capulus-core");
  assert.equal(EDV.safeUrl("https://github.com/andere/repo", "https://github.com/pkr-lab/capulus-"), "");
});

test("formatDate gibt das Datum ausgeschrieben auf Deutsch aus", () => {
  assert.equal(EDV.formatDate("2026-11-05"), "5. November 2026");
  assert.equal(EDV.formatDate("2026-01-31"), "31. Januar 2026");
});

test("formatDate lässt ungültige Werte unverändert", () => {
  assert.equal(EDV.formatDate("2026-02-30"), "2026-02-30");
  assert.equal(EDV.formatDate("gestern"), "gestern");
  assert.equal(EDV.formatDate(undefined), "");
});

test("fetchJson liefert JSON und wirft bei HTTP-Fehlern", async () => {
  const responses = {
    "/ok.json": { ok: true, status: 200, json: () => Promise.resolve({ wert: 1 }) },
    "/fehlt.json": { ok: false, status: 404, json: () => Promise.resolve({ fehler: true }) },
  };
  const utils = loadUtils((url) => Promise.resolve(responses[url]));
  assert.deepEqual(await utils.fetchJson("/ok.json"), { wert: 1 });
  await assert.rejects(utils.fetchJson("/fehlt.json"), /HTTP 404/);
});
