/**
 * RadioEngine — サイトのBGMエンジン（Web Audio API のみ、音源ファイル不要）
 *
 * 構成:
 *   noise(ループ) ─ bandpass ─ noiseGain ─┐
 *   track[i] (シーケンサで合成) ─ gain_i ─┼─ muffle(lowpass) ─ master ─ analyser ─ destination
 *
 * - 街にいるときは「街の音（town）」、店に入るとその店のBGMへクロスフェードする。
 * - 閉店中の店に入ったときは、扉越しのようにこもった音になる（muffle）。
 * - 下地に微かな空電ノイズが乗っている（この星の正体の匂わせ）。
 * 音源を差し替えたい場合は Track.url に音声ファイルを指定すれば
 * 合成パターンの代わりにループ再生される（例: url: "/audio/the-node.mp3"）。
 */

export type Track = {
  /** "town" または ShopId */
  id: string;
  name: string;
  bpm: number;
  /** 16分音符ごとに呼ばれる。t は AudioContext 時刻 */
  pattern?: (ctx: AudioContext, out: AudioNode, step: number, t: number) => void;
  url?: string;
};

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

/** 汎用ループ: 音階・ベース・音色・リズムの組み合わせで店ごとの曲を作る */
function loop(o: {
  scale: number[];
  bass: number[];
  lead?: OscillatorType;
  drums?: "none" | "soft" | "four" | "shuffle";
  density?: number;
  leadGain?: number;
}): Track["pattern"] {
  const { scale, bass, lead = "triangle", drums = "soft", density = 0.5, leadGain = 0.08 } = o;
  return (ctx, out, step, t) => {
    const s16 = step % 16;
    if (s16 % 2 === 0 && Math.random() < density) tone(ctx, out, t, scale[Math.floor(Math.random() * scale.length)], 0.3, { type: lead, gain: leadGain, cutoff: 2600 });
    if (s16 === 0 || s16 === 8) tone(ctx, out, t, bass[Math.floor(step / 16) % bass.length], 0.7, { type: "sine", gain: 0.16, cutoff: 420 });
    if (drums === "four" && step % 4 === 0) kick(ctx, out, t, 0.35);
    if (drums === "four" && step % 4 === 2) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.05, 7000, 0.06);
    if (drums === "shuffle" && (s16 === 0 || s16 === 10)) kick(ctx, out, t, 0.3);
    if (drums === "shuffle" && (s16 === 4 || s16 === 12)) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.1, 2000, 0.08);
    if (drums === "soft" && s16 === 8) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.06, 4000, 0.04);
  };
}

// Lo-fiジャズ: ii–V–I をゆっくり、ビニールのプチプチ付き
const NODE_CHORDS = [
  [62, 65, 69, 72], // Dm7
  [67, 71, 74, 77], // G7
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
];
const TOWN_CHORDS = [
  [57, 64, 67, 72],
  [53, 60, 64, 69],
  [55, 62, 67, 71],
  [52, 59, 64, 67],
];
const MIYAKO = [64, 65, 69, 71, 72, 76, 77];

export const TRACKS: Track[] = [
  {
    id: "town",
    name: "街の音",
    bpm: 60,
    pattern(ctx, out, step, t) {
      const chord = TOWN_CHORDS[Math.floor(step / 32) % TOWN_CHORDS.length];
      if (step % 32 === 0) chord.forEach((m) => tone(ctx, out, t, m, 6, { type: "sine", gain: 0.035, cutoff: 900, attack: 1.2 }));
      if (step % 4 === 2 && Math.random() < 0.3) tone(ctx, out, t, chord[Math.floor(Math.random() * 4)] + 12, 1.2, { type: "sine", gain: 0.03, cutoff: 3000 });
      if (Math.random() < 0.15) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.01, 6000, 0.03);
    },
  },
  {
    id: "the-node",
    name: "Bar: The Node — Lo-fi Jazz",
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
    id: "collective-diner",
    name: "COLLECTIVE DINER — Jukebox",
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
    id: "korompo",
    name: "公籠包 — 湯気の調べ",
    bpm: 96,
    pattern(ctx, out, step, t) {
      const scale = [72, 74, 76, 79, 81, 84];
      if (step % 2 === 0 && Math.random() < 0.6) tone(ctx, out, t, scale[Math.floor(Math.random() * scale.length)], 0.35, { type: "triangle", gain: 0.1 });
      if (step % 8 === 0) tone(ctx, out, t, 48, 0.8, { type: "sine", gain: 0.16, cutoff: 400 });
    },
  },
  {
    id: "denpato",
    name: "電波塔 — GAL BEAT",
    bpm: 128,
    pattern(ctx, out, step, t) {
      if (step % 4 === 0) kick(ctx, out, t, 0.45);
      if (step % 4 === 2) noiseHit(ctx, out, noiseBuffer(ctx), t, 0.05, 7000, 0.09);
      const arp = [69, 72, 76, 81, 76, 72, 69, 64];
      if (step % 2 === 1) tone(ctx, out, t, arp[(step >> 1) % 8], 0.12, { type: "sawtooth", gain: 0.035, cutoff: 3200 });
    },
  },
  {
    id: "patisserie-quartz",
    name: "Pâtisserie Quartz — 32768Hz",
    bpm: 60,
    pattern(ctx, out, step, t) {
      if (step % 4 === 0) tone(ctx, out, t, step % 64 === 0 ? 93 : 88, 0.09, { type: "sine", gain: 0.12, cutoff: 8000 });
      if (step % 16 === 8) [76, 79, 83, 88].forEach((m, i) => tone(ctx, out, t + i * 0.12, m, 1.2, { type: "sine", gain: 0.05, cutoff: 6000 }));
    },
  },
  { id: "shinabundo", name: "シナブン堂 — オルゴール", bpm: 88, pattern: loop({ scale: [72, 74, 76, 79, 81, 84, 86], bass: [48, 53, 55, 48], lead: "sine", drums: "none", density: 0.55, leadGain: 0.09 }) },
  { id: "seven-percent", name: "7% — Rainbow Pop", bpm: 118, pattern: loop({ scale: [72, 76, 79, 83, 84, 88], bass: [48, 45, 41, 43], lead: "square", drums: "four", density: 0.6, leadGain: 0.04 }) },
  { id: "nikukyu-sushi", name: "肉球寿司 — 板場の琴", bpm: 90, pattern: loop({ scale: MIYAKO, bass: [40, 45, 40, 47], lead: "triangle", drums: "none", density: 0.45, leadGain: 0.1 }) },
  { id: "tancho", name: "丹頂 — 座敷の宵", bpm: 60, pattern: loop({ scale: MIYAKO.map((m) => m - 12), bass: [40, 45], lead: "sine", drums: "none", density: 0.35, leadGain: 0.1 }) },
  { id: "loop", name: "LOOP — Vintage Funk", bpm: 104, pattern: loop({ scale: [67, 70, 72, 74, 77], bass: [43, 43, 46, 41], lead: "square", drums: "shuffle", density: 0.4, leadGain: 0.04 }) },
  { id: "moomoomeaw", name: "moomoomeaw — ゆめうつつ", bpm: 70, pattern: loop({ scale: [76, 79, 81, 83, 88], bass: [52, 47, 45, 50], lead: "sine", drums: "none", density: 0.35, leadGain: 0.07 }) },
  { id: "jack", name: "JACK — Dance Hall", bpm: 124, pattern: loop({ scale: [69, 72, 74, 76, 79], bass: [45, 45, 48, 43], lead: "sawtooth", drums: "four", density: 0.5, leadGain: 0.03 }) },
  { id: "radiator-park", name: "ラジエーター公園 — アイスの歌", bpm: 100, pattern: loop({ scale: [74, 76, 78, 81, 83, 86], bass: [50, 47, 43, 45], lead: "triangle", drums: "soft", density: 0.5, leadGain: 0.08 }) },
  { id: "power-alley", name: "パワー横丁 — 裏路地", bpm: 90, pattern: loop({ scale: [57, 60, 62, 63, 67], bass: [33, 33, 36, 31], lead: "sawtooth", drums: "shuffle", density: 0.3, leadGain: 0.03 }) },
];

export const trackFor = (id: string | null | undefined) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];

type Channel = { track: Track; gain: GainNode; step: number; nextTime: number; media?: HTMLAudioElement };
export type SoundState = { track: Track; volume: number; muffled: boolean };

export class RadioEngine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master!: GainNode;
  private muffle!: BiquadFilterNode;
  private noiseGain!: GainNode;
  private channels: Channel[] = [];
  private timer: number | null = null;
  private track: Track = TRACKS[0];
  private muffled = false;
  private volume = 0.7;
  private listeners = new Set<(s: SoundState) => void>();

  get running() {
    return !!this.ctx && this.ctx.state === "running" && this.timer != null;
  }

  async start() {
    if (!this.ctx) this.build();
    await this.ctx!.resume();
    this.master.gain.setTargetAtTime(this.volume, this.ctx!.currentTime, 0.2);
    if (this.timer == null) this.timer = window.setInterval(() => this.schedule(), 25);
    this.apply();
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
    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = "lowpass";
    this.muffle.frequency.value = 18000;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.muffle.connect(this.master);
    this.master.connect(this.analyser).connect(ctx.destination);

    // 下地の微かな空電
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.7;
    bp.frequency.value = 1800;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.02;
    noise.connect(bp).connect(this.noiseGain).connect(this.master);
    noise.start();

    this.channels = TRACKS.map((track) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.muffle);
      const ch: Channel = { track, gain, step: 0, nextTime: ctx.currentTime + 0.1 };
      if (track.url) {
        const media = new Audio(track.url);
        media.loop = true;
        media.crossOrigin = "anonymous";
        ctx.createMediaElementSource(media).connect(gain);
        ch.media = media;
      }
      return ch;
    });
  }

  /** 先読みスケジューラ。鳴っている曲だけ音符を積む */
  private schedule() {
    const ctx = this.ctx!;
    const horizon = ctx.currentTime + 0.12;
    for (const ch of this.channels) {
      const { track } = ch;
      if (!track.pattern) continue;
      const stepDur = 60 / track.bpm / 4;
      if (ch.nextTime < ctx.currentTime - 0.5) ch.nextTime = ctx.currentTime; // タブ復帰時の追いつき防止
      while (ch.nextTime < horizon) {
        if (ch.gain.gain.value > 0.01) track.pattern(ctx, ch.gain, ch.step, ch.nextTime);
        ch.step++;
        ch.nextTime += stepDur;
      }
    }
  }

  /** 曲の切り替え。muffled = 閉店中の店（扉越しの音） */
  play(id: string | null, muffled = false) {
    this.track = trackFor(id);
    this.muffled = muffled;
    this.apply();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.running) this.master.gain.setTargetAtTime(this.volume, this.ctx!.currentTime, 0.05);
    this.emit();
  }

  private apply() {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      for (const ch of this.channels) {
        const on = ch.track.id === this.track.id;
        ch.gain.gain.setTargetAtTime(on ? 0.9 : 0, now, 0.4); // クロスフェード
        if (ch.media) {
          if (on && this.running) ch.media.play().catch(() => {});
          else if (!on) ch.media.pause();
        }
      }
      this.muffle.frequency.setTargetAtTime(this.muffled ? 450 : 18000, now, 0.2);
    }
    this.emit();
  }

  private emit() {
    const s = this.state();
    this.listeners.forEach((l) => l(s));
  }

  state(): SoundState {
    return { track: this.track, volume: this.volume, muffled: this.muffled };
  }

  /** 「ジリジリッ」という一瞬のノイズ */
  burst(duration = 1.2) {
    if (!this.ctx || !this.running) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.master);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    for (let i = 0; i < 6; i++) noiseHit(this.ctx, g, noiseBuffer(this.ctx), t + i * (duration / 6), duration / 5, 400 + i * 700, 0.6);
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

  subscribe(fn: (s: SoundState) => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }
}
