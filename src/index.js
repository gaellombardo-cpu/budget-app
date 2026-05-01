import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('App error:', error, errorInfo);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24, fontFamily: '-apple-system, sans-serif',
          background: 'rgba(255,255,255,0.95)', color: '#c0392b',
          maxWidth: 600, margin: '40px auto', borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 14
        }}>
          <h2 style={{ marginBottom: 12, fontSize: 18 }}>⚠ Erreur dans l'application</h2>
          <p style={{ marginBottom: 12, color: '#333', fontWeight: 600 }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{
            background: '#f5f5f7', padding: 12, borderRadius: 8,
            fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            color: '#555', overflow: 'auto', maxHeight: 400
          }}>
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
          <p style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            Copie ce message et envoie-le pour qu'on corrige le bug.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
