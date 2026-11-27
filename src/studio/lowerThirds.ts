import {
  EpisodeScript,
  LocationCardConfig,
  LocationCardPosition,
  LocationCardStyle,
  STAGE_CATALOG,
  StoryBeat,
} from './types';

export interface LowerThirdTimingState {
  visible: boolean;
  alpha: number; // 0..1
  slideFrac: number; // 0 (resting) .. 1 (off-edge)
  wipeFrac: number; // 0..1 accent rule reveal
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function easeOutBack(t: number): number {
  const c1 = 1.35;
  const c3 = c1 + 1;
  const x = clamp(t, 0, 1) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

function easeInCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x;
}

/**
 * Pure deterministic timing envelope for animated Location / Time-Jump Lower-Third banners:
 * - Enters at 0.15s with 12-Principles easeOutBack overshoot (0.42s)
 * - Holds cleanly through middle of beat (capped at 3.4s hold on very long beats)
 * - Exits smoothly before beat end (0.35s)
 */
export function computeLowerThirdTiming(localT: number, beatDuration: number): LowerThirdTimingState {
  const dur = Math.max(1.2, Number.isFinite(beatDuration) ? beatDuration : 4);
  const enterStart = 0.15;
  const enterDur = 0.42;
  const exitDur = 0.35;
  const maxVisibleEnd = Math.min(dur - 0.18, enterStart + enterDur + 3.4 + exitDur);
  const exitStart = Math.max(enterStart + enterDur + 0.35, maxVisibleEnd - exitDur);

  if (localT < enterStart || localT >= maxVisibleEnd) {
    return { visible: false, alpha: 0, slideFrac: 1, wipeFrac: 0 };
  }

  if (localT < enterStart + enterDur) {
    const p = clamp((localT - enterStart) / enterDur, 0, 1);
    const eased = easeOutBack(p);
    return {
      visible: true,
      alpha: Number(clamp(p * 1.4, 0, 1).toFixed(3)),
      slideFrac: Number((1 - eased).toFixed(4)),
      wipeFrac: Number(clamp(p * 1.15, 0, 1).toFixed(3)),
    };
  }

  if (localT >= exitStart) {
    const p = clamp((localT - exitStart) / exitDur, 0, 1);
    const eased = easeInCubic(p);
    return {
      visible: true,
      alpha: Number((1 - eased).toFixed(3)),
      slideFrac: Number(eased.toFixed(4)),
      wipeFrac: Number((1 - eased * 0.6).toFixed(3)),
    };
  }

  return { visible: true, alpha: 1, slideFrac: 0, wipeFrac: 1 };
}

/**
 * Draws a crisp deterministic animated Location / Time-Jump Lower-Third banner directly onto `ctx`.
 * Automatically skips `chapter_title`, `moral_card`, and `end_screen` slates.
 */
export function drawLocationLowerThird(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: Pick<StoryBeat, 'locationCard' | 'frame' | 'duration'>,
  localT: number,
  accentHex: string,
  isVert: boolean
): boolean {
  const card = beat.locationCard;
  if (!card || !card.title || !card.title.trim()) return false;
  if (beat.frame === 'chapter_title' || beat.frame === 'moral_card' || beat.frame === 'end_screen') {
    return false;
  }

  const timing = computeLowerThirdTiming(localT, beat.duration);
  if (!timing.visible || timing.alpha <= 0.01) return false;

  const position: LocationCardPosition = card.position || 'top_left';
  const style: LocationCardStyle = card.style || 'cinematic_bar';
  const s = Math.min(w, h) / 720;

  const titleText = card.title.trim();
  const subtitleText = (card.subtitle || '').trim();

  ctx.save();
  ctx.globalAlpha = timing.alpha;

  const titleFontSize = Math.round((isVert ? 20 : 18) * s);
  const subFontSize = Math.round((isVert ? 13 : 12.5) * s);
  const padX = Math.round(16 * s);
  const padY = Math.round(10 * s);

  ctx.font = `700 ${titleFontSize}px "Inter", system-ui, sans-serif`;
  const titleW = ctx.measureText(titleText).width;
  ctx.font = `500 ${subFontSize}px "Inter", system-ui, sans-serif`;
  const subW = subtitleText ? ctx.measureText(subtitleText).width : 0;

  const boxW = Math.min(w * (isVert ? 0.82 : 0.46), Math.max(titleW, subW) + padX * 2 + 12 * s);
  const boxH = subtitleText
    ? Math.round(titleFontSize + subFontSize + padY * 2 + 6 * s)
    : Math.round(titleFontSize + padY * 2);

  const marginX = Math.round(w * (isVert ? 0.06 : 0.045));
  const slidePx = timing.slideFrac * (44 * s) * (position === 'top_right' ? 1 : -1);

  let bx = marginX + slidePx;
  let by = Math.round(h * (isVert ? 0.095 : 0.085));
  if (position === 'top_right') {
    bx = w - marginX - boxW + slidePx;
  } else if (position === 'bottom_left') {
    // Sit cleanly above classic cinema captions
    by = Math.round(h * (isVert ? 0.67 : 0.72) - boxH);
  }

  const radius = style === 'scroll_ribbon' ? 4 * s : style === 'minimal_tag' ? 6 * s : 7 * s;

  // Background plate per style
  ctx.beginPath();
  if (style === 'scroll_ribbon') {
    // Decorative notched parchment ribbon
    const notch = 10 * s;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + boxW, by);
    ctx.lineTo(bx + boxW - notch, by + boxH * 0.5);
    ctx.lineTo(bx + boxW, by + boxH);
    ctx.lineTo(bx, by + boxH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(26, 20, 14, 0.86)';
    ctx.fill();
    ctx.strokeStyle = accentHex || '#f2c85b';
    ctx.lineWidth = Math.max(1.2, 1.8 * s);
    ctx.stroke();
  } else if (style === 'minimal_tag') {
    ctx.roundRect(bx, by, boxW, boxH, radius);
    ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.stroke();
  } else {
    // cinematic_bar
    ctx.roundRect(bx, by, boxW, boxH, radius);
    ctx.fillStyle = 'rgba(9, 12, 22, 0.84)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.stroke();
  }

  // Animated vertical accent rule
  const accentBarW = Math.max(3, 4.5 * s);
  const accentH = Math.max(2, (boxH - 12 * s) * timing.wipeFrac);
  ctx.fillStyle = accentHex || '#f2c85b';
  const barX = position === 'top_right' ? bx + boxW - accentBarW - 5 * s : bx + 5 * s;
  ctx.fillRect(barX, by + 6 * s, accentBarW, accentH);

  // Typography
  const textX = position === 'top_right' ? bx + padX : bx + padX + accentBarW + 4 * s;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 6 * s;

  ctx.font = `700 ${titleFontSize}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = style === 'scroll_ribbon' ? '#fdf3d7' : '#ffffff';
  ctx.fillText(titleText, textX, by + padY, boxW - padX * 2 - accentBarW);

  if (subtitleText) {
    ctx.font = `600 ${subFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = accentHex || '#f2c85b';
    ctx.fillText(
      subtitleText,
      textX,
      by + padY + titleFontSize + 5 * s,
      boxW - padX * 2 - accentBarW
    );
  }

  ctx.restore();
  return true;
}

/**
 * Pure helper: inspects an episode's beat list and automatically attaches tasteful Location Cards
 * whenever `beat.stage` changes (and on the first narrative beat), preserving any user-authored cards.
 */
export function autoTagStageChangeLocationCards(episode: EpisodeScript): {
  episode: EpisodeScript;
  taggedCount: number;
} {
  const stageLabelMap = new Map(STAGE_CATALOG.map((st) => [st.id, st.label]));
  let lastStage: string | null = null;
  let taggedCount = 0;

  const nextBeats = episode.beats.map((beat, idx) => {
    const isSlate =
      beat.frame === 'chapter_title' || beat.frame === 'moral_card' || beat.frame === 'end_screen';
    if (isSlate) return beat;

    const stageChanged = lastStage === null || beat.stage !== lastStage;
    lastStage = beat.stage;

    if (!stageChanged || beat.locationCard?.title?.trim()) {
      return beat;
    }

    const stageLabel = stageLabelMap.get(beat.stage) || beat.stage.replace(/_/g, ' ');
    const card: LocationCardConfig = {
      title: stageLabel,
      subtitle: idx === 0 ? episode.series : beat.title || `Scene ${idx + 1}`,
      position: 'top_left',
      style: 'cinematic_bar',
    };
    taggedCount += 1;
    return { ...beat, locationCard: card };
  });

  return {
    episode: { ...episode, beats: nextBeats },
    taggedCount,
  };
}
