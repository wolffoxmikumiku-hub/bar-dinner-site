/**
 * キャラクターごとの2種類のドット絵。
 *  - sprite:   マップ探索用の低解像度SDスプライトシート（行=向き, 列=歩行コマ）
 *  - portrait: 入店・EC・会話用の高精細ピクセル立ち絵
 * キャラを増やすときは public/characters/<id>/ に2枚置いて、ここに1件足すだけ。
 */

export type Facing = "down" | "up" | "left" | "right";

export type CharacterArt = {
  name: string;
  sprite: {
    src: string;
    cellW: number;
    cellH: number;
    frames: number;
    rows: Record<Facing, number>;
  };
  portrait: { src: string; w: number; h: number };
};

export const CHARACTER_ART = {
  crane: {
    name: "ニホンツルの女将",
    sprite: {
      src: "characters/crane/walk.png",
      cellW: 32,
      cellH: 44,
      frames: 2,
      rows: { down: 0, up: 1, left: 2, right: 3 },
    },
    portrait: { src: "characters/crane/standing.png", w: 84, h: 112 },
  },
} satisfies Record<string, CharacterArt>;

export type CharacterId = keyof typeof CHARACTER_ART;
