# 基板惑星『壊れたレトロラジオ』

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
| `/?weather=rain` | 雨のシェーダー、B1にトレンチコートの鳩、The Node の雨の日限定イベントが「開催中」 |
| `/?weather=storm` | 雷フラッシュ、電気三兄弟（ボルト・パルス・スパーク）が起動 |
| `/?weather=static` | 砂嵐。ノイズ強め |
| 20:00〜5:00 にアクセス | Bar: The Node 点灯、丸窓が最初から B1 |

## 構成

```
src/
  app/                    layout / page / globals.css（Tailwind v4 + 独自CSS）
  data/world.ts           エリア・店舗・キャラ・配線3色（ブリーフ + Excel）
  lib/
    radioEngine.ts        Web Audio の選局エンジン（局ごとの合成BGM + 空電ノイズのクロスフェード）
    reception.ts          アンテナ受信ロジック（時刻・日付・回線・訪問回数 → 天候/訪問客）
    daily.ts              日替わり（シナブン堂のパン・ジャンク棚）
  components/
    RadioProvider.tsx     音・受信・グリッチ・イースターエッグの共有状態
    hero/
      pcbShader.ts        基板シェーダー（銅箔の流光・ビアの静電気・ハンダ鏡面・ノイズ・雨・雷・グリッチ）
      PcbCanvas.tsx       Three.js フルスクリーン描画、画面外で停止、WebGL不可時はCSSフォールバック
      TunerDial.tsx       画面上部の周波数ダイヤル（つまみ回転/目盛りドラッグ/矢印キー）
      Hero.tsx            ヒーロー + 「銀色の鏡面広場」ホットスポット + 受信ログ
    porthole/PortholeViewer.tsx  真鍮の丸窓（1F/B1切替・TIME/CALENDAR/LIVE FEED・お土産ショップ）
    map/
      BoardArt.tsx        全体基板マップのSVG（部品＝エリア）
      CircuitMap.tsx      ピン（ホバー発光＋店名）、条件付き訪問客
      ShopModal.tsx       店舗モーダル（シナブン堂=焼きたてパン＋ジャンク、The Node=雨の日イベント 等）
    egg/MirrorEgg.tsx     隠しギミック：ノイズ → 『レイとユウ』特別ビジュアル＋リンク
    characters/           住人一覧、27A 12V 弾帯SVG
    layout/               ローダー（スペースハム）、トップバー、世界観/シグネチャー/フッター
public/scenes/            丸窓・世界観セクションの参考イラスト（差し替え前提）
```

## 差し替えポイント

- **『レイとユウ』のリンク**: 環境変数 `NEXT_PUBLIC_REI_YUU_URL` を設定（未設定時は `#rei-and-yuu`）。
- **BGM**: `src/lib/radioEngine.ts` の `STATIONS` に `url: "/audio/xxx.mp3"` を足すと、その局は合成音の代わりに音声ファイルをループ再生。
- **シーン画像**: `public/scenes/*.webp`。丸窓は画像中心 (712, 380) 付近の半径 380px を切り抜く前提（`.porthole-scene` の left/top/width で調整）。
- **キャラ絵**: 現在は絵文字 + 弾帯SVG のプレースホルダ。`CharacterRoster.tsx` の絵文字部分を画像に置き換え。
- **Excelの「裏設定（明かさない）」列**はデータに取り込んでいません。
