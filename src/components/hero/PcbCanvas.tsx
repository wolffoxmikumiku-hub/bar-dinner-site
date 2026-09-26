"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useRadio } from "@/components/RadioProvider";
import { fragmentShader, vertexShader } from "./pcbShader";

export type MirrorSpot = { x: number; y: number; r: number };

/**
 * ヒーロー背景。Three.js のフルスクリーンクアッドに PCB シェーダーを描く。
 * WebGLが使えない環境では CSS のグラデーションにフォールバックする。
 */
export function PcbCanvas({ mirror, className }: { mirror: MirrorSpot; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const { fx, reception } = useRadio();
  const mirrorRef = useRef(mirror);
  mirrorRef.current = mirror;
  const weatherRef = useRef(reception?.weather);
  weatherRef.current = reception?.weather;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      el.dataset.fallback = "1";
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMirror: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uNoise: { value: 0.4 },
      uGlitch: { value: 0 },
      uLevel: { value: 0 },
      uRain: { value: 0 },
      uStorm: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      const pr = renderer.getPixelRatio();
      uniforms.uRes.value.set(width * pr, height * pr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    window.addEventListener("pointermove", onMove);

    // 画面外では描画を止める
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    let last = performance.now();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      uniforms.uTime.value += dt * (reduced ? 0.25 : 1);
      const m = mirrorRef.current;
      uniforms.uMirror.value.set(m.x, m.y, m.r);
      const w = weatherRef.current;
      uniforms.uRain.value += ((w === "rain" || w === "storm" ? 1 : 0) - uniforms.uRain.value) * 0.02;
      uniforms.uStorm.value = w === "storm" ? 1 : 0;
      // 天候が砂嵐の日は常にノイズ多め
      uniforms.uNoise.value += (fx.current.noise + (w === "static" ? 0.35 : 0) - uniforms.uNoise.value) * 0.1;
      uniforms.uGlitch.value = reduced ? Math.min(fx.current.glitch, 0.3) : fx.current.glitch;
      uniforms.uLevel.value += (fx.current.level - uniforms.uLevel.value) * 0.2;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [fx]);

  return <div ref={host} className={`pcb-fallback ${className ?? ""}`} aria-hidden />;
}
