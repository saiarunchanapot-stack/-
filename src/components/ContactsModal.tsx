import React from 'react';
import { X, Phone, Shield, Home, Users, MapPin, ExternalLink, AlertCircle } from 'lucide-react';
import { EMERGENCY_CONTACTS, SHELTERS_DATA, Shelter } from '../data/chachoengsaoData';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShelterOnMap: (shelter: Shelter) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  onSelectShelterOnMap
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-rose-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Phone className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                สายด่วนฉุกเฉินและศูนย์พักพิง จ.ฉะเชิงเทรา
              </h2>
              <p className="text-rose-200 text-xs">
                ติดต่อหน่วยบรรเทาสาธารณภัย กู้ภัย และจุดอพยพปลอดภัย
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Emergency Hotlines */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-900 mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-rose-600" />
              <span>เบอร์โทรฉุกเฉิน 24 ชั่วโมง</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EMERGENCY_CONTACTS.map(contact => (
                <div
                  key={contact.phone}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 hover:border-rose-300 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {contact.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {contact.role}
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Shelters */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>ศูนย์พักพิงชั่วคราวฉะเชิงเทรา</span>
            </h3>
            <div className="space-y-2.5">
              {SHELTERS_DATA.map(shelter => {
                const percent = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
                const isNearFull = percent >= 80;

                return (
                  <div
                    key={shelter.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {shelter.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          อ.{shelter.district} • {shelter.address}
                        </div>
                      </div>
                      <span
                        className={`self-start sm:self-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isNearFull
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isNearFull ? '⚠️ ใกล้เต็ม' : '✓ เปิดรับผู้ประสบภัย'}
                      </span>
                    </div>

                    {/* Capacity bar */}
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>ความจุที่รองรับ:</span>
                        <span className="font-semibold text-slate-700">
                          {shelter.currentOccupancy} / {shelter.capacity} คน ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {shelter.facilities.map(f => (
                        <span
                          key={f}
                          className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium"
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${shelter.phone}`}
                        className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>โทรสอบถาม ({shelter.phone})</span>
                      </a>
                      <button
                        onClick={() => {
                          onSelectShelterOnMap(shelter);
                          onClose();
                        }}
                        className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs py-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-emerald-700" />
                        <span>ชี้บนแผนที่</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
