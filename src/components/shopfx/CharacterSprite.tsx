"use client";

import { useEffect, useState } from "react";
import { CHARACTER_ART, type CharacterId, type Facing } from "./characterArt";

/**
 * マップ上を歩く低解像度SDスプライト。
 * スプライトシートの1コマだけを background-position で切り出し、
 * image-rendering: pixelated のまま整数倍に拡大する（軽くてボケない）。
 */
export function CharacterSprite({
  id,
  facing = "down",
  walking = false,
  scale = 2,
  fps = 4,
  className = "",
}: {
  id: CharacterId;
  facing?: Facing;
  walking?: boolean;
  scale?: number;
  fps?: number;
  className?: string;
}) {
  const { sprite, name } = CHARACTER_ART[id];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!walking) {
      setFrame(0);
      return;
    }
    const t = window.setInterval(() => setFrame((f) => (f + 1) % sprite.frames), 1000 / fps);
    return () => window.clearInterval(t);
  }, [walking, fps, sprite.frames]);

  const row = sprite.rows[facing];
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-block [image-rendering:pixelated] ${className}`}
      style={{
        width: sprite.cellW * scale,
        height: sprite.cellH * scale,
        backgroundImage: `url(${sprite.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sprite.cellW * sprite.frames * scale}px auto`,
        backgroundPosition: `${-frame * sprite.cellW * scale}px ${-row * sprite.cellH * scale}px`,
      }}
    />
  );
}
