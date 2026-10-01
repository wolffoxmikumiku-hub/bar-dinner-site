"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CHARACTER_ART, type CharacterId } from "./characterArt";
import { PixelFocusPortrait } from "./PixelFocusPortrait";
import { useEntryTransition } from "./useEntryTransition";

export type ShopItem = { name: string; price: number; href?: string };

/**
 * 店舗入店 / EC / 会話イベント用モーダル。
 *   左：高精細ピクセル立ち絵（入店時に砂嵐→ピント合わせ）
 *   右：レトロゲーム風メッセージウィンドウ（1文字ずつ表示、クリックで次へ）＋商品一覧
 * 閉店中は誰もいない：立ち絵もセリフも出さず CLOSED の札だけ。
 */
export function ShopDialogueModal({
  open,
  onClose,
  shopName,
  isOpen,
  characterId,
  lines,
  items,
  soundOn = false,
  onAddToCart,
}: {
  open: boolean;
  onClose: () => void;
  shopName: string;
  isOpen: boolean;
  characterId: CharacterId;
  lines: string[];
  items: ShopItem[];
  soundOn?: boolean;
  onAddToCart?: (item: ShopItem) => void;
}) {
  const art = CHARACTER_ART[characterId];
  const { phase, enter, leave } = useEntryTransition(soundOn);
  const [lineIdx, setLineIdx] = useState(0);
  const typed = useTypewriter(phase === "shown" ? lines[lineIdx] ?? "" : "", 40);

  useEffect(() => {
    if (open && isOpen) enter();
    else leave();
    setLineIdx(0);
  }, [open, isOpen, enter, leave]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const done = typed.length >= (lines[lineIdx]?.length ?? 0);
  const next = () => {
    if (!done) return;
    setLineIdx((i) => Math.min(lines.length - 1, i + 1));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={shopName}
            onClick={(e) => e.stopPropagation()}
            initial={{ scaleY: 0.02, opacity: 0.6 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0.02, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-3xl overflow-hidden rounded-md border-2 border-[#c9a45c] bg-[#0b0f14] font-mono text-[#e9e3d0] shadow-[0_0_40px_rgba(0,0,0,.6)]"
          >
            <header className="flex items-center justify-between border-b border-[#c9a45c]/40 px-4 py-2 text-xs tracking-[0.25em]">
              <span>{shopName}</span>
              <button onClick={onClose} className="opacity-70 hover:opacity-100">
                ✕ CLOSE
              </button>
            </header>

            {!isOpen ? (
              <div className="grid place-items-center px-6 py-16 text-center">
                <span className="rounded border-2 border-[#c9a45c] px-6 py-3 text-2xl tracking-[0.3em]">CLOSED</span>
                <p className="mt-4 text-xs opacity-60">本日の営業は終了しました。店内には誰もいません。</p>
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
                <div className="mx-auto self-end">
                  <PixelFocusPortrait
                    src={art.portrait.src}
                    w={art.portrait.w}
                    h={art.portrait.h}
                    scale={3}
                    phase={phase}
                    alt={art.name}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-3">
                  {/* メッセージウィンドウ */}
                  <button
                    onClick={next}
                    className="relative min-h-28 rounded border-2 border-[#e9e3d0] bg-[#10162a] p-3 text-left text-sm leading-relaxed"
                  >
                    <span className="mb-1 block text-[10px] tracking-[0.3em] text-[#c9a45c]">{art.name}</span>
                    {phase === "shown" ? typed : <span className="opacity-40">……</span>}
                    {phase === "shown" && done && lineIdx < lines.length - 1 && (
                      <motion.span
                        aria-hidden
                        className="absolute bottom-2 right-3"
                        animate={{ y: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      >
                        ▼
                      </motion.span>
                    )}
                  </button>

                  {/* 商品一覧（EC） */}
                  <motion.ul
                    initial={false}
                    animate={{ opacity: phase === "shown" ? 1 : 0.25 }}
                    className="space-y-1.5"
                  >
                    {items.map((it) => (
                      <li key={it.name} className="flex items-center justify-between gap-3 border border-[#e9e3d0]/20 px-3 py-2 text-sm">
                        <span className="truncate">{it.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs opacity-70">¥{it.price.toLocaleString()}</span>
                          {it.href ? (
                            <a href={it.href} className="rounded px-2 py-1 text-[10px] ring-1 ring-[#c9a45c]">
                              BUY
                            </a>
                          ) : (
                            <button
                              disabled={phase !== "shown"}
                              onClick={() => onAddToCart?.(it)}
                              className="rounded px-2 py-1 text-[10px] ring-1 ring-[#c9a45c] disabled:opacity-30"
                            >
                              CART
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useTypewriter(text: string, cps: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const t = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 1000 / cps);
    return () => window.clearInterval(t);
  }, [text, cps]);
  return text.slice(0, n);
}
