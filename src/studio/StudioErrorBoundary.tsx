import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface StudioErrorBoundaryProps {
  children: React.ReactNode;
}

interface StudioErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Top-level runtime resilience guard ensuring corrupted browser drafts,
 * malformed imports, or transient WebGL/Canvas quirks never blank the studio.
 */
export class StudioErrorBoundary extends React.Component<
  StudioErrorBoundaryProps,
  StudioErrorBoundaryState
> {
  constructor(props: StudioErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): StudioErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'An unexpected studio rendering error occurred.';
    return { hasError: true, errorMessage: message.slice(0, 220) };
  }

  componentDidCatch(error: unknown): void {
    // Keep console output concise without exposing sensitive state
    if (error instanceof Error) {
      console.error('Katha Studio recovered from runtime error:', error.message);
    }
  }

  private handleResetAndReload = () => {
    try {
      window.localStorage.removeItem('katha_studio_autosave_fallback_v1');
    } catch {
      // ignore storage restriction
    }
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen w-full bg-[#090d1a] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-amber-400/30 bg-[#11172b] p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Studio Recovery Mode</h1>
              <p className="text-xs text-slate-400">
                Katha Studio caught an unexpected runtime error so your session stays safe.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-[#090d1a] border border-white/10 p-3 text-[11px] font-mono text-amber-200 break-words">
            {this.state.errorMessage || 'Unexpected rendering fault'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="flex-1 h-9 rounded-lg bg-[#1d2745] hover:bg-[#27355c] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Studio</span>
            </button>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="flex-1 h-9 rounded-lg bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clean Reload</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
