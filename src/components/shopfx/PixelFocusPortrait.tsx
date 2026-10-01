"use client";

import { useEffect, useRef } from "react";
import { FOCUS_MS, type EntryPhase } from "./useEntryTransition";

/**
 * 高精細の立ち絵を canvas に描き、ブロックサイズを 16→1 と細かくしていくことで
 * 「低解像度のドットからピントが合う」ように見せる。
 * tuning 中は砂嵐と走査線、shown で静止。
 */
export function PixelFocusPortrait({
  src,
  w,
  h,
  scale = 4,
  phase,
  alt,
}: {
  src: string;
  w: number;
  h: number;
  scale?: number;
  phase: EntryPhase;
  alt: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const i = new Image();
    i.src = src;
    img.current = i;
  }, [src]);

  useEffect(() => {
    const cv = canvas.current;
    const g = cv?.getContext("2d");
    if (!cv || !g) return;
    g.imageSmoothingEnabled = false;
    const small = document.createElement("canvas");
    let raf = 0;
    const start = performance.now();

    const drawBlocks = (block: number) => {
      const i = img.current;
      g.clearRect(0, 0, w, h);
      if (!i?.complete) return;
      if (block <= 1) {
        g.drawImage(i, 0, 0, w, h);
        return;
      }
      // 別キャンバスに縮小 → smoothing無効で拡大してブロック化
      const sw = Math.max(1, Math.ceil(w / block));
      const sh = Math.max(1, Math.ceil(h / block));
      small.width = sw;
      small.height = sh;
      small.getContext("2d")!.drawImage(i, 0, 0, sw, sh);
      g.drawImage(small, 0, 0, sw, sh, 0, 0, w, h);
    };

    const drawStatic = () => {
      const data = g.createImageData(w, h);
      for (let p = 0; p < data.data.length; p += 4) {
        const v = Math.random() * 200;
        data.data[p] = data.data[p + 1] = data.data[p + 2] = v;
        data.data[p + 3] = Math.random() < 0.55 ? 160 : 0;
      }
      g.putImageData(data, 0, 0);
    };

    const tick = (now: number) => {
      const t = now - start;
      if (phase === "tuning") {
        drawStatic();
      } else if (phase === "focus") {
        const k = Math.min(1, t / FOCUS_MS);
        const steps = [16, 12, 8, 6, 4, 3, 2, 1];
        drawBlocks(steps[Math.min(steps.length - 1, Math.floor(k * steps.length))]);
      } else {
        drawBlocks(phase === "shown" ? 1 : 16);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, w, h]);

  return (
    <div className="relative" style={{ width: w * scale, height: h * scale }}>
      <canvas
        ref={canvas}
        width={w}
        height={h}
        role="img"
        aria-label={alt}
        className="h-full w-full [image-rendering:pixelated]"
      />
      {phase !== "shown" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.35)_0_2px,transparent_2px_4px)] mix-blend-multiply"
        />
      )}
    </div>
  );
}
