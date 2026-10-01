"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { AREAS, COPPER, SHOPS, YAMASEMI_STALL, areaById, type Shop } from "@/data/world";
import { meets } from "@/lib/reception";
import { BoardArt } from "./BoardArt";
import { CharacterSprite } from "@/components/shopfx/CharacterSprite";
import type { Facing } from "@/components/shopfx/characterArt";

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

      {/* 丹頂の前を行き来する女将（低解像度スプライト。押すと入店） */}
      {(() => {
        const tancho = shops.find((s) => s.id === "tancho");
        return tancho ? <CraneWalker x={tancho.x} y={tancho.y} onClick={() => onPick(tancho)} /> : null;
      })()}

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

/** 店の前を左右に行き来する（地図座標 1000x640） */
function CraneWalker({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setT(((now - t0) / 1000) % 12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  // 0–5秒: 左へ歩く / 5–6秒: こちらを向いて止まる / 6–11秒: 右へ戻る / 11–12秒: 止まる
  const span = 70;
  let dx = 0;
  let facing: Facing = "down";
  let walking = false;
  if (t < 5) (dx = -span * (t / 5), (facing = "left"), (walking = true));
  else if (t < 6) dx = -span;
  else if (t < 11) (dx = -span + span * ((t - 6) / 5), (facing = "right"), (walking = true));
  return (
    <button
      aria-label="ニホンツルの女将（割烹料理 丹頂に入る）"
      onClick={onClick}
      className="absolute z-[2] -translate-x-1/2 -translate-y-full"
      style={{ left: `${(x - 30 + dx) / 10}%`, top: `${(y + 40) / 6.4}%` }}
    >
      <CharacterSprite id="crane" facing={facing} walking={walking} scale={1} fps={5} />
    </button>
  );
}
