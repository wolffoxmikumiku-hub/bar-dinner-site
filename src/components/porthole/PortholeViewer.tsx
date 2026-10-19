"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { ShopModal } from "@/components/map/ShopModal";
import { MapBoard } from "@/components/map/MapBoard";
import { ShopDialogueModal } from "@/components/shopfx/ShopDialogueModal";
import { SHOPS, shopById, type Shop } from "@/data/world";
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
type Actor = { id: string; box: [number, number, number, number]; anim: string; trip?: string; delay?: number; /** カウンターの奥（front レイヤーの後ろ）に立つ */ behind?: boolean };
/** 閉店中に残る明かり（窓の外光など）。住人のいない場所だけを照らす。a = 明るさ 0..1 */
type Light = { cx: number; cy: number; rx: number; ry: number; a: number };
const FLOORS: Record<FloorId, { shop: Shop["id"]; src: string; alt: string; sign: string; panes: Pane[]; paneTint: string; closedLights: Light[]; openSrc?: string; actors: Actor[]; fx?: "grill"; /** 住人より手前に重ねるレイヤー（カウンター等） */ front?: { src: string; box: [number, number, number, number] } }> = {
  "1F": {
    shop: "collective-diner",
    // 店内の絵は akira 作（キャラなしの内装）。ネオンは「COLLECTIVE DINER」に差し替え済み
    src: "/scenes/diner-1f.webp",
    alt: "COLLECTIVE DINER の店内。バイソンがカウンターの奥で肉を焼き、プロングホーンがローラースケートで配膳している",
    sign: "1F DINER ／ Open 5 AM",
    panes: [
      { kind: "ellipse", cx: 572, cy: 248, rx: 19, ry: 25 },
      { kind: "poly", points: [[995, 10], [1100, 40], [1100, 285], [995, 250]] },
    ],
    paneTint: "rgba(74, 92, 120, 0.62)",
    fx: "grill",
    front: { src: "/scenes/diner-1f-front.webp", box: [697, 322, 711, 446] },
    actors: [
      { id: "bison", box: [797, 190, 126, 249], anim: "act-cook", trip: "trip-kitchen-l", behind: true },
      { id: "owl", box: [641, 283, 99, 146], anim: "act-read" },
      { id: "waitress", box: [440, 350, 150, 211], anim: "act-skate", trip: "trip-serve" },
    ],
    // 夜: 窓からの外光、ジュークボックスとネオンの残り灯、ドアの小窓
    closedLights: [
      { cx: 1060, cy: 170, rx: 95, ry: 140, a: 1 },
      { cx: 300, cy: 300, rx: 60, ry: 110, a: 0.6 },
      { cx: 650, cy: 95, rx: 170, ry: 60, a: 0.35 },
      { cx: 572, cy: 248, rx: 40, ry: 45, a: 0.6 },
      { cx: 880, cy: 600, rx: 140, ry: 70, a: 0.35 },
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
    const t = window.setInterval(() => setNow(new Date()), 1000);
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

type Page = "main" | "logs" | "alley" | "shop-1F" | "shop-B1";

/** ブラウザに記憶するクレジットと景品（ゲーム内だけのもの。実際の支払いはない） */
function useWallet() {
  const [credit, setCredit] = useState(100);
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    try {
      const c = localStorage.getItem("pcb:credit");
      if (c != null) setCredit(Number(c) || 0);
      const i = localStorage.getItem("pcb:items");
      if (i) setItems(JSON.parse(i));
    } catch {}
  }, []);
  const save = (c: number, i: string[]) => {
    setCredit(c);
    setItems(i);
    try {
      localStorage.setItem("pcb:credit", String(c));
      localStorage.setItem("pcb:items", JSON.stringify(i));
    } catch {}
  };
  return { credit, items, save };
}

/**
 * SIGNAL RECEIVER（受信ダッシュボード）
 *  - RECEIVER (MAIN): 左に受信ログ、中央にCRTモニター（丸窓カメラ）、右に基板の地図（ワープタグ）
 *  - 地図の DINER / BAR チップ、またはモニターの ENTER で各店の特設ページへ
 *  - 店で買い物（シミュレート）をするとクレジットが貯まり、裏路地のスロットで使える
 */
export function PortholeViewer() {
  const { reception, glitch, enterShop, powered } = useRadio();
  const now = useClock();
  const wallet = useWallet();
  const [page, setPage] = useState<Page>("main");
  const [floor, setFloor] = useState<FloorId>("1F");
  const [shop, setShop] = useState<Shop | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ text: string; tone: string } | null>(null);
  const [noise, setNoise] = useState(0);

  // 夜にアクセスしたら最初からB1を覗く
  useEffect(() => {
    if (reception?.isNight) setFloor("B1");
  }, [reception?.isNight]);

  const rain = reception ? meets(reception, "rain") : false;
  const storm = reception?.weather === "storm";
  const current = FLOORS[floor];
  const currentShop = shopById(current.shop);
  const open = reception ? meets(reception, currentShop.opensWhen) : true;
  const night = reception?.isNight ?? false;

  const buzz = (s = 0.35) => {
    glitch(s);
    setNoise((n) => n + 1);
  };
  const switchFloor = (f: FloorId) => {
    if (f === floor) return;
    buzz();
    setFloor(f);
  };
  const go = (p: Page) => {
    if (p === page) return;
    buzz(0.25);
    setPage(p);
  };
  // 地図のワープタグ: Diner / Bar は特設ページへ、ほかの店はその場で入店
  const warp = (s: Shop) => {
    if (s.id === "collective-diner") return (setFloor("1F"), go("shop-1F"));
    if (s.id === "the-node") return (setFloor("B1"), go("shop-B1"));
    if (s.id === "tancho") return setCrane(true); // 女将の立ち絵＋会話で入店
    if (s.openEffect === "static-burst") glitch(0.9);
    setShop(s);
  };
  const [crane, setCrane] = useState(false);
  const [craneToast, setCraneToast] = useState<string | null>(null);
  // 丹頂に入っている間は丹頂のBGM
  useEffect(() => {
    if (!crane) return;
    enterShop("tancho");
    return () => enterShop(null);
  }, [crane, enterShop]);

  return (
    <section id="live" className="receiver relative mx-auto max-w-[1500px] px-4 py-16 sm:py-24">
      <header className="rx-header">
        <div className="flex min-w-0 items-center">
          <span className="rx-dot" style={{ ["--dot" as string]: night ? "#b388ff" : "#ffd54f" }} />
          <span className="truncate">
            {reception ? `STATUS: ONLINE // ${night ? "BAR: THE NODE" : "COLLECTIVE DINER"} CONTROL` : "SIGNAL: RECEIVING..."}
          </span>
        </div>
        <div className="rx-wallet">
          <div className="rx-wallet-item">
            CREDIT: <b className="text-[#ffd54f] [text-shadow:0_0_5px_rgba(255,213,79,.5)]">{wallet.credit}</b>
          </div>
          <div className="rx-wallet-item">
            ITEMS: <b className="text-[#4af2a1]">{wallet.items.length ? wallet.items.join(", ") : "NONE"}</b>
          </div>
          <div className="tabular-nums">TIME: {now ? now.toTimeString().slice(0, 8) : "--:--:--"}</div>
        </div>
      </header>

      <nav className="rx-tags" aria-label="受信ページ">
        <button className="rx-tag" data-active={page === "main" || undefined} onClick={() => go("main")}>
          RECEIVER (MAIN)
        </button>
        <button className="rx-tag" data-active={page === "logs" || undefined} onClick={() => go("logs")}>
          PROJECT LOGS
        </button>
        <button className="rx-tag rx-tag-alley" data-active={page === "alley" || undefined} onClick={() => go("alley")}>
          BACK ALLEY (裏路地)
        </button>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {page === "main" && (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
              {/* 左: 受信ログ */}
              <div className="order-3 lg:order-1">
                <DataLog floor={floor} open={open} rain={rain} />
              </div>

              {/* 中央: CRTモニター（丸窓カメラ） */}
              <div className="order-1 lg:order-2">
                <div className="crt-frame">
                  <div className="crt-view">
                    <span key={noise} className="crt-noise" aria-hidden />
                    <div className="crt-cam">
                      <div className="porthole">
                        <div className="porthole-glass">
                          <AnimatePresence initial={false} mode="popLayout">
                            <motion.button
                              key={floor}
                              onClick={() => go(floor === "1F" ? "shop-1F" : "shop-B1")}
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
                                {open && <Actors floor={floor} actors={current.actors} fx={current.fx} front={current.front} />}
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
                    </div>

                    {/* モニター上のHUD */}
                    <p className="crt-hud left-3 top-3">
                      <span className="live-dot" /> CAM {floor} // {floor === "1F" ? "COLLECTIVE DINER" : "BAR: THE NODE"}
                      {rain && <span className="ml-2 text-[#8fb4ff]">☂ RAIN</span>}
                    </p>
                    <div className="crt-hud right-3 top-3 flex gap-1.5" role="tablist" aria-label="フロア">
                      {(["1F", "B1"] as FloorId[]).map((f) => (
                        <button key={f} role="tab" aria-selected={floor === f} onClick={() => switchFloor(f)} className="crt-btn">
                          {f}
                        </button>
                      ))}
                    </div>
                    <p className="crt-hud bottom-3 left-3">
                      {now ? `${timeLabel(now)} · ${WEEK[now.getDay()]}, ${MONTH[now.getMonth()]} ${ordinal(now.getDate())}` : "--:--"}
                    </p>
                    <button className="crt-hud crt-btn bottom-3 right-3" onClick={() => go(floor === "1F" ? "shop-1F" : "shop-B1")}>
                      {open ? "ENTER ▶" : "CLOSED ／ PEEK ▶"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-center font-mono text-[10px] text-white/35">
                  [ {night ? "NIGHT MODE // 20:00 – 5:00" : "DAYLIGHT MODE // 5:00 – 20:00"} ] 窓をクリックすると店に入れます
                </p>
              </div>

              {/* 右: 地図 */}
              <div id="map" className="rx-panel order-2 scroll-mt-24 lg:order-3">
                <p className="rx-title">MAP NODE (WARP TAG)</p>
                <MapBoard
                  onPick={warp}
                  current={current.shop}
                  compact
                  onHover={(s) =>
                    setHoverInfo(
                      s
                        ? s.id === "collective-diner"
                          ? { text: "CPU:01 // COLLECTIVE DINER [ENTER]", tone: "#ffd54f" }
                          : s.id === "the-node"
                            ? { text: "CPU:02 // BAR: THE NODE [ENTER]", tone: "#b388ff" }
                            : { text: s.name, tone: "#4af2a1" }
                        : null,
                    )
                  }
                />
                <p className="mt-3 min-h-4 text-center font-mono text-[11px]" style={{ color: hoverInfo?.tone ?? "#666" }}>
                  {hoverInfo?.text ?? "ピンに触れると回路が光る"}
                </p>
              </div>
            </div>
          )}

          {(page === "shop-1F" || page === "shop-B1") && (
            <ShopPage
              floor={page === "shop-1F" ? "1F" : "B1"}
              onBack={() => go("main")}
              onBuy={(name, reward) => {
                wallet.save(wallet.credit + reward, wallet.items);
                return `「${name}」をシミュレート購入しました。+${reward} CREDIT`;
              }}
              enterShop={enterShop}
            />
          )}

          {page === "logs" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SHOPS.map((s) => (
                <button key={s.id} className="rx-card text-left" onClick={() => warp(s)}>
                  <p className="font-mono text-sm font-bold tracking-wider text-white">{s.name}</p>
                  <p className="mt-1 text-xs text-[var(--pink)]">{s.tagline}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/55">{s.concept}</p>
                </button>
              ))}
            </div>
          )}

          {page === "alley" && <BackAlley wallet={wallet} />}
        </motion.div>
      </AnimatePresence>

      <ShopModal shop={shop} onClose={() => setShop(null)} />
      <ShopDialogueModal
        open={crane}
        onClose={() => setCrane(false)}
        shopName="割烹料理 丹頂"
        isOpen
        characterId="crane"
        soundOn={powered}
        lines={["ようこそ、お越しくださいました。", "ここでは雑音を置いて、どうぞ静かに。今日の椀物は、ちょうど出汁がととのったところです。"]}
        items={[
          { name: "本日のおまかせ懐石", price: 8800 },
          { name: "丹頂の出汁パック（6袋）", price: 1800 },
          { name: "女将の手ぬぐい（波柄）", price: 1500 },
        ]}
        onAddToCart={(it) => {
          const reward = Math.round(it.price / 100);
          wallet.save(wallet.credit + reward, wallet.items);
          setCraneToast(`「${it.name}」をシミュレート購入しました。+${reward} CREDIT`);
          window.setTimeout(() => setCraneToast(null), 2200);
        }}
      />
      {craneToast && (
        <p className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md border border-[#4af2a1]/40 bg-black/85 px-4 py-2 font-mono text-xs text-[#4af2a1]">
          {craneToast}
        </p>
      )}
    </section>
  );
}

/** 各店の特設ページ（メニューを“買う”とクレジットが貯まる） */
function ShopPage({
  floor,
  onBack,
  onBuy,
  enterShop,
}: {
  floor: FloorId;
  onBack: () => void;
  onBuy: (name: string, reward: number) => string;
  enterShop: (id: string | null, closed?: boolean) => void;
}) {
  const { reception } = useRadio();
  const s = shopById(FLOORS[floor].shop);
  const open = reception ? meets(reception, s.opensWhen) : true;
  const [toast, setToast] = useState<string | null>(null);
  const bar = floor === "B1";
  const keeper = bar ? FLOORS.B1.actors.find((a) => a.id === "owl")! : FLOORS["1F"].actors.find((a) => a.id === "bison")!;

  useEffect(() => {
    enterShop(s.id, !open);
    return () => enterShop(null);
  }, [s.id, open, enterShop]);

  const items = s.sections.flatMap((sec) => (sec.activeWhen && reception && !meets(reception, sec.activeWhen) ? [] : sec.items));
  const goods = (s.goods ?? []).map((g) => ({ name: g, note: "おみやげ", price: undefined as string | undefined }));
  const balloon = !open
    ? s.closedNote ?? "ただいま準備中。"
    : bar
      ? "いらっしゃい。貯まったクレジットは『裏路地』で使えるらしい……ここだけの話だがね。"
      : "よく来たな！ 注文するとクレジットが貯まるぜ。";

  return (
    <div className={`shop-page ${bar ? "shop-page-bar" : "shop-page-diner"}`}>
      <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
        <span style={{ color: bar ? "#b388ff" : "#ffd54f" }}>[ NODE_0{bar ? 2 : 1} // INSIDE THE {bar ? "BAR" : "DINER"} ]</span>
        <button onClick={onBack} className="rx-tag">
          ← RECEIVER
        </button>
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-wider text-white sm:text-3xl">{s.name}</h3>
      <p className="mt-1 text-sm" style={{ color: bar ? "#b388ff" : "#ffd54f" }}>
        {s.tagline} {!open && "（CLOSED）"}
      </p>

      <div className="relative z-[2] mt-6 grid gap-4 pr-0 sm:grid-cols-2 lg:grid-cols-3 lg:pr-[260px]">
        {[...items, ...goods].map((it) => {
          const cr = it.price ? parseInt(it.price, 10) : 5;
          const reward = cr * 10;
          return (
            <button
              key={it.name}
              disabled={!open}
              className="product-card"
              onClick={() => {
                setToast(onBuy(it.name, reward));
                window.setTimeout(() => setToast(null), 2200);
              }}
            >
              <span className="block text-sm font-bold" style={{ color: bar ? "#d6c1ff" : "#ffe08a" }}>
                {it.name}
              </span>
              {it.note && <span className="mt-1 block text-[11px] text-white/45">{it.note}</span>}
              <span className="mt-2 block font-mono text-xs text-white/50">{it.price ?? "GOODS"}</span>
              <span className="mt-1 block font-mono text-[11px] text-[#4af2a1]">{open ? `+${reward} CREDIT` : "CLOSED"}</span>
            </button>
          );
        })}
      </div>

      {/* 店主がひょっこり */}
      <div className="shopkeeper">
        <p className="shopkeeper-balloon" style={{ borderColor: bar ? "#4a3270" : "#5c431d" }}>
          {balloon}
        </p>
        {open && (
          <span className="shopkeeper-avatar" style={{ aspectRatio: `${keeper.box[2]} / ${keeper.box[3] * 0.72}` }}>
            {/* 上半身だけ（カウンターから顔を出している感じ） */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/scenes/sprites/${bar ? "bar-b1" : "diner-1f"}-${keeper.id}.webp`}
              alt={bar ? "マスターのフクロウ" : "店長のバイソン"}
              className="block w-full [image-rendering:pixelated]"
            />
          </span>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border border-[#4af2a1]/40 bg-black/85 px-4 py-2 font-mono text-xs text-[#4af2a1]"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const REEL = ["🍔", "🍸", "⚡", "🔋", "7️⃣", "🦬"];

/** 裏路地スロット（パワー横丁の奥。クレジットを使う） */
function BackAlley({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const [reels, setReels] = useState(["🍔", "🍸", "⚡"]);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState<{ t: string; c: string } | null>(null);

  const spin = () => {
    if (spinning) return;
    if (wallet.credit < 50) return setMsg({ t: "ERROR: CREDIT INSUFFICIENT — 店で注文してクレジットを貯めよう", c: "#ff6b6b" });
    let credit = wallet.credit - 50;
    wallet.save(credit, wallet.items);
    setSpinning(true);
    setMsg({ t: "SPINNING...", c: "#aaa" });
    let n = 0;
    const pick = () => REEL[Math.floor(Math.random() * REEL.length)];
    const timer = window.setInterval(() => {
      const r = [pick(), pick(), pick()];
      setReels(r);
      if (++n > 15) {
        window.clearInterval(timer);
        setSpinning(false);
        let items = wallet.items;
        if (r[0] === r[1] && r[1] === r[2]) {
          const prize = r[0] === "7️⃣" ? "GOLD 27A BATTERY" : "PREMIUM CHIP";
          if (!items.includes(prize)) items = [...items, prize];
          setMsg(r[0] === "7️⃣" ? { t: "🎉 JACKPOT!!! 金の27A電池を獲得！", c: "#ffd54f" } : { t: "🎁 WIN!! プレミアムチップ獲得！", c: "#4af2a1" });
        } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
          credit += 30;
          setMsg({ t: "✨ TWO PAIR! +30 CREDIT 還元", c: "#a7ffeb" });
        } else setMsg({ t: "MISS // TRY AGAIN", c: "#666" });
        wallet.save(credit, items);
      }
    }, 80);
  };

  return (
    <div className="alley">
      <p className="font-mono text-xs text-[#4af2a1]">[ POWER ALLEY // BACK ALLEY SLOT ]</p>
      <div className="slot-machine">
        <p className="slot-title">CIRCUIT SLOT</p>
        <div className="slot-reels">
          {reels.map((r, i) => (
            <span key={i} className="reel">
              {r}
            </span>
          ))}
        </div>
        <button className="slot-btn" onClick={spin} disabled={spinning}>
          SPIN REELS
        </button>
        <p className="mt-2 font-mono text-[11px] text-white/40">COST: 50 CREDIT / SPIN</p>
        <p className="mt-4 min-h-6 font-mono text-sm font-bold" style={{ color: msg?.c ?? "#aaa" }}>
          {msg?.t}
        </p>
      </div>
      <p className="mt-5 max-w-sm text-center text-xs leading-relaxed text-white/40">
        電源・暴走エリアの裏路地。フードを被った三兄弟の長男・ボルトが、黙って台の番をしている。
      </p>
    </div>
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
    <div className="rx-panel rx-log">
      <p className="rx-title">DATA STREAM LOG</p>
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
function Actors({
  floor,
  actors,
  fx,
  front,
}: {
  floor: FloorId;
  actors: Actor[];
  fx?: "grill";
  front?: { src: string; box: [number, number, number, number] };
}) {
  const sprite = (a: Actor) => {
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
  };
  return (
    <span className="absolute inset-0" aria-hidden>
      {fx === "grill" && (
        <span className="absolute" style={{ left: pct(720, 1408), top: pct(150, 768), width: pct(80, 1408), height: pct(45, 768) }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="grill-smoke" style={{ left: `${10 + i * 18}%`, animationDelay: `${i * 0.55}s` }} />
          ))}
        </span>
      )}
      {actors.filter((a) => a.behind).map(sprite)}
      {front && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={front.src}
          alt=""
          className="absolute [image-rendering:pixelated]"
          style={{ left: pct(front.box[0], 1408), top: pct(front.box[1], 768), width: pct(front.box[2], 1408), height: pct(front.box[3], 768) }}
          draggable={false}
        />
      )}
      {actors.filter((a) => !a.behind).map(sprite)}
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
