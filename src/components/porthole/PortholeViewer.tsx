"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { ShopModal } from "@/components/map/ShopModal";
import { shopById, type Shop } from "@/data/world";
import { meets } from "@/lib/reception";

/**
 * 定点観測モニター（真鍮の丸窓）
 *  - 1F: COLLECTIVE DINER / B1: Bar: The Node をフロア切替
 *  - TIME / CALENDAR / LIVE FEED パネルは実時刻
 *  - 右のタブはお土産ショップ（10:00–20:00 営業）
 * シーン画像は public/scenes/ の参考イラスト。差し替えは FLOORS の src を変えるだけ。
 */

type FloorId = "1F" | "B1";
const FLOORS: Record<FloorId, { shop: Shop["id"]; src: string; alt: string }> = {
  "1F": { shop: "collective-diner", src: "/scenes/diner-1f.webp", alt: "COLLECTIVE DINER の店内。バイソンがバーガーを焼き、プロングホーンがローラースケートで配膳している" },
  B1: { shop: "the-node", src: "/scenes/bar-b1.webp", alt: "Bar: The Node の店内。フクロウのマスターがグラスを磨いている" },
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
  const { reception, glitch } = useRadio();
  const now = useClock();
  const [floor, setFloor] = useState<FloorId>("1F");
  const [souvenir, setSouvenir] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);

  // 夜にアクセスしたら最初からB1を覗く
  useEffect(() => {
    if (reception?.isNight) setFloor("B1");
  }, [reception?.isNight]);

  const barOpen = reception ? meets(reception, "night") : false;
  const rain = reception ? meets(reception, "rain") : false;
  const hour = now?.getHours() ?? 12;
  const souvenirOpen = hour >= 10 && hour < 20;
  const current = FLOORS[floor];
  const currentShop = shopById(current.shop);

  const switchFloor = (f: FloorId) => {
    if (f === floor) return;
    glitch(0.35);
    setFloor(f);
  };

  return (
    <section id="live" className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <p className="font-mono text-xs tracking-[0.3em] text-[var(--cinnamon)]">FIXED-POINT MONITOR</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">丸窓から、中心街をのぞく</h2>

      <div className="porthole-plate mt-8">
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.src} alt={current.alt} className="porthole-scene" draggable={false} />
                {floor === "B1" && !barOpen && (
                  <span className="absolute inset-0 grid place-items-center bg-[#050818]/75">
                    <span className="closed-sign">
                      CLOSED
                      <small>B1 – BAR ／ Open 8 PM</small>
                    </span>
                  </span>
                )}
              </motion.button>
            </AnimatePresence>
            {rain && <span className="porthole-rain" aria-hidden />}
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

      <p className="mt-4 text-center text-xs text-emerald-50/50">
        窓をクリックすると店に入れます。{rain && "雨の日はB1の隅に、トレンチコートの客がいるらしい。"}
      </p>

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
