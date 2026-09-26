"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useRadio } from "@/components/RadioProvider";
import { FREQ_MAX, FREQ_MIN, STATIONS } from "@/lib/radioEngine";

const KHZ_PER_TURN = 360;
const pct = (f: number) => ((f - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * 100;

/**
 * 画面上部の周波数ダイヤル（チューナー）
 *  - つまみを円を描くようにドラッグ / 目盛り窓を左右にドラッグ / 矢印キーで選局
 *  - 局に近づくとBGMがフェードイン、局の間は空電ノイズ
 */
export function TunerDial() {
  const { tuner, setFrequency, powered, togglePower, glitch } = useRadio();
  const poweredRef = useRef(powered);
  poweredRef.current = powered;
  const freqRef = useRef(tuner.freq);
  freqRef.current = tuner.freq;

  const needle = useSpring(pct(tuner.freq), { stiffness: 260, damping: 26 });
  const knobAngle = useSpring(0, { stiffness: 300, damping: 30 });
  const needleLeft = useTransform(needle, (v) => `${v}%`);
  useEffect(() => {
    needle.set(pct(tuner.freq));
    knobAngle.set(((tuner.freq - FREQ_MIN) / KHZ_PER_TURN) * 360);
  }, [tuner.freq, needle, knobAngle]);

  const lastLocked = useRef<string | null>(null);
  useEffect(() => {
    const id = tuner.locked?.id ?? null;
    if (id && id !== lastLocked.current && poweredRef.current) glitch(0.25); // 局を捕まえた瞬間に一瞬ザッ
    lastLocked.current = id;
  }, [tuner.locked, glitch]);

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
        setFrequency(freqRef.current + (d / (Math.PI * 2)) * KHZ_PER_TURN);
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
    [setFrequency],
  );

  // ── 目盛り窓: 横ドラッグで針を直接動かす ──
  const scale = useRef<HTMLDivElement>(null);
  const onScaleDown = useCallback(
    (e: React.PointerEvent) => {
      const el = scale.current!;
      el.setPointerCapture(e.pointerId);
      const set = (clientX: number) => {
        const r = el.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        setFrequency(FREQ_MIN + t * (FREQ_MAX - FREQ_MIN));
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
    [setFrequency],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 50 : 10;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setFrequency(tuner.freq + step);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setFrequency(tuner.freq - step);
    else return;
    e.preventDefault();
  };

  const ticks = [];
  for (let f = 600; f <= 1600; f += 100) ticks.push(f);

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      {/* 目盛り窓 */}
      <div className="min-w-0 flex-1">
        <div
          ref={scale}
          onPointerDown={onScaleDown}
          className="tuner-window relative h-12 cursor-ew-resize touch-none select-none overflow-hidden rounded-md"
        >
          {ticks.map((f) => (
            <div key={f} className="absolute bottom-0 top-5 flex flex-col items-center" style={{ left: `${pct(f)}%` }}>
              <span className={`-translate-x-1/2 font-mono text-[9px] text-amber-100/60 ${f % 200 ? "hidden sm:inline" : ""}`}>{f / 10}</span>
              <span className="mt-0.5 h-full w-px -translate-x-1/2 bg-amber-100/30" />
            </div>
          ))}
          {STATIONS.map((s) => (
            <div
              key={s.id}
              title={s.name}
              className="absolute top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
              style={{
                left: `${pct(s.freq)}%`,
                background: tuner.locked?.id === s.id ? "var(--pink)" : "rgba(255,230,200,0.35)",
                boxShadow: tuner.locked?.id === s.id ? "0 0 10px var(--pink)" : "none",
              }}
            />
          ))}
          <motion.div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--pink)] shadow-[0_0_12px_var(--pink)]" style={{ left: needleLeft }} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px] sm:text-xs">
          <span className="shrink-0 whitespace-nowrap tabular-nums text-[var(--mint)]">{Math.round(tuner.freq)} kHz</span>
          <span className="truncate text-right text-amber-100/80">
            {tuner.locked ? `♪ ${tuner.locked.name}` : "…ザザ…（空電）…"}
          </span>
        </div>
      </div>

      {/* つまみ */}
      <motion.div
        ref={knob}
        role="slider"
        tabIndex={0}
        aria-label="周波数ダイヤル"
        aria-valuemin={FREQ_MIN}
        aria-valuemax={FREQ_MAX}
        aria-valuenow={Math.round(tuner.freq)}
        aria-valuetext={`${Math.round(tuner.freq)}キロヘルツ ${tuner.locked?.name ?? "受信なし"}`}
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
