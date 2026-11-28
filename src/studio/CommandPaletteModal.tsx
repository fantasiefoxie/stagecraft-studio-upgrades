import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Command, CornerDownLeft, Search, X } from 'lucide-react';
import {
  NLE_SHORTCUT_CATALOG,
  StudioCommandItem,
  filterStudioCommands,
} from './studioShortcuts';
import { getCatalogIndexSize, searchStudioCatalog } from './catalogSearchIndex';

export interface CommandPaletteModalProps {
  commands: StudioCommandItem[];
  onExecute: (cmd: StudioCommandItem) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<StudioCommandItem['category'], string> = {
  viewport: 'Viewport',
  tools: 'Studio Tools',
  director: 'Director AI & Edits',
  scene: 'Scenes',
  style: 'Art Engines',
  acting: 'Acting Macros',
  transport: 'Transport',
  asset: 'BM25 Asset',
};

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  commands,
  onExecute,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const trimmed = query.trim();
    const baseHits = filterStudioCommands(commands, trimmed, 28);
    if (trimmed.length < 2) return baseHits;

    const existingIds = new Set(baseHits.map((c) => `${c.actionType}:${String(c.payload ?? c.id)}`));
    const catalogHits = searchStudioCatalog(trimmed, {
      kinds: ['stage', 'archetype', 'prop', 'mood', 'render_style', 'acting_macro'],
      limit: 14,
    });

    const semanticItems: StudioCommandItem[] = [];
    for (const hit of catalogHits) {
      if (hit.id === 'none') continue;
      let actionType: StudioCommandItem['actionType'] | null = null;
      let labelPrefix = '';
      let category: StudioCommandItem['category'] = 'asset';

      if (hit.kind === 'stage') {
        actionType = 'apply_stage';
        labelPrefix = 'Stage: ';
      } else if (hit.kind === 'archetype') {
        actionType = 'add_archetype';
        labelPrefix = 'Add Cast: ';
      } else if (hit.kind === 'prop') {
        actionType = 'apply_prop';
        labelPrefix = 'Prop: ';
      } else if (hit.kind === 'mood') {
        actionType = 'apply_mood';
        labelPrefix = 'Mood: ';
      } else if (hit.kind === 'render_style') {
        actionType = 'set_render_style';
        labelPrefix = 'Art Engine: ';
        category = 'style';
      } else if (hit.kind === 'acting_macro') {
        actionType = 'apply_acting_macro';
        labelPrefix = 'Acting Macro: ';
        category = 'acting';
      }

      if (!actionType) continue;
      const dedupeKey = `${actionType}:${hit.id}`;
      if (existingIds.has(dedupeKey)) continue;
      existingIds.add(dedupeKey);

      semanticItems.push({
        id: `bm25_${hit.kind}_${hit.id}`,
        label: `${labelPrefix}${hit.label}`,
        subtitle: hit.description || `${hit.category} · id: ${hit.id}`,
        category,
        actionType,
        payload: hit.id,
      });
    }

    return [...baseHits, ...semanticItems].slice(0, 38);
  }, [commands, query]);

  const totalIndexedAssets = useMemo(() => getCatalogIndexSize(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (results.length > 0 ? (i + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (results.length > 0 ? (i - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      onExecute(results[activeIdx]);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0c101e] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[76vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#11162a] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#f2c85b] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search commands, scenes, art engines, or ${totalIndexedAssets.toLocaleString()}+ assets semantically…`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#7d87a3] focus:outline-none"
          />
          <span className="px-1.5 py-0.5 rounded bg-white/8 text-[10px] font-mono text-[#9aa5c4]">
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-white/10 text-[#9aa5c4] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#7f8aa8]">
              No matching commands for “{query}”.
            </div>
          ) : (
            results.map((cmd, idx) => {
              const selected = idx === activeIdx;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => {
                    onExecute(cmd);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#1c2440] border border-[#f2c85b]/45 text-white'
                      : 'hover:bg-white/5 border border-transparent text-[#d6dcf0]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate">{cmd.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/6 text-[9px] font-semibold uppercase tracking-wider text-[#9aa5c4] shrink-0">
                        {CATEGORY_LABELS[cmd.category]}
                      </span>
                    </div>
                    {cmd.subtitle && (
                      <div className="text-[10px] text-[#848da8] truncate mt-0.5">{cmd.subtitle}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cmd.shortcut && (
                      <span className="px-1.5 py-0.5 rounded bg-[#0a0d18] border border-white/12 text-[10px] font-mono text-[#f2c85b]">
                        {cmd.shortcut}
                      </span>
                    )}
                    {selected && <CornerDownLeft className="w-3.5 h-3.5 text-[#f2c85b]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* NLE Keyboard Shortcut Cheat-Sheet Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-[#0a0d18] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#848da8]">
          <div className="flex items-center gap-1.5 text-[#f2c85b] font-semibold">
            <Command className="w-3 h-3" />
            <span>NLE Shortcuts:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {NLE_SHORTCUT_CATALOG.slice(1, 9).map((sc) => (
              <span key={sc.id} className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/8 text-[#d6dcf0] font-mono text-[9px]">
                  {sc.keys}
                </kbd>
                <span>{sc.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
