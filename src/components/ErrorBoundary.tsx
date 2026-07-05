import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Top-level Error Boundary that catches unhandled React render errors
 * and shows a friendly, styled fallback screen instead of a blank page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production you'd send this to an error tracking service (e.g. Sentry)
    console.error('[AttendWise] Uncaught error:', error, info.componentStack);
  }

  handleReload = () => {
    // Clear state and attempt a re-render; if it fails again the boundary will catch it
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#15121b',
          padding: '2rem',
          fontFamily: '"JetBrains Mono", monospace',
          color: '#e8dfee',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '0.5rem',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: '#dc2626' }}
            aria-hidden="true"
          >
            warning
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.25rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#dc2626',
            marginBottom: '0.5rem',
          }}
        >
          SYSTEM ERROR DETECTED
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: '#958da1',
            maxWidth: 380,
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          AttendWise encountered an unexpected error. Your data is safe — it is stored
          locally in your browser. Try reloading to restore normal operation.
        </p>

        {/* Error detail (collapsed) */}
        {this.state.error && (
          <details
            style={{
              marginBottom: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '0.75rem 1rem',
              borderRadius: '0.25rem',
              maxWidth: 500,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <summary
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: '#958da1',
                textTransform: 'uppercase',
              }}
            >
              Error details
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#dc2626',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReload}
            style={{
              background: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(124, 58, 237, 0.5)',
              color: '#d2bbff',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 44,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.2)';
            }}
          >
            RETRY
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#958da1',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 44,
            }}
          >
            RELOAD PAGE
          </button>
        </div>
      </div>
    );
  }
}
