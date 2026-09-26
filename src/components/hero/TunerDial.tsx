"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useRadio } from "@/components/RadioProvider";
import { SHOPS } from "@/data/world";

const SWEEP = 270; // つまみの可動角（度）
const PAD = 5; // 目盛り窓の左右の余白（%）
const pos = (v: number) => PAD + v * (100 - PAD * 2);

/**
 * 画面上部のサウンドコントロール
 *  - SOUND ON/OFF と、レトロなつまみ + 目盛り窓での音量調整
 *  - 流れているのは「今いる場所」のBGM（街 / 入った店）
 */
export function TunerDial() {
  const { sound, setVolume, powered, togglePower } = useRadio();
  const volRef = useRef(sound.volume);
  volRef.current = sound.volume;

  const needle = useSpring(pos(sound.volume), { stiffness: 260, damping: 26 });
  const knobAngle = useSpring(0, { stiffness: 300, damping: 30 });
  const needleLeft = useTransform(needle, (v) => `${v}%`);
  useEffect(() => {
    needle.set(pos(sound.volume));
    knobAngle.set(sound.volume * SWEEP - SWEEP / 2);
  }, [sound.volume, needle, knobAngle]);

  // ── つまみ: 中心からの角度差で回す ──
  const knob = useRef<HTMLDivElement>(null);
  const onKnobDown = useCallback(
    (e: React.PointerEvent) => {
      const el = knob.current!;
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let prev = Math.atan2(e.clientY - cy, e.clientX - cx);
      const move = (ev: PointerEvent) => {
        const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        let d = a - prev;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        prev = a;
        setVolume(volRef.current + (d * 180) / Math.PI / SWEEP);
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    },
    [setVolume],
  );

  // ── 目盛り窓: 横ドラッグで針を直接動かす ──
  const scale = useRef<HTMLDivElement>(null);
  const onScaleDown = useCallback(
    (e: React.PointerEvent) => {
      const el = scale.current!;
      el.setPointerCapture(e.pointerId);
      const set = (clientX: number) => {
        const r = el.getBoundingClientRect();
        setVolume(((clientX - r.left) / r.width - PAD / 100) / (1 - PAD / 50));
      };
      set(e.clientX);
      const move = (ev: PointerEvent) => set(ev.clientX);
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    },
    [setVolume],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setVolume(sound.volume + step);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setVolume(sound.volume - step);
    else return;
    e.preventDefault();
  };

  const place = SHOPS.find((s) => s.id === sound.track.id)?.name ?? "街の音";
  const vol = Math.round(sound.volume * 10);

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      {/* 目盛り窓 */}
      <div className="min-w-0 flex-1">
        <div
          ref={scale}
          onPointerDown={onScaleDown}
          className="tuner-window relative h-12 cursor-ew-resize touch-none select-none overflow-hidden rounded-md"
        >
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className="absolute bottom-0 top-5 flex flex-col items-center" style={{ left: `${pos(i / 10)}%` }}>
              <span className={`-translate-x-1/2 font-mono text-[9px] text-amber-100/60 ${i % 2 ? "hidden sm:inline" : ""}`}>{i}</span>
              <span className="mt-0.5 h-full w-px -translate-x-1/2 bg-amber-100/30" />
            </div>
          ))}
          <motion.div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--pink)] shadow-[0_0_12px_var(--pink)]" style={{ left: needleLeft }} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px] sm:text-xs">
          <span className="shrink-0 whitespace-nowrap tabular-nums text-[var(--mint)]">VOL {vol}</span>
          <span className="truncate text-right text-amber-100/80">
            {powered ? `♪ ${place}${sound.muffled ? "（扉の向こうから）" : ""}` : "…（しずか）…"}
          </span>
        </div>
      </div>

      {/* つまみ */}
      <motion.div
        ref={knob}
        role="slider"
        tabIndex={0}
        aria-label="音量"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={vol}
        onPointerDown={onKnobDown}
        onKeyDown={onKey}
        style={{ rotate: knobAngle }}
        className="tuner-knob relative h-12 w-12 shrink-0 cursor-grab touch-none rounded-full active:cursor-grabbing sm:h-14 sm:w-14"
      >
        <span className="absolute left-1/2 top-1 h-3 w-1 -translate-x-1/2 rounded bg-[var(--pink)] shadow-[0_0_8px_var(--pink)]" />
      </motion.div>

      {/* 電源 */}
      <button
        onClick={togglePower}
        className="shrink-0 rounded-full border border-amber-100/30 px-3 py-2 font-mono text-[10px] tracking-widest text-amber-100 transition hover:border-[var(--mint)] sm:text-xs"
        aria-pressed={powered}
      >
        <span
          className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
          style={{ background: powered ? "var(--mint)" : "#442", boxShadow: powered ? "0 0 8px var(--mint)" : "none" }}
        />
        {powered ? "SOUND ON" : "SOUND OFF"}
      </button>
    </div>
  );
}
