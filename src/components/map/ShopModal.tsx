"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useRadio } from "@/components/RadioProvider";
import { areaById, charById, type Shop, type ShopSection } from "@/data/world";
import { dailyBreads, dailyJunk } from "@/lib/daily";
import { meets } from "@/lib/reception";
import { BatteryBandolier } from "@/components/characters/BatteryBandolier";

function withDaily(shop: Shop): ShopSection[] {
  if (shop.id !== "shinabundo") return shop.sections;
  const [bread, junk] = shop.sections;
  return [
    { ...bread, items: dailyBreads() },
    { ...junk, items: dailyJunk() },
  ];
}

export function ShopModal({ shop, onClose }: { shop: Shop | null; onClose: () => void }) {
  const { reception, enterShop } = useRadio();
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!shop) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [shop, onClose]);

  const closed = shop && reception && shop.opensWhen ? !meets(reception, shop.opensWhen) : false;

  // 店に入ったらその店のBGMへ。閉店中は扉越しのこもった音。出たら街の音に戻る
  useEffect(() => {
    if (!shop) return;
    enterShop(shop.id, closed);
    return () => enterShop(null);
  }, [shop, closed, enterShop]);

  return (
    <AnimatePresence>
      {shop && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.97, clipPath: "inset(48% 0 48% 0)" }}
            animate={{ y: 0, opacity: 1, scale: 1, clipPath: "inset(0% 0 0% 0)" }}
            exit={{ y: 30, opacity: 0, clipPath: "inset(50% 0 50% 0)" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={`modal-panel relative max-h-[88svh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl sm:p-8 ${
              shop.openEffect === "rainbow" ? "rainbow-edge" : ""
            }`}
            data-accent={shop.accent}
          >
            {shop.openEffect === "steam" && <Steam />}

            <button
              ref={closeBtn}
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full px-2 py-1 font-mono text-xs text-emerald-50/60 hover:text-white"
              aria-label="閉じる"
            >
              ✕ CLOSE
            </button>

            <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--accent)]">
              {areaById(shop.area).name} ／ {areaById(shop.area).part}
            </p>
            <h3 id="shop-title" className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {shop.name}
            </h3>
            {shop.kana && <p className="mt-0.5 text-xs text-emerald-50/50">{shop.kana}</p>}
            <p className="mt-3 text-sm font-bold text-[var(--accent)]">{shop.tagline}</p>

            {closed && (
              <p className="mt-4 rounded-md border border-amber-200/20 bg-amber-200/5 px-3 py-2 text-xs text-amber-100/90">
                {shop.closedNote ?? "ただいま準備中。"}
              </p>
            )}

            {shop.gallery && (
              <div className={`mt-5 grid gap-2 ${shop.gallery.length > 1 ? "grid-cols-2" : ""}`}>
                {shop.gallery.map((g) => (
                  <figure key={g.src} className="overflow-hidden rounded-lg border border-emerald-100/10" style={{ background: g.bg ?? "#0b1512" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.alt} className="mx-auto block h-64 w-64 object-contain [image-rendering:pixelated] sm:h-72 sm:w-72" loading="lazy" />
                    {g.caption && <figcaption className="bg-black/70 px-2 py-1 font-mono text-[10px] tracking-widest text-emerald-50/70">{g.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-emerald-50/80">{shop.concept}</p>

            {withDaily(shop).map((sec) => {
              const gated = !!sec.activeWhen;
              const live = !gated || (reception ? meets(reception, sec.activeWhen) : false);
              return (
                <section key={sec.title} className={`mt-6 ${live ? "" : "opacity-60"}`}>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-bold text-white">{sec.title}</h4>
                    {sec.kicker && <span className="font-mono text-[10px] tracking-widest text-emerald-50/50">{sec.kicker}</span>}
                    {gated && (
                      <span className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] ${live ? "live-badge" : "text-emerald-50/50"}`}>
                        {live ? "● 開催中" : "待機中"}
                      </span>
                    )}
                  </div>
                  {!live && sec.inactiveNote && <p className="mt-2 text-xs text-emerald-50/60">{sec.inactiveNote}</p>}
                  <ul className="mt-2 divide-y divide-emerald-100/10">
                    {sec.items.map((it) => (
                      <li key={it.name} className="flex gap-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="text-emerald-50">{it.name}</p>
                          {it.note && <p className="text-xs text-emerald-50/50">{it.note}</p>}
                        </div>
                        {it.price && <span className="shrink-0 font-mono text-xs text-[var(--accent)]">{it.price}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {shop.characters.length > 0 && (
              <section className="mt-6">
                <h4 className="text-sm font-bold text-white">住人</h4>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {shop.characters.map((id) => {
                    const c = charById(id);
                    if (!c) return null;
                    const here = !closed && (!c.appearsWhen || (reception ? meets(reception, c.appearsWhen) : false));
                    return (
                      <li key={id} className={`char-chip ${here ? "" : "opacity-40"}`}>
                        <span className="relative text-2xl">
                          {c.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.image} alt="" className="block h-9 w-9 rounded-full bg-black/40 object-contain [image-rendering:pixelated]" />
                          ) : (
                            c.emoji
                          )}
                          <BatteryBandolier className="absolute -bottom-1 -left-1 w-9" />
                        </span>
                        <span className="min-w-0">
                          <b className="block truncate text-sm text-white">{c.name}</b>
                          <span className="block truncate text-[11px] text-emerald-50/60">
                            {c.role}
                            {closed && "（閉店中・不在）"}
                            {!closed && !here && c.appearsWhen === "rain" && "（雨の日に来る）"}
                            {!closed && !here && c.appearsWhen === "storm" && "（雷の日に起きる）"}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {shop.goods && (
              <section className="mt-6">
                <h4 className="text-sm font-bold text-white">人間界のグッズ</h4>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {shop.goods.map((g) => (
                    <li key={g} className="rounded-full border border-emerald-100/15 px-2.5 py-1 text-[11px] text-emerald-50/80">
                      {g}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shop.openEffect === "rainbow" && (
              <button className="rainbow-btn mt-7 w-full rounded-md py-3 text-sm font-bold text-black">SHOP 7%</button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Steam() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
      {Array.from({ length: 7 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 h-16 w-16 rounded-full bg-white/10 blur-xl"
          style={{ left: `${8 + i * 13}%` }}
          animate={{ y: [40, -120], opacity: [0, 0.8, 0], scale: [0.6, 1.6] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
