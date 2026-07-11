import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-2xl w-full text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">Something went wrong</h2>
            <p className="text-red-600 dark:text-red-300 mb-6">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-white dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-64 border border-red-100 dark:border-red-900/50 mt-6">
                <p className="text-red-500 font-mono text-sm font-bold mb-2">{this.state.error.toString()}</p>
                <pre className="text-slate-600 dark:text-slate-400 text-xs font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
