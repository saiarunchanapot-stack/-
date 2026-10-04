import React from 'react';
import { User } from 'firebase/auth';
import {
  LifeBuoy,
  FileSpreadsheet,
  PhoneCall,
  LogOut,
  Navigation,
  ListFilter,
  Waves,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  Lock,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  userLocation: { lat: number; lng: number } | null;
  onOpenSosModal: () => void;
  onOpenContacts: () => void;
  onOpenReportsList: () => void;
  onOpenWaterMonitor: () => void;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  spreadsheetId: string | null;
  onCreateOrSyncSheet: () => void;
  isCreatingSheet: boolean;
  totalPending: number;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userLocation,
  onOpenSosModal,
  onOpenContacts,
  onOpenReportsList,
  onOpenWaterMonitor,
  onSignInWithGoogle,
  onSignOut,
  spreadsheetId,
  onCreateOrSyncSheet,
  isCreatingSheet,
  totalPending,
  isAdmin
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-950/40">
            <LifeBuoy className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
                ฉะเชิงเทรา Flood SOS
              </span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden sm:inline">
                เรียลไทม์
              </span>
              {isAdmin && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 hidden xs:flex">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ลุ่มน้ำบางปะกง</span>
              {userLocation && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-blue-400 flex items-center gap-0.5">
                    <Navigation className="w-2.5 h-2.5" />
                    <span>GPS พร้อม</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2">
          {/* Water Monitor Button */}
          <button
            onClick={onOpenWaterMonitor}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors border border-slate-700/60"
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>ระดับน้ำบางปะกง</span>
          </button>

          {/* Reports List Button - Admin Restricted */}
          <button
            onClick={onOpenReportsList}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-colors border relative font-medium ${
              isAdmin
                ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border-emerald-700/60'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
            title="รายการคำขอความช่วยเหลือ (เฉพาะผู้ดูแลระบบ)"
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">รายการคำขอ</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({isAdmin ? 'Admin' : 'ล็อก'})
            </span>
            {totalPending > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {totalPending}
              </span>
            )}
          </button>

          {/* Emergency Hotline Button */}
          <button
            onClick={onOpenContacts}
            className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 px-2.5 sm:px-3 py-2 rounded-xl transition-colors border border-rose-800/50 font-medium"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">สายด่วน</span>
          </button>

          {/* Google Sheets Sync State / Button */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl p-1">
              {spreadsheetId ? (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                  title="เปิดดูใน Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">เปิด Google Sheet</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <button
                  onClick={onCreateOrSyncSheet}
                  disabled={isCreatingSheet}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  title="สร้างชีตสำหรับบันทึกเหตุอัตโนมัติ"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">
                    {isCreatingSheet ? 'กำลังสร้างชีต...' : 'สร้าง Sheet บันทึก'}
                  </span>
                </button>
              )}

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full border border-slate-600"
                    title={user.email || ''}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                  title="ออกจากระบบ Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Official Material Button for Google Sign In */
            <button
              onClick={onSignInWithGoogle}
              className="gsi-material-button text-xs !h-9 !py-1 !px-2.5 sm:!px-3"
              title="ลงชื่อเข้าใช้ Google เพื่อซิงค์กับ Google Sheets"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
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
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-medium text-slate-800">
                  <span className="hidden sm:inline">เชื่อมต่อ</span> Sheets
                </span>
              </div>
            </button>
          )}

          {/* SOS Trigger Button */}
          <button
            onClick={onOpenSosModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-red-950/50 transition-transform active:scale-95 border border-red-400/40 animate-pulse"
          >
            <LifeBuoy className="w-4 h-4 fill-white" />
            <span>แจ้งขอช่วย (SOS)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
