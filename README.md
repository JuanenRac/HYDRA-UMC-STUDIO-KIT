<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - Shared code of the HYDRA-UMC web clients
Copyright (C) JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

<p align="center">
  <img src="images/HYDRA_UMC_BANNER.svg" alt="HYDRA-UMC-STUDIO-KIT banner" width="100%">
</p>

# 🧰 HYDRA-UMC-STUDIO-KIT

<p align="center">🇺🇸 <b>English</b> | <a href="README_spa.md">🇪🇸 Español</a> | <a href="README_fra.md">🇫🇷 Français</a> | <a href="README_ita.md">🇮🇹 Italiano</a> | <a href="README_deu.md">🇩🇪 Deutsch</a> | <a href="README_zho.md">🇨🇳 简体中文</a> | <a href="README_jpn.md">🇯🇵 日本語</a> | <a href="README_por.md">🇵🇹 Português</a></p>

### 🧰 The code the HYDRA-UMC web clients repeat, written once: session, HTTP, history, preferences and tours

<p align="center">
  <img src="https://img.shields.io/badge/License-GPL%203.0--or--later-blue.svg" alt="GPL 3.0 or later">
  <img src="https://img.shields.io/badge/Stack-TypeScript-3178C6.svg" alt="Stack">
  <img src="https://img.shields.io/badge/Feature-No%20Runtime%20Dependencies-blueviolet.svg" alt="Feature">
  <img src="https://img.shields.io/badge/Tests-87%20passing-2ea44f.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Version-0.0.2-0f6cbd.svg" alt="Version">
  <img src="https://img.shields.io/badge/Maturity-scaffolding-FFB020.svg" alt="Maturity">
</p>

---

**Honesty check - what actually runs today:** the session, the HTTP client, the address resolution, the connection-history parsers, the local preferences, the recent list, the tours and the texts are real and tested (87 tests passing), always against fakes of `fetch` and of the storage: nothing has run inside a real browser or against a real HYDRA-UMC-SERVER yet. HYDRA-UMC-STUDIO does not consume the kit yet, so no screen of any client uses it today. The guided tours are new code: no client has a tour to replace. See `CHANGELOG.md` for exactly what has shipped so far.

---

> **Safety and security status:** this ecosystem is not a certified safety system. There is no hardware E-STOP path, no firmware-enforced limits or interlocks and no verified motion command yet; firmware images are checked with CRC-32 and an Ed25519 signature, and a release build refuses the published development keys (the tool heads and expansion boards behind the relay still run URTC bootloaders, which take a shared-key HMAC-SHA256 instead of a signature); TLS and mutual TLS are optional and off by default; no custom board has been populated or tested yet. Read the [security baseline](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md) and the [threat model](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md) before relying on any statement here for the safety of a person.

---

## 📋 At a glance

| | |
|---|---|
| Version | `0.0.2` |
| Maturity | Scaffolding |
| Tests | 87 (`npm test`) |
| Stack | TypeScript / Vitest |
| Target | A web browser on the user's PC |
| On real hardware | Not applicable: nothing here runs on hardware |

**Jump to:** [Overview](#-overview) · [Architecture](#-architecture) · [Quick start](#-quick-start) · [Testing](#-testing) · [Repository Structure](#-repository-structure) · [Related Projects](#-related-projects)

## 🚦 Project status

Each line is one part of this repository and the light says how far it is today. It is written from what the repository can show (tests, builds, runs), not from what is planned.

🟢 Done and verified · 🟡 Works, with known limits · 🟠 Partly done or not verified yet · 🔴 Not done or not working

| Area | State | What it means here |
|---|---|---|
| Software | 🟠 | Structure and first pieces only; most of the work is still to do |
| Tests | 🟡 | 87 automated tests, run on every change |
| Real hardware | 🟡 | Not applicable: nothing here runs on hardware |
| Interface and protocols | 🟡 | The routes or messages it offers are documented and tested with a client; not every client has used them yet |
| Integration | 🟠 | It works on its own; its link with the rest of the ecosystem has not been exercised yet |
| Security | 🟡 | Access control, input limits or signatures are implemented and tested on a computer; nobody outside the project has reviewed them |
| Languages and accessibility | 🟡 | The interface and its help are in eight languages; keyboard and screen-reader use has not been tested |
| Documentation | 🟡 | README in eight languages, checked against the manifest on every change |

## 🎯 Overview

**HYDRA-UMC-STUDIO-KIT** is a small TypeScript package with no framework and no runtime dependencies. It holds the code that every HYDRA-UMC web client needs and that would otherwise be copied from one client to the next: where the sign-in tokens live, how a call to the server is made, how the connection history of the server is read, how the local choices of a person are remembered and how a guided tour keeps track of what was already shown.

### Key Features:
* 🔑 **Session:** access and refresh tokens in the session storage by default, in the local storage only when the person ticks "keep me signed in"; a token that arrives in the address is read from the fragment, kept for that view only and removed from the address. The `?token=` form is a switch, off by default.
* 🌐 **HTTP client:** a timeout on every attempt, bounded retries with a doubling wait for calls that are safe to repeat (never a POST on its own), `Retry-After`, one token refresh on a 401, and a typed `HttpError` (network, timeout, aborted, http, parse) whose text never holds the token. The token goes only to the configured origin.
* 🕘 **History:** parsers for the client list and the sign-in history of the server (an older server answers "unsupported" instead of breaking) and a bounded list of the recent choices of the person.
* ⚙️ **Preferences:** local choices with one validator per field; whatever is in the storage becomes a valid value or the default, and a storage that fails never breaks a screen.
* 🧭 **Tours:** the state of a guided tour and which ones were seen; a tour never starts by itself unless the application asks, and it is offered again when its version is raised.
* 🌍 **Eight languages:** the errors, the tour buttons and the names of the sign-in events in en, es, de, fr, it, ja, zh and pt (European Portuguese).

The kit draws nothing: a React client binds any of its stores with `useSyncExternalStore(store.subscribe, store.get)`. HYDRA-UMC-STUDIO is the first client meant to use it and does not consume it yet; `docs/MIGRATION.md` lists what it replaces and how each step is checked.

## 🧩 Role in HYDRA-UMC

**HYDRA-UMC-STUDIO-KIT** is the code that the web clients of the family would otherwise copy from one another: the sign-in session, the HTTP client, the connection history, the local preferences and the guided tours, as a TypeScript package with no framework and no runtime dependencies. HYDRA-UMC-STUDIO is the first client meant to use it and does not consume it yet.

## 🏛️ Architecture

<p align="center">
  <img src="images/architecture.svg" alt="HYDRA-UMC-STUDIO-KIT architecture" width="100%">
</p>

### ARCHITECTURE & DESIGN DECISIONS

* **Why a package and not another copy.** The session, the address of the server, the connection history and the local preferences were written in HYDRA-UMC-STUDIO and are needed unchanged by every other web client; a fix made in one copy was never made in the others.
* **Why no framework.** Every store has `get` and `subscribe`, the shape `useSyncExternalStore` expects, so React binds it in one line and another framework (or none) uses it as it is. A lint rule fails the build on an import of React.
* **Why a POST is never repeated on its own.** A call that failed for a temporary reason may or may not have reached the server; only a call the application declares idempotent is repeated. The wait doubles up to a limit with no random jitter, so a test can assert it.
* **Why the token goes only to the configured origin.** A page that calls an address typed by a person must not hand it the sign-in token; sending it elsewhere is a switch, off by default, and an error message never contains the token or the query string.
* **Why the `?token=` form of a launch address is a switch.** A query string reaches server logs, while the fragment (`#token=`) never leaves the browser. The older form is still read when the application asks for it.
* **Why a storage that fails is not an error.** A private window or blocked site data makes every read and write throw; the kit falls back to the defaults and keeps the choice for that visit.

For the full picture, see [`docs/API.md`](docs/API.md) for the API reference and [`docs/MIGRATION.md`](docs/MIGRATION.md) for the steps a web client follows to consume the kit.

## 🚀 Quick start

Requires Node.js 22 or newer with npm.

```bash
npm ci         # installs the development dependencies (the package itself has none at run time)
npm run build  # compiles src/ to dist/ (./build.sh runs the tests first; build.bat on Windows)
npm run typecheck && npm run lint && npm test
```

Use it from a web client with `import { createSession, createHttpClient } from 'hydra-umc-studio-kit'`; `docs/API.md` has the reference and `docs/MIGRATION.md` the steps a client follows to adopt it.

## 🧪 Testing

87 automated tests run with `npm test`. They use fakes for `fetch` and for the storage and need no browser and no network.

The CI runs `HYDRA_UMC_CI=1 python tools/ci_validate.py`, which checks the manifest, the documents, the eight READMEs and the pictures.

## 🏗️ Build & Release

The package compiles to `dist/` with the TypeScript compiler; there is no bundler and nothing to run.

```bash
# Windows
build.bat

# Linux / macOS
./build.sh

npm run typecheck && npm run lint && npm test
```

`build.sh` / `build.bat` install the dependencies, run the tests and compile; they never change the version (only `python tools/hydra_project_tool.py bump` raises it). `npm run typecheck`, `npm run lint` and `npm test` are the three checks the CI runs. A web client installs the package from a release tag, never from a branch (see `docs/MIGRATION.md`).

## 📂 Repository Structure

<p align="center">
  <img src="images/repository-structure.svg" alt="Repository structure of HYDRA-UMC-STUDIO-KIT" width="100%">
</p>

<details>
<summary>Text version of the tree</summary>

```text
HYDRA-UMC-STUDIO-KIT/
├── src/
│   ├── storage.ts                        safe storage helpers, in-memory storage
│   ├── store.ts                          a small observable value for any framework
│   ├── session.ts                        sign-in tokens, launch address, Authorization header
│   ├── apiBase.ts                        the address of the server in development and in production
│   ├── http.ts                           HTTP client: timeout, bounded retries, typed errors
│   ├── history.ts                        connection history parsers and recent choices
│   ├── prefs.ts                          local preferences with a validator per field
│   ├── tours.ts                          guided tours and which ones were seen
│   ├── messages.ts                       the texts of the kit in the eight languages
│   └── index.ts                          the public API
├── tests/                                tests with fakes for fetch and for the storage: session, HTTP, address, history, preferences, tours and texts
├── docs/                                 API reference and the migration guide for the web clients
├── tools/                                project tools and CI checks
├── images/                               banner and diagrams
├── .github/                              CI workflow and issue templates
├── package.json                          package metadata and scripts
├── tsconfig.json / tsconfig.build.json   TypeScript configuration (checks and build)
├── bump_manifest_version.py              syncs the version of hydra-umc.project.json
├── build.sh / build.bat                  install, test and build dist/
├── CHANGELOG.md                          what changed in each version
├── build-test.sh                         non-mutating build check
├── hydra-umc.project.json                manifest: version, maturity, family
└── test.sh                               runs the tests
```

</details>

## 🗺️ Roadmap & Known limits

**Known limits today**

* **Phase 1:** HYDRA-UMC-STUDIO consumes the kit, one file at a time (see `docs/MIGRATION.md`).
* **Phase 2:** The web studios of the ARMOR and URTC families adopt it with their own storage keys and texts.
* **Phase 3:** A separate, optional binding for React hooks that only uses the `get` / `subscribe` contract.
* **Phase 4:** Run the HTTP client and the session in a real browser against a real server.

## 🌍 Languages

This README and the documents of the repository exist in eight languages: English, Spanish, German, French, Italian, Japanese, Chinese and Portuguese (Portugal). They are written together and checked in the CI so that the eight files have the same sections and the same links. This repository has no screen or message catalogue of its own, so there are no interface strings to translate.

## 🔗 Related Projects

This project is part of the HYDRA-UMC robotics ecosystem by the same author (JuanenRac / Electro Hobby 3D). Worth knowing about, since a request might actually be about one of these rather than this repository.

**Directly Related**
- **[HYDRA-UMC-STUDIO](https://github.com/JuanenRac/HYDRA-UMC-STUDIO)** — web control dashboard with real-time multi-robot 3D visualization — the first client meant to consume this kit (not yet).
- **[HYDRA-UMC-SERVER](https://github.com/JuanenRac/HYDRA-UMC-SERVER)** — the headless backend (REST/WebSocket) the HTTP client and the connection-history reads are written for.

**Also Part of the Ecosystem**

*Core Hardware & Platform*
- **[HYDRA-UMC](https://github.com/JuanenRac/HYDRA-UMC)** — the robot-arm motherboard design: CM5 host + dual-core STM32H745, meant to orchestrate up to 8 tool arms over CAN-OTA/SPI-OTA (firmware at an early stage; no populated board yet).
- **[HYDRA-UMC-OS](https://github.com/JuanenRac/HYDRA-UMC-OS)** — reproducible Raspberry Pi OS product layer for the CM5: read-only agent, validated config/profiles, WiFi first-contact provisioning.
- **[HYDRA-UMC-SDK](https://github.com/JuanenRac/HYDRA-UMC-SDK)** — the shared JSON-Schema contract and software job-gate boundary every bridge validates its commands against (not a certified safety function).
- **[HYDRA-UMC-CONNECTOR-HUB](https://github.com/JuanenRac/HYDRA-UMC-CONNECTOR-HUB)** — declarative adapter-manifest registry and validator for external-machine connectors; extends the SDK's own contract idea to external machines without replacing the industrial-gateway projects.

*Core Backend & Clients*
- **[HYDRA-UMC-SUITE](https://github.com/JuanenRac/HYDRA-UMC-SUITE)** — desktop (PySide6) swarm command center for multiple servers at once, packaged as a standalone executable.
- **[HYDRA-UMC-ANDROID-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-ANDROID-CONTROL)** — native Android control app with biometric login and a paired Wear OS companion.
- **[HYDRA-UMC-IOS-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-IOS-CONTROL)** — iOS/iPadOS control app (Flutter) with real-time WebSocket sync.
- **[HYDRA-UMC-DSI](https://github.com/JuanenRac/HYDRA-UMC-DSI)** — native touch UI for the onboard 7" DSI touchscreen, embedded on the CM5 itself.
- **[HYDRA-UMC-EDITOR-URDF](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-URDF)** — desktop graphical URDF creator/editor that pushes finished models into STUDIO's own catalog.
- **[HYDRA-UMC-EDITOR-STL](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-STL)** — desktop STL model editor, transforming/replacing/removing/adding real parts in the same model catalog HYDRA-UMC-EDITOR-URDF also edits.
- **[HYDRA-UMC-BRIDGE-AMR](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-AMR)** — coordination boundary for AGV/AMR fleets via a VDA 5050 MQTT publisher (tested against an emulated fleet only).
- **[HYDRA-UMC-BRIDGE-CNC](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-CNC)** — high-level CNC-cell coordinator with GRBL status/control-byte access (tested against an emulator only).
- **[HYDRA-UMC-BRIDGE-DROIDS](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-DROIDS)** — coordination boundary for legged/humanoid droids, with a Boston Dynamics Spot command sender (tested against an emulator only).
- **[HYDRA-UMC-BRIDGE-LASER](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-LASER)** — laser-cell coordinator reading 3 key/enclosure/interlock GPIO signals (tested against a fake chip only; it cannot arm or fire a laser).
- **[HYDRA-UMC-BRIDGE-OPENPNP](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-OPENPNP)** — safe high-level board-flow coordinator for OpenPnP pick-and-place.
- **[HYDRA-UMC-BRIDGE-PRINTER3D](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-PRINTER3D)** — safe coordination boundary for Moonraker/Klipper 3D printers, with real gated job commands.
- **[HYDRA-UMC-BRIDGE-ROS2](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-ROS2)** — coordinator with a lazily imported rclpy ROS 2 transport (not yet run against a ROS 2 installation).
- **[HYDRA-UMC-BRIDGE-UAV](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-UAV)** — coordination boundary for camera-equipped UAVs, with a MAVLink command sender (tested against an emulator only).

*URTC Tool Platform*
- **[URTC](https://github.com/JuanenRac/URTC)** — firmware for the physical Universal Robot Tool Controller PCB, 25+ tool profiles over CAN bus.
- **[URTC-FLASHER](https://github.com/JuanenRac/URTC-FLASHER)** — desktop GUI flashing tool for URTC boards, CAN-OTA plus full-chip SWD/JTAG.
- **[URTC-TESTER](https://github.com/JuanenRac/URTC-TESTER)** — desktop live CAN-bus diagnostic tool for URTC boards, one panel per tool profile.
- **[URTC-WEB-STUDIO](https://github.com/JuanenRac/URTC-WEB-STUDIO)** — browser-based alternative to URTC-TESTER via the Web Serial API, no local install needed.
- **[URTC-GATEWAY](https://github.com/JuanenRac/URTC-GATEWAY)** — gateway in front of the URTC CAN bus: an allowed list of identifiers, a rate limit and a session key; software tested on a computer, not yet on a real bus.

*Vision AI Node (Hailo-8)*
- **[HYDRA-UMC-VISION-NODE](https://github.com/JuanenRac/HYDRA-UMC-VISION-NODE)** — integration hub for the Hailo-8 vision pipeline, with a real per-stage hardware-readiness check.
- **[HYDRA-UMC-DETECTION-HEF](https://github.com/JuanenRac/HYDRA-UMC-DETECTION-HEF)** — real compiled-model registry with Hailo-architecture/checksum safe-load verification.
- **[HYDRA-UMC-VISION-STREAMER](https://github.com/JuanenRac/HYDRA-UMC-VISION-STREAMER)** — real GStreamer pipeline + MediaMTX config generator with a real HailoRT integration boundary.
- **[HYDRA-UMC-VISUAL-SERVOING-API](https://github.com/JuanenRac/HYDRA-UMC-VISUAL-SERVOING-API)** — Position-Based Visual Servoing correction law with authorisation gated on the zone state; no camera pose estimation yet.
- **[HYDRA-UMC-SAFETY-ZONES](https://github.com/JuanenRac/HYDRA-UMC-SAFETY-ZONES)** — v0 zone-breach, calibration-freshness and E-STOP-request logic that takes object positions from a file; no detector feeds it and no physical E-STOP is wired to it yet.

*Cognitive AI Node (Hailo-10)*
- **[HYDRA-UMC-COGNITIVE-NODE](https://github.com/JuanenRac/HYDRA-UMC-COGNITIVE-NODE)** — integration hub for the Hailo-10 cognitive pipeline (LLM/VLA/voice orchestration).
- **[HYDRA-UMC-VLA-ENGINE](https://github.com/JuanenRac/HYDRA-UMC-VLA-ENGINE)** — real action-token encoding/decoding and trajectory generation for a Vision-Language-Action model.
- **[HYDRA-UMC-VOICE-UI](https://github.com/JuanenRac/HYDRA-UMC-VOICE-UI)** — real voice front-end (VAD + intent parser) with a bounded, confirmation-gated Watch relay.
- **[HYDRA-UMC-SEMANTIC-PLANNER](https://github.com/JuanenRac/HYDRA-UMC-SEMANTIC-PLANNER)** — real rule-based task decomposition and semantic error recovery over MCU error codes.
- **[HYDRA-UMC-DOCS-QA](https://github.com/JuanenRac/HYDRA-UMC-DOCS-QA)** — real stdlib-only TF-IDF document search over this ecosystem's own Markdown docs.
- **[HYDRA-UMC-LOCAL-TECHNICIAN](https://github.com/JuanenRac/HYDRA-UMC-LOCAL-TECHNICIAN)** — local, policy-gated AI maintenance technician for the ecosystem itself - observes, diagnoses and proposes fixes; the two highest risk levels are deliberately not implemented yet.

*Digital Twin & Simulation*
- **[HYDRA-UMC-TWIN](https://github.com/JuanenRac/HYDRA-UMC-TWIN)** — integration hub for the digital-twin engine, with a real version-compatibility sync contract.
- **[HYDRA-UMC-HIL-BRIDGE](https://github.com/JuanenRac/HYDRA-UMC-HIL-BRIDGE)** — hardware-in-the-loop router with a software collision interlock between simulation and real hardware (tested without real hardware).
- **[HYDRA-UMC-PHYSICS-REPLICA](https://github.com/JuanenRac/HYDRA-UMC-PHYSICS-REPLICA)** — real forward kinematics and joint-limit validation over a real URDF subset.
- **[HYDRA-UMC-SYNTHETIC-DATA-GEN](https://github.com/JuanenRac/HYDRA-UMC-SYNTHETIC-DATA-GEN)** — real procedural 2D scene generator with YOLO/COCO annotation export.

*Data & Analytics*
- **[HYDRA-UMC-DATALAKE](https://github.com/JuanenRac/HYDRA-UMC-DATALAKE)** — real sqlite3-backed time-series store with a real ingest/query HTTP API.
- **[HYDRA-UMC-ANOMALY-DETECTOR](https://github.com/JuanenRac/HYDRA-UMC-ANOMALY-DETECTOR)** — real FFT + statistical baseline anomaly detector with drift monitoring.
- **[HYDRA-UMC-PRODUCTION-REPORTS](https://github.com/JuanenRac/HYDRA-UMC-PRODUCTION-REPORTS)** — real OEE/availability calculation over DATALAKE history, with reproducible CSV export.
- **[HYDRA-UMC-TELEMETRY-COLLECTOR](https://github.com/JuanenRac/HYDRA-UMC-TELEMETRY-COLLECTOR)** — real CAN/WebSocket ingestion pipeline into DATALAKE, with sequence deduplication.

*Industrial Gateway*
- **[HYDRA-UMC-GATEWAY-INDUSTRIAL](https://github.com/JuanenRac/HYDRA-UMC-GATEWAY-INDUSTRIAL)** — integration hub relaying to industrial protocols, with a real command allowlist/backpressure layer.
- **[HYDRA-UMC-OPCUA-SERVER](https://github.com/JuanenRac/HYDRA-UMC-OPCUA-SERVER)** — real OPC-UA address space, verified with a real binary-protocol client session.
- **[HYDRA-UMC-MQTT-BROKER](https://github.com/JuanenRac/HYDRA-UMC-MQTT-BROKER)** — real MQTT broker with optional per-client authentication and topic ACLs.
- **[HYDRA-UMC-MTCONNECT-ADAPTER](https://github.com/JuanenRac/HYDRA-UMC-MTCONNECT-ADAPTER)** — real MTConnect `/probe` and `/current` XML endpoints with degraded-mode output.

*Complementary Tools & Ecosystem Operations*
- **[HYDRA-UMC-DASHBOARD-AI](https://github.com/JuanenRac/HYDRA-UMC-DASHBOARD-AI)** — Smart Summaries and Anomaly Highlighting panels over DATALAKE/ANOMALY-DETECTOR, with an honest statistical fallback.
- **[HYDRA-UMC-TOOL-CLI](https://github.com/JuanenRac/HYDRA-UMC-TOOL-CLI)** — fleet CLI with a real, stable exit-code contract, a genuine live client of HYDRA-UMC-SERVER's own API.
- **[HYDRA-UMC-WATCH](https://github.com/JuanenRac/HYDRA-UMC-WATCH)** — WearOS companion app with haptic alert patterns and a paired-phone voice relay (not yet run on a physical watch).
- **[URTC-SMART-RACK](https://github.com/JuanenRac/URTC-SMART-RACK)** — firmware for a board-mounting rack with real tool-ID decoding and Smart Idle pre-heating logic.
- **[URTC-VISION-TOOL](https://github.com/JuanenRac/URTC-VISION-TOOL)** — firmware plus a real Python vision companion for a thermal/RGB inspection tool head.
- **[HYDRA-UMC-UPDATER](https://github.com/JuanenRac/HYDRA-UMC-UPDATER)** — administrative desktop tool that discovers, clones and updates every repo in this ecosystem.
- **[HYDRA-UMC-OS-REBUILDER](https://github.com/JuanenRac/HYDRA-UMC-OS-REBUILDER)** — Windows/Linux desktop tool that builds a ready-to-flash CM5 image pre-loaded with the ecosystem's most current versions, with Raspberry-Pi-Imager-style first-boot Wi-Fi/user/SSH configuration.
- **[HYDRA-UMC-OPS-AGENT](https://github.com/JuanenRac/HYDRA-UMC-OPS-AGENT)** — maintenance-incident coordinator: a low-privilege edge role collects a sanitized inventory/health snapshot, a control-plane role renders it read-only and asks an AI provider to suggest a diagnosis - never applies a patch or deploys anything.
- **[HYDRA-UMC-DEV-SERVER](https://github.com/JuanenRac/HYDRA-UMC-DEV-SERVER)** — reproducible development host (Raspberry Pi 5 / CM5) that stores the ecosystem's source and runs bounded build/test tasks under a durable queue; a dedicated dev role, explicitly not an operational CM5.

## 📚 Documentation

Where to read more:

* [Security baseline of the ecosystem](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md)
* [Threat model of the ecosystem](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md)
* [Changelog of this repository](CHANGELOG.md)
* [License of this repository](LICENSE.md)

## 🤝 Contributing & Community

* Before a pull request run `HYDRA_UMC_CI=1 py -3 tools/ci_validate.py` (or `HYDRA_UMC_CI=1 python3 tools/ci_validate.py`): it must print `CI_VALIDATION=PASS`. Do not run `build.sh` or `build.bat` for this check; building is not a check.
* The eight READMEs are written from one source in HYDRA-UMC-DOCS; do not edit them by hand. Change the source and write them again with `tools/make_readmes.py`.
* Do not state in a README what has not run: say "simulated" or "not tried on hardware" where that is the truth.
* See [CONTRIBUTING.md](CONTRIBUTING.md), the [code of conduct](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md) and [SUPPORT.md](SUPPORT.md).

## 👤 AUTHOR

**JuanenRac (Electro Hobby 3D)** · electrohobby3d@gmail.com

## 📜 LICENSE

GPL-3.0-or-later - [LICENSE](LICENSE).
