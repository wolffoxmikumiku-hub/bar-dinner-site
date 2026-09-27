# 基板惑星（Bar & Diner）

> 星の正体（壊れたレトロラジオ）はサイト上では明かさない。ノイズ・アンテナ・音量つまみで匂わせるだけ。

Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion + Three.js

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## 確認用パラメータ

アンテナが受信する天候は日付・時刻・回線・訪問回数から決まります。確認時は URL で強制できます。

| URL | 見えるもの |
| --- | --- |
| `/?weather=rain` | 丸窓の中、店内の窓の外にだけ雨。B1にトレンチコートの鳩、The Node の雨の日限定イベントが「開催中」 |
| `/?weather=storm` | 雷フラッシュ（窓の外も光る）、電気三兄弟（ボルト・パルス・スパーク）が起動 |
| `/?weather=static` | 砂嵐。ノイズ強め |
| 20:00〜5:00 にアクセス（`/?time=night`） | Bar: The Node 営業、1F Diner は CLOSED の札、丸窓が最初から B1 |
| 5:00〜20:00 にアクセス（`/?time=day`） | Diner 営業、B1 Bar は CLOSED の札 |

パラメータは組み合わせ可（例: `/?time=night&weather=rain`）。

## 構成

```
src/
  app/                    layout / page / globals.css（Tailwind v4 + 独自CSS）
  data/world.ts           エリア・店舗・キャラ・配線3色（ブリーフ + Excel）
  lib/
    radioEngine.ts        Web Audio のBGMエンジン（街の音 / 店ごとの合成BGMをクロスフェード、閉店中はこもった音）
    reception.ts          アンテナ受信ロジック（時刻・日付・回線・訪問回数 → 天候/訪問客）
    daily.ts              日替わり（シナブン堂のパン・ジャンク棚）
  components/
    RadioProvider.tsx     音（ON/OFF・音量・今いる店）・受信・グリッチの共有状態
    hero/
      pcbShader.ts        基板シェーダー（銅箔の流光・ビアの静電気・ハンダ鏡面・ノイズ・雨・雷・グリッチ）
      PcbCanvas.tsx       Three.js フルスクリーン描画、画面外で停止、WebGL不可時はCSSフォールバック
      TunerDial.tsx       画面上部のサウンドコントロール（SOUND ON/OFF + 音量つまみ/目盛りドラッグ/矢印キー）
      Hero.tsx            ヒーロー + 「銀色の鏡面広場」 + 受信ログ
    porthole/PortholeViewer.tsx  SIGNAL RECEIVER：ヘッダー（CREDIT/ITEMS/TIME）＋タブ（RECEIVER / PROJECT LOGS / BACK ALLEY）。MAIN は左ログ・中央CRT丸窓・右地図、Diner/Bar 特設ページ（注文でクレジット）、裏路地スロット
    map/
      BoardArt.tsx        全体基板マップのSVG（部品＝エリア）
      MapBoard.tsx        地図のピン（ホバー発光＋店名）、条件付き訪問客
      ShopModal.tsx       店舗モーダル（シナブン堂=焼きたてパン＋ジャンク、The Node=雨の日イベント 等）
    characters/           住人一覧、27A 12V 弾帯SVG
    layout/               ローダー（スペースハム）、トップバー、世界観/シグネチャー/フッター
public/scenes/            丸窓・世界観セクションの参考イラスト（差し替え前提）
```

## 差し替えポイント

- **BGM**: 店のモーダル（店に入る）やお土産ショップを開くと、その店のBGMに切り替わる。`src/lib/radioEngine.ts` の `TRACKS` の該当店に `url: "/audio/xxx.mp3"` を足すと、合成音の代わりに音声ファイルをループ再生（`public/audio/` に置く）。
- **店内で動く住人**: `public/scenes/sprites/`（シーン画像から切り出したスプライト）と `diner-1f-open.webp`（バイソンとウェイトレスを抜いた背景）。配置と動きは `PortholeViewer.tsx` の `FLOORS[*].actors`、動きの中身は `globals.css` の `.act-*` / `.trip-*`。シーン画像を差し替えたら作り直しが必要。
- **窓の外の雨**: `PortholeViewer.tsx` の `FLOORS[*].panes`（シーン画像 1408x768 上の窓ガラスの形）。画像を差し替えたら座標も合わせる。
- **静的HTML版**: `npm run build:html` で `../html版/index.html`（ダブルクリックで開ける）を書き出す。
- **シーン画像**: `public/scenes/*.webp`。丸窓は画像中心 (712, 380) 付近の半径 380px を切り抜く前提（`.porthole-scene` の left/top/width で調整）。
- **キャラ絵**: `public/characters/` に置いて `world.ts` の `image`（顔アイコン）/ 店の `gallery`（店に入ると表示）にパスを書く。未設定のキャラは絵文字のまま。現在: スペースハム・液体子猫（moomoomeaw）・ハスキー（7%）。ドット絵は 64x64 グリッドを 1024px に等倍拡大した PNG（スペースハムと同じ規格）
- **Excelの「裏設定（明かさない）」列**はデータに取り込んでいません。
