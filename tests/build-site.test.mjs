import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { createRewriter, findLinkErrors, outputFile, pageUrl } from "../scripts/lib/site.mjs";

const rewrite = createRewriter(["index.html", "projekt.html", "kontakt.html"]);

test("pageUrl erzeugt saubere URLs", () => {
  assert.equal(pageUrl("index.html"), "/");
  assert.equal(pageUrl("projekt.html"), "/projekt/");
});

test("outputFile legt Seiten als index.html in eigene Ordner", () => {
  assert.equal(outputFile("dist", "index.html"), path.join("dist", "index.html"));
  assert.equal(outputFile("dist", "projekt.html"), path.join("dist", "projekt", "index.html"));
});

test("HTML: Seitenlinks werden umgeschrieben, Anker und Parameter bleiben", () => {
  assert.equal(rewrite.html('<a href="projekt.html">'), '<a href="/projekt/">');
  assert.equal(rewrite.html('<a href="projekt.html#ablauf">'), '<a href="/projekt/#ablauf">');
  assert.equal(rewrite.html('<a href="kontakt.html?interesse=App">'), '<a href="/kontakt/?interesse=App">');
  assert.equal(rewrite.html('<a href="index.html">'), '<a href="/">');
});

test("HTML: unbekannte Seiten und externe Links bleiben unverändert", () => {
  assert.equal(rewrite.html('<a href="fehlt.html">'), '<a href="fehlt.html">');
  assert.equal(rewrite.html('<a href="https://example.org/projekt.html">'), '<a href="https://example.org/projekt.html">');
});

test("HTML: Asset-Pfade werden absolut", () => {
  assert.equal(rewrite.html('<link href="css/style.css"><script src="js/main.js"></script>'), '<link href="/css/style.css"><script src="/js/main.js"></script>');
  assert.equal(rewrite.html('<img src="assets/images/a.png">'), '<img src="/assets/images/a.png">');
  assert.equal(rewrite.html('<img src="https://example.org/assets/a.png">'), '<img src="https://example.org/assets/a.png">');
});

test("JS: Zeichenketten mit Seiten und Datenpfaden werden umgeschrieben", () => {
  assert.equal(rewrite.js('fetch("data/apps.json")'), 'fetch("/data/apps.json")');
  assert.equal(rewrite.js("'<a href=\"kontakt.html\">'"), "'<a href=\"/kontakt/\">'");
  assert.equal(rewrite.js('var url = "https://support.example.org/assets/chat.js";'), 'var url = "https://support.example.org/assets/chat.js";');
});

test("findLinkErrors meldet fehlende Ziele und Links ohne saubere URL", () => {
  const existing = new Set([path.join("dist", "index.html"), path.join("dist", "projekt", "index.html"), path.join("dist", "css", "style.css")]);
  const exists = (file) => existing.has(file);
  const html = [
    '<a href="/">',
    '<a href="/projekt/#x">',
    '<link href="/css/style.css">',
    '<a href="/fehlt/">',
    '<a href="kontakt.html">',
    '<a href="https://example.org/">',
    '<a href="//cdn.example.org/a.js">',
  ].join("");
  assert.deepEqual(findLinkErrors(html, "dist", exists), ["interner Verweis ohne Ziel: /fehlt/", "Link ohne saubere URL: kontakt.html"]);
});
