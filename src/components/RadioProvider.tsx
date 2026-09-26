"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RadioEngine, type Station } from "@/lib/radioEngine";
import { receive, type Reception } from "@/lib/reception";

type TunerState = { freq: number; locked: Station | null; noise: number };

type Ctx = {
  engine: RadioEngine;
  powered: boolean;
  togglePower: () => Promise<void>;
  tuner: TunerState;
  setFrequency: (f: number) => void;
  reception: Reception | null;
  /** シェーダーが毎フレーム読む値。再レンダリングを避けるため ref */
  fx: React.MutableRefObject<{ noise: number; glitch: number; level: number }>;
  glitch: (strength?: number, ms?: number) => void;
  eggOpen: boolean;
  openEgg: () => void;
  closeEgg: () => void;
};

const RadioContext = createContext<Ctx | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => new RadioEngine(), []);
  const [powered, setPowered] = useState(false);
  const [tuner, setTuner] = useState<TunerState>({ freq: 700, locked: null, noise: 0.4 });
  const [reception, setReception] = useState<Reception | null>(null);
  const [eggOpen, setEggOpen] = useState(false);
  const fx = useRef({ noise: 0.4, glitch: 0, level: 0 });

  useEffect(() => {
    setReception(receive());
    const off = engine.subscribe((s) => {
      setTuner(s);
      fx.current.noise = s.noise;
    });
    setTuner(engine.setFrequency(700));
    return () => {
      off();
      engine.stop();
    };
  }, [engine]);

  // 受信感度が低い日は常に少しノイズが多い
  useEffect(() => {
    if (!reception) return;
    let raf = 0;
    const loop = () => {
      fx.current.level = engine.level();
      fx.current.glitch *= 0.94;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, reception]);

  const togglePower = useCallback(async () => {
    if (engine.running) {
      engine.stop();
      setPowered(false);
    } else {
      await engine.start();
      setPowered(true);
    }
  }, [engine]);

  const setFrequency = useCallback((f: number) => void engine.setFrequency(f), [engine]);

  const glitch = useCallback(
    (strength = 1) => {
      fx.current.glitch = Math.max(fx.current.glitch, strength);
      engine.burst(0.4 + strength * 0.8);
    },
    [engine],
  );

  const openEgg = useCallback(() => {
    glitch(1.2);
    setEggOpen(true);
    try {
      localStorage.setItem("brr:mirror-found", "1");
    } catch {}
  }, [glitch]);
  const closeEgg = useCallback(() => setEggOpen(false), []);

  return (
    <RadioContext.Provider
      value={{ engine, powered, togglePower, tuner, setFrequency, reception, fx, glitch, eggOpen, openEgg, closeEgg }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const c = useContext(RadioContext);
  if (!c) throw new Error("useRadio must be used inside <RadioProvider>");
  return c;
}
