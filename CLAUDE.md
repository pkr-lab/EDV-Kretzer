# CLAUDE.md — Arbeitsregeln für EDV-Kretzer

Statische Website von EDV-Kretzer (<https://www.pkr-docs.de>): Homelab-Projekt capulus, Anwendungskatalog, iOS-App, Updates mit Live-Status, Kontakt, Impressum und Datenschutz. Reines HTML, CSS und JavaScript ohne Framework. Die Quellen sind flach (`projekt.html`); `deploy.yml` erzeugt daraus mit `scripts/build-site.mjs` den Ordner `dist/` mit sauberen URLs (`/projekt/`). Sprache im Repo ist **Deutsch** (Seiten, Commit-Beschreibungen, PR-Texte). Regeln wie in capulus-core.

---

## Harte Regeln

- **Nie direkt auf `main` arbeiten.** Änderungen gehen nur per PR hinein (der Branch-Schutz auf GitHub ist hier nicht aktiv, die Regel gilt trotzdem). Steht das Arbeitsverzeichnis auf `main`, vor der ersten Änderung einen neuen Branch anlegen (`git switch -c <typ>/<kurzbeschreibung>`, z. B. `feat/anwendungen-filter`, `fix/kontakt-link`) und nur dort arbeiten. Den Branch legt Claude an, Commit, Push und PR macht der Nutzer.
- **Jeder Push auf `main` deployt sofort nach netcup** (`deploy.yml`: bauen, dann per SSH/tar nach `NETCUP_PATH`) und ist damit live. Nichts Unfertiges nach `main`.
- **Saubere URLs:** Quellen verlinken weiter mit `projekt.html`, `css/…`, `data/…`; `build-site.mjs` schreibt das in `dist/` auf `/projekt/` und `/css/…` um. Canonical-Links in den HTML-Dateien stehen deshalb ohne `.html` mit Slash am Ende (`https://www.pkr-docs.de/projekt/`). `dist/` nie committen (`.gitignore`).
- **Doku liegt nicht in diesem Repo, sondern in [pkr-lab-docs](https://github.com/pkr-lab/pkr-lab-docs)** unter `EDV-Kretzer/`. Jede Änderung am Verhalten bekommt dort einen PR (z. B. `konfiguration.md` für Datendateien, `nutzung.md` für Abläufe, `seo.md`). Konventionen stehen in der `CLAUDE.md` von pkr-lab-docs.
- **Generierte Dateien nie von Hand ändern:** `data/releases.json`, `data/versions.json` (`scripts/build-releases.mjs`), `sitemap.xml`, `robots.txt` und alle mit `data-seo` markierten Bereiche in den HTML-Dateien (`scripts/build-seo.mjs`). `data/status.json` schreibt der Workflow `status.yml`. Ändern sich Quellen (Seitentexte, `data/projects.json`, `data/apps.json`), das passende Skript ausführen und das Ergebnis mitnehmen.
- **Keine Secrets, Tokens oder interne Hostnamen im Klartext** in Seiten, JS oder Daten. Die Status-Basis-URL in `js/updates.js` steht bewusst verschleiert (Base64); das ist keine Sicherheit, nur Schutz vor beiläufigem Fund. Deploy-Zugangsdaten liegen als GitHub-Secrets (`NETCUP_*`); `NETCUP_HOST_KEY` enthält die known_hosts-Zeile des Servers, der Deploy bricht ohne sie ab.
- **Impressum und Datenschutz** (`impressum.html`, `datenschutz.html`) nur ändern, wenn der Nutzer es ausdrücklich verlangt, und die Änderung klar benennen. Es sind rechtliche Pflichtangaben.
- Texte aus externen Quellen (GitHub-Release-Notes, Daten aus `data/*.json`) werden HTML-escaped, bevor sie per `innerHTML` landen, mit `EDV.escapeHtml` aus `js/utils.js`. URLs aus Daten laufen vorher durch `EDV.safeUrl` (nur `https://` bzw. ein festes Präfix). Neue Renderer in `js/` genauso. `title` und `body` in `data/releases.json` escaped schon `build-releases.mjs`, nicht ein zweites Mal escapen.

---

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `*.html` | Seiten: `index`, `projekt`, `capulus`, `anwendungen`, `app`, `updates`, `kontakt`, `ueber-mich`, `mediamtx-drohnenstream`, `impressum`, `datenschutz`, `sitemap` |
| `css/style.css`, `css/animations.css` | gesamtes Styling, Farben und Abstände über CSS-Variablen |
| `js/main.js` | gemeinsames Verhalten (Navigation, Info-Banner, Status-Hinweis) |
| `js/utils.js` | gemeinsame Helfer als `window.EDV`: `escapeHtml`, `safeUrl`, `formatDate`, `fetchJson`; vor `apps.js`, `capulus.js` und `updates.js` eingebunden |
| `js/chat.js` | Konfiguration des Zammad-Chats, auf jeder Seite direkt nach `chat-no-jquery.min.js` eingebunden |
| `js/capulus.js`, `js/apps.js`, `js/updates.js` | seitenspezifisch; `updates.js` rendert den Release-Verlauf und den Live-Status |
| `data/projects.json` | Projektkarten und Architektur auf `capulus.html` (Repo, Beschreibung, Stack, Docs-Link) |
| `data/apps.json` | Anwendungskatalog |
| `data/releases.json`, `data/versions.json` | Release-Verlauf und aktuelle Versionen, erzeugt aus der GitHub-API |
| `data/status.json` | Status-Hinweis (Wartung/Störung), per Workflow geschaltet |
| `scripts/build-releases.mjs` | Releases aller `capulus-*`-Repos aus `projects.json` holen, `releases.json` und `versions.json` schreiben |
| `scripts/build-site.mjs` | flache Quellen nach `dist/` mit sauberen URLs bauen und interne Links prüfen (läuft in `deploy.yml` und `ci.yml`) |
| `scripts/build-seo.mjs` | Meta-Tags, JSON-LD, Sitemap und robots.txt aus der Tabelle `PAGES` erzeugen bzw. prüfen |
| `scripts/lib/` | testbare Teile der Skripte: `html.mjs` (`escapeHtml`), `releases.mjs` (`summarize`, `releaseTag`, `toRelease`), `site.mjs` (Link-Umschreibung und Link-Prüfung) |
| `tests/` | Tests für `scripts/lib/` und `js/utils.js` mit `node --test`, ohne Abhängigkeiten |
| `eslint.config.mjs`, `.htmlvalidate.json`, `.editorconfig` | Lint-Regeln (`no-undef`, `no-unused-vars`, `no-shadow`; `js/` als ES5), HTML-Prüfung und Formatierung (2 Leerzeichen, LF, UTF-8) |
| `automation/` | n8n-Workflow zum Schalten des Status-Hinweises |
| `assets/` | Icons und Bilder |
| `.github/workflows/` | `ci.yml` (Prüfung auf PRs), `deploy.yml`, `releases.yml` (stündlicher Release-Verlauf), `status.yml`, `seo.yml`, `release.yml`, `commitlint.yml` |

Neue HTML-Seite: Eintrag in `PAGES` in `scripts/build-seo.mjs` ergänzen (sonst bricht das Skript ab), `<link rel="canonical">` auf `https://www.pkr-docs.de/<name>/` setzen, danach `node scripts/build-seo.mjs`. Den Chat-Block (`chat-no-jquery.min.js`, dann `js/chat.js`) wie auf den anderen Seiten übernehmen; Seitenskripte, die Daten rendern, brauchen davor `js/utils.js`.

Neues capulus-Repo: Eintrag in `data/projects.json` (Name beginnt mit `capulus-`), dann taucht es automatisch im Release-Verlauf und bei den Versionen auf.

---

## Prüfen vor dem Commit

Die CI (`ci.yml`, nur auf PRs) prüft JSON-Syntax, JavaScript-Syntax, Lint, HTML, Tests, SEO und den Build:

```bash
for f in data/*.json automation/*.json; do jq empty "$f"; done
for f in scripts/*.mjs scripts/lib/*.mjs tests/*.mjs js/*.js; do node --check "$f"; done
npx --yes eslint@10.14.0 .
npx --yes html-validate@11.17.0 *.html
node --test tests/*.test.mjs
node scripts/build-seo.mjs
node scripts/build-seo.mjs --check
node scripts/build-site.mjs
GITHUB_TOKEN=$(gh auth token) node scripts/build-releases.mjs
python3 -m http.server 8000            # Quellen direkt, Links mit .html
python3 -m http.server 8000 -d dist    # gebaute Seite, saubere URLs wie live
```

- Die Seite lokal unter <http://localhost:8000/> ansehen. Layout, Diagramme und Animationen kann Claude ohne Browser nicht beurteilen; bei visuellen Änderungen dem Nutzer sagen, was er prüfen soll.
- `build-releases.mjs` braucht Netz und die GitHub-API; ohne Token greift das Rate-Limit.
- Layout muss auf Handybreite funktionieren (kein horizontales Scrollen außer bei Diagrammen mit `overflow-x: auto`).

---

## Code-Stil

- Semantisches HTML, `lang="de"`, jede Seite mit eigenem `<title>`, Beschreibung und Canonical (die `data-seo`-Teile erzeugt das Skript).
- Kein Framework, keine Bundler, keine neuen Abhängigkeiten oder externen Skripte. JavaScript ist ES5-Stil in IIFEs mit `"use strict"`, wie in den vorhandenen Dateien (ESLint prüft `js/` mit `ecmaVersion: 5`). ESLint und html-validate laufen nur in der CI per `npx` mit fester Version, es gibt kein `package.json`.
- Kommentare nur dort, wo der Stil der Datei sie bereits nutzt, und auf Deutsch.
- Icons über `assets/icons/sprite.svg`, externe Links mit `target="_blank" rel="noopener"`.

---

## Commits und PRs

- **Claude committet und pusht nicht.** Commits, Pushes und PRs macht ausschließlich der Nutzer. Änderungen nur im Arbeitsverzeichnis vorbereiten, am Ende kurz zusammenfassen und einen passenden Commit-Text vorschlagen. Ausnahme nur, wenn der Nutzer es in der jeweiligen Anfrage ausdrücklich verlangt.
- Conventional Commits mit Scope = Seite/Bereich, Beschreibung auf Deutsch: `feat(updates): …`, `fix(kontakt): …`, `docs(…): …`. Typen: feat fix docs chore refactor test ci build perf style revert.
  `feat`/`fix` lösen über semantic-release ein Release aus (zentraler Workflow in `pkr-lab/.github`, CHANGELOG.md und Tag `vX.Y.Z`). Der Commitlint-Check läuft auf PRs; lokal prüft `git config core.hooksPath .githooks` das Format.
- Die Bot-Commits `chore(releases)`, `chore(seo)` und `chore(status)` mit `[skip ci]` kommen von den Workflows; nicht manuell nachbauen.
- Ein PR = eine Änderung inkl. zugehöriger Doku.
