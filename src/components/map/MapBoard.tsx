"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { AREAS, COPPER, SHOPS, YAMASEMI_STALL, areaById, type Shop } from "@/data/world";
import { meets } from "@/lib/reception";
import { BoardArt } from "./BoardArt";

/**
 * 基板の街の地図（ピン＝ワープタグ）
 *  - ピンにホバー/フォーカスで発光＆店名、クリックで onPick
 *  - Barは20時以降・Dinerは昼だけ点灯、雨の日は鳩、ヤマセミ兄妹は日替わりで出張
 */
export function MapBoard({
  onPick,
  current,
  compact,
  onHover,
}: {
  onPick: (s: Shop) => void;
  current?: string;
  compact?: boolean;
  onHover?: (s: Shop | null) => void;
}) {
  const { reception } = useRadio();
  const [hover, setHover] = useState<string | null>(null);

  const shops = useMemo<Shop[]>(() => {
    if (!reception) return SHOPS;
    const a = areaById(reception.yamasemiAt);
    return [...SHOPS, { ...YAMASEMI_STALL, area: a.id, x: a.x + 55, y: a.y - 60 }];
  }, [reception]);
  const isRain = reception ? meets(reception, "rain") : false;

  return (
    <div className={`map-frame relative aspect-[1000/640] ${compact ? "map-compact" : "min-w-[720px]"}`} data-hover={hover ? (hover === "collective-diner" ? "diner" : hover === "the-node" ? "bar" : "other") : undefined}>
      <BoardArt />

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
        const active = hover === s.id || current === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            onPointerEnter={() => (setHover(s.id), onHover?.(s))}
            onPointerLeave={() => (setHover((h) => (h === s.id ? null : h)), onHover?.(null))}
            onFocus={() => (setHover(s.id), onHover?.(s))}
            onBlur={() => (setHover(null), onHover?.(null))}
            className="pin group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x / 10}%`, top: `${s.y / 6.4}%`, ["--pin" as string]: color }}
            aria-label={`${s.name}${closed ? "（準備中）" : ""}`}
            data-closed={closed || undefined}
            data-current={current === s.id || undefined}
          >
            <motion.span
              className="pin-dot block"
              animate={active ? { scale: 1.5 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            />
            {!closed && <span className="pin-pulse" />}
            <AnimatePresence>
              {hover === s.id && (
                <motion.span
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 4 }}
                  className="pin-label"
                >
                  {s.name}
                  {closed && <em> ／ CLOSED</em>}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}

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
  );
}
