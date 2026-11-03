<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - Shared code of the HYDRA-UMC web clients
Copyright (C) JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

<p align="center">
  <img src="images/HYDRA_UMC_BANNER.svg" alt="HYDRA-UMC-STUDIO-KIT banner" width="100%">
</p>

# 🧰 HYDRA-UMC-STUDIO-KIT

<p align="center"><a href="README.md">🇺🇸 English</a> | <a href="README_spa.md">🇪🇸 Español</a> | <a href="README_fra.md">🇫🇷 Français</a> | 🇮🇹 <b>Italiano</b> | <a href="README_deu.md">🇩🇪 Deutsch</a> | <a href="README_zho.md">🇨🇳 简体中文</a> | <a href="README_jpn.md">🇯🇵 日本語</a> | <a href="README_por.md">🇵🇹 Português</a></p>

### 🧰 Il codice che i client web HYDRA-UMC ripetono, scritto una sola volta: sessione, HTTP, cronologia, preferenze e tour

<p align="center">
  <img src="https://img.shields.io/badge/License-GPL%203.0--or--later-blue.svg" alt="GPL 3.0 or later">
  <img src="https://img.shields.io/badge/Stack-TypeScript-3178C6.svg" alt="Stack">
  <img src="https://img.shields.io/badge/Feature-No%20Runtime%20Dependencies-blueviolet.svg" alt="Feature">
  <img src="https://img.shields.io/badge/Tests-87%20passing-2ea44f.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Version-0.0.2-0f6cbd.svg" alt="Version">
  <img src="https://img.shields.io/badge/Maturity-scaffolding-FFB020.svg" alt="Maturity">
</p>

---

**Verifica di onestà - cosa gira davvero oggi:** la sessione, il client HTTP, la risoluzione dell'indirizzo, i lettori della cronologia delle connessioni, le preferenze locali, l'elenco recente, i tour e i testi sono reali e testati (87 test superati), sempre contro simulazioni di `fetch` e dell'archivio: nulla è ancora girato in un browser reale né contro un vero HYDRA-UMC-SERVER. HYDRA-UMC-STUDIO non consuma ancora il kit, quindi oggi nessuna schermata di nessun client lo usa. I tour guidati sono codice nuovo: nessun client ha un tour da sostituire. Vedi `CHANGELOG.md` per ciò che è stato consegnato finora.

---

> **Stato di sicurezza (safety e security):** questo ecosistema non è un sistema di sicurezza certificato. Non esiste ancora un percorso E-STOP hardware, né limiti o interblocchi imposti dal firmware, né un comando di movimento verificato; le immagini firmware sono controllate con CRC-32 e una firma Ed25519, e una compilazione di rilascio rifiuta le chiavi di sviluppo pubblicate (le teste utensile e le schede di espansione dietro il relè usano ancora i bootloader di URTC, che accettano un HMAC-SHA256 a chiave condivisa invece di una firma); TLS e TLS reciproco sono opzionali e disattivati per impostazione predefinita; nessuna scheda propria è stata ancora assemblata o provata. Leggi la [base di sicurezza](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md) e il [modello delle minacce](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md) prima di fidarti di qualsiasi affermazione qui per la sicurezza di una persona.

---

## 📋 In breve

| | |
|---|---|
| Versione | `0.0.2` |
| Maturità | Impalcatura |
| Test | 87 (`npm test`) |
| Tecnologia | TypeScript / Vitest |
| Destinazione | Un browser web sul PC dell'utente |
| Su hardware reale | Non applicabile: nulla qui gira su hardware |

**Vai a:** [Panoramica](#-panoramica) · [Architettura](#-architettura) · [Avvio rapido](#-avvio-rapido) · [Test](#-test) · [Struttura del repository](#-struttura-del-repository) · [Progetti correlati](#-progetti-correlati)

## 🚦 Stato del progetto

Ogni riga è una parte di questo repository e il semaforo dice a che punto è oggi. È scritta in base a ciò che il repository può mostrare (test, compilazioni, esecuzioni), non a ciò che è previsto.

🟢 Fatto e verificato · 🟡 Funziona, con limiti noti · 🟠 Fatto a metà o non ancora verificato · 🔴 Non fatto o non funzionante

| Area | Stato | Cosa significa qui |
|---|---|---|
| Software | 🟠 | Solo struttura e primi pezzi; gran parte del lavoro è ancora da fare |
| Test | 🟡 | 87 test automatici, eseguiti a ogni modifica |
| Hardware reale | 🟡 | Non applicabile: nulla qui gira su hardware |
| Interfaccia e protocolli | 🟡 | Le rotte o i messaggi offerti sono documentati e provati con un client; non tutti i client li hanno ancora usati |
| Integrazione | 🟠 | Funziona da solo; il collegamento con il resto dell'ecosistema non è ancora stato provato |
| Sicurezza | 🟡 | Il controllo degli accessi, i limiti d'ingresso o le firme sono implementati e provati su un computer; nessuno al di fuori del progetto li ha rivisti |
| Lingue e accessibilità | 🟡 | L'interfaccia e la sua guida sono in otto lingue; l'uso con tastiera e screen reader non è stato provato |
| Documentazione | 🟡 | README in otto lingue, verificato rispetto al manifesto a ogni modifica |

## 🎯 Panoramica

**HYDRA-UMC-STUDIO-KIT** è un piccolo pacchetto TypeScript senza framework e senza dipendenze di esecuzione. Raccoglie il codice di cui ogni client web HYDRA-UMC ha bisogno e che altrimenti verrebbe copiato da un client all'altro: dove vivono i token di accesso, come si fa una chiamata al server, come si legge la cronologia delle connessioni del server, come si ricordano le scelte locali di una persona e come un tour guidato tiene traccia di ciò che è già stato mostrato.

### Caratteristiche principali:
* 🔑 **Sessione:** i token di accesso e di rinnovo vanno per impostazione predefinita nell'archivio di sessione e in quello locale solo quando la persona spunta «resta connesso»; un token che arriva nell'indirizzo viene letto dal frammento, tenuto solo per quella vista e rimosso dall'indirizzo. La forma `?token=` è un interruttore, spento di default.
* 🌐 **Client HTTP:** un timeout a ogni tentativo, tentativi limitati con attesa crescente per le chiamate sicure da ripetere (mai un POST da solo), `Retry-After`, un rinnovo del token su un 401 e un `HttpError` tipizzato (rete, timeout, annullata, http, lettura) il cui testo non contiene mai il token. Il token va solo all'origine configurata.
* 🕘 **Cronologia:** lettori dell'elenco dei client e della cronologia degli accessi del server (un server più vecchio risponde «non supportato» invece di rompersi) e un elenco limitato delle scelte recenti della persona.
* ⚙️ **Preferenze:** scelte locali con un validatore per campo; ciò che si trova nell'archivio diventa un valore valido o il valore predefinito, e un archivio che fallisce non rompe mai una schermata.
* 🧭 **Tour:** lo stato di un tour guidato e quali sono stati visti; un tour non parte mai da solo a meno che l'applicazione lo chieda, e viene riproposto quando la sua versione sale.
* 🌍 **Otto lingue:** gli errori, i pulsanti del tour e i nomi degli eventi di accesso in en, es, de, fr, it, ja, zh e pt (portoghese del Portogallo).

Il kit non disegna nulla: un client React collega ciascuno dei suoi store con `useSyncExternalStore(store.subscribe, store.get)`. HYDRA-UMC-STUDIO è il primo client pensato per usarlo e non lo consuma ancora; `docs/MIGRATION.md` elenca cosa sostituisce e come si verifica ogni passo.

## 🧩 Ruolo in HYDRA-UMC

**HYDRA-UMC-STUDIO-KIT** è il codice che i client web della famiglia altrimenti si copierebbero a vicenda: la sessione di accesso, il client HTTP, la cronologia delle connessioni, le preferenze locali e i tour guidati, come pacchetto TypeScript senza framework e senza dipendenze di esecuzione. HYDRA-UMC-STUDIO è il primo client pensato per usarlo e non lo consuma ancora.

## 🏛️ Architettura

<p align="center">
  <img src="images/architecture.svg" alt="HYDRA-UMC-STUDIO-KIT architecture" width="100%">
</p>

### ARCHITETTURA E SCELTE DI PROGETTO

* **Perché un pacchetto e non un'altra copia.** La sessione, l'indirizzo del server, la cronologia delle connessioni e le preferenze locali sono state scritte in HYDRA-UMC-STUDIO e servono identiche a ogni altro client web; una correzione fatta in una copia non veniva mai fatta nelle altre.
* **Perché senza framework.** Ogni store ha `get` e `subscribe`, la forma che `useSyncExternalStore` si aspetta: React lo collega in una riga e un altro framework (o nessuno) lo usa così com'è. Una regola di lint fa fallire la compilazione davanti a un import di React.
* **Perché un POST non viene mai ripetuto da solo.** Una chiamata fallita per un motivo temporaneo può essere arrivata o no al server; si ripete solo una chiamata che l'applicazione dichiara idempotente. L'attesa raddoppia fino a un limite senza casualità, così un test può verificarla.
* **Perché il token va solo all'origine configurata.** Una pagina che chiama un indirizzo digitato da una persona non deve consegnargli il token di accesso; inviarlo altrove è un interruttore, spento di default, e un messaggio di errore non contiene mai il token né la stringa di query.
* **Perché la forma `?token=` di un indirizzo di avvio è un interruttore.** Una stringa di query arriva nei log del server, mentre il frammento (`#token=`) non lascia mai il browser. La forma più vecchia viene ancora letta quando l'applicazione lo chiede.
* **Perché un archivio che fallisce non è un errore.** Una finestra privata o i dati del sito bloccati fanno lanciare un'eccezione a ogni lettura e scrittura; il kit torna ai valori predefiniti e tiene la scelta per quella visita.

Per il quadro completo, vedi [`docs/API.md`](docs/API.md) per il riferimento dell'API e [`docs/MIGRATION.md`](docs/MIGRATION.md) per i passi che un client web segue per usare il kit.

## 🚀 Avvio rapido

Richiede Node.js 22 o successivo con npm.

```bash
npm ci         # installs the development dependencies (the package itself has none at run time)
npm run build  # compiles src/ to dist/ (./build.sh runs the tests first; build.bat on Windows)
npm run typecheck && npm run lint && npm test
```

Usalo da un client web con `import { createSession, createHttpClient } from 'hydra-umc-studio-kit'`; `docs/API.md` contiene il riferimento e `docs/MIGRATION.md` i passi che un client segue per adottarlo.

## 🧪 Test

87 test automatici si eseguono con `npm test`. Usano simulazioni di `fetch` e dell'archivio e non richiedono né browser né rete.

La CI esegue `HYDRA_UMC_CI=1 python tools/ci_validate.py`, che controlla il manifesto, i documenti, gli otto README e le immagini.

## 🏗️ Compilazione e rilascio

Il pacchetto si compila in `dist/` con il compilatore TypeScript; non c'è un bundler né nulla da eseguire.

```bash
# Windows
build.bat

# Linux / macOS
./build.sh

npm run typecheck && npm run lint && npm test
```

`build.sh` / `build.bat` installano le dipendenze, eseguono i test e compilano; non cambiano mai la versione (solo `python tools/hydra_project_tool.py bump` la alza). `npm run typecheck`, `npm run lint` e `npm test` sono i tre controlli della CI. Un client web installa il pacchetto da un tag di rilascio, mai da un ramo (vedi `docs/MIGRATION.md`).

## 📂 Struttura del repository

<p align="center">
  <img src="images/repository-structure.svg" alt="Repository structure of HYDRA-UMC-STUDIO-KIT" width="100%">
</p>

<details>
<summary>Versione testuale dell'albero</summary>

```text
HYDRA-UMC-STUDIO-KIT/
├── src/
│   ├── storage.ts                        aiuti di archiviazione sicuri, archivio in memoria
│   ├── store.ts                          un piccolo valore osservabile per qualsiasi framework
│   ├── session.ts                        token di accesso, indirizzo di avvio, intestazione Authorization
│   ├── apiBase.ts                        l'indirizzo del server in sviluppo e in produzione
│   ├── http.ts                           client HTTP: timeout, tentativi limitati, errori tipizzati
│   ├── history.ts                        lettori della cronologia delle connessioni e scelte recenti
│   ├── prefs.ts                          preferenze locali con un validatore per campo
│   ├── tours.ts                          tour guidati e quali sono stati visti
│   ├── messages.ts                       i testi del kit nelle otto lingue
│   └── index.ts                          l'API pubblica
├── tests/                                test con simulazioni di fetch e dell'archivio: sessione, HTTP, indirizzo, cronologia, preferenze, tour e testi
├── docs/                                 riferimento dell'API e guida alla migrazione per i client web
├── tools/                                strumenti del progetto e controlli CI
├── images/                               banner e diagrammi
├── .github/                              flusso CI e modelli di segnalazione
├── package.json                          metadati del pacchetto e script
├── tsconfig.json / tsconfig.build.json   configurazione di TypeScript (controllo e compilazione)
├── bump_manifest_version.py              sincronizza la versione di hydra-umc.project.json
├── build.sh / build.bat                  installa, testa e compila dist/
├── CHANGELOG.md                          cosa è cambiato in ogni versione
├── build-test.sh                         verifica della compilazione senza modifiche
├── hydra-umc.project.json                manifesto: versione, maturità, famiglia
└── test.sh                               esegue i test
```

</details>

## 🗺️ Roadmap e limiti noti

**Limiti noti oggi**

* **Fase 1:** HYDRA-UMC-STUDIO consuma il kit, un file alla volta (vedi `docs/MIGRATION.md`).
* **Fase 2:** Gli studio web delle famiglie ARMOR e URTC lo adottano con le proprie chiavi di archiviazione e i propri testi.
* **Fase 3:** Un collegamento separato e facoltativo per gli hook di React che usi solo il contratto `get` / `subscribe`.
* **Fase 4:** Eseguire il client HTTP e la sessione in un browser reale contro un server reale.

## 🌍 Lingue

Questo README e i documenti del repository esistono in otto lingue: inglese, spagnolo, tedesco, francese, italiano, giapponese, cinese e portoghese (Portogallo). Sono scritti insieme e la CI verifica che gli otto file abbiano le stesse sezioni e gli stessi link. Questo repository non ha uno schermo né un catalogo di messaggi propri, quindi non ci sono stringhe di interfaccia da tradurre.

## 🔗 Progetti correlati

Questo progetto fa parte dell'ecosistema robotico HYDRA-UMC dello stesso autore (JuanenRac / Electro Hobby 3D). Vale la pena conoscerlo, poiché una richiesta potrebbe in realtà riguardare uno di questi invece di questo repository.

**Direttamente Correlati**
- **[HYDRA-UMC-STUDIO](https://github.com/JuanenRac/HYDRA-UMC-STUDIO)** — dashboard web di controllo con visualizzazione 3D in tempo reale di più robot — il primo client pensato per usare questo kit (non ancora).
- **[HYDRA-UMC-SERVER](https://github.com/JuanenRac/HYDRA-UMC-SERVER)** — il backend senza interfaccia (REST/WebSocket) per cui sono scritti il client HTTP e le letture della cronologia delle connessioni.

**Fa Anche Parte dell'Ecosistema**

*Hardware e Piattaforma di Base*
- **[HYDRA-UMC](https://github.com/JuanenRac/HYDRA-UMC)** — il progetto della scheda madre del braccio robotico: host CM5 + coprocessore STM32H745 dual-core, pensato per coordinare fino a 8 bracci utensile via CAN-OTA/SPI-OTA (firmware in fase iniziale; nessuna scheda assemblata per ora).
- **[HYDRA-UMC-OS](https://github.com/JuanenRac/HYDRA-UMC-OS)** — livello prodotto riproducibile su Raspberry Pi OS per il CM5: agente in sola lettura, config/profili validati, provisioning WiFi al primo contatto.
- **[HYDRA-UMC-SDK](https://github.com/JuanenRac/HYDRA-UMC-SDK)** — il contratto JSON-Schema condiviso e la barriera software di controllo dei job contro cui ogni bridge valida i propri comandi (non è una funzione di sicurezza certificata).
- **[HYDRA-UMC-CONNECTOR-HUB](https://github.com/JuanenRac/HYDRA-UMC-CONNECTOR-HUB)** — registro dichiarativo e validatore di manifesti adattatore per connettori di macchine esterne; estende la propria idea di contratto dell'SDK alle macchine esterne senza sostituire i progetti di gateway industriale.

*Backend Centrale e Client*
- **[HYDRA-UMC-SUITE](https://github.com/JuanenRac/HYDRA-UMC-SUITE)** — centro di comando sciame desktop (PySide6) per più server contemporaneamente, pacchettizzato come eseguibile standalone.
- **[HYDRA-UMC-ANDROID-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-ANDROID-CONTROL)** — app di controllo nativa per Android con login biometrico e un companion Wear OS abbinato.
- **[HYDRA-UMC-IOS-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-IOS-CONTROL)** — app di controllo per iOS/iPadOS (Flutter) con sincronizzazione WebSocket in tempo reale.
- **[HYDRA-UMC-DSI](https://github.com/JuanenRac/HYDRA-UMC-DSI)** — interfaccia touch nativa per il touchscreen DSI da 7" a bordo, incorporata direttamente nel CM5.
- **[HYDRA-UMC-EDITOR-URDF](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-URDF)** — creatore/editor grafico desktop di URDF che invia i modelli finiti al catalogo di STUDIO.
- **[HYDRA-UMC-EDITOR-STL](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-STL)** — editor desktop di modelli STL, che trasforma/sostituisce/rimuove/aggiunge veri pezzi nello stesso catalogo di modelli modificato anche da HYDRA-UMC-EDITOR-URDF.
- **[HYDRA-UMC-BRIDGE-AMR](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-AMR)** — barriera di coordinamento per flotte AGV/AMR tramite un publisher MQTT VDA 5050 (testato solo contro una flotta emulata).
- **[HYDRA-UMC-BRIDGE-CNC](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-CNC)** — coordinatore ad alto livello per celle CNC con accesso a stato/byte di controllo GRBL (testato solo contro un emulatore).
- **[HYDRA-UMC-BRIDGE-DROIDS](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-DROIDS)** — barriera di coordinamento per droidi con zampe/umanoidi, con un mittente di comandi per Boston Dynamics Spot (testato solo contro un emulatore).
- **[HYDRA-UMC-BRIDGE-LASER](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-LASER)** — coordinatore per celle laser che legge 3 segnali GPIO di chiave/involucro/interblocco (testato solo contro un chip simulato; non può armare né far partire un laser).
- **[HYDRA-UMC-BRIDGE-OPENPNP](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-OPENPNP)** — coordinatore ad alto livello sicuro per il flusso schede del pick-and-place OpenPnP.
- **[HYDRA-UMC-BRIDGE-PRINTER3D](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-PRINTER3D)** — barriera di coordinamento sicura per stampanti 3D Moonraker/Klipper, con comandi di lavoro reali e controllati.
- **[HYDRA-UMC-BRIDGE-ROS2](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-ROS2)** — coordinatore con un trasporto ROS 2 rclpy importato in modo lazy (non ancora eseguito contro un'installazione ROS 2).
- **[HYDRA-UMC-BRIDGE-UAV](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-UAV)** — barriera di coordinamento per UAV dotati di fotocamera, con un mittente di comandi MAVLink (testato solo contro un emulatore).

*Piattaforma Strumenti URTC*
- **[URTC](https://github.com/JuanenRac/URTC)** — firmware per la scheda fisica dell'Universal Robot Tool Controller, oltre 25 profili utensile su bus CAN.
- **[URTC-FLASHER](https://github.com/JuanenRac/URTC-FLASHER)** — strumento desktop con GUI per il flashing delle schede URTC, CAN-OTA più SWD/JTAG a chip intero.
- **[URTC-TESTER](https://github.com/JuanenRac/URTC-TESTER)** — strumento desktop di diagnostica CAN-bus dal vivo per schede URTC, un pannello per profilo utensile.
- **[URTC-WEB-STUDIO](https://github.com/JuanenRac/URTC-WEB-STUDIO)** — alternativa basata su browser a URTC-TESTER tramite la Web Serial API, senza installazione locale.
- **[URTC-GATEWAY](https://github.com/JuanenRac/URTC-GATEWAY)** — gateway davanti al bus CAN di URTC: elenco di identificatori consentiti, limite di frequenza e chiave di sessione; software provato su computer, non ancora su un bus reale.

*Nodo IA Visione (Hailo-8)*
- **[HYDRA-UMC-VISION-NODE](https://github.com/JuanenRac/HYDRA-UMC-VISION-NODE)** — hub di integrazione per la pipeline di visione Hailo-8, con un vero controllo di prontezza hardware per fase.
- **[HYDRA-UMC-DETECTION-HEF](https://github.com/JuanenRac/HYDRA-UMC-DETECTION-HEF)** — registro reale di modelli compilati con verifica di caricamento sicuro per architettura Hailo/checksum.
- **[HYDRA-UMC-VISION-STREAMER](https://github.com/JuanenRac/HYDRA-UMC-VISION-STREAMER)** — generatore reale di pipeline GStreamer + config MediaMTX, con una vera barriera di integrazione HailoRT.
- **[HYDRA-UMC-VISUAL-SERVOING-API](https://github.com/JuanenRac/HYDRA-UMC-VISUAL-SERVOING-API)** — legge di correzione Position-Based Visual Servoing con autorizzazione condizionata allo stato di zona; ancora nessuna stima di posa da telecamera.
- **[HYDRA-UMC-SAFETY-ZONES](https://github.com/JuanenRac/HYDRA-UMC-SAFETY-ZONES)** — logica v0 di violazione zona, freschezza di calibrazione e richiesta E-STOP che legge le posizioni degli oggetti da un file; nessun rilevatore la alimenta e nessun E-STOP fisico è ancora collegato.

*Nodo IA Cognitivo (Hailo-10)*
- **[HYDRA-UMC-COGNITIVE-NODE](https://github.com/JuanenRac/HYDRA-UMC-COGNITIVE-NODE)** — hub di integrazione per la pipeline cognitiva Hailo-10 (orchestrazione LLM/VLA/voce).
- **[HYDRA-UMC-VLA-ENGINE](https://github.com/JuanenRac/HYDRA-UMC-VLA-ENGINE)** — vera codifica/decodifica di token d'azione e generazione di traiettoria per un modello Vision-Language-Action.
- **[HYDRA-UMC-VOICE-UI](https://github.com/JuanenRac/HYDRA-UMC-VOICE-UI)** — vero front-end vocale (VAD + parser di intenti) con un relay verso Watch limitato e soggetto a conferma.
- **[HYDRA-UMC-SEMANTIC-PLANNER](https://github.com/JuanenRac/HYDRA-UMC-SEMANTIC-PLANNER)** — vera scomposizione dei task basata su regole e recupero semantico degli errori sui codici errore MCU.
- **[HYDRA-UMC-DOCS-QA](https://github.com/JuanenRac/HYDRA-UMC-DOCS-QA)** — vera ricerca documentale TF-IDF (solo libreria standard) sui documenti Markdown di questo ecosistema.
- **[HYDRA-UMC-LOCAL-TECHNICIAN](https://github.com/JuanenRac/HYDRA-UMC-LOCAL-TECHNICIAN)** — tecnico di manutenzione IA locale e con cancelli di policy per l'ecosistema stesso - osserva, diagnostica e propone correzioni; i due livelli di rischio più alti non sono deliberatamente ancora implementati.

*Gemello Digitale e Simulazione*
- **[HYDRA-UMC-TWIN](https://github.com/JuanenRac/HYDRA-UMC-TWIN)** — hub di integrazione per il motore di gemello digitale, con un vero contratto di sincronizzazione per compatibilità di versione.
- **[HYDRA-UMC-HIL-BRIDGE](https://github.com/JuanenRac/HYDRA-UMC-HIL-BRIDGE)** — router hardware-in-the-loop con un interblocco software di collisione tra simulazione e hardware reale (testato senza hardware reale).
- **[HYDRA-UMC-PHYSICS-REPLICA](https://github.com/JuanenRac/HYDRA-UMC-PHYSICS-REPLICA)** — vera cinematica diretta e validazione dei limiti articolari su un vero sottoinsieme URDF.
- **[HYDRA-UMC-SYNTHETIC-DATA-GEN](https://github.com/JuanenRac/HYDRA-UMC-SYNTHETIC-DATA-GEN)** — vero generatore procedurale di scene 2D con esportazione di annotazioni YOLO/COCO.

*Dati e Analisi*
- **[HYDRA-UMC-DATALAKE](https://github.com/JuanenRac/HYDRA-UMC-DATALAKE)** — vero archivio di serie temporali basato su sqlite3, con una vera API HTTP di ingestione/query.
- **[HYDRA-UMC-ANOMALY-DETECTOR](https://github.com/JuanenRac/HYDRA-UMC-ANOMALY-DETECTOR)** — vero rilevatore di anomalie FFT + baseline statistica, con monitoraggio della deriva.
- **[HYDRA-UMC-PRODUCTION-REPORTS](https://github.com/JuanenRac/HYDRA-UMC-PRODUCTION-REPORTS)** — vero calcolo OEE/disponibilità sullo storico di DATALAKE, con esportazione CSV riproducibile.
- **[HYDRA-UMC-TELEMETRY-COLLECTOR](https://github.com/JuanenRac/HYDRA-UMC-TELEMETRY-COLLECTOR)** — vera pipeline di ingestione CAN/WebSocket verso DATALAKE, con deduplicazione per sequenza.

*Gateway Industriale*
- **[HYDRA-UMC-GATEWAY-INDUSTRIAL](https://github.com/JuanenRac/HYDRA-UMC-GATEWAY-INDUSTRIAL)** — hub di integrazione che inoltra ai protocolli industriali, con un vero livello di allowlist dei comandi/backpressure.
- **[HYDRA-UMC-OPCUA-SERVER](https://github.com/JuanenRac/HYDRA-UMC-OPCUA-SERVER)** — vero spazio di indirizzi OPC-UA, verificato con una vera sessione client del protocollo binario.
- **[HYDRA-UMC-MQTT-BROKER](https://github.com/JuanenRac/HYDRA-UMC-MQTT-BROKER)** — vero broker MQTT con autenticazione opzionale per client e ACL sui topic.
- **[HYDRA-UMC-MTCONNECT-ADAPTER](https://github.com/JuanenRac/HYDRA-UMC-MTCONNECT-ADAPTER)** — veri endpoint XML `/probe` e `/current` di MTConnect, con output in modalità degradata.

*Strumenti Complementari e Operazioni dell'Ecosistema*
- **[HYDRA-UMC-DASHBOARD-AI](https://github.com/JuanenRac/HYDRA-UMC-DASHBOARD-AI)** — pannelli Smart Summaries e Anomaly Highlighting su DATALAKE/ANOMALY-DETECTOR, con un fallback statistico onesto.
- **[HYDRA-UMC-TOOL-CLI](https://github.com/JuanenRac/HYDRA-UMC-TOOL-CLI)** — CLI di flotta con un vero e stabile contratto di exit-code, un client live reale della stessa API di HYDRA-UMC-SERVER.
- **[HYDRA-UMC-WATCH](https://github.com/JuanenRac/HYDRA-UMC-WATCH)** — app companion WearOS con schemi di avviso aptico e un relay vocale verso il telefono abbinato (non ancora eseguita su un orologio fisico).
- **[URTC-SMART-RACK](https://github.com/JuanenRac/URTC-SMART-RACK)** — firmware per un rack di montaggio schede con decodifica reale dell'ID utensile e logica di preriscaldamento Smart Idle.
- **[URTC-VISION-TOOL](https://github.com/JuanenRac/URTC-VISION-TOOL)** — firmware più un vero companion di visione Python per una testa utensile di ispezione termica/RGB.
- **[HYDRA-UMC-UPDATER](https://github.com/JuanenRac/HYDRA-UMC-UPDATER)** — strumento amministrativo desktop che scopre, clona e aggiorna ogni repository di questo ecosistema.
- **[HYDRA-UMC-OS-REBUILDER](https://github.com/JuanenRac/HYDRA-UMC-OS-REBUILDER)** — strumento desktop Windows/Linux che costruisce un'immagine della CM5 pronta da scrivere, precaricata con le versioni più aggiornate dell'ecosistema, con configurazione di primo avvio Wi-Fi/utente/SSH in stile Raspberry Pi Imager.
- **[HYDRA-UMC-OPS-AGENT](https://github.com/JuanenRac/HYDRA-UMC-OPS-AGENT)** — coordinatore di incidenti di manutenzione: un ruolo edge a basso privilegio raccoglie uno snapshot di inventario/salute sanificato, un ruolo control-plane lo rende in sola lettura e chiede a un provider di IA di suggerire una diagnosi - non applica mai una patch né distribuisce nulla.
- **[HYDRA-UMC-DEV-SERVER](https://github.com/JuanenRac/HYDRA-UMC-DEV-SERVER)** — host di sviluppo riproducibile (Raspberry Pi 5 / CM5) che conserva il codice sorgente dell'ecosistema ed esegue attività delimitate di build/test tramite una coda durevole; un ruolo di sviluppo dedicato, esplicitamente distinto da un CM5 operativo.

## 📚 Documentazione

Dove leggere di più:

* [Base di sicurezza dell'ecosistema](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md)
* [Modello delle minacce dell'ecosistema](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md)
* [Registro delle modifiche di questo repository](CHANGELOG.md)
* [Licenza di questo repository](LICENSE.md)

## 🤝 Contribuire e comunità

* Prima di una pull request esegui `HYDRA_UMC_CI=1 py -3 tools/ci_validate.py` (oppure `HYDRA_UMC_CI=1 python3 tools/ci_validate.py`): deve stampare `CI_VALIDATION=PASS`. Non eseguire `build.sh` né `build.bat` per questa verifica; compilare non è verificare.
* I otto README sono scritti da un'unica fonte in HYDRA-UMC-DOCS; non modificarli a mano. Cambia la fonte e riscrivili con `tools/make_readmes.py`.
* Non affermare in un README ciò che non è stato eseguito: scrivi «simulato» o «non provato su hardware» quando è la verità.
* Vedi [CONTRIBUTING.md](CONTRIBUTING.md), il [codice di condotta](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md) e [SUPPORT.md](SUPPORT.md).

## 👤 AUTORE

**JuanenRac (Electro Hobby 3D)** · electrohobby3d@gmail.com

## 📜 LICENZA

GPL-3.0-or-later - [LICENSE](LICENSE).
