import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  LifeBuoy,
  AlertTriangle,
  MapPin,
  Waves,
  Home,
  FileSpreadsheet,
  PhoneCall,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MapChachoengsao } from './components/MapChachoengsao';
import { SosModal } from './components/SosModal';
import { ReportListModal } from './components/ReportListModal';
import { ContactsModal } from './components/ContactsModal';
import { WaterLevelModal } from './components/WaterLevelModal';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from './services/firebaseAuth';
import {
  SosReport,
  createFloodReportSheet,
  appendRowToSheet,
  reportToRow,
  fetchSheetReports,
  updateReportStatusInSheet,
  getSavedSpreadsheetId,
  saveSpreadsheetId
} from './services/sheetsService';
import {
  INITIAL_SOS_REPORTS,
  CHACHOENGSAO_CENTER,
  Shelter,
  WATER_STATIONS
} from './data/chachoengsaoData';
import firebaseConfig from '../firebase-applet-config.json';

// Designated Admin Emails list (user email from session)
const ADMIN_EMAILS = [
  'saiarunchanapot@gmail.com'
];

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSpreadsheetId());
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('chachoengsao_flood_admin_session') === 'true';
  });

  // Quota banner for Google Maps Platform defense
  const [hasQuotaWarning, setHasQuotaWarning] = useState(false);

  // Real-time GPS user location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Reports state (with localStorage fallback)
  const [reports, setReports] = useState<SosReport[]>(() => {
    const saved = localStorage.getItem('chachoengsao_flood_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SOS_REPORTS;
      }
    }
    return INITIAL_SOS_REPORTS;
  });

  // Selected report/shelter for highlighting on map
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Modals state
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isReportsListOpen, setIsReportsListOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isWaterMonitorOpen, setIsWaterMonitorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1. Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        // Automatically grant admin if logged in email matches admin list
        if (currentUser.email && (ADMIN_EMAILS.includes(currentUser.email) || currentUser.email.endsWith('@admin'))) {
          setIsAdmin(true);
          localStorage.setItem('chachoengsao_flood_admin_session', 'true');
        }
      },
      () => {
        // user signed out or no cached token
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen for Maps Quota event
  useEffect(() => {
    const onQuotaExceeded = () => setHasQuotaWarning(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // 3. Real-time Geolocation tracking
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ไม่รองรับระบบระบุพิกัด GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocationError(null);
        showToast('ดึงพิกัดตำแหน่งปัจจุบันสำเร็จแล้ว', 'success');
      },
      err => {
        console.warn('Geolocation error:', err.message);
        setLocationError('กรุณาอนุญาตการเข้าถึงตำแหน่ง GPS เพื่อใช้งานฟีเจอร์ระบุพิกัด');
        if (!userLocation) {
          setUserLocation({ lat: 13.6895, lng: 101.0712, accuracy: 25 });
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  }, [userLocation]);

  useEffect(() => {
    requestLocation();
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        pos => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        err => console.log('WatchPosition error:', err),
        { enableHighAccuracy: true, timeout: 20000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('chachoengsao_flood_reports', JSON.stringify(reports));
  }, [reports]);

  // Handle Google Sign In
  const handleSignInWithGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        const email = res.user.email || '';
        if (ADMIN_EMAILS.includes(email) || email.endsWith('@admin') || email === 'saiarunchanapot@gmail.com') {
          setIsAdmin(true);
          localStorage.setItem('chachoengsao_flood_admin_session', 'true');
          showToast(`เข้าสู่ระบบในฐานะผู้ดูแลระบบ: ${res.user.displayName || email}`, 'success');
        } else {
          showToast(`เข้าสู่ระบบด้วย Google: ${res.user.displayName || email}`, 'info');
        }
      }
    } catch (err: any) {
      showToast(`การลงชื่อเข้าใช้ขัดข้อง: ${err.message || 'โปรดลองใหม่'}`, 'error');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('chachoengsao_flood_admin_session');
    showToast('ออกจากระบบ Google แล้ว', 'info');
  };

  // Admin PIN Login (for emergency responders)
  const handleAdminLoginWithPin = (pin: string): boolean => {
    // Official Emergency Hotlines used as authorized emergency pins: 1669 (EMS), 1784 (Disaster Prevention), or admin
    if (['1669', '1784', '038511404', 'admin'].includes(pin)) {
      setIsAdmin(true);
      localStorage.setItem('chachoengsao_flood_admin_session', 'true');
      showToast('เข้าสู่ระบบผู้ดูแลระบบ/เจ้าหน้าที่กู้ภัยสำเร็จ', 'success');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('chachoengsao_flood_admin_session');
    showToast('ออกจากโหมดผู้ดูแลระบบแล้ว', 'info');
  };

  // Create or Link Google Sheet
  const handleCreateOrSyncSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      showToast('กรุณากด "เชื่อมต่อ Sheets" เพื่อเข้าสู่ระบบก่อนสร้างชีต', 'info');
      handleSignInWithGoogle();
      return;
    }

    setIsCreatingSheet(true);
    try {
      const { spreadsheetId: newId, spreadsheetUrl } = await createFloodReportSheet(token);
      setSpreadsheetId(newId);
      saveSpreadsheetId(newId);

      // Append current local reports to sheet
      for (const rep of reports) {
        await appendRowToSheet(token, newId, reportToRow(rep));
      }

      showToast('สร้างไฟล์ Google Sheets และนำเข้าข้อมูลเริ่มต้นเรียบร้อยแล้ว!', 'success');
    } catch (err: any) {
      showToast(`สร้าง Sheet ไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`, 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Sync with Google Sheet
  const handleSyncWithSheet = async () => {
    if (!spreadsheetId) return;
    const token = await getAccessToken();
    if (!token) {
      showToast('กรุณาลงชื่อเข้าใช้ Google เพื่อซิงค์กับ Sheet', 'info');
      handleSignInWithGoogle();
      return;
    }

    setIsSyncingSheet(true);
    try {
      const remoteReports = await fetchSheetReports(token, spreadsheetId);
      if (remoteReports && remoteReports.length > 0) {
        setReports(remoteReports);
        showToast(`ซิงค์ข้อมูลจาก Google Sheets สำเร็จ (${remoteReports.length} รายการ)`, 'success');
      } else {
        showToast('ไม่พบข้อมูลแถวใหม่ใน Sheet', 'info');
      }
    } catch (err: any) {
      showToast(`การซิงค์ล้มเหลว: ${err.message}`, 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Handle New SOS Submission
  const handleSosSubmit = async (
    newReportData: Omit<SosReport, 'id' | 'createdAt' | 'status'>
  ): Promise<string> => {
    const count = reports.length + 1;
    const id = `SOS-CCO-${String(count).padStart(3, '0')}`;
    const newReport: SosReport = {
      ...newReportData,
      id,
      createdAt: new Date().toLocaleString('th-TH'),
      status: 'pending'
    };

    setReports(prev => [newReport, ...prev]);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      try {
        await appendRowToSheet(token, spreadsheetId, reportToRow(newReport));
      } catch (err) {
        console.error('Failed to append to Google Sheet:', err);
      }
    }

    return id;
  };

  // Handle Report Status Change with safety and Google Sheets sync
  const handleUpdateStatus = async (
    reportId: string,
    newStatus: 'pending' | 'in_progress' | 'resolved'
  ) => {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      try {
        await updateReportStatusInSheet(token, spreadsheetId, reportId, newStatus);
      } catch (e) {
        console.warn('Could not update status in sheet:', e);
      }
    }

    showToast(`อัปเดตสถานะคำขอเป็น "${newStatus === 'resolved' ? 'สำเร็จ' : newStatus === 'in_progress' ? 'กำลังช่วย' : 'รอช่วย'}" เรียบร้อยแล้ว`, 'success');
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const criticalWaterStation = WATER_STATIONS.find(w => w.status === 'critical');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      {/* Required In-App Quota Notice per Google Maps Platform skill */}
      {hasQuotaWarning && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account. ระบบได้สลับมาใช้แผนที่ดาวเทียมสำรองเพื่อความปลอดภัย
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={user}
        userLocation={userLocation}
        onOpenSosModal={() => setIsSosModalOpen(true)}
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenReportsList={() => setIsReportsListOpen(true)}
        onOpenWaterMonitor={() => setIsWaterMonitorOpen(true)}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
        spreadsheetId={spreadsheetId}
        onCreateOrSyncSheet={handleCreateOrSyncSheet}
        isCreatingSheet={isCreatingSheet}
        totalPending={pendingCount}
        isAdmin={isAdmin}
      />

      {/* Emergency River Alert Bar */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white px-3 py-1.5 text-xs flex items-center justify-between border-b border-rose-900/60 shadow-inner z-20">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="font-bold text-rose-300 shrink-0">เตือนภัยน้ำท่วมฉะเชิงเทรา:</span>
          <span className="text-slate-200 truncate">
            {criticalWaterStation
              ? `ระดับน้ำ ${criticalWaterStation.name} อยู่ที่ ${criticalWaterStation.currentLevelMsl} ม.รทก. สูงเกินระดับตลิ่ง`
              : 'เฝ้าระวังมวลน้ำเหนือและน้ำทะเลหนุนในลุ่มน้ำบางปะกง'}
          </span>
        </div>
        <button
          onClick={() => setIsWaterMonitorOpen(true)}
          className="shrink-0 text-cyan-300 hover:text-white underline text-[11px] font-medium ml-2"
        >
          ดูรายละเอียด
        </button>
      </div>

      {/* Main Interactive Map Workspace */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <MapChachoengsao
          userLocation={userLocation}
          reports={reports}
          selectedReportId={selectedReportId}
          onSelectReport={rep => {
            setSelectedReportId(rep.id);
          }}
          onSelectShelter={shelter => {
            showToast(`ศูนย์พักพิง: ${shelter.name} (${shelter.phone})`, 'info');
          }}
          googleMapsApiKey={firebaseConfig.apiKey}
        />

        {/* Floating Quick Action Drawer (Bottom Left / Bottom Center on Mobile) */}
        <div className="absolute bottom-4 left-3 sm:left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* SOS Quick Button */}
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-red-900/60 font-black text-sm hover:scale-105 transition-all border-2 border-white animate-pulse"
          >
            <LifeBuoy className="w-5 h-5 fill-white" />
            <span>ขอความช่วยเหลือ (SOS)</span>
          </button>

          {/* Reports Counter Pill - indicates admin access */}
          <button
            onClick={() => setIsReportsListOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-slate-800 px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/80 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>คำขอ ({isAdmin ? 'Admin' : 'ล็อก'})</span>
            <span className="bg-red-600 text-white text-[11px] px-1.5 py-0.2 rounded-full font-extrabold">
              {pendingCount}
            </span>
          </button>

          {/* Shelters Pill */}
          <button
            onClick={() => setIsContactsOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-emerald-800 px-3 py-2.5 rounded-2xl shadow-lg border border-emerald-200/80 font-bold text-xs hover:bg-emerald-50 transition-colors hidden sm:flex"
          >
            <Home className="w-4 h-4 text-emerald-600" />
            <span>ศูนย์พักพิง (6 แห่ง)</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-600'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-600'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <SosModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        onSubmit={handleSosSubmit}
        userLocation={userLocation}
        onRequestLocation={requestLocation}
        isSheetConnected={Boolean(user && spreadsheetId)}
      />

      <ReportListModal
        isOpen={isReportsListOpen}
        onClose={() => setIsReportsListOpen(false)}
        reports={reports}
        onUpdateStatus={handleUpdateStatus}
        onSelectReportOnMap={rep => {
          setSelectedReportId(rep.id);
        }}
        onSyncWithGoogleSheet={handleSyncWithSheet}
        isSyncingSheet={isSyncingSheet}
        spreadsheetId={spreadsheetId}
        isAdmin={isAdmin}
        onAdminLoginWithPin={handleAdminLoginWithPin}
        onAdminLogout={handleAdminLogout}
        user={user}
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onSelectShelterOnMap={shelter => {
          showToast(`เลื่อนแผนที่ไปที่ ${shelter.name} แล้ว`, 'info');
        }}
      />

      <WaterLevelModal
        isOpen={isWaterMonitorOpen}
        onClose={() => setIsWaterMonitorOpen(false)}
      />
    </div>
  );
}
