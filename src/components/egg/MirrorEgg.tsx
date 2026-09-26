"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { REI_YUU_URL } from "@/data/world";

/**
 * 隠しギミック: 「ハンダの鏡面広場」をクリックすると
 *   1) 砂嵐ノイズ（Canvas + 音）
 *   2) 鏡面に外の世界が映り込み、漫画『レイとユウ』の特別ビジュアルとリンクが現れる
 * 叙述トリックは断定せず「作業ログ」の断片として匂わせる。
 */
export function MirrorEgg() {
  const { eggOpen, closeEgg } = useRadio();
  const [phase, setPhase] = useState<"noise" | "reveal">("noise");

  useEffect(() => {
    if (!eggOpen) return;
    setPhase("noise");
    const t = window.setTimeout(() => setPhase("reveal"), 1500);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeEgg();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [eggOpen, closeEgg]);

  return (
    <AnimatePresence>
      {eggOpen && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          role="dialog"
          aria-modal="true"
          aria-label="シルバー・ミラーの受信"
        >
          <StaticNoise intensity={phase === "noise" ? 1 : 0.12} />
          <AnimatePresence mode="wait">
            {phase === "noise" ? (
              <motion.p
                key="n"
                exit={{ opacity: 0 }}
                className="glitch-title absolute inset-0 grid place-items-center font-mono text-sm tracking-[0.4em] text-white"
                data-text="受信中… 受信中…"
              >
                受信中… 受信中…
              </motion.p>
            ) : (
              <Reveal key="r" onClose={closeEgg} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Reveal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
        className="solder-mirror relative aspect-square w-[min(78vw,420px)]"
      >
        {/* 鏡面に映る、外の世界のふたり */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full mix-blend-multiply" aria-hidden>
          <g opacity="0.55" fill="#20262b">
            <circle cx="78" cy="78" r="16" />
            <path d="M52 150 C54 112 64 98 78 98 C92 98 102 112 104 150 Z" />
            <circle cx="126" cy="84" r="13" />
            <path d="M104 150 C106 118 114 106 126 106 C138 106 146 118 148 150 Z" />
            {/* ハンダゴテの影 */}
            <path d="M150 40 L112 96" stroke="#20262b" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.85) 48%, transparent 60%)" }}
          animate={{ x: ["-60%", "60%"] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <p className="mt-10 font-mono text-[10px] tracking-[0.4em] text-[var(--mint)]">SIGNAL FROM OUTSIDE</p>
        <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">レイとユウ</h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-emerald-50/80">
          ツルッとした銀色の地面に、見たことのない大きな影がふたつ映った。
          <br />
          ずっと昔、この広場がまだ熱かった頃のこと。
        </p>

        <pre className="worklog mx-auto mt-6 max-w-sm text-left">
{`[作業ログ 断片]
GND ベタアース ... ハンダ盛り OK
フィレット形状 ... なめらか
作業者 ........... R / Y
メモ: 「きれいに光ったね」`}
        </pre>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={REI_YUU_URL}
            target={REI_YUU_URL.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[var(--mint)]"
          >
            漫画『レイとユウ』を読む
          </a>
          <button onClick={onClose} className="px-4 py-3 font-mono text-xs tracking-widest text-emerald-50/60 hover:text-white">
            基板に戻る
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** 低解像度で描いて拡大する砂嵐 */
function StaticNoise({ intensity }: { intensity: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const k = useRef(intensity);
  k.current = intensity;

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const W = 160;
    const H = 100;
    c.width = W;
    c.height = H;
    const img = ctx.createImageData(W, H);
    let raf = 0;
    const draw = () => {
      const d = img.data;
      const roll = (performance.now() / 8) % H;
      for (let y = 0; y < H; y++) {
        const band = Math.abs(y - roll) < 6 ? 60 : 0;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const v = Math.random() * 255 * 0.9 + band;
          d[i] = v;
          d[i + 1] = v * 0.98;
          d[i + 2] = v * 1.02;
          d[i + 3] = 255 * k.current;
        }
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full [image-rendering:pixelated]" />;
}
