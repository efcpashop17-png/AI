import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  Database,
  ArrowUpRight,
  LogOut,
  Calendar,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/googleAuthService';
import {
  getStoredSheetConfig,
  saveStoredSheetConfig,
  createNewOrderSpreadsheet,
  backupOrdersToGoogleSheet,
} from '../services/googleSheetsService';
import { useApp } from '../context/AppContext';
import { User } from 'firebase/auth';

export const GoogleSheetsSyncPanel: React.FC = () => {
  const { orders } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sheet config state
  const [config, setConfig] = useState(getStoredSheetConfig());
  const [inputSheetId, setInputSheetId] = useState(config.spreadsheetId);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 24-hour countdown display
  const [countdownText, setCountdownText] = useState<string>('');
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update countdown & check 24-hour interval
  useEffect(() => {
    const updateCountdown = async () => {
      const currentConfig = getStoredSheetConfig();
      setConfig(currentConfig);

      if (!currentConfig.autoBackupEnabled || !currentConfig.spreadsheetId) {
        setCountdownText('ปิดการสำรองข้อมูลอัตโนมัติ');
        return;
      }

      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const lastBackupDate = currentConfig.lastBackupTime
        ? new Date(currentConfig.lastBackupTime).getTime()
        : 0;
      const now = Date.now();
      const elapsed = now - lastBackupDate;
      const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);

      if (elapsed >= TWENTY_FOUR_HOURS_MS) {
        setCountdownText('ถึงกำหนดสำรองข้อมูลแล้ว (กำลังเริ่ม...)');
        // Trigger auto-backup if we have token
        const currentToken = await getAccessToken();
        if (currentToken && !isBackingUp) {
          handleExecuteBackup(currentToken);
        }
      } else {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setCountdownText(`อีก ${hours} ชม. ${minutes} นาที ${seconds} วินาที`);
      }
    };

    updateCountdown();
    backupIntervalRef.current = setInterval(updateCountdown, 10000); // Check every 10s

    return () => {
      if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    };
  }, [orders, isBackingUp]);

  const handleLogin = async () => {
    setIsSigningIn(true);
    setActionNotice(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setActionNotice({
          type: 'success',
          message: `เชื่อมต่อบัญชี Google (${result.user.email}) สำเร็จแล้ว`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setActionNotice({
        type: 'error',
        message: `เข้าสู่ระบบ Google ไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setActionNotice({
      type: 'success',
      message: 'ออกจากระบบ Google แล้ว',
    });
  };

  const handleCreateNewSheet = async () => {
    const currentToken = token || (await getAccessToken());
    if (!currentToken) {
      setActionNotice({
        type: 'error',
        message: 'กรุณาเชื่อมต่อบัญชี Google ก่อนสร้างชีต',
      });
      return;
    }

    setIsCreatingSheet(true);
    setActionNotice(null);
    try {
      const result = await createNewOrderSpreadsheet(currentToken, 'EF CPA Shop - ข้อมูลออเดอร์สต็อก');
      setInputSheetId(result.spreadsheetId);
      setConfig(getStoredSheetConfig());
      setActionNotice({
        type: 'success',
        message: 'สร้าง Google Sheet และตั้งค่าหัวตารางเรียบร้อยแล้ว!',
      });
    } catch (err: any) {
      console.error(err);
      setActionNotice({
        type: 'error',
        message: `ไม่สามารถสร้าง Google Sheet ได้: ${err.message}`,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSaveSheetId = () => {
    let cleanId = inputSheetId.trim();
    // Allow pasting full URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      cleanId = match[1];
      setInputSheetId(cleanId);
    }

    if (!cleanId) {
      setActionNotice({ type: 'error', message: 'กรุณาระบุ Spreadsheet ID' });
      return;
    }

    saveStoredSheetConfig({ spreadsheetId: cleanId });
    setConfig(getStoredSheetConfig());
    setActionNotice({
      type: 'success',
      message: `บันทึก Spreadsheet ID เรียบร้อย: ${cleanId}`,
    });
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    saveStoredSheetConfig({ autoBackupEnabled: enabled });
    setConfig(getStoredSheetConfig());
    setActionNotice({
      type: 'success',
      message: enabled
        ? 'เปิดการสำรองข้อมูลอัตโนมัติทุก 24 ชั่วโมงแล้ว'
        : 'ปิดการสำรองข้อมูลอัตโนมัติเรียบร้อย',
    });
  };

  const handleExecuteBackup = async (overrideToken?: string) => {
    const currentToken = overrideToken || token || (await getAccessToken());
    if (!currentToken) {
      setActionNotice({
        type: 'error',
        message: 'กรุณาเชื่อมต่อบัญชี Google ก่อนเริ่มการสำรองข้อมูล',
      });
      return;
    }

    if (!config.spreadsheetId) {
      setActionNotice({
        type: 'error',
        message: 'กรุณาระบุหรือสร้าง Google Sheet ก่อนสำรองข้อมูล',
      });
      return;
    }

    setIsBackingUp(true);
    setActionNotice(null);
    try {
      const result = await backupOrdersToGoogleSheet(
        currentToken,
        config.spreadsheetId,
        orders
      );
      if (result.success) {
        setConfig(getStoredSheetConfig());
        setActionNotice({
          type: 'success',
          message: `สำรองข้อมูลลง Google Sheet สำเร็จแล้วทั้งหมด ${result.count} ออเดอร์`,
        });
      } else {
        throw new Error(result.error || 'Backup failed');
      }
    } catch (err: any) {
      console.error(err);
      setActionNotice({
        type: 'error',
        message: `สำรองข้อมูลล้มเหลว: ${err.message}`,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const sheetUrl = config.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`
    : '';

  return (
    <div className="bg-[#120E24] border border-violet-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white font-heading">
                Google Sheets Real-time Order Sync & Backup
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Official API
              </span>
            </div>
            <p className="text-xs text-violet-300/80">
              เชื่อมต่อ Google Sheets API เพื่อซิงก์ออเดอร์ลูกค้าแบบเรียลไทม์ และสำรองฐานข้อมูลอัตโนมัติทุก 24 ชม.
            </p>
          </div>
        </div>

        {/* Google Auth Status Badge */}
        <div>
          {isLoadingAuth ? (
            <div className="flex items-center gap-2 text-xs text-violet-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังตรวจสอบการเชื่อมต่อ...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 bg-violet-950/70 border border-violet-600/40 px-3.5 py-1.5 rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-6 h-6 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <span className="text-[11px] font-semibold text-emerald-300 block leading-tight">
                  เชื่อมต่อแล้ว
                </span>
                <span className="text-[10px] text-violet-200/80 line-clamp-1">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="ออกจากระบบ Google"
                className="p-1 rounded-lg hover:bg-violet-800 text-violet-300 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-md transition-all cursor-pointer border border-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Connected Spreadsheet Config */}
        <div className="bg-[#181230] border border-violet-500/20 rounded-xl p-4.5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              กำหนด Google Sheet ปลายทาง
            </span>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline"
              >
                <span>เปิดใน Google Sheets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-violet-300/80 block">
              ระบุ Spreadsheet ID หรือวาง URL ของ Google Sheet
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSheetId}
                onChange={(e) => setInputSheetId(e.target.value)}
                placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0F0B1E] border border-violet-500/30 text-xs text-white placeholder-violet-500/50 outline-none focus:border-cyan-400 font-mono"
              />
              <button
                onClick={handleSaveSheetId}
                className="px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>

          {/* Quick Create Button */}
          <div className="pt-2 border-t border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-white">ยังไม่มีชีตสำหรับเก็บออเดอร์?</p>
              <p className="text-[10px] text-violet-300/70">
                ระบบจะสร้าง Google Sheet ใหม่พร้อมฟอร์แมตหัวตารางมาตรฐานให้ทันที
              </p>
            </div>
            <button
              onClick={handleCreateNewSheet}
              disabled={isCreatingSheet || !user}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
            >
              {isCreatingSheet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้างชีต...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>สร้างชีตใหม่ 1-คลิก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Column 2: Scheduled 24h Auto-Backup & Sync Engine */}
        <div className="bg-[#181230] border border-violet-500/20 rounded-xl p-4.5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              กำหนดการสำรองข้อมูล (Scheduled 24h Task)
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoBackupEnabled}
                onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-violet-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Status Details */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-[#0F0B1E] p-3 rounded-xl border border-violet-500/20">
              <span className="text-[10px] text-violet-400 block font-medium">รอบการทำงานถัดไป</span>
              <span className="text-xs font-extrabold text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-cyan-400" />
                {countdownText || 'กำลังคำนวณ...'}
              </span>
            </div>

            <div className="bg-[#0F0B1E] p-3 rounded-xl border border-violet-500/20">
              <span className="text-[10px] text-violet-400 block font-medium">สำรองข้อมูลล่าสุด</span>
              <span className="text-xs font-bold text-violet-200 font-mono mt-0.5 block truncate">
                {config.lastBackupTime
                  ? new Date(config.lastBackupTime).toLocaleString('th-TH')
                  : 'ยังไม่มีประวัติ'}
              </span>
            </div>
          </div>

          {/* Real-time Order Push Notice & Manual Backup */}
          <div className="pt-2 border-t border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Real-Time Push: ทำงานอยู่</span>
              </p>
              <p className="text-[10px] text-violet-300/70">
                ออเดอร์ใหม่จากลูกค้าจะถูกส่งไปยัง Google Sheet โดยอัตโนมัติ
              </p>
            </div>

            <button
              onClick={() => handleExecuteBackup()}
              disabled={isBackingUp || !user || !config.spreadsheetId}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสำรองข้อมูล ({orders.length})...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สำรองข้อมูลทันที ({orders.length} ออเดอร์)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Log Status Footer */}
      {config.lastBackupMessage && (
        <div className="text-[11px] text-violet-300/80 bg-violet-950/40 px-3.5 py-2 rounded-xl border border-violet-500/20 flex items-center justify-between">
          <span className="font-mono">
            สถานะล่าสุด: <strong className="text-emerald-300">{config.lastBackupMessage}</strong>
          </span>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>ดูข้อมูลในชีต</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
