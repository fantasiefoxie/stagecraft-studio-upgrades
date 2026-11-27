import React, { useEffect, useRef, useState } from 'react';
import { FolderOpen, Save, Trash2, Mic, Clock, Check, Download, Upload } from 'lucide-react';
import { SavedProjectRecord } from './projectVault';

interface ProjectVaultMenuProps {
  currentTitle: string;
  savedProjects: SavedProjectRecord[];
  autosaveAt: number | null;
  voiceClipCount: number;
  onSaveNamed: (name: string) => Promise<void>;
  onLoadProject: (record: SavedProjectRecord) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onExportKatha?: () => Promise<void>;
  onImportKatha?: (file: File) => Promise<void>;
}

function formatAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 15) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
}

export const ProjectVaultMenu: React.FC<ProjectVaultMenuProps> = ({
  currentTitle,
  savedProjects,
  autosaveAt,
  voiceClipCount,
  onSaveNamed,
  onLoadProject,
  onDeleteProject,
  onExportKatha,
  onImportKatha,
}) => {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const kathaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftName(currentTitle || 'Untitled Episode');
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, currentTitle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveNamed(draftName.trim() || currentTitle || 'Untitled Episode');
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141a2e] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-200"
        title="Local IndexedDB Project Vault & Portable .katha Archives"
      >
        <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
        <span>Vault</span>
        {savedProjects.length > 0 && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-amber-200">
            {savedProjects.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-amber-400/20 bg-[#0d1221] p-3 shadow-2xl shadow-black/70">
          <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <div className="text-xs font-bold text-amber-200">Local Project Vault</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-emerald-400" />
                  {autosaveAt ? `Autosaved ${formatAgo(autosaveAt)}` : 'Autosave ready'}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 text-slate-300">
                  <Mic className="h-2.5 w-2.5 text-amber-400" />
                  {voiceClipCount} clip{voiceClipCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Snapshot Form */}
          <div className="mb-2.5 flex gap-1.5">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSave();
              }}
              placeholder="Snapshot name..."
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#070a14] px-2.5 py-1.5 text-[11px] text-slate-100 outline-none focus:border-amber-400/50"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {justSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {justSaved ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Portable .katha Archive Export / Import */}
          {(onExportKatha || onImportKatha) && (
            <div className="mb-3 grid grid-cols-2 gap-1.5 border-b border-white/10 pb-2.5">
              {onExportKatha && (
                <button
                  type="button"
                  disabled={archiveBusy}
                  onClick={async () => {
                    setArchiveBusy(true);
                    try {
                      await onExportKatha();
                    } finally {
                      setArchiveBusy(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-400/30 bg-[#1a223b] px-2 py-1.5 text-[10px] font-semibold text-amber-200 transition hover:bg-[#232e4f] disabled:opacity-50 cursor-pointer"
                  title="Download self-contained .katha project bundle (script + voice clips + music stem + brand kit)"
                >
                  <Download className="h-3 w-3" />
                  <span>Export .katha</span>
                </button>
              )}
              {onImportKatha && (
                <>
                  <button
                    type="button"
                    disabled={archiveBusy}
                    onClick={() => kathaInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#12182b] px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-200 disabled:opacity-50 cursor-pointer"
                    title="Import a portable .katha project bundle"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Import .katha</span>
                  </button>
                  <input
                    ref={kathaInputRef}
                    type="file"
                    accept=".katha,.zip"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      setArchiveBusy(true);
                      try {
                        await onImportKatha(f);
                        setOpen(false);
                      } finally {
                        setArchiveBusy(false);
                      }
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/* Saved Snapshots List */}
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
            {savedProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-3 text-center text-[11px] text-slate-400">
                No named snapshots yet. Your current edit, voice clips &amp; music stem autosave automatically.
              </div>
            ) : (
              savedProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#12182b] px-2.5 py-2 transition hover:border-amber-400/35"
                >
                  <button
                    type="button"
                    onClick={async () => {
                      await onLoadProject(proj);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-[11px] font-semibold text-slate-100 group-hover:text-amber-200">
                      {proj.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{proj.episode.beats.length} beats</span>
                      <span>·</span>
                      <span>{proj.aspect}</span>
                      <span>·</span>
                      <span>{proj.voiceCount} voice</span>
                      {proj.hasMusicStem && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-300">stem</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatAgo(proj.savedAt)}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteProject(proj.id)}
                    className="rounded p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300"
                    title="Delete snapshot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

