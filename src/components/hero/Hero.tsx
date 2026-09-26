"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRadio } from "@/components/RadioProvider";
import { WEATHER_LABEL } from "@/lib/reception";
import { PcbCanvas, type MirrorSpot } from "./PcbCanvas";

const LANDSCAPE: MirrorSpot = { x: 0.74, y: 0.3, r: 0.12 };
const PORTRAIT: MirrorSpot = { x: 0.64, y: 0.3, r: 0.085 };

export function Hero() {
  const { reception, openEgg } = useRadio();
  const box = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 800 });
  const mirror = size.w / size.h < 0.9 ? PORTRAIT : LANDSCAPE;

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // シェーダー座標 → CSS座標（シェーダーは下が0、CSSは上が0）
  const hot = {
    left: mirror.x * size.w,
    top: (1 - mirror.y) * size.h,
    d: mirror.r * size.h * 2.4,
  };

  return (
    <section ref={box} className="relative h-[100svh] min-h-[560px] overflow-hidden" aria-label="基板惑星 壊れたレトロラジオ">
      <PcbCanvas mirror={mirror} className="absolute inset-0" />

      {/* シルクスクリーン印字 */}
      <div aria-hidden className="silk pointer-events-none absolute inset-0 hidden select-none sm:block">
        <span style={{ left: "6%", top: "22%" }}>C7 470μF 16V</span>
        <span style={{ left: "58%", top: "16%" }}>R12 ─ 4.7kΩ</span>
        <span style={{ left: "10%", bottom: "14%" }}>BT1 27A 12V ⊕</span>
        <span style={{ right: "6%", top: "44%" }}>X1 32.768kHz</span>
        <span style={{ left: "40%", bottom: "6%" }}>ANT ⌁ AMP-OUT</span>
      </div>

      {/* ハンダの鏡面広場（クリックでイースターエッグ） */}
      <button
        onClick={openEgg}
        aria-label="銀色の鏡面広場（シルバー・ミラー）"
        className="mirror-hotspot absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: hot.left, top: hot.top, width: hot.d, height: hot.d * 0.8 }}
      >
        <span className="silk-label absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap">
          SILVER MIRROR 広場
        </span>
      </button>

      {/* タイトル */}
      <div className="pointer-events-none absolute inset-x-0 top-[22%] px-4 sm:left-[7%] sm:right-auto sm:top-[30%] sm:px-0">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-mono text-xs tracking-[0.3em] text-[var(--mint)]"
        >
          PLANET PCB / DRIFTING SINCE ????
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, letterSpacing: "0em" }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="glitch-title mt-3 text-4xl font-black leading-tight text-white sm:text-6xl"
          data-text="壊れたレトロラジオ"
        >
          壊れたレトロラジオ
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-emerald-50/80 sm:text-base"
        >
          宇宙を漂う、電源の切れたラジオ。その基板の上に街がある。
          <br />
          アンテナがあなたのアクセスを受信すると、今日の天気と客が決まる。
        </motion.p>
      </div>

      {/* 受信ログ */}
      <AnimatePresence>
        {reception && (
          <motion.dl
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
            className="hud absolute bottom-5 left-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] sm:bottom-8 sm:left-auto sm:right-8 sm:text-xs"
          >
            <dt>ANT.RX</dt>
            <dd>
              {"▮".repeat(Math.round(reception.signal * 5))}
              {"▯".repeat(5 - Math.round(reception.signal * 5))} {reception.connection}
            </dd>
            <dt>WEATHER</dt>
            <dd>{WEATHER_LABEL[reception.weather]}</dd>
            <dt>LOCAL</dt>
            <dd>
              {String(reception.hour).padStart(2, "0")}:00 {reception.isNight ? "／ Bar 点灯中" : "／ Bar は20時から"}
            </dd>
            <dt>VISIT</dt>
            <dd>
              #{reception.visitCount} via {reception.origin}
            </dd>
          </motion.dl>
        )}
      </AnimatePresence>

      <a
        href="#map"
        className="absolute bottom-5 right-4 font-mono text-[10px] tracking-widest text-emerald-100/70 hover:text-white sm:bottom-8 sm:left-[7%] sm:right-auto sm:text-xs"
      >
        ↓ 基板マップへ
      </a>
    </section>
  );
}
