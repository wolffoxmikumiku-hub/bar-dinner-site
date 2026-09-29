"use client";

import { motion } from "framer-motion";
import { COPPER } from "@/data/world";
import { Battery27A, BatteryBandolier } from "@/components/characters/BatteryBandolier";
import { TunerDial } from "@/components/hero/TunerDial";

export function TopBar() {
  return (
    <header className="topbar fixed inset-x-0 top-0 z-40 px-3 py-2 sm:px-6 sm:py-3">
      <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-6">
        <a href="#" className="hidden shrink-0 font-mono text-xs font-bold tracking-[0.25em] text-white sm:block">
          P<span className="text-[var(--pink)]">/</span>C<span className="text-[var(--mint)]">/</span>B
        </a>
        <div className="min-w-0 flex-1">
          <TunerDial />
        </div>
      </div>
    </header>
  );
}

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7 },
};

export function Lore() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
        <motion.div {...fade}>
          <p className="font-mono text-xs tracking-[0.3em] text-[var(--cinnamon)]">THE PLANET</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">
            電源は、
            <br />
            とっくに切れている。
          </h2>
          <figure className="mt-8 overflow-hidden rounded-xl border border-emerald-200/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/scenes/board-overview.webp"
              alt="基板の上の街。CPUの上にダイナー、その脇にBar: The Node、銅箔の道をキッチンカーが走る"
              className="aspect-[16/10] w-full object-cover object-left [image-rendering:pixelated]"
              loading="lazy"
            />
          </figure>
        </motion.div>
        <motion.div {...fade} className="space-y-4 text-sm leading-loose text-emerald-50/80 sm:text-base">
          <p>
            宇宙空間を漂流する、巨大な“なにか”。住人たちが暮らすのは、その内部の基板（PCB）の上だ。自分たちの星がもともと何だったのか、知っている者はいない。
          </p>
          <p>
            電気は来ていないはずなのに、ときどき微弱なノイズと静電気が走る。
            どこかのアンテナだけはまだ生きていて、遠くの「アクセス」を拾っては、この星の天気や、やって来る客を変えていく。
          </p>
          <p>
            散歩なら「流動の丘」。なぜあんなにツルッとしているのか、誰も知らない。
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function Signature() {
  return (
    <section id="signature" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <p className="font-mono text-xs tracking-[0.3em] text-[var(--pink)]">SIGNATURE</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">街の共通記号</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <motion.div {...fade} className="sig-card">
          <Battery27A className="w-48" />
          <BatteryBandolier className="mt-4 w-40" cells={8} />
          <h3 className="mt-5 text-lg font-bold text-white">「27A 12V」超小型乾電池</h3>
          <p className="mt-2 text-sm text-emerald-50/70">
            ヤマセミ兄妹とカラスの旦那だけが、胸や肩にガンベルト（弾帯）状に巻きつけている。ジャンクを渡り歩く彼らの商売道具で、お守り。
          </p>
        </motion.div>
        <motion.div {...fade} className="sig-card">
          <div className="flex gap-3">
            {(Object.entries(COPPER) as [keyof typeof COPPER, string][]).map(([k, v]) => (
              <div key={k} className="flex-1">
                <div className="h-16 rounded-md" style={{ background: v, boxShadow: `0 0 24px ${v}66` }} />
                <p className="mt-2 font-mono text-[11px] text-emerald-50/70">
                  {{ pink: "ネオンピンク", mint: "ミントグリーン", cinnamon: "シナモンブラウン" }[k]}
                  <br />
                  {v}
                </p>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 300 40" className="mt-5 w-full" aria-hidden>
            {(["pink", "mint", "cinnamon"] as const).map((k, i) => (
              <path
                key={k}
                d={`M0 ${8 + i * 12} H${90 + i * 20} L${110 + i * 20} ${20 - i * 0} H300`}
                stroke={COPPER[k]}
                strokeWidth="3"
                fill="none"
                className="trace-flow"
                style={{ animationDelay: `${-i}s` }}
              />
            ))}
          </svg>
          <h3 className="mt-5 text-lg font-bold text-white">配線パターン（銅箔ライン）</h3>
          <p className="mt-2 text-sm text-emerald-50/70">ネオンピンク・ミントグリーン・シナモンブラウンの三本組。街のサインも服も、この三色で描かれる。</p>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-emerald-100/10 px-4 py-10 text-center font-mono text-[10px] tracking-widest text-emerald-50/40">
      PLANET PCB
      <br />
      ANT.RX で受信したアクセスは、この星の天気になります。
    </footer>
  );
}
