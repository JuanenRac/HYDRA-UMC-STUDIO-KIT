<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - Shared code of the HYDRA-UMC web clients
Copyright (C) JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

<p align="center">
  <img src="images/HYDRA_UMC_BANNER.svg" alt="HYDRA-UMC-STUDIO-KIT banner" width="100%">
</p>

# 🧰 HYDRA-UMC-STUDIO-KIT

<p align="center"><a href="README.md">🇺🇸 English</a> | <a href="README_spa.md">🇪🇸 Español</a> | <a href="README_fra.md">🇫🇷 Français</a> | <a href="README_ita.md">🇮🇹 Italiano</a> | 🇩🇪 <b>Deutsch</b> | <a href="README_zho.md">🇨🇳 简体中文</a> | <a href="README_jpn.md">🇯🇵 日本語</a> | <a href="README_por.md">🇵🇹 Português</a></p>

### 🧰 Der Code, den die HYDRA-UMC-Webclients wiederholen, einmal geschrieben: Sitzung, HTTP, Verlauf, Einstellungen und Rundgänge

<p align="center">
  <img src="https://img.shields.io/badge/License-GPL%203.0--or--later-blue.svg" alt="GPL 3.0 or later">
  <img src="https://img.shields.io/badge/Stack-TypeScript-3178C6.svg" alt="Stack">
  <img src="https://img.shields.io/badge/Feature-No%20Runtime%20Dependencies-blueviolet.svg" alt="Feature">
  <img src="https://img.shields.io/badge/Tests-87%20passing-2ea44f.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Version-0.0.3-0f6cbd.svg" alt="Version">
  <img src="https://img.shields.io/badge/Maturity-scaffolding-FFB020.svg" alt="Maturity">
</p>

---

**Ehrlichkeitsprüfung - was heute wirklich läuft:** Sitzung, HTTP-Client, Adressauflösung, Parser des Verbindungsverlaufs, lokale Einstellungen, die Liste der letzten Auswahl, die Rundgänge und die Texte sind echt und getestet (87 Tests bestehen), immer gegen Attrappen von `fetch` und vom Speicher: Noch nichts ist in einem echten Browser oder gegen einen echten HYDRA-UMC-SERVER gelaufen. HYDRA-UMC-STUDIO nutzt das Kit noch nicht, daher verwendet es heute keine Ansicht irgendeines Clients. Die geführten Rundgänge sind neuer Code: Kein Client hat einen Rundgang, der zu ersetzen wäre. Was bisher ausgeliefert wurde, steht in `CHANGELOG.md`.

---

> **Stand von Sicherheit (Safety) und Security:** Dieses Ökosystem ist kein zertifiziertes Sicherheitssystem. Es gibt noch keinen Hardware-E-STOP-Pfad, keine von der Firmware durchgesetzten Grenzen oder Verriegelungen und keinen verifizierten Bewegungsbefehl; Firmware-Images werden mit CRC-32 und einer Ed25519-Signatur geprüft, und ein Release-Build verweigert die veröffentlichten Entwicklungsschlüssel (die Werkzeugköpfe und Erweiterungsplatinen hinter dem Relais laufen noch mit URTC-Bootloadern, die statt einer Signatur ein HMAC-SHA256 mit gemeinsamem Schlüssel verwenden); TLS und gegenseitiges TLS sind optional und standardmäßig aus; noch keine eigene Platine wurde bestückt oder getestet. Lesen Sie die [Sicherheitsbasis](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md) und das [Bedrohungsmodell](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md), bevor Sie sich für die Sicherheit einer Person auf eine Aussage hier verlassen.

---

## 📋 Auf einen Blick

| | |
|---|---|
| Version | `0.0.3` |
| Reifegrad | Gerüst |
| Tests | 87 (`npm test`) |
| Technik | TypeScript / Vitest |
| Ziel | Ein Webbrowser auf dem PC des Benutzers |
| Auf echter Hardware | Nicht zutreffend: nichts hiervon läuft auf Hardware |

**Springe zu:** [Überblick](#-überblick) · [Architektur](#-architektur) · [Schnellstart](#-schnellstart) · [Tests](#-tests) · [Struktur des Repositorys](#-struktur-des-repositorys) · [Verwandte Projekte](#-verwandte-projekte)

## 🚦 Projektstatus

Jede Zeile ist ein Teil dieses Repositorys, und die Ampel sagt, wie weit er heute ist. Sie beruht auf dem, was das Repository zeigen kann (Tests, Builds, Läufe), nicht auf dem, was geplant ist.

🟢 Fertig und überprüft · 🟡 Funktioniert, mit bekannten Grenzen · 🟠 Teilweise fertig oder noch nicht überprüft · 🔴 Nicht gemacht oder funktioniert nicht

| Bereich | Stand | Was das hier bedeutet |
|---|---|---|
| Software | 🟠 | Nur Struktur und erste Teile; der größte Teil der Arbeit steht noch aus |
| Tests | 🟡 | 87 automatische Tests, bei jeder Änderung ausgeführt |
| Echte Hardware | 🟡 | Nicht zutreffend: nichts hiervon läuft auf Hardware |
| Schnittstelle und Protokolle | 🟡 | Die angebotenen Routen oder Nachrichten sind dokumentiert und mit einem Client getestet; noch nicht jeder Client hat sie benutzt |
| Integration | 🟠 | Es funktioniert für sich allein; die Verbindung zum Rest des Ökosystems wurde noch nicht erprobt |
| Sicherheit | 🟡 | Zugriffskontrolle, Eingabegrenzen oder Signaturen sind umgesetzt und auf einem Rechner getestet; niemand außerhalb des Projekts hat sie geprüft |
| Sprachen und Barrierefreiheit | 🟡 | Oberfläche und Hilfe gibt es in acht Sprachen; die Bedienung per Tastatur und Screenreader wurde nicht getestet |
| Dokumentation | 🟡 | README in acht Sprachen, bei jeder Änderung gegen das Manifest geprüft |

## 🎯 Überblick

**HYDRA-UMC-STUDIO-KIT** ist ein kleines TypeScript-Paket ohne Framework und ohne Laufzeitabhängigkeiten. Es enthält den Code, den jeder HYDRA-UMC-Webclient braucht und der sonst von einem Client zum nächsten kopiert würde: wo die Anmelde-Tokens liegen, wie ein Aufruf an den Server gemacht wird, wie der Verbindungsverlauf des Servers gelesen wird, wie die lokalen Entscheidungen einer Person gemerkt werden und wie ein geführter Rundgang festhält, was schon gezeigt wurde.

### Hauptmerkmale:
* 🔑 **Sitzung:** Zugriffs- und Erneuerungs-Token liegen standardmäßig im Session-Speicher und nur im lokalen Speicher, wenn die Person „angemeldet bleiben“ ankreuzt; ein Token in der Adresse wird aus dem Fragment gelesen, nur für diese Ansicht behalten und aus der Adresse entfernt. Die Form mit `?token=` ist ein Schalter, standardmäßig aus.
* 🌐 **HTTP-Client:** ein Zeitlimit je Versuch, begrenzte Wiederholungen mit wachsender Wartezeit für gefahrlos wiederholbare Aufrufe (nie ein POST von selbst), `Retry-After`, eine Token-Erneuerung bei 401 und ein typisierter `HttpError` (Netz, Zeitlimit, abgebrochen, HTTP, Lesefehler), dessen Text nie das Token enthält. Das Token geht nur an den konfigurierten Ursprung.
* 🕘 **Verlauf:** Parser für die Clientliste und den Anmeldeverlauf des Servers (ein älterer Server antwortet „nicht unterstützt“, statt zu scheitern) und eine begrenzte Liste der letzten Auswahl der Person.
* ⚙️ **Einstellungen:** lokale Entscheidungen mit einem Validator je Feld; was im Speicher steht, wird zu einem gültigen Wert oder zum Standard, und ein Speicher, der ausfällt, bricht nie eine Ansicht.
* 🧭 **Rundgänge:** der Zustand eines geführten Rundgangs und welche gesehen wurden; ein Rundgang startet nie von selbst, außer die Anwendung verlangt es, und wird erneut angeboten, wenn seine Version steigt.
* 🌍 **Acht Sprachen:** die Fehler, die Tasten des Rundgangs und die Namen der Anmeldeereignisse in en, es, de, fr, it, ja, zh und pt (europäisches Portugiesisch).

Das Kit zeichnet nichts: Ein React-Client bindet jeden seiner Speicher mit `useSyncExternalStore(store.subscribe, store.get)`. HYDRA-UMC-STUDIO ist der erste Client, der es nutzen soll, und nutzt es noch nicht; `docs/MIGRATION.md` listet, was es ersetzt und wie jeder Schritt geprüft wird.

## 🧩 Rolle in HYDRA-UMC

**HYDRA-UMC-STUDIO-KIT** ist der Code, den die Webclients der Familie sonst voneinander kopieren würden: die Anmeldesitzung, der HTTP-Client, der Verbindungsverlauf, die lokalen Einstellungen und die geführten Rundgänge, als TypeScript-Paket ohne Framework und ohne Laufzeitabhängigkeiten. HYDRA-UMC-STUDIO ist der erste Client, der es nutzen soll, und nutzt es noch nicht.

## 🏛️ Architektur

<p align="center">
  <img src="images/architecture.svg" alt="HYDRA-UMC-STUDIO-KIT architecture" width="100%">
</p>

### ARCHITEKTUR UND ENTWURFSENTSCHEIDUNGEN

* **Warum ein Paket und nicht noch eine Kopie.** Sitzung, Serveradresse, Verbindungsverlauf und lokale Einstellungen wurden in HYDRA-UMC-STUDIO geschrieben und werden von jedem anderen Webclient unverändert gebraucht; eine Korrektur in einer Kopie wurde in den anderen nie nachgeholt.
* **Warum kein Framework.** Jeder Speicher hat `get` und `subscribe`, die Form, die `useSyncExternalStore` erwartet; React bindet ihn in einer Zeile, ein anderes Framework (oder keines) nutzt ihn unverändert. Eine Lint-Regel lässt den Build bei einem React-Import scheitern.
* **Warum ein POST nie von selbst wiederholt wird.** Ein Aufruf, der aus vorübergehendem Grund scheiterte, kann den Server erreicht haben oder nicht; nur ein Aufruf, den die Anwendung als idempotent erklärt, wird wiederholt. Die Wartezeit verdoppelt sich bis zu einer Grenze ohne Zufall, damit ein Test sie prüfen kann.
* **Warum das Token nur an den konfigurierten Ursprung geht.** Eine Seite, die eine von einer Person eingegebene Adresse aufruft, darf ihr nicht das Anmelde-Token geben; es anderswohin zu senden ist ein Schalter, standardmäßig aus, und eine Fehlermeldung enthält nie das Token oder die Abfragezeichenfolge.
* **Warum die Form `?token=` einer Startadresse ein Schalter ist.** Eine Abfragezeichenfolge landet in Server-Protokollen, das Fragment (`#token=`) verlässt den Browser nie. Die ältere Form wird weiter gelesen, wenn die Anwendung es verlangt.
* **Warum ein ausfallender Speicher kein Fehler ist.** Ein privates Fenster oder gesperrte Websitedaten lassen jedes Lesen und Schreiben eine Ausnahme werfen; das Kit fällt auf die Standardwerte zurück und behält die Wahl für diesen Besuch.

Das Gesamtbild: [`docs/API.md`](docs/API.md) für die API-Referenz und [`docs/MIGRATION.md`](docs/MIGRATION.md) für die Schritte, mit denen ein Webclient das Kit übernimmt.

## 🚀 Schnellstart

Benötigt Node.js 22 oder neuer mit npm.

```bash
npm ci         # installs the development dependencies (the package itself has none at run time)
npm run build  # compiles src/ to dist/ (./build.sh runs the tests first; build.bat on Windows)
npm run typecheck && npm run lint && npm test
```

Verwende es in einem Webclient mit `import { createSession, createHttpClient } from 'hydra-umc-studio-kit'`; `docs/API.md` enthält die Referenz und `docs/MIGRATION.md` die Schritte, mit denen ein Client es übernimmt.

## 🧪 Tests

87 automatische Tests laufen mit `npm test`. Sie nutzen Attrappen für `fetch` und den Speicher und brauchen weder Browser noch Netz.

Die CI führt `HYDRA_UMC_CI=1 python tools/ci_validate.py` aus; das prüft das Manifest, die Dokumente, die acht READMEs und die Bilder.

## 🏗️ Build und Veröffentlichung

Das Paket wird mit dem TypeScript-Compiler nach `dist/` kompiliert; es gibt keinen Bundler und nichts auszuführen.

```bash
# Windows
build.bat

# Linux / macOS
./build.sh

npm run typecheck && npm run lint && npm test
```

`build.sh` / `build.bat` installieren die Abhängigkeiten, führen die Tests aus und kompilieren; sie ändern nie die Version (nur `python tools/hydra_project_tool.py bump` erhöht sie). `npm run typecheck`, `npm run lint` und `npm test` sind die drei Prüfungen der CI. Ein Webclient installiert das Paket von einem Release-Tag, nie von einem Branch (siehe `docs/MIGRATION.md`).

## 📂 Struktur des Repositorys

<p align="center">
  <img src="images/repository-structure.svg" alt="Repository structure of HYDRA-UMC-STUDIO-KIT" width="100%">
</p>

<details>
<summary>Textversion des Baums</summary>

```text
HYDRA-UMC-STUDIO-KIT/
├── src/
│   ├── storage.ts                        sichere Speicherhilfen, Speicher im Arbeitsspeicher
│   ├── store.ts                          ein kleiner beobachtbarer Wert für jedes Framework
│   ├── session.ts                        Anmelde-Tokens, Startadresse, Authorization-Header
│   ├── apiBase.ts                        die Adresse des Servers in Entwicklung und Produktion
│   ├── http.ts                           HTTP-Client: Zeitlimit, begrenzte Wiederholungen, typisierte Fehler
│   ├── history.ts                        Parser des Verbindungsverlaufs und letzte Auswahl
│   ├── prefs.ts                          lokale Einstellungen mit einem Validator je Feld
│   ├── tours.ts                          geführte Rundgänge und welche gesehen wurden
│   ├── messages.ts                       die Texte des Kits in den acht Sprachen
│   └── index.ts                          die öffentliche API
├── tests/                                Tests mit Attrappen für fetch und den Speicher: Sitzung, HTTP, Adresse, Verlauf, Einstellungen, Rundgänge und Texte
├── docs/                                 API-Referenz und Migrationsanleitung für die Web-Clients
├── tools/                                Projektwerkzeuge und CI-Prüfungen
├── images/                               Banner und Diagramme
├── .github/                              CI-Workflow und Issue-Vorlagen
├── package.json                          Paketdaten und Skripte
├── tsconfig.json / tsconfig.build.json   TypeScript-Konfiguration (Prüfung und Build)
├── bump_manifest_version.py              gleicht die Version von hydra-umc.project.json ab
├── build.sh / build.bat                  installiert, testet und baut dist/
├── CHANGELOG.md                          was sich in jeder Version geändert hat
├── build-test.sh                         Build-Prüfung ohne Änderungen
├── hydra-umc.project.json                Manifest: Version, Reifegrad, Familie
└── test.sh                               führt die Tests aus
```

</details>

## 🗺️ Roadmap und bekannte Grenzen

**Bekannte Grenzen heute**

* **Phase 1:** HYDRA-UMC-STUDIO übernimmt das Kit, Datei für Datei (siehe `docs/MIGRATION.md`).
* **Phase 2:** Die Web-Studios der Familien ARMOR und URTC übernehmen es mit eigenen Speicherschlüsseln und Texten.
* **Phase 3:** Eine getrennte, optionale Anbindung für React-Hooks, die nur den Vertrag `get` / `subscribe` nutzt.
* **Phase 4:** Den HTTP-Client und die Sitzung in einem echten Browser gegen einen echten Server ausführen.

## 🌍 Sprachen

Diese README und die Dokumente des Repositorys gibt es in acht Sprachen: Englisch, Spanisch, Deutsch, Französisch, Italienisch, Japanisch, Chinesisch und Portugiesisch (Portugal). Sie entstehen gemeinsam, und die CI prüft, dass die acht Dateien dieselben Abschnitte und dieselben Links haben. Dieses Repository hat weder eine eigene Oberfläche noch einen eigenen Meldungskatalog, es gibt also keine Oberflächentexte zu übersetzen.

## 🔗 Verwandte Projekte

Dieses Projekt ist Teil des HYDRA-UMC-Robotik-Ökosystems desselben Autors (JuanenRac / Electro Hobby 3D). Gut zu wissen, da eine Anfrage eigentlich eines dieser Projekte betreffen könnte statt dieses Repositorys.

**Direkt verwandt**
- **[HYDRA-UMC-STUDIO](https://github.com/JuanenRac/HYDRA-UMC-STUDIO)** — Web-Steuerpult mit 3D-Echtzeitvisualisierung mehrerer Roboter — der erste Client, der dieses Kit nutzen soll (noch nicht).
- **[HYDRA-UMC-SERVER](https://github.com/JuanenRac/HYDRA-UMC-SERVER)** — das Backend ohne Oberfläche (REST/WebSocket), für das der HTTP-Client und das Lesen des Verbindungsverlaufs geschrieben sind.

**Ebenfalls Teil des Ökosystems**

*Kern-Hardware & Plattform*
- **[HYDRA-UMC](https://github.com/JuanenRac/HYDRA-UMC)** — der Entwurf des Motherboards des Roboterarms: CM5-Host + Dual-Core-STM32H745, gedacht zur Koordination von bis zu 8 Werkzeugarmen über CAN-OTA/SPI-OTA (Firmware in einer frühen Phase; noch keine bestückte Platine).
- **[HYDRA-UMC-OS](https://github.com/JuanenRac/HYDRA-UMC-OS)** — reproduzierbare Raspberry-Pi-OS-Produktschicht für den CM5: schreibgeschützter Agent, validierte Konfiguration/Profile, WiFi-Ersteinrichtung.
- **[HYDRA-UMC-SDK](https://github.com/JuanenRac/HYDRA-UMC-SDK)** — der gemeinsame JSON-Schema-Vertrag und die Software-Auftragsschranke, gegen die jede Bridge ihre Befehle validiert (keine zertifizierte Sicherheitsfunktion).
- **[HYDRA-UMC-CONNECTOR-HUB](https://github.com/JuanenRac/HYDRA-UMC-CONNECTOR-HUB)** — deklaratives Adapter-Manifest-Register und Validator für Konnektoren externer Maschinen; erweitert die eigene Vertragsidee des SDK auf externe Maschinen, ohne die Industrie-Gateway-Projekte zu ersetzen.

*Kern-Backend & Clients*
- **[HYDRA-UMC-SUITE](https://github.com/JuanenRac/HYDRA-UMC-SUITE)** — Desktop-Schwarmleitstand (PySide6) für mehrere Server gleichzeitig, verpackt als eigenständige ausführbare Datei.
- **[HYDRA-UMC-ANDROID-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-ANDROID-CONTROL)** — native Android-Steuerungs-App mit biometrischem Login und einer gekoppelten Wear-OS-Begleit-App.
- **[HYDRA-UMC-IOS-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-IOS-CONTROL)** — iOS/iPadOS-Steuerungs-App (Flutter) mit Echtzeit-WebSocket-Synchronisierung.
- **[HYDRA-UMC-DSI](https://github.com/JuanenRac/HYDRA-UMC-DSI)** — native Touch-UI für das eingebaute 7"-DSI-Touchscreen, direkt auf dem CM5 eingebettet.
- **[HYDRA-UMC-EDITOR-URDF](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-URDF)** — grafischer Desktop-URDF-Ersteller/-Editor, der fertige Modelle in STUDIOs eigenen Katalog überträgt.
- **[HYDRA-UMC-EDITOR-STL](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-STL)** — Desktop-STL-Modelleditor, der echte Teile im selben Modellkatalog transformiert/ersetzt/entfernt/hinzufügt, den auch HYDRA-UMC-EDITOR-URDF bearbeitet.
- **[HYDRA-UMC-BRIDGE-AMR](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-AMR)** — Koordinationsschranke für AGV-/AMR-Flotten über einen VDA-5050-MQTT-Publisher (nur gegen eine emulierte Flotte getestet).
- **[HYDRA-UMC-BRIDGE-CNC](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-CNC)** — High-Level-Koordinator für CNC-Zellen mit GRBL-Status-/Steuerbyte-Zugriff (nur gegen einen Emulator getestet).
- **[HYDRA-UMC-BRIDGE-DROIDS](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-DROIDS)** — Koordinationsschranke für laufende/humanoide Droiden, mit einem Boston-Dynamics-Spot-Befehlssender (nur gegen einen Emulator getestet).
- **[HYDRA-UMC-BRIDGE-LASER](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-LASER)** — Koordinator für Laserzellen, liest 3 Schlüssel-/Gehäuse-/Verriegelungs-GPIO-Signale (nur gegen einen simulierten Chip getestet; kann keinen Laser scharfschalten oder auslösen).
- **[HYDRA-UMC-BRIDGE-OPENPNP](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-OPENPNP)** — sicherer High-Level-Koordinator für den Leiterplattenfluss von OpenPnP Pick-and-Place.
- **[HYDRA-UMC-BRIDGE-PRINTER3D](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-PRINTER3D)** — sichere Koordinationsschranke für Moonraker/Klipper-3D-Drucker, mit echten gesicherten Job-Befehlen.
- **[HYDRA-UMC-BRIDGE-ROS2](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-ROS2)** — Koordinator mit einem träge importierten rclpy-ROS-2-Transport (noch nicht gegen eine ROS-2-Installation ausgeführt).
- **[HYDRA-UMC-BRIDGE-UAV](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-UAV)** — Koordinationsschranke für kameraausgestattete UAVs, mit einem MAVLink-Befehlssender (nur gegen einen Emulator getestet).

*URTC-Werkzeugplattform*
- **[URTC](https://github.com/JuanenRac/URTC)** — Firmware für die physische Universal-Robot-Tool-Controller-Platine, 25+ Werkzeugprofile über CAN-Bus.
- **[URTC-FLASHER](https://github.com/JuanenRac/URTC-FLASHER)** — Desktop-GUI-Flash-Tool für URTC-Platinen, CAN-OTA plus Full-Chip-SWD/JTAG.
- **[URTC-TESTER](https://github.com/JuanenRac/URTC-TESTER)** — Desktop-Live-CAN-Bus-Diagnosetool für URTC-Platinen, ein Panel pro Werkzeugprofil.
- **[URTC-WEB-STUDIO](https://github.com/JuanenRac/URTC-WEB-STUDIO)** — browserbasierte Alternative zu URTC-TESTER über die Web-Serial-API, ohne lokale Installation.
- **[URTC-GATEWAY](https://github.com/JuanenRac/URTC-GATEWAY)** — Gateway vor dem CAN-Bus von URTC: Liste erlaubter Kennungen, Ratenbegrenzung und Sitzungsschlüssel; Software auf dem Computer getestet, noch nicht an einem echten Bus.

*Vision-KI-Knoten (Hailo-8)*
- **[HYDRA-UMC-VISION-NODE](https://github.com/JuanenRac/HYDRA-UMC-VISION-NODE)** — Integrationsknoten für die Hailo-8-Vision-Pipeline, mit einer echten stufenweisen Hardware-Bereitschaftsprüfung.
- **[HYDRA-UMC-DETECTION-HEF](https://github.com/JuanenRac/HYDRA-UMC-DETECTION-HEF)** — echte Registry für kompilierte Modelle mit Hailo-Architektur-/Prüfsummen-Safe-Load-Verifizierung.
- **[HYDRA-UMC-VISION-STREAMER](https://github.com/JuanenRac/HYDRA-UMC-VISION-STREAMER)** — echter GStreamer-Pipeline- + MediaMTX-Konfigurationsgenerator mit einer echten HailoRT-Integrationsschranke.
- **[HYDRA-UMC-VISUAL-SERVOING-API](https://github.com/JuanenRac/HYDRA-UMC-VISUAL-SERVOING-API)** — Position-Based-Visual-Servoing-Korrekturgesetz mit Freigabe abhängig vom Zonenstatus; noch keine Posenschätzung per Kamera.
- **[HYDRA-UMC-SAFETY-ZONES](https://github.com/JuanenRac/HYDRA-UMC-SAFETY-ZONES)** — v0-Logik für Zonenverletzung, Kalibrierungsaktualität und E-STOP-Anforderung, die Objektpositionen aus einer Datei nimmt; kein Detektor speist sie, und noch kein physischer E-STOP ist angeschlossen.

*Kognitiver KI-Knoten (Hailo-10)*
- **[HYDRA-UMC-COGNITIVE-NODE](https://github.com/JuanenRac/HYDRA-UMC-COGNITIVE-NODE)** — Integrationsknoten für die Hailo-10-Cognitive-Pipeline (LLM-/VLA-/Sprach-Orchestrierung).
- **[HYDRA-UMC-VLA-ENGINE](https://github.com/JuanenRac/HYDRA-UMC-VLA-ENGINE)** — echte Aktions-Token-Kodierung/-Dekodierung und Trajektoriengenerierung für ein Vision-Language-Action-Modell.
- **[HYDRA-UMC-VOICE-UI](https://github.com/JuanenRac/HYDRA-UMC-VOICE-UI)** — echtes Sprach-Frontend (VAD + Intent-Parser) mit einem begrenzten, bestätigungsgesicherten Watch-Relay.
- **[HYDRA-UMC-SEMANTIC-PLANNER](https://github.com/JuanenRac/HYDRA-UMC-SEMANTIC-PLANNER)** — echte regelbasierte Aufgabenzerlegung und semantische Fehlerbehebung über MCU-Fehlercodes.
- **[HYDRA-UMC-DOCS-QA](https://github.com/JuanenRac/HYDRA-UMC-DOCS-QA)** — echte, nur auf der Standardbibliothek basierende TF-IDF-Dokumentensuche über die eigenen Markdown-Dokumente dieses Ökosystems.
- **[HYDRA-UMC-LOCAL-TECHNICIAN](https://github.com/JuanenRac/HYDRA-UMC-LOCAL-TECHNICIAN)** — lokaler, richtlinien-gesteuerter KI-Wartungstechniker für das Ökosystem selbst - beobachtet, diagnostiziert und schlägt Korrekturen vor; die zwei höchsten Risikostufen sind absichtlich noch nicht implementiert.

*Digitaler Zwilling & Simulation*
- **[HYDRA-UMC-TWIN](https://github.com/JuanenRac/HYDRA-UMC-TWIN)** — Integrationsknoten für die Digital-Twin-Engine, mit einem echten Versionskompatibilitäts-Sync-Vertrag.
- **[HYDRA-UMC-HIL-BRIDGE](https://github.com/JuanenRac/HYDRA-UMC-HIL-BRIDGE)** — Hardware-in-the-Loop-Router mit einer Software-Kollisionsverriegelung zwischen Simulation und echter Hardware (ohne echte Hardware getestet).
- **[HYDRA-UMC-PHYSICS-REPLICA](https://github.com/JuanenRac/HYDRA-UMC-PHYSICS-REPLICA)** — echte Vorwärtskinematik und Gelenkgrenzenvalidierung über eine echte URDF-Teilmenge.
- **[HYDRA-UMC-SYNTHETIC-DATA-GEN](https://github.com/JuanenRac/HYDRA-UMC-SYNTHETIC-DATA-GEN)** — echter prozeduraler 2D-Szenengenerator mit YOLO/COCO-Annotationsexport.

*Daten & Analytik*
- **[HYDRA-UMC-DATALAKE](https://github.com/JuanenRac/HYDRA-UMC-DATALAKE)** — echter sqlite3-gestützter Zeitreihenspeicher mit einer echten Ingest-/Abfrage-HTTP-API.
- **[HYDRA-UMC-ANOMALY-DETECTOR](https://github.com/JuanenRac/HYDRA-UMC-ANOMALY-DETECTOR)** — echter FFT- + statistischer Basislinien-Anomaliedetektor mit Drift-Überwachung.
- **[HYDRA-UMC-PRODUCTION-REPORTS](https://github.com/JuanenRac/HYDRA-UMC-PRODUCTION-REPORTS)** — echte OEE-/Verfügbarkeitsberechnung über den DATALAKE-Verlauf, mit reproduzierbarem CSV-Export.
- **[HYDRA-UMC-TELEMETRY-COLLECTOR](https://github.com/JuanenRac/HYDRA-UMC-TELEMETRY-COLLECTOR)** — echte CAN/WebSocket-Ingestion-Pipeline in DATALAKE, mit Sequenz-Deduplizierung.

*Industrie-Gateway*
- **[HYDRA-UMC-GATEWAY-INDUSTRIAL](https://github.com/JuanenRac/HYDRA-UMC-GATEWAY-INDUSTRIAL)** — Integrationsknoten, der zu Industrieprotokollen weiterleitet, mit einer echten Befehls-Allowlist-/Backpressure-Schicht.
- **[HYDRA-UMC-OPCUA-SERVER](https://github.com/JuanenRac/HYDRA-UMC-OPCUA-SERVER)** — echter OPC-UA-Adressraum, verifiziert mit einer echten Binärprotokoll-Client-Session.
- **[HYDRA-UMC-MQTT-BROKER](https://github.com/JuanenRac/HYDRA-UMC-MQTT-BROKER)** — echter MQTT-Broker mit optionaler Pro-Client-Authentifizierung und Topic-ACLs.
- **[HYDRA-UMC-MTCONNECT-ADAPTER](https://github.com/JuanenRac/HYDRA-UMC-MTCONNECT-ADAPTER)** — echte MTConnect-`/probe`- und `/current`-XML-Endpunkte mit Degraded-Mode-Ausgabe.

*Ergänzende Tools & Ökosystembetrieb*
- **[HYDRA-UMC-DASHBOARD-AI](https://github.com/JuanenRac/HYDRA-UMC-DASHBOARD-AI)** — Smart-Summaries- und Anomaly-Highlighting-Panels über DATALAKE/ANOMALY-DETECTOR, mit einem ehrlichen statistischen Fallback.
- **[HYDRA-UMC-TOOL-CLI](https://github.com/JuanenRac/HYDRA-UMC-TOOL-CLI)** — Flotten-CLI mit einem echten, stabilen Exit-Code-Vertrag, ein echter Live-Client der eigenen API von HYDRA-UMC-SERVER.
- **[HYDRA-UMC-WATCH](https://github.com/JuanenRac/HYDRA-UMC-WATCH)** — WearOS-Begleit-App mit haptischen Alarmmustern und einem Sprach-Relay zum gekoppelten Telefon (noch nicht auf einer physischen Uhr ausgeführt).
- **[URTC-SMART-RACK](https://github.com/JuanenRac/URTC-SMART-RACK)** — Firmware für ein Platinenmontagegestell mit echter Werkzeug-ID-Dekodierung und Smart-Idle-Vorheizlogik.
- **[URTC-VISION-TOOL](https://github.com/JuanenRac/URTC-VISION-TOOL)** — Firmware plus ein echter Python-Vision-Begleiter für einen Thermal-/RGB-Inspektionswerkzeugkopf.
- **[HYDRA-UMC-UPDATER](https://github.com/JuanenRac/HYDRA-UMC-UPDATER)** — administratives Desktop-Tool, das jedes Repository in diesem Ökosystem entdeckt, klont und aktualisiert.
- **[HYDRA-UMC-OS-REBUILDER](https://github.com/JuanenRac/HYDRA-UMC-OS-REBUILDER)** — Windows/Linux-Desktop-Tool, das ein flashbereites CM5-Image baut, vorgeladen mit den aktuellsten Versionen des Ökosystems, mit Ersteinrichtungs-Konfiguration für WLAN/Benutzer/SSH im Stil von Raspberry Pi Imager.
- **[HYDRA-UMC-OPS-AGENT](https://github.com/JuanenRac/HYDRA-UMC-OPS-AGENT)** — Wartungsvorfall-Koordinator: eine Edge-Rolle mit niedrigem Privileg sammelt einen bereinigten Inventar-/Gesundheits-Snapshot, eine Control-Plane-Rolle rendert ihn schreibgeschützt und bittet einen KI-Anbieter um einen Diagnosevorschlag - wendet nie einen Patch an und stellt nie etwas bereit.
- **[HYDRA-UMC-DEV-SERVER](https://github.com/JuanenRac/HYDRA-UMC-DEV-SERVER)** — reproduzierbarer Entwicklungshost (Raspberry Pi 5 / CM5), der den Quellcode des Ökosystems vorhält und begrenzte Build-/Test-Aufgaben über eine dauerhafte Warteschlange ausführt; eine dedizierte Entwicklerrolle, ausdrücklich kein operativer CM5.

## 📚 Dokumentation

Hier steht mehr:

* [Sicherheitsgrundlage des Ökosystems](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md)
* [Bedrohungsmodell des Ökosystems](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md)
* [Änderungsprotokoll dieses Repositorys](CHANGELOG.md)
* [Lizenz dieses Repositorys](LICENSE.md)

## 🤝 Mitwirken und Community

* Führe vor einem Pull Request `HYDRA_UMC_CI=1 py -3 tools/ci_validate.py` (oder `HYDRA_UMC_CI=1 python3 tools/ci_validate.py`) aus: Es muss `CI_VALIDATION=PASS` ausgeben. Führe dafür nicht `build.sh` oder `build.bat` aus; Bauen ist keine Prüfung.
* Die acht READMEs entstehen aus einer einzigen Quelle in HYDRA-UMC-DOCS; bearbeite sie nicht von Hand. Ändere die Quelle und schreibe sie mit `tools/make_readmes.py` neu.
* Behaupte in einer README nichts, was nicht gelaufen ist: Schreibe „simuliert“ oder „nicht auf Hardware erprobt“, wo das stimmt.
* Siehe [CONTRIBUTING.md](CONTRIBUTING.md), den [Verhaltenskodex](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md) und [SUPPORT.md](SUPPORT.md).

## 👤 AUTOR

**JuanenRac (Electro Hobby 3D)** · electrohobby3d@gmail.com

## 📜 LIZENZ

GPL-3.0-or-later - [LICENSE](LICENSE).
