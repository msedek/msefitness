import { useCallback, useEffect, useRef, useState } from 'react';
import { GRASA, bpmRange, programMinutes, type Block, type GrasaId } from '../../shared/domain.ts';

// Sesión guiada de quema de grasa. El estado se guarda con marcas de tiempo en localStorage,
// así sobrevive a recargas, al bloqueo de pantalla y a que el sistema congele la PWA.
interface Stored { level: GrasaId; startedAt: number; pausedAt: number | null; pausedMs: number }

const KEY = 'msefitness.guided';

const load = (): Stored | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};
const save = (s: Stored | null) => {
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* sin storage */ }
};

export interface GuidedView {
  active: boolean;
  level: GrasaId | null;
  running: boolean;
  elapsedSec: number;
  totalSec: number;
  blocks: Block[];
  blockIndex: number;
  block: Block | null;
  next: Block | null;
  blockElapsedSec: number;
  blockRemainingSec: number;
  finished: boolean;
  /** Rango en lpm del bloque actual para la FCmáx dada. */
  rangeFor: (fcmax: number) => [number, number] | null;
  /** Compara el pulso que marca la bici con el rango del bloque actual. */
  checkHr: (hr: number, fcmax: number) => 'bajo' | 'en zona' | 'sobre' | null;
}

function compute(s: Stored | null, now: number) {
  if (!s) return null;
  const blocks = GRASA[s.level].blocks;
  const totalSec = programMinutes(GRASA[s.level]) * 60;
  const elapsedSec = Math.min(totalSec, Math.max(0, ((s.pausedAt ?? now) - s.startedAt - s.pausedMs) / 1000));
  let acc = 0;
  let blockIndex = blocks.length - 1;
  for (let i = 0; i < blocks.length; i++) {
    if (elapsedSec < acc + blocks[i].minutes * 60) { blockIndex = i; break; }
    acc += blocks[i].minutes * 60;
  }
  if (elapsedSec >= totalSec) acc = totalSec - blocks[blocks.length - 1].minutes * 60;
  const block = blocks[blockIndex];
  const blockElapsedSec = elapsedSec - acc;
  return { blocks, totalSec, elapsedSec, blockIndex, block, blockElapsedSec, blockRemainingSec: block.minutes * 60 - blockElapsedSec };
}

export function useGuided() {
  const [stored, setStored] = useState<Stored | null>(load);
  const [now, setNow] = useState(Date.now);
  const lastBlock = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const update = useCallback((s: Stored | null) => { save(s); setStored(s); setNow(Date.now()); }, []);

  const running = !!stored && stored.pausedAt === null;
  const c = compute(stored, now);
  const finished = !!c && c.elapsedSec >= c.totalSec;

  // Reloj.
  useEffect(() => {
    if (!running || finished) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running, finished]);

  // Pantalla encendida mientras corre (se pierde al ocultar la app: se vuelve a pedir).
  useEffect(() => {
    if (!running || finished || !('wakeLock' in navigator)) return;
    let cancelled = false;
    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) void l.release(); else wakeLock.current = l;
      } catch { /* no disponible */ }
    };
    const onVis = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [running, finished]);

  // Vibración al cambiar de bloque y al terminar.
  useEffect(() => {
    if (!c || !running) { lastBlock.current = c?.blockIndex ?? null; return; }
    const idx = finished ? -1 : c.blockIndex;
    if (lastBlock.current !== null && lastBlock.current !== idx) navigator.vibrate?.(finished ? [400, 150, 400, 150, 400] : [250, 120, 250]);
    lastBlock.current = idx;
  }, [c?.blockIndex, finished, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const view: GuidedView = {
    active: !!stored,
    level: stored?.level ?? null,
    running: running && !finished,
    elapsedSec: c?.elapsedSec ?? 0,
    totalSec: c?.totalSec ?? 0,
    blocks: c?.blocks ?? [],
    blockIndex: c?.blockIndex ?? 0,
    block: c?.block ?? null,
    next: c ? c.blocks[c.blockIndex + 1] ?? null : null,
    blockElapsedSec: c?.blockElapsedSec ?? 0,
    blockRemainingSec: c?.blockRemainingSec ?? 0,
    finished,
    rangeFor: (fcmax) => (c ? bpmRange(c.block.range, fcmax) : null),
    checkHr: (hr, fcmax) => {
      if (!c) return null;
      const [lo, hi] = bpmRange(c.block.range, fcmax);
      return hr < lo ? 'bajo' : hr > hi ? 'sobre' : 'en zona';
    },
  };

  return {
    ...view,
    start: (level: GrasaId) => update({ level, startedAt: Date.now(), pausedAt: null, pausedMs: 0 }),
    pause: () => { if (stored && stored.pausedAt === null) update({ ...stored, pausedAt: Date.now() }); },
    resume: () => { if (stored?.pausedAt != null) update({ ...stored, pausedMs: stored.pausedMs + Date.now() - stored.pausedAt, pausedAt: null }); },
    /** Termina (completa o antes) y devuelve lo necesario para pre-llenar el registro. */
    finish: () => {
      const r = c && stored ? { level: stored.level, minutes: Math.max(1, Math.round(c.elapsedSec / 60)) } : null;
      update(null);
      return r;
    },
    cancel: () => update(null),
  };
}
