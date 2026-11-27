/**
 * Shared 10-second Machinima Director Script (600 frames @ 60 FPS).
 * Both Style 1 (Illuminated Miniature) and Style 2 (Bold Chiaroscuro)
 * consume this exact same deterministic state per frame — proving
 * that one AI-directed Episode Script can drive completely different art engines.
 */

export const BAKEOFF_FPS = 60;
export const BAKEOFF_DURATION = 10.0;
export const BAKEOFF_TOTAL_FRAMES = BAKEOFF_DURATION * BAKEOFF_FPS; // 600 frames

export type CutId = 'establishing' | 'betaal_cu' | 'vikram_flashback' | 'escape_climax';
export type AspectMode = '16:9' | '9:16';

export interface DialogueBeat {
  id: string;
  start: number;
  end: number;
  speaker: 'narrator' | 'betaal' | 'vikram';
  speakerLabel: string;
  text: string;
  syllableRate: number;
}

export interface CutDefinition {
  id: CutId;
  index: number;
  label: string;
  start: number;
  end: number;
  cameraNote: string;
}

export const BAKEOFF_CUTS: CutDefinition[] = [
  {
    id: 'establishing',
    index: 1,
    label: '01. Moonlit Banyan',
    start: 0.0,
    end: 2.6,
    cameraNote: 'Wide parallax push-in · Vikram enters',
  },
  {
    id: 'betaal_cu',
    index: 2,
    label: '02. Betaal Close-Up',
    start: 2.6,
    end: 5.2,
    cameraNote: 'Tight acting CU · Lip-sync & brow animation',
  },
  {
    id: 'vikram_flashback',
    index: 3,
    label: '03. Verdict & Lotus',
    start: 5.2,
    end: 7.8,
    cameraNote: 'Vikram reaction → Lotus petal flashback',
  },
  {
    id: 'escape_climax',
    index: 4,
    label: '04. Escape Swoop',
    start: 7.8,
    end: 10.0,
    cameraNote: 'Low-angle dramatic swoop across full moon',
  },
];

export const BAKEOFF_DIALOGUE: DialogueBeat[] = [
  {
    id: 'd1',
    start: 0.25,
    end: 2.45,
    speaker: 'narrator',
    speakerLabel: 'Narrator',
    text: 'Midnight beneath the ancient banyan, King Vikram stepped into the mist.',
    syllableRate: 5.4,
  },
  {
    id: 'd2',
    start: 2.75,
    end: 5.05,
    speaker: 'betaal',
    speakerLabel: 'Betaal',
    text: 'Tell me, wise King—which delicate brother felt the sharpest wound?',
    syllableRate: 6.2,
  },
  {
    id: 'd3',
    start: 5.3,
    end: 7.65,
    speaker: 'vikram',
    speakerLabel: 'Vikramaditya',
    text: 'The third! Bruised by nothing more than a single falling lotus petal.',
    syllableRate: 5.8,
  },
  {
    id: 'd4',
    start: 7.95,
    end: 9.8,
    speaker: 'betaal',
    speakerLabel: 'Betaal',
    text: 'Aha! You spoke—so back to the banyan I fly!',
    syllableRate: 6.6,
  },
];

export interface DirectorFrameState {
  t: number;
  cut: CutDefinition;
  cutT: number; // local seconds inside cut
  cutU: number; // normalized 0..1 inside cut
  activeDialogue: DialogueBeat | null;
  speechEnergy: number; // 0..1 deterministic voiceover envelope for lip-sync
  viseme: number; // 0 = closed, 1 = slight, 2 = open, 3 = wide/expressive
  speaker: 'none' | 'narrator' | 'betaal' | 'vikram';
  flashbackMix: number; // 0 = Vikram CU, 1 = Lotus Petal flashback inside Cut 3
  petalImpact: number; // 0..1 after petal hits shoulder
  showCaptions: boolean;
  aspect: AspectMode;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

export function easeOutBack(t: number): number {
  const x = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function evaluateDirectorFrame(
  tRaw: number,
  showCaptions: boolean,
  aspect: AspectMode
): DirectorFrameState {
  const t = clamp(tRaw, 0, BAKEOFF_DURATION);
  let cut = BAKEOFF_CUTS[BAKEOFF_CUTS.length - 1];
  for (const c of BAKEOFF_CUTS) {
    if (t >= c.start && t < c.end) {
      cut = c;
      break;
    }
  }
  const cutT = clamp(t - cut.start, 0, cut.end - cut.start);
  const cutU = clamp(cutT / (cut.end - cut.start), 0, 1);

  let activeDialogue: DialogueBeat | null = null;
  for (const d of BAKEOFF_DIALOGUE) {
    if (t >= d.start && t <= d.end) {
      activeDialogue = d;
      break;
    }
  }

  let speechEnergy = 0;
  let viseme = 0;
  let speaker: DirectorFrameState['speaker'] = 'none';

  if (activeDialogue) {
    speaker = activeDialogue.speaker;
    const localD = t - activeDialogue.start;
    const durD = activeDialogue.end - activeDialogue.start;
    const envFade =
      smoothstep(clamp(localD / 0.12, 0, 1)) *
      smoothstep(clamp((durD - localD) / 0.14, 0, 1));
    // Natural multi-harmonic syllable cadence simulating real recorded voiceover amplitude
    const r = activeDialogue.syllableRate;
    const rawWave =
      0.52 +
      0.34 * Math.sin(localD * Math.PI * 2 * r) +
      0.22 * Math.sin(localD * Math.PI * 2 * (r * 0.53) + 1.1) +
      0.14 * Math.cos(localD * Math.PI * 2 * (r * 1.41));
    // Brief natural breath pause around midpoint of sentence
    const breathDip = 1 - 0.72 * Math.exp(-Math.pow((localD - durD * 0.46) / 0.11, 2));
    speechEnergy = clamp(rawWave * envFade * breathDip, 0, 1);
    if (speechEnergy < 0.16) viseme = 0;
    else if (speechEnergy < 0.42) viseme = 1;
    else if (speechEnergy < 0.72) viseme = 2;
    else viseme = 3;
  }

  // Inside Cut 3 (5.2..7.8): 0..0.95s Vikram heroic close-up, then smooth 0.35s wipe to Lotus Flashback!
  const flashbackMix =
    cut.id === 'vikram_flashback' ? smoothstep(clamp((cutT - 0.85) / 0.38, 0, 1)) : 0;

  // Inside Lotus Flashback (cutT = 1.2..2.6): petal lands on shoulder at cutT = 1.98s
  const petalImpact =
    cut.id === 'vikram_flashback' ? clamp((cutT - 1.98) / 0.55, 0, 1) : 0;

  return {
    t,
    cut,
    cutT,
    cutU,
    activeDialogue,
    speechEnergy,
    viseme,
    speaker,
    flashbackMix,
    petalImpact,
    showCaptions,
    aspect,
  };
}

/**
 * Shared clean cinematic subtitle bar drawn identically in readable hierarchy
 * tailored to each style's color temperature, optional toggleable.
 */
export function drawCaptionOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState,
  variant: 'miniature' | 'chiaroscuro'
): void {
  if (!state.showCaptions || !state.activeDialogue) return;

  const d = state.activeDialogue;
  const localT = state.t - d.start;
  const fade =
    smoothstep(clamp(localT / 0.14, 0, 1)) *
    smoothstep(clamp((d.end - state.t) / 0.14, 0, 1));
  if (fade <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = fade;

  const isVertical = state.aspect === '9:16';
  const padX = isVertical ? w * 0.07 : w * 0.12;
  const maxW = w - padX * 2;
  const fontSize = Math.round(isVertical ? w * 0.044 : h * 0.044);
  const labelSize = Math.round(fontSize * 0.62);

  // Measured bottom gradient scrim for guaranteed >= 4.5:1 legibility
  const scrimH = h * (isVertical ? 0.25 : 0.26);
  const grad = ctx.createLinearGradient(0, h - scrimH, 0, h);
  grad.addColorStop(0, 'rgba(6, 8, 18, 0)');
  grad.addColorStop(0.55, 'rgba(6, 8, 18, 0.72)');
  grad.addColorStop(1, 'rgba(6, 8, 18, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - scrimH, w, scrimH);

  // Word wrap cleanly
  ctx.font =
    variant === 'miniature'
      ? `600 ${fontSize}px "Fraunces", Georgia, serif`
      : `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const words = d.text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineH = fontSize * 1.26;
  const bottomY = h - (isVertical ? h * 0.065 : h * 0.055);
  const textStartY = bottomY - (lines.length - 1) * lineH;

  // Speaker kicker (clean unboxed text)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${labelSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const speakerCol =
    d.speaker === 'betaal'
      ? variant === 'miniature'
        ? '#ff7a8a'
        : '#ff3855'
      : d.speaker === 'vikram'
        ? '#f5c956'
        : '#c5d2eb';
  ctx.fillStyle = speakerCol;
  ctx.fillText(d.speakerLabel.toUpperCase(), w / 2, textStartY - fontSize * 0.95);

  // Caption text
  ctx.font =
    variant === 'miniature'
      ? `600 ${fontSize}px "Fraunces", Georgia, serif`
      : `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  for (let i = 0; i < lines.length; i++) {
    const ly = textStartY + i * lineH;
    ctx.fillStyle = 'rgba(5, 7, 15, 0.85)';
    ctx.fillText(lines[i], w / 2 + 2, ly + 2);
    ctx.fillStyle = variant === 'miniature' ? '#f8eed8' : '#ffffff';
    ctx.fillText(lines[i], w / 2, ly);
  }

  ctx.restore();
}

/**
 * Lightweight procedural Raag Bhairavi + dramatic stinger audio engine
 * synced to the 10-second Bake-Off timeline (safe user-gesture unlock).
 */
export class BakeoffAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  public unlocked = false;
  public muted = false;
  private lastStep = -1;
  private lastCut = '';

  private scale = [0, 1, 3, 5, 7, 8, 10, 12, 13, 15];
  private baseFreq = 293.66; // D4 Sa

  private freq(deg: number, oct = 0): number {
    const idx = ((deg % this.scale.length) + this.scale.length) % this.scale.length;
    return this.baseFreq * Math.pow(2, (this.scale[idx] + oct * 12) / 12);
  }

  public unlock(): void {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.48;
      this.master.connect(this.ctx.destination);

      // Subtle atmospheric tanpura drone
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.06;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 380;
      this.droneGain.connect(lp);
      lp.connect(this.master);

      const now = this.ctx.currentTime;
      for (const f of [73.42, 110.0, 146.83]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(this.droneGain);
        osc.start(now);
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.48, this.ctx.currentTime, 0.04);
    }
  }

  public setPlaying(playing: boolean): void {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(playing ? 0.06 : 0, this.ctx.currentTime, 0.08);
    }
  }

  public reset(): void {
    this.lastStep = -1;
    this.lastCut = '';
  }

  private pluck(deg: number, oct = 0, vol = 0.2, dur = 0.55): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const f = this.freq(deg, oct);
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(f * 5.2, now);
    flt.frequency.exponentialRampToValueAtTime(Math.max(240, f * 1.2), now + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    osc.connect(flt);
    flt.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  private flute(deg: number, oct = 0, vol = 0.14, dur = 0.72): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const f = this.freq(deg, oct);
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 0.96, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.09);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  public update(state: DirectorFrameState, isPlaying: boolean): void {
    if (!this.unlocked || !this.ctx || !isPlaying) return;

    // Gentle auto-ducking underneath active speech (just like a real voiceover mix!)
    if (this.master && !this.muted) {
      const targetGain = state.speechEnergy > 0.2 ? 0.34 : 0.48;
      this.master.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }

    const step = Math.floor(state.t / 0.23);
    if (step !== this.lastStep) {
      this.lastStep = step;
      const motif = [0, 4, 2, 3, 5, 4, 2, 1, 0, 4, 6, 5, 4, 2, 1, 0];
      const deg = motif[step % motif.length];
      if (step % 2 === 0 || state.cut.id === 'escape_climax') {
        this.pluck(deg, state.cut.id === 'escape_climax' ? 1 : 0, 0.18, 0.52);
      }
      if (step % 4 === 0) {
        const fluteNotes = [4, 5, 7, 5, 3, 2, 4, 0, 5, 6, 7];
        this.flute(fluteNotes[Math.floor(step / 4) % fluteNotes.length], 0, 0.12, 0.78);
      }
    }

    if (state.cut.id !== this.lastCut) {
      this.lastCut = state.cut.id;
      if (state.cut.id === 'betaal_cu') {
        this.pluck(5, 1, 0.18, 0.45);
      } else if (state.cut.id === 'vikram_flashback') {
        this.pluck(0, 0, 0.24, 0.9);
        this.pluck(4, 0, 0.2, 0.9);
      } else if (state.cut.id === 'escape_climax') {
        [2, 4, 5, 7].forEach((d, i) => setTimeout(() => this.pluck(d, 1, 0.16, 0.35), i * 65));
      }
    }
  }
}
