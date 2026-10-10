import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] p-6 sm:p-10 my-8 mx-auto max-w-2xl rounded-3xl bg-[#141928] border-2 border-rose-500/50 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold border border-rose-500/40">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-black text-white">
            {this.props.fallbackTitle || 'เกิดข้อผิดพลาดในการแสดงผล'}
          </h3>

          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            ระบบพบปัญหาชั่วคราวในการโหลดข้อมูล กรุณากดปุ่มรีโหลดข้อมูลเพื่อเริ่มต้นใหม่ ข้อมูลของคุณยังคงปลอดภัย
          </p>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-[#0b0e17] border border-slate-800 text-[11px] font-mono text-rose-300 max-h-24 overflow-y-auto text-left">
              {this.state.error.message}
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>รีโหลดหน้านี้ใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>กลับสู่หน้าแรก</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
