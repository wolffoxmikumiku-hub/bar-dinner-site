/**
 * 「27A 12V」超小型乾電池のガンベルト（弾帯）。巻いているのはヤマセミ兄妹とカラスだけ。
 * キャラクターの胸・肩にたすき掛けで重ねて使う。
 */
export function BatteryBandolier({ className, cells = 5 }: { className?: string; cells?: number }) {
  const w = cells * 14 + 8;
  return (
    <svg viewBox={`0 0 ${w} 30`} className={className} aria-hidden>
      <g transform={`rotate(-24 ${w / 2} 15)`}>
        <rect x="0" y="9" width={w} height="12" rx="3" fill="#3a2a1c" stroke="#C8814B" strokeWidth="1" />
        {Array.from({ length: cells }, (_, i) => (
          <g key={i} transform={`translate(${6 + i * 14} 4)`}>
            <rect width="9" height="22" rx="2" fill="#d9dde0" />
            <rect y="0" width="9" height="4" rx="1.5" fill="#FF007F" />
            <rect x="3" y="-2" width="3" height="2.5" rx="0.5" fill="#bfc4c7" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** 単体の 27A 12V 電池（アイコン用） */
export function Battery27A({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} aria-label="27A 12V 電池">
      <rect x="4" y="6" width="104" height="28" rx="14" fill="#d9dde0" />
      <rect x="4" y="6" width="26" height="28" rx="12" fill="#FF007F" />
      <rect x="108" y="14" width="8" height="12" rx="2" fill="#bfc4c7" />
      <text x="68" y="25" textAnchor="middle" fontFamily="monospace" fontWeight="700" fontSize="13" fill="#1b1b1b">
        27A 12V
      </text>
    </svg>
  );
}
