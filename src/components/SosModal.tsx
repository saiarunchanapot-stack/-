import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  MapPin,
  Send,
  Users,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  Navigation,
  Loader2,
  LifeBuoy
} from 'lucide-react';
import { CHACHOENGSAO_DISTRICTS } from '../data/chachoengsaoData';
import { SosReport } from '../services/sheetsService';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Omit<SosReport, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  userLocation: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
  isSheetConnected: boolean;
}

const COMMON_NEEDS = [
  'เรือท้องแบน/เรือกู้ภัย',
  'มีผู้ป่วยติดเตียง/คนชรา',
  'น้ำดื่มและอาหารแห้ง',
  'นมผง/ของใช้ทารก',
  'ยาสามัญ/ยาประจำตัว',
  'ไฟฟ้าถูกตัด/ไม่มีสัญญาณ',
  'ช่วยเหลือสัตว์เลี้ยง',
  'กระสอบทราย/เครื่องสูบน้ำ'
];

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userLocation,
  onRequestLocation,
  isSheetConnected
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [district, setDistrict] = useState(CHACHOENGSAO_DISTRICTS[0]);
  const [subdistrict, setSubdistrict] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium'>('critical');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(['เรือท้องแบน/เรือกู้ภัย', 'น้ำดื่มและอาหารแห้ง']);
  const [victimCount, setVictimCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState(userLocation ? userLocation.lat : 13.6904);
  const [longitude, setLongitude] = useState(userLocation ? userLocation.lng : 101.0779);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Sync coords if user location updates
  useEffect(() => {
    if (userLocation) {
      setLatitude(userLocation.lat);
      setLongitude(userLocation.lng);
    }
  }, [userLocation]);

  if (!isOpen) return null;

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !reporterPhone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์สำหรับติดต่อช่วยเหลือ');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = await onSubmit({
        reporterName,
        reporterPhone,
        district,
        subdistrict: subdistrict.trim() || 'ชุมชนริมน้ำ',
        severity,
        needs: selectedNeeds,
        victimCount,
        latitude,
        longitude,
        notes
      });
      setSubmittedId(newId);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${err.message || 'โปรดลองอีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedId(null);
    setReporterName('');
    setReporterPhone('');
    setSubdistrict('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <LifeBuoy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl leading-tight">
                แจ้งขอความช่วยเหลือฉุกเฉิน (SOS)
              </h2>
              <p className="text-rose-100 text-xs mt-0.5">
                ศูนย์รับแจ้งภัยน้ำท่วม จังหวัดฉะเชิงเทรา
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submitted Success View */}
        {submittedId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                ส่งสัญญาณขอความช่วยเหลือสำเร็จ!
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                รหัสคำขอของคุณคือ{' '}
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {submittedId}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200 text-slate-700">
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">ผู้ประสบภัย:</span>
                <span className="font-medium">{reporterName} ({victimCount} คน)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">พิกัด GPS:</span>
                <span className="font-mono font-medium text-blue-600">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500">สถานะบันทึก Google Sheets:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  isSheetConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSheetConnected ? '✓ ซิงค์ลง Google Sheet แล้ว' : 'บันทึกในระบบศูนย์กู้ภัย'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 text-left">
              <strong>คำแนะนำ:</strong> กรุณาชาร์จแบตเตอรี่โทรศัพท์และปิดแอปที่ไม่จำเป็น หากระดับน้ำเพิ่มขึ้นอย่างรวดเร็ว โทรสายด่วน <strong>1669</strong> หรือ <strong>038-511-404 (ปภ.ฉะเชิงเทรา)</strong> ทันที
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง / กลับสู่แผนที่
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* GPS Location Auto-Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    พิกัดตำแหน่งขอความช่วยเหลือ
                  </div>
                  <div className="text-[11px] font-mono text-blue-700">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onRequestLocation}
                className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>ดึงพิกัดปัจจุบันฉัน</span>
              </button>
            </div>

            {/* Severity Radio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ระดับความเร่งด่วน <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('critical')}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    severity === 'critical'
                      ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-sm">🔴 วิกฤตสูงสุด</div>
                  <div className="text-[10px] mt-0.5 opacity-90">ติดค้าง/น้ำท่วมชั้น 2</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('high')}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    severity === 'high'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-sm">🟠 เร่งด่วน</div>
                  <div className="text-[10px] mt-0.5 opacity-90">ขออพยพ/ตัดไฟ</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('medium')}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    severity === 'medium'
                      ? 'bg-yellow-500 text-white border-yellow-600 shadow-md ring-2 ring-yellow-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-sm">🟡 ปานกลาง</div>
                  <div className="text-[10px] mt-0.5 opacity-90">ต้องการเสบียง/น้ำดื่ม</div>
                </button>
              </div>
            </div>

            {/* Reporter Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้แจ้ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายประสิทธิ์ ใจดี"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={reporterPhone}
                    onChange={e => setReporterPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* District & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อำเภอ (ฉะเชิงเทรา) <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                >
                  {CHACHOENGSAO_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      อำเภอ{d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำบล / ชุมชน / จุดสังเกต
                </label>
                <input
                  type="text"
                  placeholder="เช่น ต.บ้านใหม่ ใกล้วัด, ซอย 4"
                  value={subdistrict}
                  onChange={e => setSubdistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {/* Victim Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนผู้ประสบภัยที่ติดค้าง (คน)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={victimCount}
                  onChange={e => setVictimCount(parseInt(e.target.value, 10))}
                  className="flex-1 accent-red-600 h-2 bg-slate-200 rounded-lg"
                />
                <span className="w-16 text-center font-bold text-sm bg-red-50 text-red-700 py-1 rounded-lg border border-red-200">
                  {victimCount} คน
                </span>
              </div>
            </div>

            {/* Needs Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ความต้องการเร่งด่วน (เลือกได้หลายข้อ)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {COMMON_NEEDS.map(need => {
                  const isChecked = selectedNeeds.includes(need);
                  return (
                    <button
                      key={need}
                      type="button"
                      onClick={() => toggleNeed(need)}
                      className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-rose-600 text-white' : 'border border-slate-300'
                      }`}>
                        {isChecked && '✓'}
                      </span>
                      <span className="truncate">{need}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติม / ข้อมูลสถานการณ์
              </label>
              <textarea
                rows={2}
                placeholder="เช่น น้ำลึกประมาณระดับอก กระแสน้ำแรง มีผู้สูงอายุเดินไม่ได้ 1 คน"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>

            {/* Google Sheets Status Notice */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSheetConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-[11px]">
                {isSheetConnected
                  ? 'เชื่อมต่อ Google Sheets แล้ว ข้อมูลจะถูกบันทึกลงชีตอัตโนมัติ'
                  : 'ยังไม่ได้เชื่อมต่อ Google Sheets (สามารถส่งข้อมูลขึ้นระบบแผนที่ได้ตามปกติ)'}
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึกและส่งสัญญาณ SOS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>ส่งคำขอความช่วยเหลือทันที</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
