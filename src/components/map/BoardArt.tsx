"use client";

import { COPPER } from "@/data/world";

/**
 * 全体基板マップの「絵」の部分（SVG）。
 * 部品＝エリア。インタラクションは CircuitMap 側の HTML ピンが持つ。
 */

const TRACES: { d: string; c: keyof typeof COPPER }[] = [
  { d: "M500 285 H330 V165 H215", c: "pink" },
  { d: "M500 285 V120 H770", c: "mint" },
  { d: "M500 285 H650 V470 H800", c: "cinnamon" },
  { d: "M500 285 V400 H190 V470", c: "mint" },
  { d: "M500 285 H935", c: "pink" },
  { d: "M215 165 V300 H60", c: "cinnamon" },
  { d: "M190 470 H320 L380 530 H440", c: "pink" },
  { d: "M800 470 V580 H700", c: "mint" },
  { d: "M770 150 H900 V300", c: "cinnamon" },
  { d: "M215 165 H120 V60 H880 V150", c: "mint" },
  { d: "M60 300 V600 H420", c: "pink" },
];

export function BoardArt({ onMirror }: { onMirror: () => void }) {
  return (
    <svg viewBox="0 0 1000 640" className="absolute inset-0 h-full w-full" role="img" aria-label="基板全体図">
      <defs>
        <pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#06261a" />
          <path d="M0 6 H12 M6 0 V12" stroke="#0a3323" strokeWidth="1" />
        </pattern>
        <linearGradient id="solder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f7fa" />
          <stop offset="0.35" stopColor="#8f9aa3" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#6b7680" />
          <stop offset="1" stopColor="#dfe6ea" />
          <animateTransform attributeName="gradientTransform" type="translate" values="-0.4 0; 0.4 0; -0.4 0" dur="6s" repeatCount="indefinite" />
        </linearGradient>
        <linearGradient id="can" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e5ebef" />
          <stop offset="0.5" stopColor="#8a959d" />
          <stop offset="1" stopColor="#c9d1d6" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="4" y="4" width="992" height="632" rx="24" fill="url(#weave)" stroke="#0f4a33" strokeWidth="3" />
      {/* 取付穴 */}
      {[
        [30, 30],
        [970, 30],
        [30, 610],
        [970, 610],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="10" fill="#020d08" stroke="#b9a36b" strokeWidth="3" />
      ))}

      {/* 銅箔ライン: 下地 + 流光 */}
      {TRACES.map((t, i) => (
        <g key={i}>
          <path d={t.d} fill="none" stroke="#1d4a2a" strokeWidth="7" strokeLinejoin="round" />
          <path
            d={t.d}
            fill="none"
            stroke={COPPER[t.c]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="trace-flow"
            style={{ animationDelay: `${-i * 0.7}s`, animationDuration: `${3 + (i % 4)}s` }}
            filter="url(#glow)"
          />
        </g>
      ))}

      {/* ① CPUヒートシンク */}
      <g transform="translate(500 285)">
        <rect x="-85" y="-85" width="170" height="170" rx="6" fill="#1b2422" stroke="#56615d" strokeWidth="2" />
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={-78 + i * 15} y="-78" width="6" height="156" rx="2" fill="#3b4744" />
        ))}
        <text y="100" textAnchor="middle" className="silk-svg">U1 CPU / HEATSINK</text>
      </g>

      {/* ② 電解コンデンサ群 */}
      {[
        [215, 165, 46],
        [150, 215, 30],
        [285, 110, 26],
        [290, 215, 22],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={r} fill="#1b2f5a" stroke="#9fb2d9" strokeWidth="2" />
          <path d={`M${-r * 0.5} 0 H${r * 0.5} M0 ${-r * 0.5} V${r * 0.5}`} stroke="#c7d3ea" strokeWidth="2" />
          <path d={`M${r * 0.7} ${-r * 0.7} A${r} ${r} 0 0 1 ${r * 0.7} ${r * 0.7}`} fill="none" stroke="#d6dde9" strokeWidth={r * 0.18} opacity="0.7" />
        </g>
      ))}
      <text x="215" y="240" textAnchor="middle" className="silk-svg">C1–C4 ELECTROLYTIC</text>

      {/* ③ 抵抗器 */}
      {[
        [770, 150, ["#8b4513", "#000", "#ff0000"]],
        [770, 110, ["#ffd700", "#8a2be2", "#ff0000"]],
        [770, 190, ["#ff7f00", "#ff7f00", "#8b4513"]],
      ].map(([x, y, bands], i) => (
        <g key={i} transform={`translate(${x as number} ${y as number})`}>
          <line x1="-80" x2="80" stroke="#bfc6c9" strokeWidth="3" />
          <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#d8c29a" />
          {(bands as string[]).map((b, j) => (
            <rect key={j} x={-30 + j * 16} y="-12" width="7" height="24" fill={b} />
          ))}
          <rect x="24" y="-12" width="7" height="24" fill="#d4af37" />
        </g>
      ))}
      <text x="770" y="222" textAnchor="middle" className="silk-svg">R1–R3</text>

      {/* ④ クォーツ（HC-49缶） */}
      <g transform="translate(800 470)">
        <rect x="-75" y="-30" width="150" height="60" rx="30" fill="url(#can)" stroke="#fff" strokeOpacity="0.4" />
        <text y="5" textAnchor="middle" fill="#2d383f" fontSize="14" fontFamily="monospace">
          32.768
        </text>
        <text y="50" textAnchor="middle" className="silk-svg">X1 QUARTZ</text>
      </g>

      {/* ⑤ 電源・バッテリー */}
      <g transform="translate(190 470)">
        <rect x="-85" y="-32" width="170" height="64" rx="8" fill="#101512" stroke="#3a4a42" strokeWidth="2" />
        <rect x="-60" y="-16" width="110" height="32" rx="16" fill="#c9ced1" />
        <rect x="50" y="-7" width="8" height="14" rx="2" fill="#c9ced1" />
        <text x="-5" y="5" textAnchor="middle" fill="#1b1b1b" fontSize="12" fontWeight="700" fontFamily="monospace">
          27A 12V
        </text>
        <path d="M-78 -46 l10 16 h-8 l10 18" fill="none" stroke={COPPER.mint} strokeWidth="2.5" className="bolt" />
        <text y="52" textAnchor="middle" className="silk-svg">BT1 POWER</text>
      </g>

      {/* 銀色の鏡面広場（ハンダのフィレット） */}
      <g transform="translate(490 520)" className="cursor-pointer" onClick={onMirror}>
        <path
          d="M-70 -8 C-72 -40 -20 -52 12 -44 C52 -36 84 -30 86 -2 C88 26 48 40 10 38 C-30 36 -68 22 -70 -8 Z"
          fill="url(#solder)"
          stroke="#e8eef2"
          strokeOpacity="0.7"
        />
        <ellipse cx="-18" cy="-20" rx="28" ry="7" fill="#fff" opacity="0.55" />
        <text y="62" textAnchor="middle" className="silk-svg">SILVER MIRROR</text>
      </g>
      {/* 流動の丘 */}
      <g transform="translate(640 575)">
        <path d="M-60 6 C-50 -18 -10 -22 20 -14 C46 -8 64 -2 62 10 C60 22 -52 24 -60 6 Z" fill="url(#solder)" opacity="0.85" />
        <text y="38" textAnchor="middle" className="silk-svg">流動の丘</text>
      </g>

      {/* 音響・出力（イヤホンジャック） */}
      <g transform="translate(935 300)">
        <rect x="-38" y="-38" width="76" height="76" rx="6" fill="#141414" stroke="#444" />
        <circle r="18" fill="#000" stroke="#999" strokeWidth="3" />
        <text y="56" textAnchor="middle" className="silk-svg">J1 OUT</text>
      </g>

      {/* 冷却・放熱（ファン） */}
      <g transform="translate(60 300)">
        <circle r="40" fill="#0d1a17" stroke="#3c6b5e" strokeWidth="2" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M0 0 C10 -10 22 -30 6 -36 C-6 -30 -4 -12 0 0Z" fill="#6bd7c3" opacity="0.5" transform={`rotate(${a})`} />
        ))}
        <circle r="6" fill="#9ee" />
        <text y="58" textAnchor="middle" className="silk-svg">FAN1</text>
      </g>
    </svg>
  );
}
