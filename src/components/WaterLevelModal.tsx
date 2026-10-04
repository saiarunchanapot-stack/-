import React from 'react';
import { X, Waves, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WATER_STATIONS, WaterStation } from '../data/chachoengsaoData';

interface WaterLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaterLevelModal: React.FC<WaterLevelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-cyan-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Waves className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                ระดับน้ำแม่น้ำบางปะกง จ.ฉะเชิงเทรา
              </h2>
              <p className="text-cyan-200 text-xs">
                ข้อมูลโทรมาตรแบบเรียลไทม์เพื่อเฝ้าระวังน้ำท่วมฉับพลันและน้ำทะเลหนุน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>ประกาศเตือนภัยน้ำหนุน:</strong> ในช่วง 24 ชั่วโมงนี้ แม่น้ำบางปะกงมีปริมาณน้ำหนุนสูง ร่วมกับมวลน้ำระบายจากตอนบน ขอให้ประชาชนริมฝั่ง อ.เมือง, อ.บางคล้า, และ อ.บ้านโพธิ์ ยกสิ่งของขึ้นที่สูง
            </div>
          </div>

          <div className="space-y-3">
            {WATER_STATIONS.map(ws => {
              const diffToBank = (ws.currentLevelMsl - ws.bankLevelMsl).toFixed(2);
              const isOverBank = ws.currentLevelMsl >= ws.bankLevelMsl;

              return (
                <div
                  key={ws.id}
                  className={`p-4 rounded-xl border transition-all ${
                    ws.status === 'critical'
                      ? 'bg-rose-50/50 border-rose-200'
                      : ws.status === 'warning'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {ws.code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{ws.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ws.location}</p>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        ws.status === 'critical'
                          ? 'bg-red-600 text-white'
                          : ws.status === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {ws.status === 'critical' ? 'วิกฤตล้นตลิ่ง' : 'เฝ้าระวัง'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500">ระดับน้ำปัจจุบัน</div>
                      <div className="font-extrabold text-sm sm:text-base text-red-600">
                        {ws.currentLevelMsl} <span className="text-[10px] font-normal text-slate-500">ม.รทก.</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500">ระดับตลิ่ง</div>
                      <div className="font-bold text-sm sm:text-base text-slate-700">
                        {ws.bankLevelMsl} <span className="text-[10px] font-normal text-slate-500">ม.รทก.</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500">สถานะเทียบตลิ่ง</div>
                      <div className={`font-bold text-xs sm:text-sm ${isOverBank ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isOverBank ? `+${diffToBank} ม. (ล้น)` : `${diffToBank} ม.`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <span>แนวโน้ม:</span>
                      {ws.trend === 'rising' ? (
                        <span className="text-red-600 font-semibold flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>กำลังเพิ่มขึ้น</span>
                        </span>
                      ) : ws.trend === 'falling' ? (
                        <span className="text-emerald-600 font-semibold flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>กำลังลดลง</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-semibold flex items-center">
                          <Minus className="w-3.5 h-3.5" />
                          <span>ทรงตัว</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px]">อัปเดต: {ws.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
