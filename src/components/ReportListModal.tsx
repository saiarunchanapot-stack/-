import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Search,
  Filter,
  LifeBuoy,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle,
  Clock,
  Send,
  FileSpreadsheet,
  AlertTriangle,
  RotateCw,
  Lock,
  ShieldCheck,
  KeyRound,
  LogIn,
  LogOut
} from 'lucide-react';
import { SosReport } from '../services/sheetsService';
import { CHACHOENGSAO_DISTRICTS } from '../data/chachoengsaoData';

interface ReportListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: SosReport[];
  onUpdateStatus: (reportId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => Promise<void>;
  onSelectReportOnMap: (report: SosReport) => void;
  onSyncWithGoogleSheet?: () => Promise<void>;
  isSyncingSheet?: boolean;
  spreadsheetId: string | null;
  isAdmin: boolean;
  onAdminLoginWithPin: (pin: string) => boolean;
  onAdminLogout: () => void;
  user: User | null;
  onSignInWithGoogle: () => void;
}

export const ReportListModal: React.FC<ReportListModalProps> = ({
  isOpen,
  onClose,
  reports,
  onUpdateStatus,
  onSelectReportOnMap,
  onSyncWithGoogleSheet,
  isSyncingSheet,
  spreadsheetId,
  isAdmin,
  onAdminLoginWithPin,
  onAdminLogout,
  user,
  onSignInWithGoogle
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation dialog state for mutating Workspace data
  const [confirmDialog, setConfirmDialog] = useState<{
    reportId: string;
    newStatus: 'pending' | 'in_progress' | 'resolved';
    reporterName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const success = onAdminLoginWithPin(pinInput.trim());
    if (success) {
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง (สำหรับเจ้าหน้าที่กู้ภัยฉะเชิงเทรา)');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchDistrict = filterDistrict === 'all' || r.district === filterDistrict;
    const matchSearch =
      searchTerm.trim() === '' ||
      r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reporterPhone.includes(searchTerm) ||
      r.subdistrict.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.needs.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchStatus && matchDistrict && matchSearch;
  });

  const handleConfirmStatusChange = async () => {
    if (!confirmDialog) return;
    try {
      await onUpdateStatus(confirmDialog.reportId, confirmDialog.newStatus);
      setConfirmDialog(null);
    } catch (err: any) {
      alert(`ไม่สามารถอัปเดตสถานะได้: ${err.message || 'โปรดลองใหม่'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAdmin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg">
                  รายการขอความช่วยเหลือผู้ประสบภัย
                </h2>
                <span className="bg-rose-900 text-rose-200 border border-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>เฉพาะผู้ดูแลระบบ</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                {isAdmin
                  ? 'โหมดผู้ดูแลระบบ: ตรวจสอบพิกัด ประสานงานกู้ภัย และอัปเดตสถานะ'
                  : 'สงวนสิทธิ์การเข้าถึงข้อมูลส่วนบุคคลเฉพาะเจ้าหน้าที่และผู้ดูแลระบบ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onAdminLogout}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                title="ออกจากโหมดผู้ดูแลระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Access Gate (If NOT Admin) */}
        {!isAdmin ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                เข้าสู่ระบบสำหรับผู้ดูแลระบบ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เนื่องจากคำขอความช่วยเหลือประกอบด้วยข้อมูลส่วนบุคคล เบอร์โทรศัพท์ และพิกัดที่อยู่อาศัยของผู้ประสบภัยน้ำท่วม ระบบจึงจำกัดสิทธิ์การดูข้อมูลเฉพาะเจ้าหน้าที่ศูนย์บัญชาการ ปภ. และหน่วยกู้ภัยเท่านั้น
              </p>
            </div>

            {/* Login Options Card */}
            <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
              {/* Option 1: Google Account Sign-In */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  วิธีที่ 1: เข้าสู่ระบบด้วยบัญชี Google ผู้ดูแลระบบ
                </label>
                {user ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-emerald-900">เข้าสู่ระบบแล้ว:</div>
                      <div className="text-emerald-700 truncate max-w-[200px]">{user.email}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      รอสิทธิ์ Admin
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={onSignInWithGoogle}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-3 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 text-xs transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-blue-600" />
                    <span>ลงชื่อเข้าใช้ด้วย Google (Admin)</span>
                  </button>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-300" />
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold">หรือ</span>
                <div className="flex-grow border-t border-slate-300" />
              </div>

              {/* Option 2: Emergency Field PIN */}
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  วิธีที่ 2: รหัสผ่านเจ้าหน้าที่กู้ภัย (Admin PIN)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      placeholder="กรอกรหัส PIN เจ้าหน้าที่ (เช่น 1669)"
                      value={pinInput}
                      onChange={e => {
                        setPinInput(e.target.value);
                        setPinError(null);
                      }}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    ยืนยัน
                  </button>
                </div>
                {pinError && (
                  <p className="text-[11px] text-red-600 font-medium">{pinError}</p>
                )}
                <p className="text-[10px] text-slate-500">
                  * รหัสผ่านสำหรับเจ้าหน้าที่ประจำศูนย์ ปภ. ฉะเชิงเทรา และกู้ภัยสว่างศรัทธาฯ (รหัสเริ่มต้น: <strong>1669</strong> หรือ <strong>1784</strong>)
                </p>
              </form>
            </div>

            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              กลับสู่แผนที่หลัก
            </button>
          </div>
        ) : (
          /* Admin Authorized View */
          <>
            {/* Filter Controls & Admin Info Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สิทธิ์ผู้ดูแลระบบ (Admin) ได้รับอนุญาตแล้ว</span>
                </div>
                {spreadsheetId && onSyncWithGoogleSheet && (
                  <button
                    onClick={onSyncWithGoogleSheet}
                    disabled={isSyncingSheet}
                    className="flex items-center gap-1 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg transition-colors font-medium shadow-2xs"
                    title="ดึงข้อมูลล่าสุดจาก Google Sheets"
                  >
                    <RotateCw className={`w-3 h-3 ${isSyncingSheet ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>ซิงค์ Sheets</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                พบข้อมูลทั้งหมด <strong className="text-slate-800">{filteredReports.length}</strong> รายการ
              </div>
            </div>

            {/* Filter Row */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-[150px]">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, เบอร์โทร, ตำบล, สิ่งของ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2 py-1 rounded font-medium ${
                    filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ทั้งหมด ({reports.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2 py-1 rounded font-medium ${
                    filterStatus === 'pending' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  รอช่วย ({reports.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('in_progress')}
                  className={`px-2 py-1 rounded font-medium ${
                    filterStatus === 'in_progress' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  กำลังช่วย ({reports.filter(r => r.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-2 py-1 rounded font-medium ${
                    filterStatus === 'resolved' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  สำเร็จ ({reports.filter(r => r.status === 'resolved').length})
                </button>
              </div>

              {/* District Filter */}
              <select
                value={filterDistrict}
                onChange={e => setFilterDistrict(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none text-slate-700"
              >
                <option value="all">ทุกอำเภอ</option>
                {CHACHOENGSAO_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    อ.{d}
                  </option>
                ))}
              </select>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <LifeBuoy className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                  <p className="text-sm">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              ) : (
                filteredReports.map(rep => {
                  const isPending = rep.status === 'pending';
                  const isInProgress = rep.status === 'in_progress';
                  const isResolved = rep.status === 'resolved';

                  return (
                    <div
                      key={rep.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-rose-50/40 border-rose-200'
                          : isInProgress
                          ? 'bg-amber-50/30 border-amber-200'
                          : 'bg-emerald-50/20 border-emerald-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {rep.id}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInProgress
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isResolved ? '✅ ช่วยเหลือสำเร็จ' : isInProgress ? '🚤 กำลังส่งทีมกู้ภัย' : '⏳ รอการช่วยเหลือ'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {rep.createdAt}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              onSelectReportOnMap(rep);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg font-medium shadow-sm transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            <span>ชี้บนแผนที่</span>
                          </button>

                          <a
                            href={`https://maps.google.com/?q=${rep.latitude},${rep.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Google Maps</span>
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-slate-500">ผู้ประสบภัย:</div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{rep.reporterName}</span>
                            <span className="text-xs font-normal text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-medium">
                              {rep.victimCount} คน
                            </span>
                          </div>
                          <a
                            href={`tel:${rep.reporterPhone}`}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{rep.reporterPhone}</span>
                          </a>
                        </div>

                        <div>
                          <div className="text-slate-500">พิกัด / พื้นที่:</div>
                          <div className="font-medium text-slate-800">
                            อ.{rep.district} {rep.subdistrict && `(${rep.subdistrict})`}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {rep.latitude.toFixed(5)}, {rep.longitude.toFixed(5)}
                          </div>
                        </div>
                      </div>

                      {/* Needs */}
                      <div className="mt-2 text-xs flex flex-wrap gap-1">
                        {rep.needs.map(n => (
                          <span
                            key={n}
                            className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>

                      {rep.notes && (
                        <div className="mt-2 text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 italic">
                          "{rep.notes}"
                        </div>
                      )}

                      {/* Update Status Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">
                          ปรับสถานะการช่วยเหลือ:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {rep.status !== 'in_progress' && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  reportId: rep.id,
                                  newStatus: 'in_progress',
                                  reporterName: rep.reporterName
                                })
                              }
                              className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 font-medium transition-colors"
                            >
                              🚤 ส่งทีมช่วยเหลือ
                            </button>
                          )}

                          {rep.status !== 'resolved' && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  reportId: rep.id,
                                  newStatus: 'resolved',
                                  reporterName: rep.reporterName
                                })
                              }
                              className="px-2.5 py-1 rounded-md text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors"
                            >
                              ✅ บันทึกช่วยสำเร็จ
                            </button>
                          )}

                          {rep.status !== 'pending' && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  reportId: rep.id,
                                  newStatus: 'pending',
                                  reporterName: rep.reporterName
                                })
                              }
                              className="px-2 py-1 rounded-md text-xs bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-colors"
                            >
                              ย้อนกลับเป็นรอช่วย
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Confirmation Modal for Mutating Data */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900">
                  ยืนยันการเปลี่ยนแปลงสถานะข้อมูล
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการเปลี่ยนสถานะของคำขอ{' '}
                <strong className="text-slate-800 font-semibold">{confirmDialog.reporterName}</strong> เป็น{' '}
                <span className="font-bold text-blue-600">
                  {confirmDialog.newStatus === 'resolved'
                    ? 'ช่วยเหลือสำเร็จแล้ว'
                    : confirmDialog.newStatus === 'in_progress'
                    ? 'กำลังส่งทีมกู้ภัย'
                    : 'รอการช่วยเหลือ'}
                </span>{' '}
                ใช่หรือไม่?
                {spreadsheetId && (
                  <span className="block mt-1 text-[11px] text-emerald-700 font-medium">
                    * สถานะในไฟล์ Google Sheets จะได้รับการอัปเดตตรงกันด้วย
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-sm"
                >
                  ยืนยันการเปลี่ยนสถานะ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
