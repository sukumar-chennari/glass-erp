import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './ErrorBoundary.module.css';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useTranslation('errors');
  return (
    <div className={styles.container}>
      <span className={styles.icon}><AlertTriangle size={36} /></span>
      <h2 className={styles.title}>{t('boundary.title')}</h2>
      <p className={styles.message}>{error?.message ?? t('boundary.message')}</p>
      <button className={styles.btn} onClick={onReset}>
        <RefreshCw size={14} /> {t('boundary.tryAgain')}
      </button>
    </div>
  );
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
    return <ErrorFallback error={this.state.error} onReset={this.reset} />;
  }
}
