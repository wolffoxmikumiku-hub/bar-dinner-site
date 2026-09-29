"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { AREAS, CHARACTERS, SHOPS, type Character } from "@/data/world";
import { meets } from "@/lib/reception";
import { BatteryBandolier } from "./BatteryBandolier";

const FILTERS: { id: Character["area"] | "all"; label: string }[] = [
  { id: "all", label: "すべて" },
  ...AREAS.filter((a) => CHARACTERS.some((c) => c.area === a.id)).map((a) => ({ id: a.id, label: a.name })),
  { id: "travel", label: "出張・協力" },
  { id: "space", label: "宇宙" },
];

export function CharacterRoster() {
  const { reception } = useRadio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const list = CHARACTERS.filter((c) => filter === "all" || c.area === filter);

  return (
    <section id="residents" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <p className="font-mono text-xs tracking-[0.3em] text-[var(--mint)]">RESIDENTS</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">住人たち</h2>
      <p className="mt-3 max-w-2xl text-sm text-emerald-50/70">
        基板の上で暮らす住人たち。「27A 12V」電池の弾帯を巻いているのは、ヤマセミ兄妹とカラスの旦那だけ。
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="エリアで絞り込み">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="filter-chip"
          >
            {f.label}
          </button>
        ))}
      </div>

      <motion.ul layout className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((c) => {
            const shop = SHOPS.find((s) => s.id === c.shop);
            const here = !c.appearsWhen || (reception ? meets(reception, c.appearsWhen) : true);
            return (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="char-card"
                data-away={!here || undefined}
              >
                <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-black/40 text-4xl">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className={`char-face ${here ? "" : "grayscale"}`} loading="lazy" />
                  ) : (
                    <span className={here ? "" : "grayscale"}>{c.emoji}</span>
                  )}
                  {c.bandolier && <BatteryBandolier className="absolute -bottom-1 -left-2 w-14" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono tracking-widest text-emerald-50/50">
                    {c.animal}
                    {shop ? ` ／ ${shop.name}` : ""}
                  </p>
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-[var(--pink)]">{c.role}</p>
                  {c.fashion && <p className="mt-1 text-[11px] text-emerald-50/60">👕 {c.fashion}</p>}
                  {c.personality && <p className="mt-1 text-xs leading-relaxed text-emerald-50/80">{c.personality}</p>}
                  {c.behavior && <p className="mt-1 text-[11px] leading-relaxed text-[var(--mint)]/80">▶ {c.behavior}</p>}
                  {!here && (
                    <p className="mt-1 text-[11px] text-amber-200/80">
                      {c.appearsWhen === "rain" ? "今日は来ていない（雨の日限定）" : "眠っている（雷が来ると起動）"}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
}
