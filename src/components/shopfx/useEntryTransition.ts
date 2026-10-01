"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 入店トランジションの進行管理。
 *   idle → tuning（ザッと砂嵐・0.45秒）→ focus（粗いドットからピントが合う・0.7秒）→ shown
 * 音は SOUND ON のときだけ、ごく小さく短く鳴らす（世界観の匂わせ程度）。
 */
export type EntryPhase = "idle" | "tuning" | "focus" | "shown";

export const TUNING_MS = 450;
export const FOCUS_MS = 700;

export function useEntryTransition(soundOn: boolean) {
  const [phase, setPhase] = useState<EntryPhase>("idle");
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const enter = useCallback(() => {
    clear();
    setPhase("tuning");
    if (soundOn) playTuningNoise(TUNING_MS / 1000);
    timers.current.push(
      window.setTimeout(() => setPhase("focus"), TUNING_MS),
      window.setTimeout(() => setPhase("shown"), TUNING_MS + FOCUS_MS),
    );
  }, [soundOn]);

  const leave = useCallback(() => {
    clear();
    setPhase("idle");
  }, []);

  useEffect(() => clear, []);
  return { phase, enter, leave };
}

let ctx: AudioContext | null = null;

/** バンドパスを掃引したホワイトノイズを一瞬だけ。音量は控えめ（akiraの要望で静かめ）。 */
function playTuningNoise(seconds: number) {
  try {
    ctx ??= new AudioContext();
    const c = ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(600, c.currentTime);
    bp.frequency.exponentialRampToValueAtTime(3200, c.currentTime + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + seconds);
    src.connect(bp).connect(g).connect(c.destination);
    src.start();
  } catch {
    /* 音が出せない環境では無音で続行 */
  }
}
