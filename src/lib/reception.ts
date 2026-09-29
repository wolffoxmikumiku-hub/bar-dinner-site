/**
 * アンテナ受信ロジック
 *
 * この星のアンテナが「現実のWebアクセス」を受信し、
 * 基板の天候と訪問客を決める。入力にしているのは:
 *  - アクセス時刻（20時以降は夜。Barが点灯する）
 *  - 日付（その日の天候の基調。全員に同じ空が届く）
 *  - 訪問回数（localStorage。通うほど電波が安定する）
 *  - 回線種別 navigator.connection（弱い回線ほどノイズが強い）
 *  - リファラ（どこから電波が来たか）
 * URLに ?weather=rain|storm|static|clear を付けると天候を、
 * ?time=night|day を付けると時間帯を強制できる（確認用）。
 */
import type { AreaId, Condition } from "@/data/world";
import { daySeed, seededRandom } from "./daily";

export type Weather = "clear" | "static" | "rain" | "storm";

export type Reception = {
  weather: Weather;
  isNight: boolean;
  hour: number;
  visitCount: number;
  /** 0..1 受信感度。低いほど画面ノイズが増える */
  signal: number;
  connection: string;
  origin: string;
  /** 今日ヤマセミ兄妹が出張している地区 */
  yamasemiAt: AreaId;
};

const WEATHERS: Weather[] = ["clear", "clear", "static", "rain", "rain", "storm"];
const TRAVEL_SPOTS: AreaId[] = ["cpu", "capacitor", "resistor", "quartz", "hill"];

type NetworkInformationLike = { effectiveType?: string; downlink?: number };

function safeStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function receive(now = new Date()): Reception {
  const params = new URLSearchParams(location.search);
  const forcedTime = params.get("time");
  const hour = forcedTime === "night" ? 22 : forcedTime === "day" ? 12 : now.getHours();
  const isNight = hour >= 20 || hour < 5;

  const visitCount = safeStorage(() => {
    const n = Number(localStorage.getItem("brr:visits") ?? "0") + 1;
    localStorage.setItem("brr:visits", String(n));
    return n;
  }, 1);

  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  const connection = conn?.effectiveType ?? "unknown";
  const connScore = { "slow-2g": 0.2, "2g": 0.35, "3g": 0.6, "4g": 0.9 }[connection] ?? 0.75;
  const signal = Math.min(1, connScore * 0.7 + Math.min(visitCount, 10) * 0.03);

  const rnd = seededRandom(daySeed(now) + hour * 13);
  let weather = WEATHERS[Math.floor(rnd() * WEATHERS.length)];
  if (!navigator.onLine) weather = "static";

  const forced = params.get("weather");
  if (forced && ["clear", "static", "rain", "storm"].includes(forced)) weather = forced as Weather;

  let origin = "direct";
  try {
    if (document.referrer) origin = new URL(document.referrer).hostname;
  } catch {}

  const yamasemiAt = TRAVEL_SPOTS[Math.floor(seededRandom(daySeed(now) * 3)() * TRAVEL_SPOTS.length)];

  return { weather, isNight, hour, visitCount, signal, connection, origin, yamasemiAt };
}

export function meets(r: Reception, c: Condition | undefined) {
  if (!c) return true;
  if (c === "night") return r.isNight;
  if (c === "day") return !r.isNight;
  if (c === "rain") return r.weather === "rain" || r.weather === "storm";
  return r.weather === "storm";
}

export const WEATHER_LABEL: Record<Weather, string> = {
  clear: "快晴（静電気すこし）",
  static: "砂嵐",
  rain: "雨（ノイズ性）",
  storm: "雷雨",
};
