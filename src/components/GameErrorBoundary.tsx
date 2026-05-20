import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onExitToMenu: () => void;
  onRestart: () => void;
  /** Optional snapshot fn — called when an error fires, result stored in localStorage. */
  getSnapshot?: () => unknown;
}

interface State {
  error: Error | null;
  componentStack: string | null;
  resetKey: number;
}

const CRASH_KEY = 'lastCrashReport';

/**
 * Catches render-time errors inside the in-game tree so a single crash
 * stops a session-ender. The parent keeps `gameConfig` alive, so recovery
 * never bounces the player back to the family-select screen.
 */
export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const componentStack = info?.componentStack ?? null;
    this.setState({ componentStack });

    try {
      const snapshot = this.props.getSnapshot?.();
      const report = {
        ts: new Date().toISOString(),
        message: error?.message ?? String(error),
        stack: (error?.stack ?? '').split('\n').slice(0, 40).join('\n'),
        componentStack: (componentStack ?? '').split('\n').slice(0, 30).join('\n'),
        snapshot,
      };
      localStorage.setItem(CRASH_KEY, JSON.stringify(report));
    } catch {
      /* storage may be full — non-fatal */
    }
    // eslint-disable-next-line no-console
    console.error('[GameErrorBoundary] caught render error', error, info);
  }

  private reset = () => {
    this.setState(s => ({ error: null, componentStack: null, resetKey: s.resetKey + 1 }));
  };

  private handleRestart = () => {
    this.reset();
    // Defer so the child remounts cleanly before parent state churn.
    queueMicrotask(() => this.props.onRestart());
  };

  private handleExit = () => {
    this.reset();
    queueMicrotask(() => this.props.onExitToMenu());
  };

  render() {
    const { error, componentStack, resetKey } = this.state;
    if (!error) {
      // `key` lets us force a clean remount of the entire tree after recovery.
      return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
    }

    const msg = error?.message ?? String(error);
    const stackPreview = (error?.stack ?? '').split('\n').slice(0, 6).join('\n');

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            <h1 className="font-playfair text-2xl font-bold">The game hit an unexpected error</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            We caught it before it could end your session. Your last autosave is still intact —
            pick how you'd like to continue.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            <Button onClick={this.reset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try to continue
            </Button>
            <Button onClick={this.handleRestart} variant="secondary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart same family
            </Button>
            <Button onClick={this.handleExit} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Return to menu
            </Button>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical details
            </summary>
            <div className="mt-2 p-3 rounded bg-muted/40 font-mono whitespace-pre-wrap break-words">
              <div className="text-destructive mb-1">{msg}</div>
              {stackPreview && <div className="opacity-80">{stackPreview}</div>}
              {componentStack && (
                <div className="opacity-60 mt-2">
                  {componentStack.split('\n').slice(0, 12).join('\n')}
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }
}

export default GameErrorBoundary;
