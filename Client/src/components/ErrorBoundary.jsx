import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; wire to a real logger later
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="bg-surface border border-border rounded-2xl p-10 max-w-lg text-center">
          <div className="h-14 w-14 rounded-full bg-status-tampered/10 text-status-tampered grid place-items-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 className="text-base font-bold text-text-main">Something went wrong</h2>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            The page crashed while rendering. You can try reloading, or sign out and back in.
          </p>

          <details className="mt-4 text-left">
            <summary className="text-[11px] font-medium text-text-muted cursor-pointer hover:text-text-main">
              Technical details
            </summary>
            <pre className="mt-2 text-[10px] bg-background border border-border rounded-lg p-3
                            overflow-x-auto text-text-muted font-mono whitespace-pre-wrap">
              {msg}
            </pre>
          </details>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                         text-xs font-semibold px-4 py-2 transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}