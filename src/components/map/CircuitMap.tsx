"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { AREAS, COPPER, SHOPS, YAMASEMI_STALL, areaById, type Shop } from "@/data/world";
import { meets } from "@/lib/reception";
import { BoardArt } from "./BoardArt";
import { ShopModal } from "./ShopModal";

/**
 * インタラクティブ・エリアマップ
 *  - ピンにホバー/フォーカスで発光＆店名
 *  - タップ/クリックでモーダル
 *  - Barは20時以降のみ点灯、雨の日は鳩、雷の日は三兄弟、ヤマセミ兄妹は日替わりで出張
 */
export function CircuitMap() {
  const { reception, glitch } = useRadio();
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<Shop | null>(null);

  const shops = useMemo<Shop[]>(() => {
    if (!reception) return SHOPS;
    const a = areaById(reception.yamasemiAt);
    return [...SHOPS, { ...YAMASEMI_STALL, area: a.id, x: a.x + 55, y: a.y - 60 }];
  }, [reception]);

  const open = (s: Shop) => {
    if (s.openEffect === "static-burst") glitch(0.9); // 電波塔: ジリジリ…
    setSelected(s);
  };

  const isRain = reception ? meets(reception, "rain") : false;

  return (
    <section id="map" className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <header className="mb-8 max-w-2xl">
        <p className="font-mono text-xs tracking-[0.3em] text-[var(--pink)]">CIRCUIT MAP</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">基板の街をあるく</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-50/70">
          部品ひとつがひとつの街。ピンに触れると灯りがつき、タップすると店に入れる。
          住人が「シルバー・ミラー」と呼ぶ銀色の広場は、いつもツルッと光っている。
        </p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="map-frame relative aspect-[1000/640] min-w-[720px]">
          <BoardArt />

          {/* エリア名（ホバー中のみ強調） */}
          {AREAS.map((a) => (
            <span
              key={a.id}
              className="area-label pointer-events-none absolute -translate-x-1/2"
              style={{ left: `${a.x / 10}%`, top: `${(a.y - 70) / 6.4}%` }}
              data-active={shops.some((s) => s.id === hover && s.area === a.id) || undefined}
            >
              {a.name}
              <small>{a.part}</small>
            </span>
          ))}

          {shops.map((s) => {
            const closed = reception && s.opensWhen ? !meets(reception, s.opensWhen) : false;
            const color = s.accent === "silver" ? "#e6edf0" : COPPER[s.accent];
            const active = hover === s.id;
            return (
              <button
                key={s.id}
                onClick={() => open(s)}
                onPointerEnter={() => setHover(s.id)}
                onPointerLeave={() => setHover((h) => (h === s.id ? null : h))}
                onFocus={() => setHover(s.id)}
                onBlur={() => setHover(null)}
                className="pin group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${s.x / 10}%`, top: `${s.y / 6.4}%`, ["--pin" as string]: color }}
                aria-label={`${s.name}${closed ? "（準備中）" : ""}`}
                data-closed={closed || undefined}
              >
                <motion.span
                  className="pin-dot block"
                  animate={active ? { scale: 1.5 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                />
                {!closed && <span className="pin-pulse" />}
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 4 }}
                      className="pin-label"
                    >
                      {s.name}
                      {closed && <em> ／ 20:00 OPEN</em>}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}

          {/* 雨の日: The Node の前にトレンチコートの鳩 */}
          {isRain && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="pointer-events-none absolute text-lg"
              style={{ left: `${57}%`, top: `${54}%` }}
              title="トレンチコートの鳩"
            >
              🕊️
            </motion.span>
          )}
        </div>
      </div>

      {/* モバイル・支援技術向けの一覧 */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {shops.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => open(s)}
              className="rounded-full border border-emerald-200/15 bg-black/30 px-3 py-1.5 text-xs text-emerald-50/80 transition hover:border-[var(--pink)] hover:text-white"
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>

      <ShopModal shop={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
