/**
 * RadioEngine — 周波数ダイヤル用の音声エンジン（Web Audio API のみ、音源ファイル不要）
 *
 * 構成:
 *   noise(ループ) ─ bandpass ─ noiseGain ─┐
 *   station[i] (シーケンサで合成) ─ gain_i ┼─ master ─ analyser ─ destination
 *
 * setFrequency(kHz) で各局との距離から受信強度を計算し、
 * 局の音量とノイズ量をクロスフェードする。局の間はザーッという空電ノイズ。
 * 音源を差し替えたい場合は Station.url に音声ファイルを指定すれば
 * 合成パターンの代わりにループ再生される。
 */

export type Station = {
  id: string;
  freq: number; // kHz (AM 530–1610)
  name: string;
  host: string;
  bpm: number;
  /** 16分音符ごとに呼ばれる。t は AudioContext 時刻 */
  pattern?: (ctx: AudioContext, out: AudioNode, step: number, t: number) => void;
  url?: string;
};

export const FREQ_MIN = 530;
export const FREQ_MAX = 1610;
const BANDWIDTH = 28; // kHz: この幅でフェードする

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function tone(
  ctx: AudioContext,
  out: AudioNode,
  t: number,
  midi: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; cutoff?: number; attack?: number } = {},
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  osc.type = opts.type ?? "triangle";
  osc.frequency.value = mtof(midi);
  f.type = "lowpass";
  f.frequency.value = opts.cutoff ?? 2200;
  const peak = opts.gain ?? 0.15;
  const a = opts.attack ?? 0.01;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(f).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noiseHit(ctx: AudioContext, out: AudioNode, buf: AudioBuffer, t: number, dur: number, hp: number, gain: number) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.5, dur + 0.05);
}

function kick(ctx: AudioContext, out: AudioNode, t: number, gain = 0.5) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.32);
}

let sharedNoise: AudioBuffer | null = null;
function noiseBuffer(ctx: AudioContext) {
  if (sharedNoise && sharedNoise.sampleRate === ctx.sampleRate) return sharedNoise;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  sharedNoise = buf;
  return buf;
}

// ── 局（ステーション）──────────────────────────────
// Lo-fiジャズ: ii–V–I をゆっくり、ビニールのプチプチ付き
const NODE_CHORDS = [
  [62, 65, 69, 72], // Dm7
  [67, 71, 74, 77], // G7
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
];

export const STATIONS: Station[] = [
  {
    id: "the-node",
    freq: 700,
    name: "Bar: The Node — Lo-fi Jazz",
    host: "フクロウ",
    bpm: 72,
    pattern(ctx, out, step, t) {
      const bar = Math.floor(step / 16) % NODE_CHORDS.length;
      const chord = NODE_CHORDS[bar];
      if (step % 16 === 0 || step % 16 === 10) chord.forEach((m) => tone(ctx, out, t, m, 1.6, { type: "sine", gain: 0.06, cutoff: 1200, attack: 0.03 }));
      if (step % 4 === 0) tone(ctx, out, t, chord[0] - 24, 0.5, { type: "triangle", gain: 0.18, cutoff: 500 });
      if (step % 8 === 4) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.08, 3000, 0.05);
      if (Math.random() < 0.25) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.01, 6000, 0.04); // crackle
    },
  },
  {
    id: "korompo",
    freq: 850,
    name: "公籠包 湯気ラジオ",
    host: "パンダ＆アヒル",
    bpm: 96,
    pattern(ctx, out, step, t) {
      const scale = [72, 74, 76, 79, 81, 84];
      if (step % 2 === 0 && Math.random() < 0.6) tone(ctx, out, t, scale[Math.floor(Math.random() * scale.length)], 0.35, { type: "triangle", gain: 0.1 });
      if (step % 8 === 0) tone(ctx, out, t, 48, 0.8, { type: "sine", gain: 0.16, cutoff: 400 });
    },
  },
  {
    id: "diner",
    freq: 1000,
    name: "COLLECTIVE DINER Jukebox",
    host: "バイソン",
    bpm: 132,
    pattern(ctx, out, step, t) {
      const walk = [48, 52, 55, 57, 58, 57, 55, 52];
      if (step % 2 === 0) tone(ctx, out, t, walk[(step / 2) % 8], 0.2, { type: "square", gain: 0.06, cutoff: 900 });
      if (step % 4 === 0) kick(ctx, out, t, 0.25);
      if (step % 8 === 4) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.12, 1800, 0.12);
      if (step % 16 === 0) [64, 67, 72].forEach((m) => tone(ctx, out, t, m, 0.3, { type: "square", gain: 0.03 }));
    },
  },
  {
    id: "denpato",
    freq: 1270,
    name: "電波塔 GAL BEAT",
    host: "ハクビシン",
    bpm: 128,
    pattern(ctx, out, step, t) {
      if (step % 4 === 0) kick(ctx, out, t, 0.45);
      if (step % 4 === 2) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.05, 7000, 0.09);
      const arp = [69, 72, 76, 81, 76, 72, 69, 64];
      if (step % 2 === 1) tone(ctx, out, t, arp[(step >> 1) % 8], 0.12, { type: "sawtooth", gain: 0.035, cutoff: 3200 });
    },
  },
  {
    id: "quartz",
    freq: 1470,
    name: "Quartz 32768Hz Time Signal",
    host: "白ギツネ",
    bpm: 60,
    pattern(ctx, out, step, t) {
      if (step % 4 === 0) tone(ctx, out, t, step % 64 === 0 ? 93 : 88, 0.09, { type: "sine", gain: 0.12, cutoff: 8000 });
      if (step % 16 === 8) [76, 79, 83, 88].forEach((m, i) => tone(ctx, out, t + i * 0.12, m, 1.2, { type: "sine", gain: 0.05, cutoff: 6000 }));
    },
  },
];

type Channel = { station: Station; gain: GainNode; step: number; nextTime: number; media?: HTMLAudioElement };

export class RadioEngine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master!: GainNode;
  private noiseGain!: GainNode;
  private noiseFilter!: BiquadFilterNode;
  private channels: Channel[] = [];
  private timer: number | null = null;
  private freq = 700;
  private listeners = new Set<(s: { freq: number; locked: Station | null; noise: number }) => void>();

  get running() {
    return !!this.ctx && this.ctx.state === "running";
  }

  async start() {
    if (!this.ctx) this.build();
    await this.ctx!.resume();
    this.master.gain.setTargetAtTime(0.8, this.ctx!.currentTime, 0.2);
    if (this.timer == null) this.timer = window.setInterval(() => this.schedule(), 25);
    this.channels.forEach((c) => c.media?.play().catch(() => {}));
    this.setFrequency(this.freq);
  }

  stop() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
    this.channels.forEach((c) => c.media?.pause());
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.master.connect(this.analyser).connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.Q.value = 0.7;
    this.noiseFilter.frequency.value = 1800;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.2;
    noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
    noise.start();

    this.channels = STATIONS.map((station) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.master);
      const ch: Channel = { station, gain, step: 0, nextTime: ctx.currentTime + 0.1 };
      if (station.url) {
        const media = new Audio(station.url);
        media.loop = true;
        media.crossOrigin = "anonymous";
        ctx.createMediaElementSource(media).connect(gain);
        ch.media = media;
      }
      return ch;
    });
  }

  /** 先読みスケジューラ。受信している局だけ音符を積む */
  private schedule() {
    const ctx = this.ctx!;
    const horizon = ctx.currentTime + 0.12;
    for (const ch of this.channels) {
      const { station } = ch;
      if (!station.pattern) continue;
      const stepDur = 60 / station.bpm / 4;
      if (ch.nextTime < ctx.currentTime - 0.5) ch.nextTime = ctx.currentTime; // タブ復帰時の追いつき防止
      while (ch.nextTime < horizon) {
        if (ch.gain.gain.value > 0.01) station.pattern(ctx, ch.gain, ch.step, ch.nextTime);
        ch.step++;
        ch.nextTime += stepDur;
      }
    }
  }

  strengthOf(station: Station, freq = this.freq) {
    const d = (freq - station.freq) / BANDWIDTH;
    return Math.exp(-d * d);
  }

  setFrequency(freq: number) {
    this.freq = Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq));
    let best = 0;
    let locked: Station | null = null;
    for (const ch of this.channels.length ? this.channels : STATIONS.map((station) => ({ station }) as Channel)) {
      const s = this.strengthOf(ch.station);
      if (s > best) {
        best = s;
        locked = ch.station;
      }
      if (this.ctx && ch.gain) ch.gain.gain.setTargetAtTime(s * 0.9, this.ctx.currentTime, 0.05);
    }
    const noise = Math.max(0.06, 1 - best);
    if (this.ctx) {
      this.noiseGain.gain.setTargetAtTime(noise * 0.35, this.ctx.currentTime, 0.05);
      // ダイヤルを回すと空電の音色も揺れる
      this.noiseFilter.frequency.setTargetAtTime(600 + ((this.freq * 7.3) % 3000), this.ctx.currentTime, 0.08);
    }
    const state = { freq: this.freq, locked: best > 0.5 ? locked : null, noise };
    this.listeners.forEach((l) => l(state));
    return state;
  }

  /** イースターエッグ等で使う「ジリジリッ」という一瞬のノイズ */
  burst(duration = 1.2) {
    if (!this.ctx || !this.running) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.master);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    for (let i = 0; i < 6; i++) noiseHit(this.ctx, g, noiseBuffer(this.ctx), t + i * (duration / 6), duration / 5, 400 + i * 700, 0.6);
    tone(this.ctx, g, t, 96, duration, { type: "square", gain: 0.04, cutoff: 5000 });
  }

  /** 0..1 現在の出力レベル（シェーダーの揺れに使う） */
  level() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 3);
  }

  subscribe(fn: (s: { freq: number; locked: Station | null; noise: number }) => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }
}
