"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RadioEngine, type SoundState } from "@/lib/radioEngine";
import { receive, type Reception } from "@/lib/reception";

type Ctx = {
  engine: RadioEngine;
  powered: boolean;
  togglePower: () => Promise<void>;
  sound: SoundState;
  setVolume: (v: number) => void;
  /** 店に入る（null で街に戻る）。閉店中なら扉越しのこもった音 */
  enterShop: (id: string | null, closed?: boolean) => void;
  reception: Reception | null;
  /** シェーダーが毎フレーム読む値。再レンダリングを避けるため ref */
  fx: React.MutableRefObject<{ noise: number; glitch: number; level: number }>;
  glitch: (strength?: number, ms?: number) => void;
};

const RadioContext = createContext<Ctx | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => new RadioEngine(), []);
  const [powered, setPowered] = useState(false);
  const [sound, setSound] = useState<SoundState>(() => engine.state());
  const [reception, setReception] = useState<Reception | null>(null);
  const fx = useRef({ noise: 0.25, glitch: 0, level: 0 });

  useEffect(() => {
    const r = receive();
    setReception(r);
    // 受信感度が低い日は常に少しノイズが多い
    fx.current.noise = 0.12 + (1 - r.signal) * 0.4;
    const off = engine.subscribe(setSound);
    return () => {
      off();
      engine.stop();
    };
  }, [engine]);

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

  const setVolume = useCallback((v: number) => engine.setVolume(v), [engine]);
  const enterShop = useCallback((id: string | null, closed = false) => engine.play(id, closed), [engine]);

  const glitch = useCallback(
    (strength = 1) => {
      fx.current.glitch = Math.max(fx.current.glitch, strength);
      engine.burst(0.3 + strength * 0.5);
    },
    [engine],
  );

  return (
    <RadioContext.Provider value={{ engine, powered, togglePower, sound, setVolume, enterShop, reception, fx, glitch }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const c = useContext(RadioContext);
  if (!c) throw new Error("useRadio must be used inside <RadioProvider>");
  return c;
}
