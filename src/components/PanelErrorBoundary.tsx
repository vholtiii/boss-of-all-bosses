import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Human label for the surface, e.g. "Map" or "Left panel". */
  label: string;
}

interface State {
  error: Error | null;
  resetKey: number;
}

/**
 * Compact, surface-local error boundary.
 *
 * Keeps one crashing panel (map, sidebar, modal) from taking down the whole
 * game shell — the player sees an inline "this panel failed" card with a
 * retry, and the rest of the session keeps running.
 */
export class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[PanelErrorBoundary:${this.props.label}]`, error, info?.componentStack);
  }

  private retry = () => {
    this.setState(s => ({ error: null, resetKey: s.resetKey + 1 }));
  };

  render() {
    const { error, resetKey } = this.state;
    if (!error) {
      return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
    }

    return (
      <div className="m-2 rounded-lg border border-destructive/40 bg-card/95 p-3 text-xs shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-semibold text-foreground">{this.props.label} hit an error</span>
        </div>
        <p className="text-muted-foreground mb-2">
          The rest of your game is unaffected — your turn and saves are intact.
        </p>
        <button
          onClick={this.retry}
          className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-foreground hover:bg-accent transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Reload this panel
        </button>
        <div className="mt-2 truncate font-mono text-[10px] text-destructive/80">
          {error.message}
        </div>
      </div>
    );
  }
}

export default PanelErrorBoundary;
