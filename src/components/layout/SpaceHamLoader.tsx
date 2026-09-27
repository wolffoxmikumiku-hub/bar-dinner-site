"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * ローディング: 宇宙（元絵の背景）は固定のまま、スペースハムだけが
 * ゆっくりぷかぷか浮遊しながら、くるりと回る
 */
export function SpaceHamLoader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 3600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#181425]"
          exit={{ opacity: 0, transition: { duration: 0.9 } }}
          aria-label="読み込み中"
          role="status"
        >
          <div className="stars absolute inset-0" aria-hidden />
          <div className="text-center">
            <div className="relative mx-auto h-64 w-64 sm:h-80 sm:w-80">
              {/* 背景（固定） */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/characters/space-ham-bg.png" alt="" aria-hidden className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
              {/* ハムスターだけが漂いながら回る */}
              <motion.div
                className="absolute inset-0"
                animate={{ x: [0, 6, -4, 0], y: [0, -10, 4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.img
                  src="/characters/space-ham-body.png"
                  alt="スペースハム"
                  className="absolute left-[12%] top-[12%] h-[76%] w-[76%] [image-rendering:pixelated]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                  draggable={false}
                />
              </motion.div>
            </div>
            <p className="mt-6 font-mono text-[10px] tracking-[0.4em] text-white/60">TUNING IN…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
