import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Dices,
  Sparkles,
  Check,
  Copy,
  FlipHorizontal2,
  BookmarkPlus,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShieldCheck,
  FileJson,
} from 'lucide-react';
import {
  ARCHETYPE_CATALOG,
  ArchetypeId,
  CastMember,
  EpisodeScript,
  EXPRESSION_CATALOG,
  ExpressionId,
  MOOD_CATALOG,
  MoodId,
  POSE_LIST,
  PoseId,
  RENDER_STYLE_CATALOG,
  RenderStyleId,
  resolveVisualStyle,
} from './types';
import {
  AURA_STYLE_CATALOG,
  BOTTOM_STYLE_CATALOG,
  CAPE_CATALOG,
  CHASSIS_CATALOG,
  CharacterDNA,
  CharacterSilhouetteFingerprint,
  COLLAR_CATALOG,
  CURATED_DNA_PALETTES,
  EAR_STYLE_CATALOG,
  EntityChassisId,
  EYE_STYLE_CATALOG,
  FACE_MARK_CATALOG,
  FACIAL_HAIR_CATALOG,
  GAIT_CATALOG,
  HAIR_STYLE_CATALOG,
  HEAD_SHAPE_CATALOG,
  HEADWEAR_CATALOG,
  HORN_STYLE_CATALOG,
  NOSE_STYLE_CATALOG,
  SURFACE_PATTERN_CATALOG,
  TAIL_STYLE_CATALOG,
  TOP_STYLE_CATALOG,
  WING_STYLE_CATALOG,
  computeDnaFingerprint,
  createBaseDna,
  evaluateMemberUniqueness,
  hydrateArchetypeToDna,
  mutateDnaForUniqueness,
  randomizeCharacterDna,
  syncMemberWithDna,
  validateAndNormalizeDna,
} from './characterDna';
import {
  PartThumbnailCategory,
  drawDnaPartThumbnail,
  drawModularEntityCloseUp,
  drawModularEntityFullBody,
} from './modularEntityRenderer';
import { drawStageBackdrop } from './renderAssets';
import { composeStyledScene } from './styleEngines';
import { collectLedgerCastFingerprints, loadPublishLedger } from './monetizationShield';

type WorkshopTab = 'body' | 'face' | 'hair' | 'outfit' | 'traits';
type PreviewView = 'full' | 'closeup' | 'split';

interface EntityWorkshopModalProps {
  member: CastMember;
  isNew?: boolean;
  episode: EpisodeScript;
  onSave: (member: CastMember, options?: { addToCurrentBeat?: boolean }) => void;
  onSaveToBible?: (member: CastMember) => void;
  onClose: () => void;
}

interface PartThumbTileProps {
  category: PartThumbnailCategory;
  optionId: string;
  label: string;
  dna: CharacterDNA;
  active: boolean;
  onSelect: () => void;
}

const PartThumbTile: React.FC<PartThumbTileProps> = React.memo(
  ({ category, optionId, label, dna, active, onSelect }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      drawDnaPartThumbnail(ctx, c.width, c.height, category, optionId, dna);
    }, [
      category,
      optionId,
      dna.chassis,
      dna.head.headShape,
      dna.palette.primary,
      dna.palette.secondary,
      dna.palette.accent,
      dna.palette.skin,
      dna.palette.hair,
      dna.palette.eye,
      dna.palette.patternTint,
    ]);

    return (
      <button
        type="button"
        onClick={onSelect}
        className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
          active
            ? 'bg-[#1c2440] border-[#f2c85b]'
            : 'bg-[#111629] border-white/10 hover:border-white/25'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={96}
          height={64}
          className="w-full h-12 rounded bg-[#0c1020] block object-cover"
        />
        <div
          className={`mt-1 text-[10px] font-semibold truncate ${
            active ? 'text-[#f2c85b]' : 'text-[#d4dced]'
          }`}
        >
          {label}
        </div>
      </button>
    );
  }
);

PartThumbTile.displayName = 'PartThumbTile';

const MORPH_SLIDERS: Array<{
  key: 'height' | 'shoulderWidth' | 'torsoBulk' | 'headRatio' | 'limbLength' | 'posture';
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}> = [
  { key: 'height', label: 'Height', min: 0.72, max: 1.32, step: 0.02, format: (v) => `${v.toFixed(2)}×` },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    min: 0.72,
    max: 1.38,
    step: 0.02,
    format: (v) => `${v.toFixed(2)}×`,
  },
  {
    key: 'torsoBulk',
    label: 'Torso Bulk',
    min: 0.72,
    max: 1.38,
    step: 0.02,
    format: (v) => `${v.toFixed(2)}×`,
  },
  {
    key: 'headRatio',
    label: 'Head Ratio',
    min: 0.8,
    max: 1.28,
    step: 0.02,
    format: (v) => `${v.toFixed(2)}×`,
  },
  {
    key: 'limbLength',
    label: 'Limb Length',
    min: 0.78,
    max: 1.28,
    step: 0.02,
    format: (v) => `${v.toFixed(2)}×`,
  },
  {
    key: 'posture',
    label: 'Posture Lean',
    min: -0.25,
    max: 0.25,
    step: 0.02,
    format: (v) => (v === 0 ? '0.00' : `${v > 0 ? '+' : ''}${v.toFixed(2)}`),
  },
];

export const EntityWorkshopModal: React.FC<EntityWorkshopModalProps> = ({
  member,
  isNew = false,
  episode,
  onSave,
  onSaveToBible,
  onClose,
}) => {
  const initialDna = useMemo<CharacterDNA>(() => {
    if (member.dna) return JSON.parse(JSON.stringify(member.dna)) as CharacterDNA;
    return hydrateArchetypeToDna(member, member.id || member.name);
  }, [member]);

  const [name, setName] = useState(member.name || 'Custom Entity');
  const [archetype, setArchetype] = useState<ArchetypeId>(member.archetype || 'king');
  const [dna, setDna] = useState<CharacterDNA>(initialDna);
  const [activeTab, setActiveTab] = useState<WorkshopTab>('body');

  // Stage preview controls
  const [viewMode, setViewMode] = useState<PreviewView>('full');
  const [pose, setPose] = useState<PoseId>('stand');
  const [expression, setExpression] = useState<ExpressionId>('warm');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isTalking, setIsTalking] = useState(false);
  const [renderStyle, setRenderStyle] = useState<RenderStyleId>(
    () => resolveVisualStyle(episode.visualStyle).renderStyle
  );
  const [mood, setMood] = useState<MoodId>(
    () => episode.beats[0]?.mood || 'midnight_banyan'
  );
  const [addToCurrentBeat, setAddToCurrentBeat] = useState<boolean>(isNew);

  // Utility states
  const [notice, setNotice] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copiedDna, setCopiedDna] = useState(false);

  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const draftMember = useMemo<CastMember>(
    () =>
      syncMemberWithDna(
        {
          ...member,
          name: name.trim() || 'Custom Entity',
          archetype,
        },
        dna
      ),
    [member, name, archetype, dna]
  );

  // Reference fingerprints for real-time Silhouette Uniqueness readout (other cast + recent Publish Ledger)
  const avoidFingerprints = useMemo<CharacterSilhouetteFingerprint[]>(() => {
    const fellow = episode.cast
      .filter((c) => c.id !== member.id)
      .map((c) => computeDnaFingerprint(c));
    const ledger = loadPublishLedger();
    const past = collectLedgerCastFingerprints(ledger, episode.id);
    return [...fellow, ...past];
  }, [episode.cast, episode.id, member.id]);

  const uniqueness = useMemo(
    () => evaluateMemberUniqueness(draftMember, avoidFingerprints),
    [draftMember, avoidFingerprints]
  );

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((cur) => (cur === msg ? null : cur)), 3200);
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Live 60fps animated Workshop stage canvas
  const previewRef = useRef({
    draftMember,
    dna,
    viewMode,
    pose,
    expression,
    facing,
    isTalking,
    renderStyle,
    mood,
  });

  useEffect(() => {
    previewRef.current = {
      draftMember,
      dna,
      viewMode,
      pose,
      expression,
      facing,
      isTalking,
      renderStyle,
      mood,
    };
  }, [draftMember, dna, viewMode, pose, expression, facing, isTalking, renderStyle, mood]);

  useEffect(() => {
    let rafId = 0;
    const startTs = performance.now();

    const tick = (now: number) => {
      const canvas = stageCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const t = (now - startTs) / 1000;
          const p = previewRef.current;
          const w = canvas.width;
          const h = canvas.height;
          const viseme = p.isTalking ? Math.floor(t * 9.5) % 5 : 0;
          const speechEnergy = p.isTalking ? 0.55 + Math.sin(t * 14) * 0.35 : 0;
          const stageId = episode.beats[0]?.stage || 'banyan_clearing';

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, w, h);

          composeStyledScene(ctx, w, h, p.renderStyle, p.mood, t, {
            drawBackdrop: (bctx) => {
              drawStageBackdrop(bctx, w, h, stageId, p.mood, t * 0.5);
              // Ground horizon sheen so full-body silhouettes read crisply
              const floorGrad = bctx.createLinearGradient(0, h * 0.68, 0, h);
              floorGrad.addColorStop(0, 'rgba(9, 12, 22, 0)');
              floorGrad.addColorStop(1, 'rgba(9, 12, 22, 0.52)');
              bctx.fillStyle = floorGrad;
              bctx.fillRect(0, h * 0.68, w, h * 0.32);
            },
            drawForeground: (fctx) => {
              const lightSide = p.facing === 'right' ? 'right' : 'left';
              if (p.viewMode === 'full') {
                drawModularEntityFullBody(
                  fctx,
                  p.draftMember,
                  p.dna,
                  w * 0.5,
                  h * 0.87,
                  1.16,
                  p.pose,
                  p.expression,
                  p.facing,
                  viseme,
                  speechEnergy,
                  t,
                  (t * 0.25) % 1,
                  undefined,
                  p.renderStyle
                );
              } else if (p.viewMode === 'closeup') {
                fctx.save();
                fctx.translate(w * 0.5, h * 0.58);
                fctx.scale(1.18, 1.18);
                if (p.facing === 'left') fctx.scale(-1, 1);
                drawModularEntityCloseUp(
                  fctx,
                  p.draftMember,
                  p.dna,
                  p.expression,
                  viseme,
                  speechEnergy,
                  lightSide,
                  t
                );
                fctx.restore();
              } else {
                // Split view: full body left + close-up portrait right
                drawModularEntityFullBody(
                  fctx,
                  p.draftMember,
                  p.dna,
                  w * 0.31,
                  h * 0.87,
                  1.02,
                  p.pose,
                  p.expression,
                  p.facing,
                  viseme,
                  speechEnergy,
                  t,
                  (t * 0.25) % 1,
                  undefined,
                  p.renderStyle
                );
                // Hairline divider
                fctx.save();
                fctx.strokeStyle = 'rgba(255,255,255,0.16)';
                fctx.lineWidth = 1;
                fctx.beginPath();
                fctx.moveTo(w * 0.58, 18);
                fctx.lineTo(w * 0.58, h - 18);
                fctx.stroke();
                fctx.translate(w * 0.79, h * 0.58);
                fctx.scale(0.86, 0.86);
                if (p.facing === 'left') fctx.scale(-1, 1);
                drawModularEntityCloseUp(
                  fctx,
                  p.draftMember,
                  p.dna,
                  p.expression,
                  viseme,
                  speechEnergy,
                  lightSide,
                  t
                );
                fctx.restore();
              }
            },
          });

          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [episode.beats]);

  // DNA mutation helpers
  const setChassis = (nextChassis: EntityChassisId) => {
    setDna((prev) => {
      const fresh = createBaseDna(nextChassis, { palette: prev.palette });
      return {
        ...fresh,
        appendages: {
          ...fresh.appendages,
          aura: prev.appendages.aura,
        },
      };
    });
  };

  const patchMorph = (patch: Partial<CharacterDNA['morph']>) => {
    setDna((prev) => ({ ...prev, morph: { ...prev.morph, ...patch } }));
  };

  const patchHead = (patch: Partial<CharacterDNA['head']>) => {
    setDna((prev) => ({ ...prev, head: { ...prev.head, ...patch } }));
  };

  const patchOutfit = (patch: Partial<CharacterDNA['outfit']>) => {
    setDna((prev) => ({ ...prev, outfit: { ...prev.outfit, ...patch } }));
  };

  const patchAppendages = (patch: Partial<CharacterDNA['appendages']>) => {
    setDna((prev) => ({ ...prev, appendages: { ...prev.appendages, ...patch } }));
  };

  const patchPalette = (patch: Partial<CharacterDNA['palette']>) => {
    setDna((prev) => ({ ...prev, palette: { ...prev.palette, ...patch } }));
  };

  const handleRandomize = () => {
    const next = randomizeCharacterDna(dna.chassis, Date.now());
    setDna(next);
    flash(`Generated fresh ${next.chassis} silhouette.`);
  };

  const handleMutateLook = () => {
    const mutated = mutateDnaForUniqueness(
      draftMember,
      avoidFingerprints.length > 0 ? avoidFingerprints : [computeDnaFingerprint(draftMember)],
      { salt: Date.now() }
    );
    setDna(mutated);
    flash(`Mutated ${mutated.chassis} silhouette into a distinct look.`);
  };

  const handleSeedFromArchetype = (arch: ArchetypeId) => {
    setArchetype(arch);
    const hydrated = hydrateArchetypeToDna(
      { id: member.id, name, archetype: arch },
      `${arch}_${Date.now()}`
    );
    setDna(hydrated);
    flash(`Seeded modular anatomy from ${arch.replace(/_/g, ' ')}.`);
  };

  const handleCopyDnaJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(dna, null, 2));
      setCopiedDna(true);
      setTimeout(() => setCopiedDna(false), 1800);
    } catch {
      setJsonText(JSON.stringify(dna, null, 2));
      setJsonOpen(true);
    }
  };

  const handleImportDnaJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = validateAndNormalizeDna(parsed, draftMember);
      if (!normalized) {
        flash('Provide a valid Character DNA JSON object.');
        return;
      }
      setDna(normalized);
      setJsonOpen(false);
      flash('Imported Character DNA JSON.');
    } catch {
      flash('Invalid JSON — check braces and commas.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1220px] h-[92vh] bg-[#0e1222] border border-white/12 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 h-14 border-b border-white/10 bg-[#0b0e19] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="font-display text-sm font-semibold text-white whitespace-nowrap">
              Entity DNA Workshop
            </span>
            <span className="text-white/20">·</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character or creature name..."
              className="h-8 w-44 sm:w-56 px-2.5 rounded-md bg-[#13182b] border border-white/12 text-xs font-semibold text-white focus:outline-none focus:border-[#f2c85b]"
            />
            <span className="hidden md:inline text-[11px] text-[#8e97b0] truncate">
              {dna.chassis} · {dna.head.headShape.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRandomize}
              className="h-8 px-2.5 rounded-md bg-[#141a2f] hover:bg-[#1e2745] border border-white/10 text-xs font-semibold text-[#e2e7f5] inline-flex items-center gap-1.5 cursor-pointer"
              title="Randomize features for current body chassis"
            >
              <Dices className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span className="hidden sm:inline">Randomize</span>
            </button>

            <button
              type="button"
              onClick={handleMutateLook}
              className="h-8 px-2.5 rounded-md bg-[#141a2f] hover:bg-[#1e2745] border border-white/10 text-xs font-semibold text-[#e2e7f5] inline-flex items-center gap-1.5 cursor-pointer"
              title="Mutate silhouette away from similar cast members and past uploads"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span className="hidden sm:inline">Mutate Look</span>
            </button>

            {onSaveToBible && (
              <button
                type="button"
                onClick={() => {
                  onSaveToBible(draftMember);
                  flash(`Locked "${draftMember.name}" into Channel Cast Bible.`);
                }}
                className="h-8 px-2.5 rounded-md bg-[#141a2f] hover:bg-[#1e2745] border border-white/10 text-xs font-semibold text-[#e2e7f5] inline-flex items-center gap-1.5 cursor-pointer"
                title="Save this custom entity into your persistent Channel Cast Bible"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#9ec2ff]" />
                <span className="hidden lg:inline">Save to Bible</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSave(draftMember, { addToCurrentBeat });
                onClose();
              }}
              className="h-8 px-3.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isNew ? 'Add to Cast' : 'Save to Cast'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center text-[#9aa3bd] hover:text-white cursor-pointer"
              title="Close Workshop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {notice && (
          <div className="px-4 py-1.5 bg-[#16213d] border-b border-[#f2c85b]/25 text-[11px] text-[#f7e7bc] flex items-center justify-between shrink-0">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[10px] text-[#8e97b0] hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main 2-Pane Split: Left 54% Live Stage | Right 46% Modular Builder */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* LEFT STAGE PANE */}
          <div className="lg:w-[54%] bg-[#090c16] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col min-h-0">
            {/* Live Canvas Container */}
            <div className="flex-1 min-h-[240px] p-4 flex flex-col items-center justify-center">
              <div className="w-full max-w-[640px] aspect-[16/10] rounded-lg overflow-hidden border border-white/10 bg-[#070a13] relative">
                <canvas
                  ref={stageCanvasRef}
                  width={720}
                  height={450}
                  className="w-full h-full block"
                />
              </div>

              {/* Single-Line Real-Time Silhouette Uniqueness Bar */}
              <div className="w-full max-w-[640px] mt-3 px-3 py-2 rounded-lg bg-[#111629] border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-[11px]">
                  {uniqueness.isTwinRisk ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[#9aa3bd]">Silhouette Distance</span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      uniqueness.isTwinRisk ? 'text-[#f2c85b]' : 'text-emerald-300'
                    }`}
                  >
                    Δ {Math.round(uniqueness.minDistance * 100)}%
                  </span>
                  {avoidFingerprints.length > 0 && uniqueness.closestMatchName ? (
                    <span className="text-[#8e97b0] truncate">
                      · closest to {uniqueness.closestMatchName}
                    </span>
                  ) : (
                    <span className="text-[#8e97b0]">· original baseline</span>
                  )}
                </div>

                {uniqueness.isTwinRisk && (
                  <button
                    type="button"
                    onClick={handleMutateLook}
                    className="h-6 px-2 rounded bg-[#2a2315] hover:bg-[#3a301c] border border-[#f2c85b]/45 text-[10px] font-semibold text-[#f2c85b] cursor-pointer"
                  >
                    Mutate Twin
                  </button>
                )}
              </div>
            </div>

            {/* Stage Preview Control Bar */}
            <div className="px-4 py-3 border-t border-white/10 bg-[#0d1120] space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* View Mode */}
                <div className="inline-flex rounded-md bg-[#090c16] border border-white/10 p-0.5">
                  {(
                    [
                      ['full', 'Full Body'],
                      ['closeup', 'Close-Up'],
                      ['split', 'Split'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setViewMode(id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        viewMode === id
                          ? 'bg-[#1c2440] text-[#f2c85b]'
                          : 'text-[#8e97b0] hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Talk + Flip + Add-to-beat checkbox */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsTalking((v) => !v)}
                    className={`h-7 px-2.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      isTalking
                        ? 'bg-[#2a2315] border-[#f2c85b]/50 text-[#f2c85b]'
                        : 'bg-[#13182b] border-white/10 text-[#9aa3bd] hover:text-white'
                    }`}
                  >
                    {isTalking ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    <span>Lip-Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFacing((f) => (f === 'right' ? 'left' : 'right'))}
                    className="h-7 px-2.5 rounded bg-[#13182b] hover:bg-[#1d2540] border border-white/10 text-[11px] font-semibold text-[#c5cde0] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FlipHorizontal2 className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>

                  {isNew && (
                    <label className="inline-flex items-center gap-1.5 ml-1 text-[11px] text-[#c5cde0] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addToCurrentBeat}
                        onChange={(e) => setAddToCurrentBeat(e.target.checked)}
                        className="accent-[#f2c85b]"
                      />
                      <span>Place in scene</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="block">
                  <span className="block text-[10px] text-[#7f89a6] mb-0.5">Pose</span>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as PoseId)}
                    className="w-full h-7 px-2 rounded bg-[#13182b] border border-white/10 text-[11px] text-white"
                  >
                    {POSE_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[10px] text-[#7f89a6] mb-0.5">Expression</span>
                  <select
                    value={expression}
                    onChange={(e) => setExpression(e.target.value as ExpressionId)}
                    className="w-full h-7 px-2 rounded bg-[#13182b] border border-white/10 text-[11px] text-white"
                  >
                    {EXPRESSION_CATALOG.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[10px] text-[#7f89a6] mb-0.5">Art Engine</span>
                  <select
                    value={renderStyle}
                    onChange={(e) => setRenderStyle(e.target.value as RenderStyleId)}
                    className="w-full h-7 px-2 rounded bg-[#13182b] border border-white/10 text-[11px] text-white"
                  >
                    {RENDER_STYLE_CATALOG.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.shortLabel}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[10px] text-[#7f89a6] mb-0.5">Lighting Mood</span>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value as MoodId)}
                    className="w-full h-7 px-2 rounded bg-[#13182b] border border-white/10 text-[11px] text-white"
                  >
                    {MOOD_CATALOG.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT MODULAR BUILDER PANE */}
          <div className="lg:w-[46%] flex flex-col min-h-0 bg-[#0e1222]">
            {/* 5 Category Tabs */}
            <div className="px-3 py-2 border-b border-white/10 bg-[#0b0e19] flex items-center gap-1 shrink-0 overflow-x-auto">
              {(
                [
                  ['body', 'Body'],
                  ['face', 'Face'],
                  ['hair', 'Hair & Head'],
                  ['outfit', 'Outfit'],
                  ['traits', 'Traits & Palette'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`px-3 h-8 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    activeTab === id
                      ? 'bg-[#1c2440] text-[#f2c85b]'
                      : 'text-[#8e97b0] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable Editor Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* TAB 1: BODY CHASSIS, ARCHETYPE SEED, MORPH SLIDERS & GAIT */}
              {activeTab === 'body' && (
                <>
                  <section className="space-y-2">
                    <div className="text-xs font-semibold text-white">Anatomical Chassis</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CHASSIS_CATALOG.map((ch) => {
                        const active = dna.chassis === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setChassis(ch.id)}
                            className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div
                              className={`text-xs font-semibold ${
                                active ? 'text-[#f2c85b]' : 'text-white'
                              }`}
                            >
                              {ch.label}
                            </div>
                            <div className="text-[10px] text-[#848da8] mt-0.5 line-clamp-2">
                              {ch.note}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        Seed From Starting Template
                      </span>
                      <span className="text-[10px] text-[#8e97b0]">Optional base</span>
                    </div>
                    <select
                      value={archetype}
                      onChange={(e) => handleSeedFromArchetype(e.target.value as ArchetypeId)}
                      className="w-full h-9 px-2.5 rounded-md bg-[#13182b] border border-white/12 text-xs text-white"
                    >
                      {ARCHETYPE_CATALOG.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} — {a.group}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Body Proportions</span>
                      <button
                        type="button"
                        onClick={() =>
                          patchMorph({
                            height: 1,
                            shoulderWidth: 1,
                            torsoBulk: 1,
                            headRatio: 1,
                            limbLength: 1,
                            posture: 0,
                          })
                        }
                        className="text-[11px] text-[#9aa3bd] hover:text-white cursor-pointer"
                      >
                        Reset Morphs
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {MORPH_SLIDERS.map((s) => (
                        <label key={s.key} className="block">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[#9aa3bd]">{s.label}</span>
                            <span className="font-mono-tabular text-white">
                              {s.format(dna.morph[s.key])}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={s.min}
                            max={s.max}
                            step={s.step}
                            value={dna.morph[s.key]}
                            onChange={(e) =>
                              patchMorph({ [s.key]: Number(e.target.value) })
                            }
                            className="w-full accent-[#f2c85b] cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Movement Gait</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {GAIT_CATALOG.map((g) => {
                        const active = dna.morph.gait === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => patchMorph({ gait: g.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}

              {/* TAB 2: FACE (HEAD SHAPE, EYES, NOSE, EARS, FACE MARKS) */}
              {activeTab === 'face' && (
                <>
                  <section className="space-y-2">
                    <div className="text-xs font-semibold text-white">Head Silhouette</div>
                    <div className="grid grid-cols-3 gap-2">
                      {HEAD_SHAPE_CATALOG.map((h) => (
                        <PartThumbTile
                          key={h.id}
                          category="headShape"
                          optionId={h.id}
                          label={h.label}
                          dna={dna}
                          active={dna.head.headShape === h.id}
                          onSelect={() => patchHead({ headShape: h.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Eye Geometry</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {EYE_STYLE_CATALOG.map((item) => {
                        const active = dna.head.eyeStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchHead({ eyeStyle: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Nose / Snout / Beak</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {NOSE_STYLE_CATALOG.map((item) => {
                        const active = dna.head.noseStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchHead({ noseStyle: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Ears</div>
                    <div className="grid grid-cols-3 gap-2">
                      {EAR_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="ears"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.head.ears === item.id}
                          onSelect={() => patchHead({ ears: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Face Marks &amp; Paint</div>
                    <div className="grid grid-cols-3 gap-2">
                      {FACE_MARK_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="faceMark"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.head.faceMark === item.id}
                          onSelect={() => patchHead({ faceMark: item.id })}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* TAB 3: HAIR, FACIAL HAIR, HORNS & HEADWEAR */}
              {activeTab === 'hair' && (
                <>
                  <section className="space-y-2">
                    <div className="text-xs font-semibold text-white">Hair, Mane &amp; Crest</div>
                    <div className="grid grid-cols-3 gap-2">
                      {HAIR_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="hairStyle"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.head.hairStyle === item.id}
                          onSelect={() => patchHead({ hairStyle: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">
                      Beard, Mustache &amp; Whiskers
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {FACIAL_HAIR_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="facialHair"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.head.facialHair === item.id}
                          onSelect={() => patchHead({ facialHair: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Horns, Antlers &amp; Tusks</div>
                    <div className="grid grid-cols-3 gap-2">
                      {HORN_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="horns"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.head.horns === item.id}
                          onSelect={() => patchHead({ horns: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Crowns, Hats &amp; Headwear</div>
                    <div className="grid grid-cols-3 gap-2">
                      {HEADWEAR_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="headwear"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.outfit.headwear === item.id}
                          onSelect={() => patchOutfit({ headwear: item.id })}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* TAB 4: OUTFIT, COLLAR, CAPE & PROCEDURAL SURFACE PATTERN */}
              {activeTab === 'outfit' && (
                <>
                  <section className="space-y-2">
                    <div className="text-xs font-semibold text-white">Upper Garment / Armor</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {TOP_STYLE_CATALOG.map((item) => {
                        const active = dna.outfit.topStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchOutfit({ topStyle: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Lower Garment / Silhouette</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {BOTTOM_STYLE_CATALOG.map((item) => {
                        const active = dna.outfit.bottomStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchOutfit({ bottomStyle: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Collar, Neck &amp; Garland</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {COLLAR_CATALOG.map((item) => {
                        const active = dna.outfit.collarAccessory === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchOutfit({ collarAccessory: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Cape &amp; Back Drape</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {CAPE_CATALOG.map((item) => {
                        const active = dna.outfit.capeStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => patchOutfit({ capeStyle: item.id })}
                            className={`h-8 px-2 rounded-md border text-[11px] font-semibold truncate cursor-pointer ${
                              active
                                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                                : 'bg-[#13182b] border-white/10 text-[#c5cde0] hover:border-white/25'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">
                      Coat, Scales &amp; Textile Pattern
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {SURFACE_PATTERN_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="surfacePattern"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.outfit.surfacePattern === item.id}
                          onSelect={() => patchOutfit({ surfacePattern: item.id })}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* TAB 5: APPENDAGES, PALETTE STUDIO & DNA JSON */}
              {activeTab === 'traits' && (
                <>
                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Wings</span>
                      {dna.chassis === 'humanoid' && (
                        <button
                          type="button"
                          onClick={() =>
                            patchAppendages({
                              extraArms: dna.appendages.extraArms === 2 ? 0 : 2,
                            })
                          }
                          className={`h-7 px-2.5 rounded border text-[11px] font-semibold cursor-pointer ${
                            dna.appendages.extraArms === 2
                              ? 'bg-[#2a2315] border-[#f2c85b]/55 text-[#f2c85b]'
                              : 'bg-[#13182b] border-white/10 text-[#c5cde0]'
                          }`}
                        >
                          {dna.appendages.extraArms === 2 ? '4-Armed Deity Rig: ON' : 'Add Extra Arms (4-Armed)'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {WING_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="wings"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.appendages.wings === item.id}
                          onSelect={() => patchAppendages({ wings: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Tail</div>
                    <div className="grid grid-cols-3 gap-2">
                      {TAIL_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="tail"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.appendages.tail === item.id}
                          onSelect={() => patchAppendages({ tail: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">Aura &amp; Spirit Halo</div>
                    <div className="grid grid-cols-3 gap-2">
                      {AURA_STYLE_CATALOG.map((item) => (
                        <PartThumbTile
                          key={item.id}
                          category="aura"
                          optionId={item.id}
                          label={item.label}
                          dna={dna}
                          active={dna.appendages.aura === item.id}
                          onSelect={() => patchAppendages({ aura: item.id })}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 7-Channel Color Palette Studio */}
                  <section className="space-y-3 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white">7-Channel Color Palette</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          ['primary', 'Primary'],
                          ['secondary', 'Secondary'],
                          ['accent', 'Accent'],
                          ['skin', 'Skin / Fur'],
                          ['hair', 'Hair / Mane'],
                          ['eye', 'Eyes'],
                          ['patternTint', 'Pattern'],
                        ] as const
                      ).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 px-2 h-8 rounded-md bg-[#13182b] border border-white/10 cursor-pointer"
                        >
                          <input
                            type="color"
                            value={dna.palette[key]}
                            onChange={(e) => patchPalette({ [key]: e.target.value })}
                            className="w-4 h-4 bg-transparent border-0 p-0 cursor-pointer shrink-0"
                          />
                          <span className="text-[11px] text-[#d4dced] truncate">{label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Curated Cultural Palettes */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-[#8e97b0]">Curated Palettes</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CURATED_DNA_PALETTES.map((cp) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => patchPalette({ ...cp.palette })}
                            className="px-2.5 py-1.5 rounded-md bg-[#13182b] hover:bg-[#1a223d] border border-white/10 flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="text-[11px] font-medium text-[#e2e7f5] truncate">
                              {cp.label}
                            </span>
                            <span className="flex items-center gap-0.5 shrink-0">
                              <span
                                className="w-2.5 h-2.5 rounded-sm border border-white/20"
                                style={{ backgroundColor: cp.palette.primary }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-sm border border-white/20"
                                style={{ backgroundColor: cp.palette.accent }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-sm border border-white/20"
                                style={{ backgroundColor: cp.palette.skin }}
                              />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* DNA JSON Export / Import */}
                  <section className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">DNA Blueprint JSON</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyDnaJson}
                          className="h-7 px-2.5 rounded bg-[#13182b] hover:bg-[#1d2540] border border-white/10 text-[11px] font-semibold text-[#e2e7f5] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedDna ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedDna ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!jsonOpen) setJsonText(JSON.stringify(dna, null, 2));
                            setJsonOpen((v) => !v);
                          }}
                          className="h-7 px-2.5 rounded bg-[#13182b] hover:bg-[#1d2540] border border-white/10 text-[11px] font-semibold text-[#e2e7f5] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileJson className="w-3 h-3 text-[#f2c85b]" />
                          <span>{jsonOpen ? 'Hide JSON' : 'Paste / Edit JSON'}</span>
                        </button>
                      </div>
                    </div>

                    {jsonOpen && (
                      <div className="space-y-2">
                        <textarea
                          value={jsonText}
                          onChange={(e) => setJsonText(e.target.value)}
                          spellCheck={false}
                          rows={7}
                          className="w-full p-2.5 rounded-md bg-[#090c16] border border-white/12 font-mono-tabular text-[10px] text-[#c5cee6] focus:outline-none focus:border-[#f2c85b]"
                        />
                        <button
                          type="button"
                          onClick={handleImportDnaJson}
                          className="h-8 px-3 rounded-md bg-[#1f2947] hover:bg-[#2a3861] text-xs font-semibold text-[#f2c85b] cursor-pointer"
                        >
                          Apply DNA Blueprint
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
