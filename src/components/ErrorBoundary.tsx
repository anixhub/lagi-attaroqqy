import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
  key?: React.Key;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in module:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-rose-100 shadow-sm text-center">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-slate-800">
            Terjadi Kendala Saat Memuat {this.props.moduleName || 'Modul'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            Sistem mendeteksi kesalahan saat menampilkan data. Anda dapat mencoba memuat ulang modul ini atau kembali ke Beranda.
          </p>
          {this.state.error && (
            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 max-w-lg overflow-x-auto text-left">
              {this.state.error.toString()}
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Coba Lagi</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
                window.location.reload();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
