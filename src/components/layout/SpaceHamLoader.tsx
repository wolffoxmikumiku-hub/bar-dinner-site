"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** ローディング: 真っ暗な宇宙でスペースハムがぷかぷか浮いて宙返りする */
export function SpaceHamLoader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 1900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#020406]"
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          aria-label="読み込み中"
          role="status"
        >
          <div className="stars absolute inset-0" aria-hidden />
          <div className="text-center">
            <motion.div
              className="relative mx-auto grid h-28 w-28 place-items-center"
              animate={{ y: [0, -10, 0], rotate: [0, 0, 360, 360] }}
              transition={{
                y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 1.9, times: [0, 0.35, 0.8, 1], ease: "easeInOut" },
              }}
            >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/characters/space-ham.png" alt="スペースハム" className="h-24 w-24 rounded-full [image-rendering:pixelated]" />
            </motion.div>
            <p className="mt-6 font-mono text-[10px] tracking-[0.4em] text-white/60">TUNING IN…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
