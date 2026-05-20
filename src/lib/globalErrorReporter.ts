import { toast } from 'sonner';

const STORAGE_KEY = 'recentBackgroundErrors';
const MAX_ENTRIES = 20;
const TOAST_THROTTLE_MS = 5000;

let installed = false;
let lastToastAt = 0;

interface ErrorRecord {
  ts: string;
  kind: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
}

function record(entry: ErrorRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: ErrorRecord[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    while (list.length > MAX_ENTRIES) list.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

function maybeToast() {
  const now = Date.now();
  if (now - lastToastAt < TOAST_THROTTLE_MS) return;
  lastToastAt = now;
  try {
    toast.error('A background error was caught — your game state is preserved.');
  } catch {
    /* sonner not mounted yet — non-fatal */
  }
}

/**
 * Mount once (e.g. from App). Captures uncaught errors and promise rejections
 * so they don't poison future React renders or get silently lost.
 */
export function installGlobalErrorReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (e: ErrorEvent) => {
    const err = e?.error;
    record({
      ts: new Date().toISOString(),
      kind: 'error',
      message: err?.message ?? e?.message ?? 'Unknown error',
      stack: err?.stack,
    });
    maybeToast();
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e?.reason;
    record({
      ts: new Date().toISOString(),
      kind: 'unhandledrejection',
      message: reason?.message ?? String(reason ?? 'Unhandled rejection'),
      stack: reason?.stack,
    });
    maybeToast();
  });
}
