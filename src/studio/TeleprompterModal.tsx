import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  Play,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { EpisodeScript } from './types';
import { trimAndNormalizeVoiceBlob } from './voiceEnvelope';
import {
  TeleprompterTake,
  buildTeleprompterCueSheet,
  computeTeleprompterProgress,
  evaluateTakePacing,
  formatTakeFileName,
} from './teleprompterUtils';

export interface TeleprompterModalProps {
  episode: EpisodeScript;
  initialBeatIdx: number;
  voiceMeta: Record<string, { fileName: string; duration: number }>;
  onBindVoiceBlob: (
    beatId: string,
    blob: Blob,
    fileName: string,
    autoSyncDuration: boolean
  ) => Promise<void>;
  onClose: () => void;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  episode,
  initialBeatIdx,
  voiceMeta,
  onBindVoiceBlob,
  onClose,
}) => {
  const cueSheet = useMemo(() => buildTeleprompterCueSheet(episode), [episode]);
  const [beatIdx, setBeatIdx] = useState(() =>
    Math.max(0, Math.min(Math.max(0, cueSheet.length - 1), initialBeatIdx))
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoTrim, setAutoTrim] = useState(true);
  const [autoSyncDuration, setAutoSyncDuration] = useState(true);
  const [bindingTakeId, setBindingTakeId] = useState<string | null>(null);
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);
  const [takesByBeat, setTakesByBeat] = useState<Record<string, TeleprompterTake[]>>({});

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterRafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);
  const takeCounterRef = useRef<number>(0);
  const createdUrlsRef = useRef<string[]>([]);

  const currentCue = cueSheet[beatIdx] || cueSheet[0];
  const currentTakes = currentCue ? takesByBeat[currentCue.beatId] || [] : [];

  const stopMeterAndStream = useCallback(() => {
    if (meterRafRef.current !== null) {
      window.cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setInputLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current = null;
      }
      stopMeterAndStream();
      for (const u of createdUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
      createdUrlsRef.current = [];
    };
  }, [stopMeterAndStream]);

  const stopRecording = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
  }, []);

  const beginMicCapture = useCallback(async () => {
    if (!currentCue) return;
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Microphone recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Live input RMS level meter
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ac = new AC();
        audioCtxRef.current = ac;
        const src = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.fftSize);
        const tickMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / buf.length);
          setInputLevel(Math.min(1, rms * 4.5));
          meterRafRef.current = window.requestAnimationFrame(tickMeter);
        };
        meterRafRef.current = window.requestAnimationFrame(tickMeter);
      }

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      const captureBeatId = currentCue.beatId;
      const captureBeatIdx = currentCue.beatIndex;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const durSec = Math.max(0.2, (performance.now() - recordStartRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stopMeterAndStream();
        if (blob.size === 0) return;

        takeCounterRef.current += 1;
        const objUrl = URL.createObjectURL(blob);
        createdUrlsRef.current.push(objUrl);

        setTakesByBeat((prev) => {
          const existing = prev[captureBeatId] || [];
          const nextNum = existing.length + 1;
          const take: TeleprompterTake = {
            id: `take_${captureBeatId}_${takeCounterRef.current}`,
            beatId: captureBeatId,
            takeNumber: nextNum,
            blob,
            objectUrl: objUrl,
            durationSec: Number(durSec.toFixed(2)),
            createdAt: Date.now(),
            fileName: formatTakeFileName(captureBeatIdx, captureBeatId, nextNum),
          };
          return { ...prev, [captureBeatId]: [take, ...existing] };
        });
        setStatusMsg(`Captured Take (${durSec.toFixed(1)}s). Audition or Accept & Bind.`);
      };

      recorderRef.current = recorder;
      recordStartRef.current = performance.now();
      setElapsedSec(0);
      setIsRecording(true);
      recorder.start(100);

      timerRef.current = window.setInterval(() => {
        setElapsedSec((performance.now() - recordStartRef.current) / 1000);
      }, 60);
    } catch (err) {
      stopMeterAndStream();
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to access microphone. Check browser permissions.'
      );
    }
  }, [currentCue, stopMeterAndStream]);

  const startWithCountdown = useCallback(() => {
    if (isRecording || countdown !== null) return;
    setErrorMsg(null);
    setStatusMsg(null);
    let step = 3;
    setCountdown(step);
    countdownTimerRef.current = window.setInterval(() => {
      step -= 1;
      if (step <= 0) {
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(null);
        void beginMicCapture();
      } else {
        setCountdown(step);
      }
    }, 650);
  }, [beginMicCapture, countdown, isRecording]);

  const auditionTake = useCallback(
    (take: TeleprompterTake) => {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current = null;
      }
      if (playingTakeId === take.id) {
        setPlayingTakeId(null);
        return;
      }
      const audio = new Audio(take.objectUrl);
      auditionAudioRef.current = audio;
      setPlayingTakeId(take.id);
      audio.onended = () => setPlayingTakeId(null);
      audio.onerror = () => setPlayingTakeId(null);
      void audio.play().catch(() => setPlayingTakeId(null));
    },
    [playingTakeId]
  );

  const acceptTake = useCallback(
    async (take: TeleprompterTake, advanceAfter = false) => {
      setBindingTakeId(take.id);
      setErrorMsg(null);
      try {
        let finalBlob = take.blob;
        let savedNote = '';
        if (autoTrim) {
          const trimmed = await trimAndNormalizeVoiceBlob(take.blob);
          finalBlob = trimmed.blob;
          if (trimmed.didModify && trimmed.savedSec > 0.04) {
            savedNote = ` (trimmed ${trimmed.savedSec.toFixed(2)}s silence & normalized)`;
          } else if (trimmed.didModify) {
            savedNote = ' (normalized -1 dBFS)';
          }
        }
        await onBindVoiceBlob(take.beatId, finalBlob, take.fileName, autoSyncDuration);
        setStatusMsg(`Bound Take #${take.takeNumber} to Scene ${beatIdx + 1}${savedNote}.`);
        if (advanceAfter && beatIdx < cueSheet.length - 1) {
          setBeatIdx((i) => Math.min(cueSheet.length - 1, i + 1));
          setElapsedSec(0);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to bind recorded take.');
      } finally {
        setBindingTakeId(null);
      }
    },
    [autoSyncDuration, autoTrim, beatIdx, cueSheet.length, onBindVoiceBlob]
  );

  const deleteTake = useCallback((beatId: string, takeId: string) => {
    setTakesByBeat((prev) => ({
      ...prev,
      [beatId]: (prev[beatId] || []).filter((t) => t.id !== takeId),
    }));
  }, []);

  const progress = currentCue
    ? computeTeleprompterProgress(elapsedSec, currentCue.targetDurationSec)
    : { progressFrac: 0, remainingSec: 0, isOvertime: false };

  const boundCount = useMemo(
    () => cueSheet.filter((c) => Boolean(voiceMeta[c.beatId])).length,
    [cueSheet, voiceMeta]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopRecording();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, stopRecording]);

  if (!currentCue) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-[#0b0e19] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#101528] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#f2c85b]/15 border border-[#f2c85b]/40 flex items-center justify-center text-[#f2c85b]">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                Voiceover Booth Teleprompter
              </div>
              <div className="text-[11px] text-[#8e97b0]">
                Scene {beatIdx + 1} of {cueSheet.length} · {boundCount}/{cueSheet.length} scenes voiced
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="inline-flex items-center gap-1.5 text-[11px] text-[#cbd3e8] cursor-pointer">
              <input
                type="checkbox"
                checked={autoTrim}
                onChange={(e) => setAutoTrim(e.target.checked)}
                className="accent-[#f2c85b]"
              />
              <span>Auto-Trim &amp; Normalize</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-[#cbd3e8] cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={autoSyncDuration}
                onChange={(e) => setAutoSyncDuration(e.target.checked)}
                className="accent-[#f2c85b]"
              />
              <span>Auto-Sync Beat Duration</span>
            </label>
            <button
              type="button"
              onClick={() => {
                stopRecording();
                onClose();
              }}
              className="ml-2 h-8 w-8 rounded-lg bg-white/8 hover:bg-white/15 text-[#cbd3e8] flex items-center justify-center cursor-pointer"
              title="Close Voice Booth (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Teleprompter Stage */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Speaker & Acting Direction Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-[#090c14]"
                style={{ backgroundColor: currentCue.speakerColor }}
              >
                {currentCue.speakerLabel}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#171e36] border border-white/10 text-xs font-semibold text-[#d6dcf0]">
                Expression: <span className="text-[#f2c85b]">{currentCue.expression}</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#14192b] border border-white/10 text-xs font-mono text-[#9aa5c4]">
                Target: {currentCue.targetDurationSec.toFixed(1)}s · {currentCue.wordCount} words
              </span>
              {voiceMeta[currentCue.beatId] && (
                <span className="px-2.5 py-1 rounded-md bg-[#112e21] border border-[#22c55e]/40 text-xs font-semibold text-[#86efac]">
                  Bound ({voiceMeta[currentCue.beatId].duration.toFixed(1)}s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={beatIdx <= 0 || isRecording || countdown !== null}
                onClick={() => {
                  setBeatIdx((i) => Math.max(0, i - 1));
                  setElapsedSec(0);
                  setStatusMsg(null);
                }}
                className="h-8 px-2.5 rounded-md bg-[#161c32] hover:bg-[#212a4a] disabled:opacity-35 border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={beatIdx >= cueSheet.length - 1 || isRecording || countdown !== null}
                onClick={() => {
                  setBeatIdx((i) => Math.min(cueSheet.length - 1, i + 1));
                  setElapsedSec(0);
                  setStatusMsg(null);
                }}
                className="h-8 px-2.5 rounded-md bg-[#161c32] hover:bg-[#212a4a] disabled:opacity-35 border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* High-Contrast Dialogue Teleprompter Card */}
          <div className="relative rounded-2xl bg-[#070910] border border-white/15 p-7 min-h-[180px] flex flex-col justify-center">
            {countdown !== null && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-black/80 flex flex-col items-center justify-center gap-2">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f2c85b]">
                  Get Ready
                </div>
                <div className="text-7xl font-black text-white font-mono-tabular">
                  {countdown}
                </div>
              </div>
            )}

            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7f8aa8] mb-2">
              {currentCue.title}
            </div>
            <p className="text-2xl md:text-3xl font-semibold leading-snug text-[#f9f6ef] tracking-tight">
              {currentCue.dialogue || '(Silent visual beat — no spoken line)'}
            </p>

            {/* Target Duration Countdown Bar */}
            <div className="mt-6 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                <span className={progress.isOvertime ? 'text-[#ff6b81] font-bold' : 'text-[#9aa5c4]'}>
                  {isRecording
                    ? `Recording: ${elapsedSec.toFixed(1)}s / ${currentCue.targetDurationSec.toFixed(1)}s`
                    : `Target Window: ${currentCue.targetDurationSec.toFixed(1)}s`}
                </span>
                <span className={progress.isOvertime ? 'text-[#ff6b81] font-bold' : 'text-[#f2c85b]'}>
                  {progress.isOvertime
                    ? `+${Math.abs(progress.remainingSec).toFixed(1)}s over`
                    : `${progress.remainingSec.toFixed(1)}s left`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#151b2f] overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-75 ${
                    progress.isOvertime ? 'bg-[#ff4d6d]' : 'bg-[#f2c85b]'
                  }`}
                  style={{ width: `${Math.round(progress.progressFrac * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next-Beat Preview */}
          {currentCue.nextPreview && (
            <div className="px-4 py-2.5 rounded-xl bg-[#111629] border border-white/8 flex items-baseline gap-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7f8aa8] shrink-0">
                Up Next
              </span>
              <span className="text-[#aeb7d0] truncate">{currentCue.nextPreview}</span>
            </div>
          )}

          {/* Record Transport + Live Input Level Meter */}
          <div className="p-4 rounded-xl bg-[#111629] border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  disabled={countdown !== null}
                  onClick={startWithCountdown}
                  className="h-11 px-5 rounded-xl bg-[#e11d48] hover:bg-[#f43f5e] disabled:opacity-40 text-sm font-bold text-white inline-flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{countdown !== null ? `Starting in ${countdown}…` : 'Record Take (3-2-1)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="h-11 px-5 rounded-xl bg-[#f2c85b] hover:bg-[#ffd66b] text-sm font-bold text-[#090c14] inline-flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-w-[200px] max-w-sm space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#8e97b0]">
                <span className="inline-flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-[#f2c85b]" />
                  <span>Live Mic Level</span>
                </span>
                <span className="font-mono-tabular">{Math.round(inputLevel * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#090c16] border border-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    inputLevel > 0.85 ? 'bg-[#ff4d6d]' : inputLevel > 0.35 ? 'bg-[#22c55e]' : 'bg-[#f2c85b]'
                  }`}
                  style={{ width: `${Math.round(inputLevel * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="px-3.5 py-2 rounded-lg bg-[#35121d] border border-[#ff4d6d]/40 text-xs text-[#fda4af]">
              {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div className="px-3.5 py-2 rounded-lg bg-[#102b1f] border border-[#22c55e]/35 text-xs text-[#86efac]">
              {statusMsg}
            </div>
          )}

          {/* Multi-Take A/B Audition List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#cbd3e8]">
              Recorded Takes for Scene {beatIdx + 1} ({currentTakes.length})
            </div>
            {currentTakes.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#0e1222] border border-dashed border-white/12 text-xs text-[#7f8aa8]">
                Record multiple takes for this scene, audition A/B back-to-back, and accept your best performance.
              </div>
            ) : (
              <div className="space-y-2">
                {currentTakes.map((take) => {
                  const verdict = evaluateTakePacing(take.durationSec, currentCue.targetDurationSec);
                  const verdictColor =
                    verdict === 'on_target'
                      ? 'text-[#86efac]'
                      : verdict === 'short'
                        ? 'text-[#93c5fd]'
                        : 'text-[#fbbf24]';
                  const isBusy = bindingTakeId === take.id;
                  return (
                    <div
                      key={take.id}
                      className="px-3.5 py-2.5 rounded-xl bg-[#13182b] border border-white/10 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => auditionTake(take)}
                          className="h-8 w-8 rounded-lg bg-[#1c2440] hover:bg-[#273258] border border-white/12 text-[#f2c85b] flex items-center justify-center shrink-0 cursor-pointer"
                          title="Audition Take"
                        >
                          {playingTakeId === take.id ? (
                            <Square className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            Take #{take.takeNumber} · {take.durationSec.toFixed(2)}s
                          </div>
                          <div className={`text-[10px] ${verdictColor}`}>
                            {verdict === 'on_target'
                              ? 'On target pacing'
                              : verdict === 'short'
                                ? 'Faster than beat target'
                                : 'Longer than beat target'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void acceptTake(take, false)}
                          className="h-8 px-3 rounded-lg bg-[#1b2b22] hover:bg-[#234030] border border-[#22c55e]/40 text-xs font-semibold text-[#86efac] inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBusy ? 'Binding…' : 'Accept'}</span>
                        </button>
                        {beatIdx < cueSheet.length - 1 && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void acceptTake(take, true)}
                            className="h-8 px-3 rounded-lg bg-[#f2c85b] hover:bg-[#ffd66b] text-xs font-bold text-[#090c14] inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          >
                            <span>Accept &amp; Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTake(currentCue.beatId, take.id)}
                          className="h-8 w-8 rounded-lg bg-white/5 hover:bg-[#3a1622] text-[#9aa5c4] hover:text-[#fda4af] flex items-center justify-center cursor-pointer"
                          title="Discard Take"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
