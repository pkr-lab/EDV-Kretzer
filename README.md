# EDV-Kretzer

Statische Website von EDV-Kretzer (<https://www.edv-kretzer.de>): das Homelab-Projekt capulus-core, der Anwendungskatalog, die iOS-App, Updates mit Live-Status, Kontakt, Impressum und Datenschutz.

## Quickstart

```bash
git clone https://github.com/pkr-lab/EDV-Kretzer.git
cd EDV-Kretzer
python3 -m http.server 8000
```

Dann <http://localhost:8000/> öffnen. Mit sauberen URLs wie live: `node scripts/build-site.mjs && python3 -m http.server 8000 -d dist`. Ein Push auf `main` baut die Seite und deployt sie per GitHub Actions nach netcup.

## Dokumentation

[Überblick](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/index.md) · [Installation](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/installation.md) · [Konfiguration](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/konfiguration.md) · [Nutzung](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/nutzung.md) · [SEO](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/seo.md) · [Releases](https://github.com/pkr-lab/pkr-lab-docs/blob/main/EDV-Kretzer/releases.md)
