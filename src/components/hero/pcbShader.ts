/**
 * 基板（PCB）背景シェーダー
 *  - ダークグリーンのソルダーレジスト + ガラス繊維の織り目
 *  - 銅箔ライン（ネオンピンク / ミントグリーン / シナモンブラウン）を光が流れる
 *  - ビアで静電気がパチッと弾ける
 *  - 「ハンダの鏡面広場」: 溶けて固まったハンダのフィレットを、
 *    SDFのドーム法線 + 環境反射 + フレネルで銀色の鏡面として描く
 *  - ラジオノイズ（砂嵐・走査線）、雨、雷、グリッチ
 */

export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uMirror;   // xy: 画面内の中心(0..1), z: 半径(画面高さ比)
uniform float uTime;
uniform float uNoise;   // 0..1 ダイヤルの空電ノイズ量
uniform float uGlitch;  // 0..1+ グリッチ強度
uniform float uLevel;   // 0..1 音声出力レベル
uniform float uRain;
uniform float uStorm;

const vec3 PINK = vec3(1.0, 0.0, 0.498);
const vec3 MINT = vec3(0.24, 1.0, 0.75);
const vec3 CINN = vec3(0.784, 0.506, 0.294);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hash1(float n) { return fract(sin(n) * 43758.5453123); }

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
vec3 palette(float h) { return h < 0.34 ? PINK : (h < 0.67 ? MINT : CINN); }

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// ハンダの溜まり: 3つの円をなめらかに結合した「溶けて固まった」形
float solderSdf(vec2 q) {
  vec2 c = uMirror.xy * vec2(uRes.x / uRes.y, 1.0);
  float r = uMirror.z;
  float d = length((q - c) * vec2(0.85, 1.1)) - r;
  d = smin(d, length(q - c - vec2(r * 0.9, -r * 0.35)) - r * 0.55, r * 0.5);
  d = smin(d, length(q - c - vec2(-r * 0.75, r * 0.45)) - r * 0.4, r * 0.45);
  return d;
}

vec3 scene(vec2 frag) {
  vec2 q = frag / uRes.y;              // 画面高さ = 1
  float scale = 16.0;
  vec2 p = q * scale;

  // ベース: ダークグリーンのソルダーレジスト + ガラス繊維の織り
  vec3 col = vec3(0.012, 0.085, 0.05);
  float weave = sin(p.x * 18.0) * sin(p.y * 18.0);
  col += vec3(0.0, 0.02, 0.012) * weave;
  col += vec3(0.01, 0.05, 0.03) * fbm(p * 0.35 + 3.0);

  // 銅箔ライン（水平・垂直）
  vec3 traceCol = vec3(0.0);
  float traceMask = 0.0;
  for (int k = 0; k < 2; k++) {
    float s = k == 0 ? p.x : p.y;
    float t = k == 0 ? p.y : p.x;
    float laneId = floor(t + 0.5) + float(k) * 101.0;
    float segLen = 5.0 + floor(hash1(laneId * 7.1) * 6.0);
    float seg = floor((s + hash1(laneId) * segLen) / segLen);
    float exists = step(0.55, hash(vec2(laneId, seg)));
    float dt = abs(t - floor(t + 0.5));
    float m = (1.0 - smoothstep(0.045, 0.075, dt)) * exists;
    vec3 c = palette(hash(vec2(laneId * 1.3, seg)));
    float dir = hash(vec2(seg, laneId * 3.0)) > 0.5 ? 1.0 : -1.0;
    float speed = 0.3 + hash(vec2(laneId, seg * 1.7)) * 0.7;
    float ph = fract(dir * s * 0.06 - uTime * speed * 0.3 + hash(vec2(seg, laneId)));
    float head = pow(ph, 22.0) * 1.6 + 0.25 * pow(ph, 5.0);
    float halo = exp(-dt * 22.0) * exists * head;
    traceCol += c * (m * (0.16 + head * 1.4 + uLevel * 0.3) + halo * 0.9);
    traceMask = max(traceMask, m);
  }
  // 銅箔の下地（レジスト越しの鈍い銅色）
  col = mix(col, vec3(0.13, 0.2, 0.09), traceMask * 0.55);
  col += traceCol;

  // ビア（スルーホール）と静電気
  vec2 gi = floor(p + 0.5);
  float isVia = step(0.86, hash(gi + 17.0));
  float vd = length(p - gi);
  float ring = (1.0 - smoothstep(0.15, 0.2, vd)) * smoothstep(0.06, 0.1, vd);
  col = mix(col, vec3(0.55, 0.5, 0.35), ring * isVia * 0.8);
  float zap = step(0.992, hash(gi + floor(uTime * 9.0)));
  col += MINT * isVia * zap * exp(-vd * 6.0) * 1.4;

  // ハンダの鏡面広場（ベタアースのフィレット）
  float d = solderSdf(q);
  float r = uMirror.z;
  if (d < 0.02) {
    vec2 e = vec2(0.002, 0.0);
    float hC = sqrt(clamp(-d / r, 0.0, 1.0));
    float hX = sqrt(clamp(-solderSdf(q + e.xy) / r, 0.0, 1.0));
    float hY = sqrt(clamp(-solderSdf(q + e.yx) / r, 0.0, 1.0));
    vec3 n = normalize(vec3(-(hX - hC) / e.x * 0.06, -(hY - hC) / e.x * 0.06, 1.0));
    vec3 v = vec3(0.0, 0.0, -1.0);
    vec3 rf = reflect(v, n);
    // 環境: 基板の緑とネオンの帯、上にラジオの筐体の暗がり
    float band = smoothstep(0.2, 0.9, sin(rf.x * 7.0 + rf.y * 3.0 + uTime * 0.25) * 0.5 + 0.5);
    vec3 env = mix(vec3(0.05, 0.12, 0.09), vec3(0.85, 0.9, 0.92), smoothstep(-0.2, 0.7, rf.y));
    env += band * 0.25 * mix(PINK, MINT, 0.5 + 0.5 * sin(uTime * 0.2 + rf.x * 2.0));
    // 光源（マウスに追従）の鋭いハイライト
    vec3 L = normalize(vec3((uMouse - 0.5) * 2.0, 1.0));
    float spec = pow(max(dot(rf, L), 0.0), 90.0);
    float sweep = pow(max(0.0, 1.0 - abs(rf.x + rf.y - mod(uTime * 0.35, 4.0) + 2.0) * 3.0), 3.0);
    float fres = pow(1.0 - n.z, 2.0);
    vec3 silver = env * vec3(0.78, 0.8, 0.84) + spec * 1.6 + sweep * 0.35 + fres * vec3(0.4, 0.45, 0.5);
    // フィレットの縁: メニスカスの暗い線
    float edge = smoothstep(0.0, -0.006, d);
    float rim = exp(-abs(d) * 300.0);
    col = mix(col, silver, edge);
    col += rim * vec3(0.2, 0.25, 0.25);
    col = mix(col, col * 0.4, (1.0 - edge) * smoothstep(0.02, 0.0, d)); // フラックスの焦げ
  }

  // 雨（ノイズ性の雨粒）
  if (uRain > 0.0) {
    float cx = floor(q.x * 90.0);
    float rain = step(0.93, hash(vec2(cx, floor(q.y * 6.0 + uTime * (6.0 + hash1(cx) * 5.0) + hash1(cx * 3.1) * 10.0))));
    rain *= smoothstep(0.35, 0.0, abs(fract(q.x * 90.0) - 0.5));
    col += MINT * rain * 0.12 * uRain;
  }
  return col;
}

void main() {
  vec2 frag = vUv * uRes;
  float t = uTime;

  // グリッチ: 横ブロックずらし
  float row = floor(vUv.y * 24.0);
  float blk = step(0.55, hash1(row * 3.7 + floor(t * 18.0)));
  frag.x += (hash1(row + floor(t * 30.0)) - 0.5) * uRes.x * 0.12 * uGlitch * blk;
  // 空電ノイズで走査線が揺れる
  frag.x += sin(vUv.y * 180.0 + t * 40.0) * uNoise * 1.5;

  vec3 col = scene(frag);
  if (uGlitch > 0.02) {
    float sh = uRes.x * 0.012 * uGlitch;
    col.r = scene(frag + vec2(sh, 0.0)).r;
    col.b = scene(frag - vec2(sh, 0.0)).b;
  }

  // 砂嵐
  float g = hash(frag + fract(t * 37.0) * 311.0);
  col += (g - 0.5) * (0.06 + uNoise * 0.35 + uGlitch * 0.5);
  // ロールする走査帯
  float roll = smoothstep(0.0, 0.04, fract(vUv.y + t * 0.07)) * smoothstep(0.1, 0.04, fract(vUv.y + t * 0.07));
  col += roll * 0.035 * (0.4 + uNoise);
  col *= 0.94 + 0.06 * sin(frag.y * 1.6);
  // 雷
  float flash = step(0.975, hash1(floor(t * 5.0))) * uStorm;
  col += flash * vec3(0.5, 0.55, 0.7);
  // ビネット
  vec2 uv = vUv - 0.5;
  col *= 1.0 - dot(uv, uv) * 0.9;
  gl_FragColor = vec4(col, 1.0);
}
`;
