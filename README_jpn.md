<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - Shared code of the HYDRA-UMC web clients
Copyright (C) JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

<p align="center">
  <img src="images/HYDRA_UMC_BANNER.svg" alt="HYDRA-UMC-STUDIO-KIT banner" width="100%">
</p>

# 🧰 HYDRA-UMC-STUDIO-KIT

<p align="center"><a href="README.md">🇺🇸 English</a> | <a href="README_spa.md">🇪🇸 Español</a> | <a href="README_fra.md">🇫🇷 Français</a> | <a href="README_ita.md">🇮🇹 Italiano</a> | <a href="README_deu.md">🇩🇪 Deutsch</a> | <a href="README_zho.md">🇨🇳 简体中文</a> | 🇯🇵 <b>日本語</b> | <a href="README_por.md">🇵🇹 Português</a></p>

### 🧰 HYDRA-UMC の Web クライアントが繰り返すコードを一度だけ書く：セッション、HTTP、履歴、設定、ツアー

<p align="center">
  <img src="https://img.shields.io/badge/License-GPL%203.0--or--later-blue.svg" alt="GPL 3.0 or later">
  <img src="https://img.shields.io/badge/Stack-TypeScript-3178C6.svg" alt="Stack">
  <img src="https://img.shields.io/badge/Feature-No%20Runtime%20Dependencies-blueviolet.svg" alt="Feature">
  <img src="https://img.shields.io/badge/Tests-87%20passing-2ea44f.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Version-0.0.4-0f6cbd.svg" alt="Version">
  <img src="https://img.shields.io/badge/Maturity-scaffolding-FFB020.svg" alt="Maturity">
</p>

---

**正直さの確認 - 現時点で実際に動くもの：** セッション、HTTP クライアント、アドレスの解決、接続履歴のパーサー、ローカル設定、最近の選択のリスト、ツアー、文言は実際に動作し、テスト済みです（87 件が成功）。ただしテストはすべて `fetch` とストレージの代役を相手にしたもので、実際のブラウザー内や実際の HYDRA-UMC-SERVER に対して動かしたことはまだありません。HYDRA-UMC-STUDIO はまだこのキットを使っていないため、現時点でこれを使っているクライアントの画面はありません。ガイドツアーは新しいコードで、置き換える既存のツアーを持つクライアントはありません。これまでに提供した内容は `CHANGELOG.md` を参照してください。

---

> **安全性とセキュリティの現状:** このエコシステムは認証された安全システムではありません。ハードウェアの E-STOP 経路、ファームウェアが強制する制限やインターロック、検証済みの動作コマンドはまだありません。ファームウェアイメージは CRC-32 と Ed25519 署名で検査し、リリースビルドは公開済みの開発用鍵を拒否します(リレーの先のツールヘッドと拡張ボードは引き続き URTC のブートローダーを使い、署名ではなく共有鍵の HMAC-SHA256 を使います)。TLS と相互 TLS は任意で、既定では無効です。独自基板はまだ実装も試験もされていません。ここに書かれた内容を人の安全のために頼る前に、[セキュリティベースライン](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md)と[脅威モデル](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md)をお読みください。

---

## 📋 ひと目で

| | |
|---|---|
| バージョン | `0.0.4` |
| 成熟度 | 足場段階 |
| テスト | 87 (`npm test`) |
| 技術 | TypeScript / Vitest |
| 対象 | 利用者の PC 上の Web ブラウザー |
| 実機での確認 | 対象外：ここにあるものはハードウェア上では動きません |

**移動：** [概要](#-概要) · [アーキテクチャ](#-アーキテクチャ) · [クイックスタート](#-クイックスタート) · [テスト](#-テスト) · [リポジトリの構成](#-リポジトリの構成) · [関連プロジェクト](#-関連プロジェクト)

## 🚦 プロジェクトの状況

各行はこのリポジトリの一部分で、信号は今日どこまで進んでいるかを示します。計画ではなく、リポジトリが示せるもの（テスト、ビルド、実行）に基づいて書かれています。

🟢 完了・検証済み · 🟡 動作する（既知の制限あり） · 🟠 一部のみ、または未検証 · 🔴 未実装または動作しない

| 領域 | 状態 | ここでの意味 |
|---|---|---|
| ソフトウェア | 🟠 | 構造と最初の部品のみで、作業の大部分はこれからです |
| テスト | 🟡 | 自動テスト 87 件。変更のたびに実行されます |
| 実機 | 🟡 | 対象外：ここにあるものはハードウェア上では動きません |
| インターフェースとプロトコル | 🟡 | 提供するルートやメッセージは文書化され、クライアントで試験済みです。すべてのクライアントがまだ使ったわけではありません |
| 連携 | 🟠 | 単独では動作しますが、エコシステムの他の部分との連携はまだ試していません |
| セキュリティ | 🟡 | アクセス制御、入力の制限、署名のいずれかは実装されコンピューター上で試験済みですが、プロジェクト外の誰もレビューしていません |
| 言語とアクセシビリティ | 🟡 | インターフェースとヘルプは 8 言語ですが、キーボード操作とスクリーンリーダーでの利用は試していません |
| ドキュメント | 🟡 | 8 言語の README。変更のたびにマニフェストと照合されます |

## 🎯 概要

**HYDRA-UMC-STUDIO-KIT** は、フレームワークにも実行時の依存にも頼らない小さな TypeScript パッケージです。HYDRA-UMC のどの Web クライアントにも必要で、放っておくとクライアントごとにコピーされてしまうコードをまとめています。サインイントークンの保管場所、サーバーへの呼び出し方、サーバーの接続履歴の読み方、利用者のローカルな選択の記憶、ガイドツアーが表示済みの内容を覚える仕組みです。

### 主な機能：
* 🔑 **セッション：** アクセストークンと更新トークンは既定ではセッションストレージに保存され、利用者が「サインインしたままにする」を選んだときだけローカルストレージに保存されます。アドレスで受け取ったトークンはフラグメントから読み取り、そのビューの間だけ保持してアドレスから取り除きます。`?token=` 形式はスイッチで、既定ではオフです。
* 🌐 **HTTP クライアント：** 試行ごとのタイムアウト、繰り返しても安全な呼び出しに対する待ち時間を増やしながらの回数制限付き再試行（POST は自動では繰り返しません）、`Retry-After`、401 でのトークン更新を 1 回、そして型付きの `HttpError`（ネットワーク、タイムアウト、中止、http、解析）。そのメッセージにトークンが含まれることはありません。トークンは設定されたオリジンにだけ送られます。
* 🕘 **履歴：** サーバーのクライアント一覧とサインイン履歴のパーサー（古いサーバーは失敗せず「未対応」を返します）と、利用者が最近選んだものの上限付きリスト。
* ⚙️ **設定：** フィールドごとの検証付きのローカルな選択。ストレージの内容は有効な値か既定値になり、ストレージが失敗しても画面は壊れません。
* 🧭 **ツアー：** ガイドツアーの状態と、表示済みのツアー。アプリケーションが求めない限りツアーは自動で始まらず、バージョンが上がると再び提示されます。
* 🌍 **8 言語：** エラー、ツアーのボタン、サインインイベントの名称を en、es、de、fr、it、ja、zh、pt（ポルトガルのポルトガル語）で提供します。

このキットは何も描画しません。React クライアントは `useSyncExternalStore(store.subscribe, store.get)` で各ストアを結び付けます。HYDRA-UMC-STUDIO はこれを使うことを想定した最初のクライアントですが、まだ使っていません。`docs/MIGRATION.md` に、何を置き換えるか、各手順をどう確認するかを載せています。

## 🧩 HYDRA-UMC での役割

**HYDRA-UMC-STUDIO-KIT** は、ファミリーの Web クライアントが放っておけば互いにコピーし合うコードです。サインインセッション、HTTP クライアント、接続履歴、ローカル設定、ガイドツアーを、フレームワークにも実行時の依存にも頼らない TypeScript パッケージにまとめています。HYDRA-UMC-STUDIO がこれを使うことを想定した最初のクライアントですが、まだ使っていません。

## 🏛️ アーキテクチャ

<p align="center">
  <img src="images/architecture.svg" alt="HYDRA-UMC-STUDIO-KIT architecture" width="100%">
</p>

### アーキテクチャと設計判断

* **コピーではなくパッケージにした理由。** セッション、サーバーのアドレス、接続履歴、ローカル設定は HYDRA-UMC-STUDIO で書かれたもので、他のどの Web クライアントも同じものを必要とします。1 つのコピーで行った修正が、他のコピーに反映されることはありませんでした。
* **フレームワークを使わない理由。** どのストアも `useSyncExternalStore` が求める形（`get` と `subscribe`）を持つので、React は 1 行で結び付けられ、他のフレームワークでもそのまま使えます。React を import するとリントがビルドを失敗させます。
* **POST を自動で繰り返さない理由。** 一時的な理由で失敗した呼び出しは、サーバーに届いていたかもしれません。アプリケーションが冪等だと宣言した呼び出しだけを繰り返します。待ち時間は上限まで倍々に増え、乱数は使わないので、テストで確認できます。
* **トークンを設定されたオリジンにだけ送る理由。** 利用者が入力したアドレスを呼ぶページが、サインイントークンをそこへ渡してはいけません。別のオリジンへ送るにはスイッチが必要で、既定ではオフです。エラーメッセージにトークンやクエリ文字列が含まれることはありません。
* **起動アドレスの `?token=` 形式をスイッチにした理由。** クエリ文字列はサーバーのログに残りますが、フラグメント（`#token=`）はブラウザーの外へ出ません。古い形式は、アプリケーションが求めたときだけ読み取ります。
* **失敗するストレージをエラーにしない理由。** プライベートウィンドウやブロックされたサイトデータでは、読み書きのたびに例外が起きます。キットは既定値に戻り、その訪問の間だけ選択を保持します。

全体像は、API リファレンスの [`docs/API.md`](docs/API.md) と、Web クライアントがキットを取り込む手順の [`docs/MIGRATION.md`](docs/MIGRATION.md) を参照してください。

## 🚀 クイックスタート

Node.js 22 以上と npm が必要です。

```bash
npm ci         # installs the development dependencies (the package itself has none at run time)
npm run build  # compiles src/ to dist/ (./build.sh runs the tests first; build.bat on Windows)
npm run typecheck && npm run lint && npm test
```

Web クライアントから `import { createSession, createHttpClient } from 'hydra-umc-studio-kit'` で使います。リファレンスは `docs/API.md`、クライアントが取り込む手順は `docs/MIGRATION.md` にあります。

## 🧪 テスト

`npm test` で自動テスト 87 件を実行します。 `fetch` とストレージの代役を使うため、ブラウザーもネットワークも不要です。

CI は `HYDRA_UMC_CI=1 python tools/ci_validate.py` を実行し、マニフェスト、文書、8 つの README、図を検査します。

## 🏗️ ビルドとリリース

パッケージは TypeScript コンパイラーで `dist/` にコンパイルされます。バンドラーはなく、実行するものもありません。

```bash
# Windows
build.bat

# Linux / macOS
./build.sh

npm run typecheck && npm run lint && npm test
```

`build.sh` / `build.bat` は依存関係をインストールし、テストを実行してコンパイルします。バージョンは変更しません（上げるのは `python tools/hydra_project_tool.py bump` だけです）。CI が実行する検査は `npm run typecheck`、`npm run lint`、`npm test` の 3 つです。Web クライアントはブランチではなく、リリースタグからパッケージをインストールします（`docs/MIGRATION.md` を参照）。

## 📂 リポジトリの構成

<p align="center">
  <img src="images/repository-structure.svg" alt="Repository structure of HYDRA-UMC-STUDIO-KIT" width="100%">
</p>

<details>
<summary>ツリーのテキスト版</summary>

```text
HYDRA-UMC-STUDIO-KIT/
├── src/
│   ├── storage.ts                        安全なストレージ補助、メモリ上のストレージ
│   ├── store.ts                          どのフレームワークでも使える小さな監視可能な値
│   ├── session.ts                        サインイントークン、起動アドレス、Authorization ヘッダー
│   ├── apiBase.ts                        開発時と本番でのサーバーのアドレス
│   ├── http.ts                           HTTP クライアント：タイムアウト、回数制限付き再試行、型付きエラー
│   ├── history.ts                        接続履歴のパーサーと最近の選択
│   ├── prefs.ts                          フィールドごとの検証付きローカル設定
│   ├── tours.ts                          ガイドツアーと表示済みのツアー
│   ├── messages.ts                       キットの文言（8 言語）
│   └── index.ts                          公開 API
├── tests/                                fetch とストレージの代役を使ったテスト：セッション、HTTP、アドレス、履歴、設定、ツアー、文言
├── docs/                                 API リファレンスと Web クライアント向けの移行ガイド
├── tools/                                プロジェクトのツールと CI チェック
├── images/                               バナーと図
├── .github/                              CI ワークフローと Issue テンプレート
├── package.json                          パッケージのメタデータとスクリプト
├── tsconfig.json / tsconfig.build.json   TypeScript の設定（検査とビルド）
├── bump_manifest_version.py              hydra-umc.project.json のバージョンを同期
├── build.sh / build.bat                  インストール、テスト、dist/ のビルド
├── CHANGELOG.md                          各バージョンの変更点
├── build-test.sh                         変更を伴わないビルド検査
├── hydra-umc.project.json                マニフェスト：バージョン、成熟度、ファミリー
└── test.sh                               テストを実行
```

</details>

## 🗺️ ロードマップと既知の制限

**現時点の既知の制限**

* **フェーズ 1:** HYDRA-UMC-STUDIO がキットを 1 ファイルずつ取り込みます（`docs/MIGRATION.md` を参照）。
* **フェーズ 2:** ARMOR ファミリーと URTC ファミリーの Web スタジオが、それぞれ独自のストレージキーと文言で採用します。
* **フェーズ 3:** `get` / `subscribe` の契約だけを使う、React フック用の独立した任意のバインディング。
* **フェーズ 4:** HTTP クライアントとセッションを、実際のブラウザーで実際のサーバーに対して動かす。

## 🌍 言語

この README とリポジトリの文書は、英語・スペイン語・ドイツ語・フランス語・イタリア語・日本語・中国語・ポルトガル語（ポルトガル）の 8 言語で提供されています。8 つのファイルは同時に書かれ、同じ節と同じリンクを持つことを CI が確認します。 このリポジトリには独自の画面もメッセージカタログもないため、翻訳すべきインターフェース文字列はありません。

## 🔗 関連プロジェクト

本プロジェクトは、同じ作者(JuanenRac / Electro Hobby 3D)による HYDRA-UMC ロボティクスエコシステムの一部です。リクエストが実はこの中のどれかについてのものである可能性があるため、知っておく価値があります。

**直接関連**
- **[HYDRA-UMC-STUDIO](https://github.com/JuanenRac/HYDRA-UMC-STUDIO)** — 複数ロボットのリアルタイム 3D 可視化を備えた Web 制御ダッシュボード ——このキットを使うことを想定した最初のクライアント（まだ使っていません）。
- **[HYDRA-UMC-SERVER](https://github.com/JuanenRac/HYDRA-UMC-SERVER)** — HTTP クライアントと接続履歴の読み取りが対象としている、画面を持たないバックエンド（REST/WebSocket）。

**エコシステムの他のプロジェクト**

*コアハードウェア&プラットフォーム*
- **[HYDRA-UMC](https://github.com/JuanenRac/HYDRA-UMC)** — ロボットアームのマザーボードの設計——CM5 ホスト + デュアルコア STM32H745、CAN-OTA/SPI-OTA 経由で最大 8 本のツールアームを統括することを目指す(ファームウェアは初期段階で、実装済みの基板はまだない)。
- **[HYDRA-UMC-OS](https://github.com/JuanenRac/HYDRA-UMC-OS)** — CM5 向けの再現可能な Raspberry Pi OS プロダクト層——読み取り専用エージェント、検証済み設定/プロファイル、WiFi 初回接続プロビジョニング。
- **[HYDRA-UMC-SDK](https://github.com/JuanenRac/HYDRA-UMC-SDK)** — すべてのブリッジが自身のコマンドを検証する共有 JSON-Schema 契約とソフトウェアのジョブゲート境界(認証済みの安全機能ではない)。
- **[HYDRA-UMC-CONNECTOR-HUB](https://github.com/JuanenRac/HYDRA-UMC-CONNECTOR-HUB)** — 外部マシン用コネクタのための宣言的アダプターマニフェストのレジストリとバリデーター。SDK 自身の契約という発想を外部マシンにまで拡張し、産業用ゲートウェイ系のプロジェクトを置き換えることはありません。

*コアバックエンド&クライアント*
- **[HYDRA-UMC-SUITE](https://github.com/JuanenRac/HYDRA-UMC-SUITE)** — 複数のサーバーを同時に扱えるデスクトップ(PySide6)スウォームコマンドセンター、スタンドアロン実行ファイルとしてパッケージ化。
- **[HYDRA-UMC-ANDROID-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-ANDROID-CONTROL)** — 生体認証ログインとペアリングされた Wear OS コンパニオンを備えたネイティブ Android 制御アプリ。
- **[HYDRA-UMC-IOS-CONTROL](https://github.com/JuanenRac/HYDRA-UMC-IOS-CONTROL)** — リアルタイム WebSocket 同期を備えた iOS/iPadOS 制御アプリ(Flutter)。
- **[HYDRA-UMC-DSI](https://github.com/JuanenRac/HYDRA-UMC-DSI)** — 本体搭載の 7 インチ DSI タッチスクリーン向けネイティブタッチ UI、CM5 自体に組み込み。
- **[HYDRA-UMC-EDITOR-URDF](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-URDF)** — 完成したモデルを STUDIO 自身のカタログへ送信するデスクトップ用グラフィカル URDF 作成/編集ツール。
- **[HYDRA-UMC-EDITOR-STL](https://github.com/JuanenRac/HYDRA-UMC-EDITOR-STL)** — HYDRA-UMC-EDITOR-URDF も編集する同じモデルカタログ内で、実在するパーツを変換/置換/削除/追加するデスクトップ STL モデルエディタ。
- **[HYDRA-UMC-BRIDGE-AMR](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-AMR)** — VDA 5050 MQTT パブリッシャーによる AGV/AMR フリートの調整境界(エミュレートしたフリートに対してのみテスト済み)。
- **[HYDRA-UMC-BRIDGE-CNC](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-CNC)** — GRBL ステータス/制御バイトへのアクセスを持つ、CNC セルの高レベルコーディネーター(エミュレーターに対してのみテスト済み)。
- **[HYDRA-UMC-BRIDGE-DROIDS](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-DROIDS)** — Boston Dynamics Spot コマンド送信機能を持つ、脚型/ヒューマノイドドロイドの調整境界(エミュレーターに対してのみテスト済み)。
- **[HYDRA-UMC-BRIDGE-LASER](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-LASER)** — キー/筐体/インターロックの GPIO 信号 3 系統を読み取るレーザーセルのコーディネーター(模擬チップに対してのみテスト済み。レーザーの武装や発射はできない)。
- **[HYDRA-UMC-BRIDGE-OPENPNP](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-OPENPNP)** — OpenPnP ピックアンドプレースの基板フローを安全に統括する高レベルコーディネーター。
- **[HYDRA-UMC-BRIDGE-PRINTER3D](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-PRINTER3D)** — 実際にゲート制御されたジョブコマンドを持つ、Moonraker/Klipper 3D プリンター向けの安全な調整境界。
- **[HYDRA-UMC-BRIDGE-ROS2](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-ROS2)** — 遅延インポートの rclpy ROS 2 トランスポートを持つコーディネーター(ROS 2 環境ではまだ実行していない)。
- **[HYDRA-UMC-BRIDGE-UAV](https://github.com/JuanenRac/HYDRA-UMC-BRIDGE-UAV)** — MAVLink コマンド送信機能を持つ、カメラ搭載 UAV の調整境界(エミュレーターに対してのみテスト済み)。

*URTC ツールプラットフォーム*
- **[URTC](https://github.com/JuanenRac/URTC)** — 物理的な Universal Robot Tool Controller 基板向けファームウェア、CAN バス経由の 25 以上のツールプロファイル。
- **[URTC-FLASHER](https://github.com/JuanenRac/URTC-FLASHER)** — URTC 基板用のデスクトップ GUI 書き込みツール、CAN-OTA およびフルチップ SWD/JTAG。
- **[URTC-TESTER](https://github.com/JuanenRac/URTC-TESTER)** — URTC 基板向けのデスクトップ CAN バスライブ診断ツール、ツールプロファイルごとに 1 パネル。
- **[URTC-WEB-STUDIO](https://github.com/JuanenRac/URTC-WEB-STUDIO)** — Web Serial API を使ったブラウザベースの URTC-TESTER の代替、ローカルインストール不要。
- **[URTC-GATEWAY](https://github.com/JuanenRac/URTC-GATEWAY)** — URTC の CAN バスの前に置くゲートウェイ：許可する識別子のリスト、レート制限、セッション鍵。コンピューター上でテスト済みで、実際のバスではまだ試していません。

*ビジョン AI ノード(Hailo-8)*
- **[HYDRA-UMC-VISION-NODE](https://github.com/JuanenRac/HYDRA-UMC-VISION-NODE)** — Hailo-8 ビジョンパイプラインの統合ハブ、段階ごとの実際のハードウェア準備状況チェック付き。
- **[HYDRA-UMC-DETECTION-HEF](https://github.com/JuanenRac/HYDRA-UMC-DETECTION-HEF)** — Hailo アーキテクチャ/チェックサムによる安全読み込み検証を備えた、実際のコンパイル済みモデルレジストリ。
- **[HYDRA-UMC-VISION-STREAMER](https://github.com/JuanenRac/HYDRA-UMC-VISION-STREAMER)** — 実際の HailoRT 統合境界を持つ、実際の GStreamer パイプライン + MediaMTX 設定生成器。
- **[HYDRA-UMC-VISUAL-SERVOING-API](https://github.com/JuanenRac/HYDRA-UMC-VISUAL-SERVOING-API)** — ゾーン状態を条件に承認する Position-Based Visual Servoing 補正則。カメラによる姿勢推定はまだない。
- **[HYDRA-UMC-SAFETY-ZONES](https://github.com/JuanenRac/HYDRA-UMC-SAFETY-ZONES)** — ファイルから物体位置を受け取る、ゾーン侵入・キャリブレーション鮮度・E-STOP 要求の v0 ロジック。検出器は接続されておらず、物理 E-STOP もまだ配線されていない。

*コグニティブ AI ノード(Hailo-10)*
- **[HYDRA-UMC-COGNITIVE-NODE](https://github.com/JuanenRac/HYDRA-UMC-COGNITIVE-NODE)** — Hailo-10 コグニティブパイプライン(LLM/VLA/音声オーケストレーション)の統合ハブ。
- **[HYDRA-UMC-VLA-ENGINE](https://github.com/JuanenRac/HYDRA-UMC-VLA-ENGINE)** — Vision-Language-Action モデル向けの、実際のアクショントークンのエンコード/デコードと軌道生成。
- **[HYDRA-UMC-VOICE-UI](https://github.com/JuanenRac/HYDRA-UMC-VOICE-UI)** — 確認ゲート付きの限定的な Watch リレーを備えた、実際の音声フロントエンド(VAD + 意図解析)。
- **[HYDRA-UMC-SEMANTIC-PLANNER](https://github.com/JuanenRac/HYDRA-UMC-SEMANTIC-PLANNER)** — MCU エラーコードに対する、実際のルールベースのタスク分解と意味的エラー復旧。
- **[HYDRA-UMC-DOCS-QA](https://github.com/JuanenRac/HYDRA-UMC-DOCS-QA)** — このエコシステム自身の Markdown ドキュメントに対する、標準ライブラリのみの実際の TF-IDF 文書検索。
- **[HYDRA-UMC-LOCAL-TECHNICIAN](https://github.com/JuanenRac/HYDRA-UMC-LOCAL-TECHNICIAN)** — エコシステム自身のための、ローカルでポリシーゲート付きのAIメンテナンス技術者 — 観察、診断し、修正を提案する;最上位の2つのリスクレベルは意図的にまだ実装されていない。

*デジタルツイン&シミュレーション*
- **[HYDRA-UMC-TWIN](https://github.com/JuanenRac/HYDRA-UMC-TWIN)** — 実際のバージョン互換性同期契約を持つ、デジタルツインエンジンの統合ハブ。
- **[HYDRA-UMC-HIL-BRIDGE](https://github.com/JuanenRac/HYDRA-UMC-HIL-BRIDGE)** — シミュレーションと実機の間にソフトウェアの衝突インターロックを備えたハードウェア・イン・ザ・ループのルーター(実機なしでテスト済み)。
- **[HYDRA-UMC-PHYSICS-REPLICA](https://github.com/JuanenRac/HYDRA-UMC-PHYSICS-REPLICA)** — 実際の URDF サブセットに対する、実際の順運動学と関節限界検証。
- **[HYDRA-UMC-SYNTHETIC-DATA-GEN](https://github.com/JuanenRac/HYDRA-UMC-SYNTHETIC-DATA-GEN)** — YOLO/COCO アノテーションのエクスポート機能を持つ、実際のプロシージャル 2D シーンジェネレーター。

*データ&分析*
- **[HYDRA-UMC-DATALAKE](https://github.com/JuanenRac/HYDRA-UMC-DATALAKE)** — 実際の取り込み/クエリ HTTP API を備えた、実際の sqlite3 ベースの時系列ストア。
- **[HYDRA-UMC-ANOMALY-DETECTOR](https://github.com/JuanenRac/HYDRA-UMC-ANOMALY-DETECTOR)** — ドリフト監視を備えた、実際の FFT + 統計ベースラインによる異常検知器。
- **[HYDRA-UMC-PRODUCTION-REPORTS](https://github.com/JuanenRac/HYDRA-UMC-PRODUCTION-REPORTS)** — DATALAKE の履歴に対する実際の OEE/稼働率計算、再現可能な CSV エクスポート付き。
- **[HYDRA-UMC-TELEMETRY-COLLECTOR](https://github.com/JuanenRac/HYDRA-UMC-TELEMETRY-COLLECTOR)** — シーケンス重複排除機能を備えた、DATALAKE への実際の CAN/WebSocket 取り込みパイプライン。

*産業用ゲートウェイ*
- **[HYDRA-UMC-GATEWAY-INDUSTRIAL](https://github.com/JuanenRac/HYDRA-UMC-GATEWAY-INDUSTRIAL)** — 実際のコマンド許可リスト/バックプレッシャー層を持つ、産業用プロトコルへ中継する統合ハブ。
- **[HYDRA-UMC-OPCUA-SERVER](https://github.com/JuanenRac/HYDRA-UMC-OPCUA-SERVER)** — 実際のバイナリプロトコルクライアントセッションで検証された、実際の OPC-UA アドレス空間。
- **[HYDRA-UMC-MQTT-BROKER](https://github.com/JuanenRac/HYDRA-UMC-MQTT-BROKER)** — クライアント単位のオプション認証とトピック ACL を備えた、実際の MQTT ブローカー。
- **[HYDRA-UMC-MTCONNECT-ADAPTER](https://github.com/JuanenRac/HYDRA-UMC-MTCONNECT-ADAPTER)** — 縮退モード出力を備えた、実際の MTConnect `/probe` および `/current` XML エンドポイント。

*補完ツール&エコシステム運用*
- **[HYDRA-UMC-DASHBOARD-AI](https://github.com/JuanenRac/HYDRA-UMC-DASHBOARD-AI)** — 誠実な統計フォールバックを備えた、DATALAKE/ANOMALY-DETECTOR 上のスマートサマリーと異常ハイライトパネル。
- **[HYDRA-UMC-TOOL-CLI](https://github.com/JuanenRac/HYDRA-UMC-TOOL-CLI)** — 実際の安定した終了コード契約を持つフリート CLI、HYDRA-UMC-SERVER 自身の API の本物のライブクライアント。
- **[HYDRA-UMC-WATCH](https://github.com/JuanenRac/HYDRA-UMC-WATCH)** — 触覚アラートのパターンとペアリング済みスマートフォンへの音声リレーを備えた WearOS コンパニオンアプリ(物理的なウォッチではまだ実行していない)。
- **[URTC-SMART-RACK](https://github.com/JuanenRac/URTC-SMART-RACK)** — 実際の工具 ID デコードと Smart Idle 予熱ロジックを備えた、基板搭載ラック用ファームウェア。
- **[URTC-VISION-TOOL](https://github.com/JuanenRac/URTC-VISION-TOOL)** — サーマル/RGB 検査ツールヘッド向けの、ファームウェアと実際の Python ビジョンコンパニオン。
- **[HYDRA-UMC-UPDATER](https://github.com/JuanenRac/HYDRA-UMC-UPDATER)** — このエコシステム内のすべてのリポジトリを検出・クローン・更新する、管理用デスクトップツール。
- **[HYDRA-UMC-OS-REBUILDER](https://github.com/JuanenRac/HYDRA-UMC-OS-REBUILDER)** — エコシステムの最新バージョンをプリロードした、書き込み可能なCM5イメージを構築するWindows/Linuxデスクトップツール。Raspberry Pi Imager方式の初回起動Wi-Fi/ユーザー/SSH設定を備える。
- **[HYDRA-UMC-OPS-AGENT](https://github.com/JuanenRac/HYDRA-UMC-OPS-AGENT)** — 保守インシデントコーディネーター: 低権限のエッジ役割がサニタイズされたインベントリ/ヘルスのスナップショットを収集し、コントロールプレーン役割がそれを読み取り専用でレンダリングして AI プロバイダーに診断の提案を依頼します - パッチを適用することも、何かをデプロイすることも決してありません。
- **[HYDRA-UMC-DEV-SERVER](https://github.com/JuanenRac/HYDRA-UMC-DEV-SERVER)** — 再現可能な開発ホスト（Raspberry Pi 5 / CM5）。エコシステムのソースコードを保管し、永続キューのもとで境界の明確なビルド/テストタスクを実行する。運用中の CM5 とは明確に異なる、開発専用の役割。

## 📚 ドキュメント

さらに読むには：

* [エコシステムのセキュリティ基準](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/SECURITY_BASELINE.md)
* [エコシステムの脅威モデル](https://github.com/JuanenRac/HYDRA-UMC-DOCS/blob/main/docs/THREAT_MODEL.md)
* [このリポジトリの変更履歴](CHANGELOG.md)
* [このリポジトリのライセンス](LICENSE.md)

## 🤝 コントリビュートとコミュニティ

* プルリクエストの前に `HYDRA_UMC_CI=1 py -3 tools/ci_validate.py`（または `HYDRA_UMC_CI=1 python3 tools/ci_validate.py`）を実行してください。`CI_VALIDATION=PASS` と表示される必要があります。この確認に `build.sh` や `build.bat` は使わないでください。ビルドは検査ではありません。
* 8 つの README は HYDRA-UMC-DOCS の 1 つのソースから書かれます。手で編集しないでください。ソースを変更し、`tools/make_readmes.py` で書き直します。
* 実行していないことを README に書かないでください。事実であれば「シミュレーションのみ」「実機では未確認」と書きます。
* [CONTRIBUTING.md](CONTRIBUTING.md)、[行動規範](CODE_OF_CONDUCT.md)、[SECURITY.md](SECURITY.md)、[SUPPORT.md](SUPPORT.md) を参照してください。

## 👤 作者

**JuanenRac (Electro Hobby 3D)** · electrohobby3d@gmail.com

## 📜 ライセンス

GPL-3.0-or-later - [LICENSE](LICENSE).
