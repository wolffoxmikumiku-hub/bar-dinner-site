import type { ShopItem } from "@/data/world";

/** 日付から決まる擬似乱数。同じ日なら全員に同じ「今日」が届く */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function daySeed(d = new Date()) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function pick<T>(arr: T[], n: number, rnd: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  return out;
}

const BREADS: ShopItem[] = [
  { name: "シナモンロール（文鳥の巣ver）", note: "くるくるの渦がそのまま巣の形", price: "3 CR" },
  { name: "ゆめかわメロンパン", note: "ラベンダー×ミントのクッキー生地", price: "3 CR" },
  { name: "はんだ付けクロワッサン", note: "表面が銀色にツヤッと光る照り", price: "4 CR" },
  { name: "コンデンサ・ブリオッシュ", note: "円筒形。頭に＋マークの焼き印", price: "3 CR" },
  { name: "ノイズ食パン", note: "断面にランダムな気泡模様", price: "5 CR" },
  { name: "カセットテープ・サンド", note: "A面とB面で具が違う", price: "4 CR" },
  { name: "12Vバゲット", note: "ちょうど27Aの電池と同じ太さ", price: "4 CR" },
];

const JUNK: ShopItem[] = [
  { name: "真空管 6BQ5（ほぼ点く）", note: "80s放出品", price: "15 CR" },
  { name: "ウォークマン型ケース（中身なし）", price: "12 CR" },
  { name: "LED 7セグ表示器 ×4", note: "「8」だけ光らない", price: "6 CR" },
  { name: "ジャンク基板 詰め放題袋", price: "8 CR" },
  { name: "バリコン（可変コンデンサ）", note: "回すと遠い局がかすかに聞こえる", price: "10 CR" },
  { name: "27A 12V 電池（弾帯用・10連）", note: "街の必需品", price: "5 CR" },
  { name: "赤いトグルスイッチ", note: "どこに付けても押したくなる", price: "3 CR" },
  { name: "ポケベル（受信のみ）", price: "9 CR" },
];

export function dailyBreads(d = new Date()) {
  return pick(BREADS, 3, seededRandom(daySeed(d)));
}

export function dailyJunk(d = new Date()) {
  return pick(JUNK, 4, seededRandom(daySeed(d) * 7 + 3));
}
