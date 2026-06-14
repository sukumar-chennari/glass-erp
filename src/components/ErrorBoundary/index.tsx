import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className={styles.container}>
        <span className={styles.icon}><AlertTriangle size={36} /></span>
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.message}>{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
        <button className={styles.btn} onClick={this.reset}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }
}
