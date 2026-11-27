import {
  CastMember,
  EpisodeScript,
  ExpressionId,
  MoodId,
  PropId,
  RenderStyleId,
  StageId,
  resolveVisualStyle,
} from './types';
import {
  MOOD_PALETTES,
  drawActorCloseUp,
  drawStageBackdrop,
  drawStoryProp,
} from './renderAssets';
import { composeStyledScene } from './styleEngines';
import {
  LanguageSpec,
  isRtlText,
  resolveEpisodeLanguage,
  safeUppercase,
} from './i18n';

export type ThumbnailLayoutId =
  | 'split_faceoff'
  | 'hero_prop'
  | 'center_epic'
  | 'mystery_silhouette';

export interface ThumbnailConfig {
  layout: ThumbnailLayoutId;
  renderStyle: RenderStyleId;
  stage: StageId;
  mood: MoodId;
  leftCastId: string;
  leftExpression: ExpressionId;
  rightCastId: string;
  rightExpression: ExpressionId;
  prop: PropId;
  kicker: string;
  headlineTop: string;
  headlineAccent: string;
}

export interface ThumbnailAbcVariant {
  key: 'A' | 'B' | 'C';
  name: string;
  angle: string;
  config: ThumbnailConfig;
}

function makeShortPunchHeadline(title: string, lang: LanguageSpec): [string, string] {
  const clean = title.replace(/['"“”「」]/g, '').trim();
  if (lang.scriptType === 'cjk') {
    const chars = Array.from(clean);
    if (chars.length <= 6) return [clean, lang.thumbnailFallback];
    const mid = Math.ceil(chars.length / 2);
    return [chars.slice(0, mid).join('').slice(0, 12), chars.slice(mid).join('').slice(0, 12)];
  }
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return [safeUppercase(clean, lang), lang.thumbnailFallback];
  const mid = Math.ceil(words.length / 2);
  return [
    safeUppercase(words.slice(0, mid).join(' ').slice(0, 24), lang),
    safeUppercase(words.slice(mid).join(' ').slice(0, 24), lang),
  ];
}

/**
 * Generates 3 psychologically distinct high-CTR YouTube A/B/C Thumbnail Variants
 * ready for YouTube Studio's native "Test & Compare" workflow:
 *  - Variant A: Emotional Face-Off (two rival characters + lightning divider)
 *  - Variant B: Action Climax + Hero Prop (protagonist + giant focal artifact)
 *  - Variant C: Mystery Silhouette (ominous backlit figure + glowing eyes + curiosity gap)
 */
export function buildAbcThumbnailVariants(episode: EpisodeScript): ThumbnailAbcVariant[] {
  const lang = resolveEpisodeLanguage(episode);
  const firstBeat = episode.beats[0];
  const climaxBeat =
    episode.beats.find((b) => b.mood === 'crimson_wrath' || b.fx === 'crimson_impact') ||
    episode.beats[Math.floor(episode.beats.length / 2)] ||
    firstBeat;
  const heroProp = (episode.beats.find((b) => b.prop !== 'none')?.prop ||
    'khanda_sword') as PropId;
  const look = resolveVisualStyle(episode.visualStyle);
  const [line1, line2] = makeShortPunchHeadline(episode.title, lang);

  const actor1 = episode.cast[0]?.id || '';
  const actor2 = episode.cast[1]?.id || actor1;

  return [
    {
      key: 'A',
      name: 'Variant A · Emotional Face-Off',
      angle: 'High-tension rivalry eyes',
      config: {
        layout: 'split_faceoff',
        renderStyle: look.renderStyle,
        stage: (firstBeat?.stage || 'banyan_clearing') as StageId,
        mood: (firstBeat?.mood || 'midnight_banyan') as MoodId,
        leftCastId: actor1,
        leftExpression: 'stern',
        rightCastId: actor2,
        rightExpression: 'sly',
        prop: heroProp,
        kicker: episode.series,
        headlineTop: line1,
        headlineAccent: line2,
      },
    },
    {
      key: 'B',
      name: 'Variant B · Climax & Relic',
      angle: 'Hero emotion + glowing object',
      config: {
        layout: 'hero_prop',
        renderStyle: look.renderStyle,
        stage: (climaxBeat?.stage || firstBeat?.stage || 'banyan_clearing') as StageId,
        mood: 'crimson_wrath',
        leftCastId: actor1,
        leftExpression: 'shocked',
        rightCastId: actor2,
        rightExpression: 'stern',
        prop: heroProp,
        kicker: '1 MISTAKE CHANGED EVERYTHING',
        headlineTop: line1,
        headlineAccent: 'WHO OUTSMARTED WHOM?',
      },
    },
    {
      key: 'C',
      name: 'Variant C · Mystery Silhouette',
      angle: 'Curiosity gap + glowing eyes',
      config: {
        layout: 'mystery_silhouette',
        renderStyle: look.renderStyle,
        stage: (climaxBeat?.stage || firstBeat?.stage || 'banyan_clearing') as StageId,
        mood: 'midnight_banyan',
        leftCastId: actor2,
        leftExpression: 'sly',
        rightCastId: actor1,
        rightExpression: 'shocked',
        prop: heroProp,
        kicker: episode.series,
        headlineTop: 'HE BROKE ONE RULE',
        headlineAccent: line2,
      },
    },
  ];
}

/**
 * Renders a crisp 1280×720 high-CTR YouTube Thumbnail using Katha Studio's
 * exact active Art Engine so thumbnails match the episode 100%.
 */
export function renderYoutubeThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EpisodeScript,
  cfg: ThumbnailConfig
): void {
  const castMap = new Map<string, CastMember>();
  for (const c of episode.cast) castMap.set(c.id, c);
  const leftCast = castMap.get(cfg.leftCastId) || episode.cast[0];
  const rightCast = castMap.get(cfg.rightCastId) || episode.cast[1] || episode.cast[0];
  const pal = MOOD_PALETTES[cfg.mood] || MOOD_PALETTES.midnight_banyan;
  const style = resolveVisualStyle(episode.visualStyle);
  const activeStyle = cfg.renderStyle || style.renderStyle;
  const s = Math.min(w, h) / 620;

  ctx.save();

  composeStyledScene(ctx, w, h, activeStyle, cfg.mood, 1.5, {
    drawBackdrop: (bCtx) => {
      drawStageBackdrop(bCtx, w, h, cfg.stage, cfg.mood, 1.5);
      const rad = bCtx.createRadialGradient(w * 0.5, h * 0.44, 60 * s, w * 0.5, h * 0.5, w * 0.72);
      rad.addColorStop(
        0,
        cfg.layout === 'mystery_silhouette'
          ? 'rgba(255, 62, 72, 0.32)'
          : 'rgba(255, 212, 82, 0.16)'
      );
      rad.addColorStop(0.62, 'rgba(6, 9, 20, 0.36)');
      rad.addColorStop(1, 'rgba(4, 6, 14, 0.86)');
      bCtx.fillStyle = rad;
      bCtx.fillRect(0, 0, w, h);

      if (cfg.layout === 'split_faceoff') {
        bCtx.save();
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.lineTo(w * 0.55, 0);
        bCtx.lineTo(w * 0.45, h);
        bCtx.lineTo(0, h);
        bCtx.closePath();
        bCtx.fillStyle = pal.skyTop;
        bCtx.globalAlpha = 0.42;
        bCtx.fill();
        bCtx.beginPath();
        bCtx.moveTo(w * 0.55, 0);
        bCtx.lineTo(w, 0);
        bCtx.lineTo(w, h);
        bCtx.lineTo(w * 0.45, h);
        bCtx.closePath();
        bCtx.fillStyle = pal.skyLow;
        bCtx.fill();
        bCtx.restore();
      } else if (cfg.layout === 'center_epic') {
        bCtx.save();
        bCtx.translate(w * 0.5, h * 0.48);
        bCtx.strokeStyle = 'rgba(255, 208, 77, 0.18)';
        bCtx.lineWidth = 6 * s;
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          bCtx.beginPath();
          bCtx.moveTo(Math.cos(a) * 140 * s, Math.sin(a) * 140 * s);
          bCtx.lineTo(Math.cos(a) * 560 * s, Math.sin(a) * 560 * s);
          bCtx.stroke();
        }
        bCtx.restore();
      } else if (cfg.layout === 'mystery_silhouette') {
        // Dramatic giant backlit blood-gold eclipse moon behind silhouette!
        bCtx.save();
        const halo = bCtx.createRadialGradient(w * 0.5, h * 0.36, 40 * s, w * 0.5, h * 0.36, 300 * s);
        halo.addColorStop(0, 'rgba(255, 224, 112, 0.92)');
        halo.addColorStop(0.52, 'rgba(230, 56, 48, 0.45)');
        halo.addColorStop(1, 'rgba(10, 12, 22, 0)');
        bCtx.fillStyle = halo;
        bCtx.beginPath();
        bCtx.arc(w * 0.5, h * 0.36, 300 * s, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.restore();
      }
    },
    drawForeground: (fCtx) => {
      if (cfg.layout === 'split_faceoff') {
        fCtx.save();
        fCtx.beginPath();
        fCtx.moveTo(0, 0);
        fCtx.lineTo(w * 0.55, 0);
        fCtx.lineTo(w * 0.45, h);
        fCtx.lineTo(0, h);
        fCtx.closePath();
        fCtx.clip();
        fCtx.translate(w * 0.25, h * 0.52);
        fCtx.scale(s * 1.48, s * 1.48);
        drawActorCloseUp(fCtx, leftCast, cfg.leftExpression, 1, 0.4, 'right', 1.2);
        fCtx.restore();

        fCtx.save();
        fCtx.beginPath();
        fCtx.moveTo(w * 0.55, 0);
        fCtx.lineTo(w, 0);
        fCtx.lineTo(w, h);
        fCtx.lineTo(w * 0.45, h);
        fCtx.closePath();
        fCtx.clip();
        fCtx.translate(w * 0.75, h * 0.52);
        fCtx.scale(s * 1.48, s * 1.48);
        drawActorCloseUp(fCtx, rightCast, cfg.rightExpression, 2, 0.6, 'left', 1.2);
        fCtx.restore();

        fCtx.strokeStyle = '#ffd04d';
        fCtx.lineWidth = 10 * s;
        fCtx.beginPath();
        fCtx.moveTo(w * 0.55, 0);
        fCtx.lineTo(w * 0.45, h);
        fCtx.stroke();

        if (cfg.prop !== 'none') {
          drawStoryProp(fCtx, cfg.prop, w * 0.5, h * 0.34, s * 0.92, 1.5, 0.5);
        }
      } else if (cfg.layout === 'hero_prop') {
        fCtx.save();
        fCtx.translate(w * 0.73, h * 0.52);
        fCtx.scale(s * 1.72, s * 1.72);
        drawActorCloseUp(fCtx, leftCast, cfg.leftExpression, 1, 0.5, 'left', 1.2);
        fCtx.restore();

        if (cfg.prop !== 'none') {
          // Subtle glowing spotlight behind focal relic
          fCtx.save();
          const pGlow = fCtx.createRadialGradient(w * 0.28, h * 0.35, 10 * s, w * 0.28, h * 0.35, 160 * s);
          pGlow.addColorStop(0, 'rgba(255, 214, 92, 0.55)');
          pGlow.addColorStop(1, 'rgba(255, 214, 92, 0)');
          fCtx.fillStyle = pGlow;
          fCtx.beginPath();
          fCtx.arc(w * 0.28, h * 0.35, 160 * s, 0, Math.PI * 2);
          fCtx.fill();
          fCtx.restore();
          drawStoryProp(fCtx, cfg.prop, w * 0.28, h * 0.35, s * 1.2, 1.5, 0.5);
        }
      } else if (cfg.layout === 'mystery_silhouette') {
        // Darkened rim-lit silhouette of looming antagonist/mystery actor
        const silhouetteCast: CastMember = {
          ...leftCast,
          primaryColor: '#070912',
          accentColor: '#ff3648',
          skinColor: '#0c1020',
        };
        fCtx.save();
        fCtx.translate(w * 0.5, h * 0.44);
        fCtx.scale(s * 1.85, s * 1.85);
        drawActorCloseUp(fCtx, silhouetteCast, cfg.leftExpression, 0, 0.2, 'right', 1.2);
        // Piercing glowing curiosity eyes cutting through the silhouette!
        fCtx.fillStyle = '#ffe169';
        fCtx.shadowColor = '#ff3648';
        fCtx.shadowBlur = 18;
        fCtx.beginPath();
        fCtx.ellipse(-28, -10, 12, 5.5, 0.14, 0, Math.PI * 2);
        fCtx.ellipse(28, -10, 12, 5.5, -0.14, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.restore();

        if (cfg.prop !== 'none') {
          drawStoryProp(fCtx, cfg.prop, w * 0.19, h * 0.4, s * 1.05, 1.5, 0.5);
          // Curiosity question glyph on right balance
          fCtx.save();
          fCtx.font = `900 ${Math.round(146 * s)}px "Fraunces", Georgia, serif`;
          fCtx.textAlign = 'center';
          fCtx.fillStyle = 'rgba(255, 212, 82, 0.9)';
          fCtx.strokeStyle = '#050712';
          fCtx.lineWidth = 14 * s;
          fCtx.strokeText('?', w * 0.82, h * 0.49);
          fCtx.fillText('?', w * 0.82, h * 0.49);
          fCtx.restore();
        }
      } else {
        fCtx.save();
        fCtx.translate(w * 0.5, h * 0.48);
        fCtx.scale(s * 1.7, s * 1.7);
        drawActorCloseUp(fCtx, leftCast, cfg.leftExpression, 2, 0.7, 'right', 1.2);
        fCtx.restore();

        if (cfg.prop !== 'none') {
          drawStoryProp(fCtx, cfg.prop, w * 0.82, h * 0.34, s * 0.95, 1.5, 0.5);
        }
      }
    },
  });

  // Bottom dark gradient scrim for razor-sharp high-CTR headline legibility
  const scrim = ctx.createLinearGradient(0, h * 0.44, 0, h);
  scrim.addColorStop(0, 'rgba(5, 7, 16, 0)');
  scrim.addColorStop(0.58, 'rgba(5, 7, 16, 0.8)');
  scrim.addColorStop(1, 'rgba(5, 7, 16, 0.97)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.44, w, h * 0.56);

  // Crisp frame border matching episode look
  const m = Math.round(16 * s);
  ctx.strokeStyle =
    cfg.layout === 'mystery_silhouette'
      ? 'rgba(255, 72, 88, 0.78)'
      : style.frameBorder === 'manuscript_margin'
        ? '#d9a441'
        : 'rgba(242, 200, 91, 0.72)';
  ctx.lineWidth = 4 * s;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);

  // Typography Layout (Script-aware fonts, RTL direction, and safe maxWidth clamping)
  const lang = resolveEpisodeLanguage(episode);
  const alignLeft = cfg.layout === 'hero_prop';
  const rtl = isRtlText(`${cfg.headlineTop} ${cfg.headlineAccent}`, lang.code);
  const tx = alignLeft ? (rtl ? w * 0.94 : w * 0.06) : w * 0.5;
  const maxTextW = alignLeft ? w * 0.86 : w * 0.9;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = alignLeft ? (rtl ? 'right' : 'left') : 'center';
  ctx.textBaseline = 'alphabetic';

  if (cfg.kicker.trim()) {
    const kickerText = safeUppercase(cfg.kicker, lang);
    ctx.font = `800 ${Math.round(24 * s)}px ${lang.fontFamily}`;
    ctx.fillStyle = cfg.layout === 'mystery_silhouette' ? '#ff6470' : '#f2c85b';
    ctx.strokeStyle = '#050712';
    ctx.lineWidth = 7 * s;
    ctx.lineJoin = 'round';
    ctx.strokeText(kickerText, tx, h * 0.69, maxTextW);
    ctx.fillText(kickerText, tx, h * 0.69, maxTextW);
  }

  if (cfg.headlineTop.trim()) {
    const topText = safeUppercase(cfg.headlineTop, lang);
    ctx.font = `900 ${Math.round(72 * s)}px ${lang.displayFontFamily}`;
    ctx.strokeStyle = '#04050c';
    ctx.lineWidth = 14 * s;
    ctx.lineJoin = 'round';
    ctx.strokeText(topText, tx, h * 0.81, maxTextW);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(topText, tx, h * 0.81, maxTextW);
  }

  if (cfg.headlineAccent.trim()) {
    const accentText = safeUppercase(cfg.headlineAccent, lang);
    ctx.font = `900 ${Math.round(78 * s)}px ${lang.fontFamily}`;
    ctx.strokeStyle = '#04050c';
    ctx.lineWidth = 15 * s;
    ctx.lineJoin = 'round';
    ctx.strokeText(accentText, tx, h * 0.93, maxTextW);
    ctx.fillStyle = '#ffd04d';
    ctx.fillText(accentText, tx, h * 0.93, maxTextW);
  }

  ctx.restore();
}
