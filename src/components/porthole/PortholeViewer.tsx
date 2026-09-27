"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { ShopModal } from "@/components/map/ShopModal";
import { MapBoard } from "@/components/map/MapBoard";
import { shopById, type Shop } from "@/data/world";
import { WEATHER_LABEL } from "@/lib/reception";
import { meets } from "@/lib/reception";

/**
 * 定点観測モニター（真鍮の丸窓）
 *  - 1F: COLLECTIVE DINER（5:00–20:00）/ B1: Bar: The Node（20:00–5:00）をフロア切替
 *  - 営業時間外のフロアは明かりが落ち、CLOSED の札がかかる
 *  - 雨の日は店内の窓の外にだけ雨が降る（丸窓のガラスには降らせない）
 *  - TIME / CALENDAR / LIVE FEED パネルは実時刻
 *  - 右のタブはお土産ショップ（10:00–20:00 営業）
 * シーン画像は public/scenes/ の参考イラスト。差し替えは FLOORS の src を変えるだけ。
 */

type FloorId = "1F" | "B1";
/** 窓ガラスの形（シーン画像 1408x768 の座標）。雨はこの中にだけ降る */
type Pane = { kind: "poly"; points: [number, number][] } | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number };
/**
 * 店内で動く住人（シーン画像から切り出したスプライト）。box = [x, y, w, h]（シーン画像 1408x768 の座標）
 * anim は globals.css の .act-* クラス。trip はたまに画角の外へ出ていく動き
 */
type Actor = { id: string; box: [number, number, number, number]; anim: string; trip?: string; delay?: number };
/** 閉店中に残る明かり（窓の外光など）。住人のいない場所だけを照らす。a = 明るさ 0..1 */
type Light = { cx: number; cy: number; rx: number; ry: number; a: number };
const FLOORS: Record<FloorId, { shop: Shop["id"]; src: string; alt: string; sign: string; panes: Pane[]; paneTint: string; closedLights: Light[]; openSrc?: string; actors: Actor[]; fx?: "grill" }> = {
  "1F": {
    shop: "collective-diner",
    src: "/scenes/diner-1f.webp",
    alt: "COLLECTIVE DINER の店内。バイソンがバーガーを焼き、プロングホーンがローラースケートで配膳している",
    sign: "1F DINER ／ Open 5 AM",
    panes: [
      { kind: "poly", points: [[837, 130], [869, 142], [869, 230], [837, 220]] },
      { kind: "poly", points: [[899, 155], [982, 195], [982, 267], [899, 235]] },
    ],
    paneTint: "rgba(74, 92, 120, 0.62)",
    // 営業中は、バイソンとウェイトレスを抜いた背景の上に住人を重ねる
    openSrc: "/scenes/diner-1f-open.webp",
    fx: "grill",
    actors: [
      { id: "bison", box: [651, 178, 148, 293], anim: "act-cook", trip: "trip-kitchen" },
      { id: "owl", box: [886, 317, 124, 183], anim: "act-read" },
      { id: "fox", box: [472, 478, 106, 110], anim: "act-cheer", delay: 0 },
      { id: "bunny", box: [392, 505, 65, 97], anim: "act-cheer", delay: 0.35 },
      { id: "squirrel", box: [363, 552, 37, 55], anim: "act-cheer", delay: 0.7 },
      { id: "raccoon1", box: [525, 583, 65, 68], anim: "act-chat", delay: 0.2 },
      { id: "raccoon2", box: [455, 629, 56, 68], anim: "act-chat", delay: 0.9 },
      { id: "waitress", box: [601, 393, 177, 248], anim: "act-skate", trip: "trip-serve" },
    ],
    // 夜: 窓からの月明かり、ジュークボックスの残り灯、空いたスツールとボックス席
    closedLights: [
      { cx: 910, cy: 165, rx: 105, ry: 125, a: 1 },
      { cx: 370, cy: 395, rx: 62, ry: 95, a: 0.55 },
      { cx: 545, cy: 130, rx: 95, ry: 70, a: 0.3 },
      { cx: 835, cy: 560, rx: 55, ry: 60, a: 0.45 },
      { cx: 990, cy: 630, rx: 120, ry: 70, a: 0.6 },
    ],
  },
  B1: {
    shop: "the-node",
    src: "/scenes/bar-b1.webp",
    alt: "Bar: The Node の店内。フクロウのマスターがグラスを磨いている",
    sign: "B1 BAR ／ Open 8 PM",
    panes: [{ kind: "ellipse", cx: 945, cy: 210, rx: 53, ry: 68 }],
    paneTint: "rgba(40, 52, 90, 0.35)",
    actors: [
      { id: "owl", box: [550, 288, 167, 194], anim: "act-polish" },
      { id: "bat", box: [836, 415, 138, 181], anim: "act-breathe", delay: 0.4 },
      { id: "mole", box: [962, 440, 92, 122], anim: "act-chat", delay: 0.1 },
      { id: "mouse", box: [934, 397, 56, 63], anim: "act-cheer", delay: 0.5 },
      { id: "raccoon", box: [665, 485, 142, 223], anim: "act-sip" },
      { id: "firefly", box: [1073, 410, 29, 52], anim: "act-fly" },
    ],
    // 昼: 丸い小窓からの外光と、酒棚のボトルだけ
    closedLights: [
      { cx: 945, cy: 210, rx: 95, ry: 115, a: 1 },
      { cx: 385, cy: 350, rx: 85, ry: 125, a: 0.45 },
      { cx: 665, cy: 150, rx: 60, ry: 50, a: 0.3 },
    ],
  },
};

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ordinal = (n: number) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function timeLabel(d: Date) {
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const part = h >= 20 || h < 5 ? "Night" : h < 11 ? "Morning" : h < 15 ? "Midday" : "Evening";
  return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} (${part})`;
}

export function PortholeViewer() {
  const { reception, glitch, enterShop } = useRadio();
  const now = useClock();
  const [floor, setFloor] = useState<FloorId>("1F");
  const [souvenir, setSouvenir] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);

  // 夜にアクセスしたら最初からB1を覗く
  useEffect(() => {
    if (reception?.isNight) setFloor("B1");
  }, [reception?.isNight]);

  const rain = reception ? meets(reception, "rain") : false;
  const storm = reception?.weather === "storm";
  const hour = now?.getHours() ?? 12;
  const souvenirOpen = hour >= 10 && hour < 20;
  const current = FLOORS[floor];
  const currentShop = shopById(current.shop);
  const open = reception ? meets(reception, currentShop.opensWhen) : true;

  // お土産ショップ（EC）を開いている間は、その店のBGM
  useEffect(() => {
    if (!souvenir) return;
    enterShop(currentShop.id);
    return () => enterShop(null);
  }, [souvenir, currentShop.id, enterShop]);

  // 地図のワープタグ: Diner / Bar は丸窓のフロアを切り替え、それ以外は店に入る
  const warp = (s: Shop) => {
    if (s.id === "collective-diner") return switchFloor("1F");
    if (s.id === "the-node") return switchFloor("B1");
    if (s.openEffect === "static-burst") glitch(0.9);
    setShop(s);
  };

  const switchFloor = (f: FloorId) => {
    if (f === floor) return;
    glitch(0.35);
    setFloor(f);
  };

  return (
    <section id="live" className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
      <p className="font-mono text-xs tracking-[0.3em] text-[var(--cinnamon)]">FIXED-POINT MONITOR</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">丸窓から、中心街をのぞく</h2>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ── 左: 受信モニター ── */}
      <div className="min-w-0">
        <div className="dash-status">
          <span><b className="text-[var(--mint)]">●</b> SIGNAL: {reception ? "RECEIVING" : "SEARCHING…"}</span>
          <span>WEATHER: {reception ? WEATHER_LABEL[reception.weather] : "---"}</span>
          <span className="tabular-nums">TIME: {now ? now.toTimeString().slice(0, 8) : "--:--:--"}</span>
        </div>
        <p className="dash-title">RECEIVER (MAIN) ／ {current.shop === "the-node" ? "B1 BAR: THE NODE" : "1F COLLECTIVE DINER"}</p>
      <div className="porthole-plate compact">
        {/* フロア切替 */}
        <div className="floor-tabs" role="tablist" aria-label="フロア">
          {(["1F", "B1"] as FloorId[]).map((f) => (
            <button key={f} role="tab" aria-selected={floor === f} onClick={() => switchFloor(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* 丸窓 */}
        <div className="porthole">
          <div className="porthole-glass">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.button
                key={floor}
                onClick={() => setShop(currentShop)}
                className="absolute inset-0 block cursor-zoom-in"
                aria-label={`${currentShop.name} に入る`}
                initial={{ y: floor === "B1" ? "100%" : "-100%", filter: "brightness(2) contrast(0.6)" }}
                animate={{ y: 0, filter: "brightness(1) contrast(1)" }}
                exit={{ y: floor === "B1" ? "-100%" : "100%" }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <span className="porthole-scene">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={open ? (current.openSrc ?? current.src) : current.src}
                    alt={open ? current.alt : `${currentShop.name} は閉店中。明かりが落ち、誰もいない`}
                    className="block w-full"
                    draggable={false}
                  />
                  {open && <Actors floor={floor} actors={current.actors} fx={current.fx} />}
                  {!open && <LightsOff id={floor} lights={current.closedLights} />}
                  {rain && <WindowRain id={floor} panes={current.panes} tint={current.paneTint} storm={storm} />}
                </span>
                {!open && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="hang-sign">
                      <svg viewBox="0 0 100 40" className="hang-strings" aria-hidden>
                        <line x1="50" y1="5" x2="14" y2="40" />
                        <line x1="50" y1="5" x2="86" y2="40" />
                        <circle cx="50" cy="5" r="4" />
                      </svg>
                      <span className="closed-sign">
                        CLOSED
                        <small>{current.sign}</small>
                      </span>
                    </span>
                  </span>
                )}
              </motion.button>
            </AnimatePresence>
            <span className="porthole-glare" aria-hidden />
          </div>
          {Array.from({ length: 8 }, (_, i) => {
            const a = ((i * 45 + 22.5) * Math.PI) / 180;
            return <span key={i} className="bolt-head" style={{ left: `${50 + 46.5 * Math.sin(a)}%`, top: `${50 - 46.5 * Math.cos(a)}%` }} aria-hidden />;
          })}
        </div>

        {/* TIME / CALENDAR / LIVE FEED */}
        <dl className="feed-panel">
          <dt>TIME:</dt>
          <dd>{now ? timeLabel(now) : "--:--"}</dd>
          <hr />
          <dt>CALENDAR:</dt>
          <dd>{now ? `${WEEK[now.getDay()]}, ${MONTH[now.getMonth()]} ${ordinal(now.getDate())}` : "---"}</dd>
          <hr />
          <dd className="live">
            <span className="live-dot" /> LIVE FEED
            {rain && <span className="ml-2 text-[#5b7fa6]">☂ RAIN</span>}
          </dd>
        </dl>

        {/* お土産ショップ */}
        <button className="souvenir-tab" onClick={() => setSouvenir(true)} aria-haspopup="dialog">
          SOUVENIR SHOP {souvenirOpen ? `[OPEN / ${floor === "1F" ? "DINER" : "BAR"} MERCH]` : "[CLOSED]"}
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-emerald-50/50">
        窓をクリックすると店に入れます。{rain && "雨の日はB1の隅に、トレンチコートの客がいるらしい。"}
      </p>
      </div>

      {/* ── 右: 地図（ワープタグ）・店・ログ ── */}
      <div className="min-w-0 space-y-4">
        <div id="map" className="dash-panel scroll-mt-24">
          <p className="dash-title">MAP NODE (WARP TAG)</p>
          <MapBoard onPick={warp} current={current.shop} compact />
          <p className="mt-2 font-mono text-[10px] text-emerald-50/50">ピンをクリック：DINER / BAR は丸窓が切り替わり、ほかの店はそのまま入店。</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["1F", "B1"] as FloorId[]).map((f) => {
            const s = shopById(FLOORS[f].shop);
            const isOpen = reception ? meets(reception, s.opensWhen) : true;
            return (
              <button key={f} onClick={() => switchFloor(f)} className="warp-card" data-active={floor === f || undefined}>
                <span className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-widest">
                  <span>{f} ／ {f === "1F" ? "5:00–20:00" : "20:00–5:00"}</span>
                  <span className={isOpen ? "text-[var(--mint)]" : "text-amber-200/70"}>{isOpen ? "● OPEN" : "CLOSED"}</span>
                </span>
                <b className="mt-1 block text-sm text-white">{s.name}</b>
                <span className="mt-1 block text-xs leading-relaxed text-emerald-50/70">{s.tagline}</span>
              </button>
            );
          })}
        </div>

        <DataLog floor={floor} open={open} rain={rain} />
      </div>
      </div>

      {/* お土産ドロワー */}
      <AnimatePresence>
        {souvenir && (
          <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSouvenir(false)}>
            <motion.aside
              role="dialog"
              aria-label="お土産ショップ"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="souvenir-drawer absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto p-6"
            >
              <button onClick={() => setSouvenir(false)} className="float-right font-mono text-xs opacity-60 hover:opacity-100">
                ✕ CLOSE
              </button>
              <p className="font-mono text-[10px] tracking-[0.3em] opacity-70">SOUVENIR SHOP</p>
              <h3 className="mt-1 text-xl font-bold">{currentShop.name} のおみやげ</h3>
              <p className="mt-2 text-xs opacity-70">{souvenirOpen ? "営業中（10:00–20:00）" : "本日の受付は終了しました（10:00–20:00）"}</p>
              <ul className="mt-5 space-y-2">
                {(currentShop.goods ?? []).map((g) => (
                  <li key={g} className="flex items-center justify-between gap-3 rounded-md border border-current/20 px-3 py-2.5 text-sm">
                    <span>{g}</span>
                    <button disabled={!souvenirOpen} className="shrink-0 rounded px-2 py-1 font-mono text-[10px] ring-1 ring-current/40 disabled:opacity-30">
                      {souvenirOpen ? "CART" : "SOLD OUT"}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <ShopModal shop={shop} onClose={() => setShop(null)} />
    </section>
  );
}

/** 受信ログ（それっぽい演出。実際の受信状態から数行つくる） */
function DataLog({ floor, open, rain }: { floor: FloorId; open: boolean; rain: boolean }) {
  const { reception } = useRadio();
  const [lines, setLines] = useState<{ t: string; k?: string; m: string }[]>([]);
  useEffect(() => {
    if (!reception) return;
    const base = Date.now();
    const at = (s: number) => new Date(base + s * 1000).toTimeString().slice(0, 8);
    const diner = meets(reception, "day");
    const all = [
      { t: at(0), k: "CONNECT", m: " TO SOURCE…" },
      { t: at(1), m: "DECODING PACKETS…" },
      { t: at(2), k: "SUCCESS", m: `: WEATHER = ${reception.weather.toUpperCase()}` },
      { t: at(3), k: "COLLECTIVE_DINER", m: diner ? ": OPEN." : ": CLOSED (OPEN 5:00)." },
      { t: at(4), k: "BAR_THE_NODE", m: diner ? ": CLOSED (OPEN 20:00)." : ": OPEN." },
      { t: at(5), k: "SIGNAL STABLE", m: ` // VISIT #${reception.visitCount} VIA ${reception.origin.toUpperCase()}` },
    ];
    setLines([]);
    const timers = all.map((l, i) => window.setTimeout(() => setLines((p) => [...p, l]), 400 + i * 450));
    return () => timers.forEach(clearTimeout);
  }, [reception]);

  const extra = `${floor === "1F" ? "MONITOR → 1F DINER" : "MONITOR → B1 BAR"}${open ? "" : " (NO ONE HERE)"}${rain ? " // RAIN ON WINDOWS" : ""}`;
  return (
    <div className="dash-panel">
      <p className="dash-title">DATA STREAM LOG</p>
      <ul className="font-mono text-[10px] leading-relaxed text-emerald-50/45 sm:text-[11px]">
        {lines.map((l, i) => (
          <li key={i}>
            [{l.t}] {l.k && <span className="text-[#2c9b60]">{l.k}</span>}
            {l.m}
          </li>
        ))}
        {lines.length >= 6 && (
          <li>
            [{lines[lines.length - 1].t}] <span className="text-[#2c9b60]">{extra}</span>
            <span className="log-caret">_</span>
          </li>
        )}
      </ul>
    </div>
  );
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** 営業中の店内: 住人がそれぞれ動く（お客さんはワイワイ、店員は仕事中） */
function Actors({ floor, actors, fx }: { floor: FloorId; actors: Actor[]; fx?: "grill" }) {
  return (
    <span className="absolute inset-0" aria-hidden>
      {fx === "grill" && (
        <span className="absolute" style={{ left: pct(540, 1408), top: pct(300, 768), width: pct(100, 1408), height: pct(60, 768) }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="grill-smoke" style={{ left: `${10 + i * 18}%`, animationDelay: `${i * 0.55}s` }} />
          ))}
        </span>
      )}
      {floor === "1F" && (
        <span className="absolute" style={{ left: pct(380, 1408), top: pct(470, 768), width: pct(200, 1408), height: pct(90, 768) }}>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="confetti" style={{ left: `${6 + i * 12}%`, animationDelay: `${i * 0.4}s`, background: ["#ff5a7a", "#ffd24a", "#5ad1ff", "#8dff7a"][i % 4] }} />
          ))}
        </span>
      )}
      {actors.map((a) => {
        const [x, y, w, h] = a.box;
        return (
          <span
            key={a.id}
            className={`actor ${a.trip ?? ""}`}
            style={{ left: pct(x, 1408), top: pct(y, 768), width: pct(w, 1408), height: pct(h, 768) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/scenes/sprites/${floor === "1F" ? "diner-1f" : "bar-b1"}-${a.id}.webp`}
              alt=""
              className={`block h-full w-full ${a.anim}`}
              style={{ animationDelay: a.delay ? `${a.delay}s` : undefined }}
              draggable={false}
            />
          </span>
        );
      })}
    </span>
  );
}

/** 閉店中: 照明を落とし、住人のいない場所にだけ外の光が残る */
function LightsOff({ id, lights }: { id: string; lights: Light[] }) {
  return (
    <svg viewBox="0 0 1408 768" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <filter id={`soft-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <mask id={`lights-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1408" height="768">
          <rect width="1408" height="768" fill="#fff" />
          <g filter={`url(#soft-${id})`}>
            {lights.map((l, i) => (
              <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="#000" fillOpacity={l.a} />
            ))}
          </g>
        </mask>
      </defs>
      <rect width="1408" height="768" fill="#03050c" fillOpacity={0.992} mask={`url(#lights-${id})`} />
      <rect width="1408" height="768" fill="#2a3a66" fillOpacity={0.18} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

/** 店内の窓の外に降る雨（窓ガラスの形で切り抜く） */
function WindowRain({ id, panes, tint, storm }: { id: string; panes: Pane[]; tint: string; storm: boolean }) {
  const drops = useMemo(
    () =>
      panes.map((p) => {
        const [x0, y0, x1, y1] =
          p.kind === "ellipse" ? [p.cx - p.rx, p.cy - p.ry, p.cx + p.rx, p.cy + p.ry] : bbox(p.points);
        let seed = x0 * 7 + y0;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        const n = Math.round(((x1 - x0) * (y1 - y0)) / 180);
        return {
          box: [x0, y0, x1, y1] as const,
          lines: Array.from({ length: n }, () => ({
            x: x0 + rnd() * (x1 - x0 + 20),
            y: y0 - 20 + rnd() * (y1 - y0),
            len: 8 + rnd() * 10,
            dur: 0.45 + rnd() * 0.35,
            delay: -rnd(),
          })),
          beads: Array.from({ length: Math.max(2, Math.round(n / 5)) }, () => ({
            x: x0 + 4 + rnd() * (x1 - x0 - 8),
            y: y0 + 4 + rnd() * (y1 - y0 - 8),
            dur: 3 + rnd() * 4,
            delay: -rnd() * 6,
          })),
        };
      }),
    [panes],
  );

  return (
    <svg viewBox="0 0 1408 768" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        {panes.map((p, i) => (
          <clipPath key={i} id={`pane-${id}-${i}`}>
            {p.kind === "ellipse" ? (
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} />
            ) : (
              <polygon points={p.points.map((q) => q.join(",")).join(" ")} />
            )}
          </clipPath>
        ))}
      </defs>
      {drops.map((d, i) => {
        const [x0, y0, x1, y1] = d.box;
        return (
          <g key={i} clipPath={`url(#pane-${id}-${i})`}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={tint} />
            {storm && <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className="pane-flash" />}
            {d.lines.map((l, j) => (
              <line
                key={j}
                x1={l.x}
                y1={l.y}
                x2={l.x - l.len * 0.25}
                y2={l.y + l.len}
                className="pane-drop"
                style={{ animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s`, ["--fall" as string]: `${y1 - y0 + 30}px` }}
              />
            ))}
            {d.beads.map((b, j) => (
              <circle
                key={`b${j}`}
                cx={b.x}
                cy={b.y}
                r={1.6}
                className="pane-bead"
                style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function bbox(pts: [number, number][]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
