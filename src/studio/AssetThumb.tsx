import React, { useEffect, useRef } from 'react';
import {
  ARCHETYPE_DEFAULT_COLORS,
  ArchetypeId,
  CastMember,
  MoodId,
  PropId,
  StageId,
} from './types';
import { drawActorCloseUp, drawStageBackdrop, drawStoryProp } from './renderAssets';

interface AssetThumbProps {
  kind: 'archetype' | 'stage' | 'prop' | 'member';
  id: string;
  mood?: MoodId;
  member?: CastMember;
  className?: string;
}

export const AssetThumb: React.FC<AssetThumbProps> = ({
  kind,
  id,
  mood = 'midnight_banyan',
  member,
  className,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);

    if (kind === 'stage') {
      drawStageBackdrop(ctx, w, h, id as StageId, mood, 1.2);
    } else if (kind === 'member' && member) {
      ctx.fillStyle = '#0d152b';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h * 0.58);
      ctx.scale(0.32, 0.32);
      drawActorCloseUp(ctx, member, 'warm', 0, 0, 'right', 0.4);
      ctx.restore();
    } else if (kind === 'archetype') {
      ctx.fillStyle = '#0d152b';
      ctx.fillRect(0, 0, w, h);
      const col = ARCHETYPE_DEFAULT_COLORS[id as ArchetypeId] || ARCHETYPE_DEFAULT_COLORS.king;
      const sample: CastMember = {
        id,
        name: id,
        archetype: id as ArchetypeId,
        primaryColor: col.primary,
        accentColor: col.accent,
        skinColor: col.skin,
      };
      ctx.save();
      ctx.translate(w / 2, h * 0.58);
      ctx.scale(0.3, 0.3);
      const slySet = new Set(['spirit', 'jackal', 'tiger', 'crocodile', 'crow']);
      drawActorCloseUp(ctx, sample, slySet.has(id) ? 'sly' : 'calm', 0, 0, 'right', 0.4);
      ctx.restore();
    } else if (kind === 'prop') {
      ctx.fillStyle = '#0c1224';
      ctx.fillRect(0, 0, w, h);
      drawStoryProp(ctx, id as PropId, w / 2, h * 0.56, 0.42, 1.4, 0.72);
    }
  }, [kind, id, mood, member]);

  return (
    <canvas
      ref={ref}
      width={160}
      height={96}
      className={className || 'w-full aspect-[5/3] rounded bg-[#080b16] block object-cover'}
    />
  );
};
