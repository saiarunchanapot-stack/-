import React, { useEffect, useState, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import L from 'leaflet';
import {
  Navigation,
  LifeBuoy,
  Home,
  Waves,
  AlertTriangle,
  Compass,
  Phone,
  Layers,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { CHACHOENGSAO_CENTER, SHELTERS_DATA, WATER_STATIONS, FLOOD_ZONES, Shelter, WaterStation, FloodZone } from '../data/chachoengsaoData';
import { SosReport } from '../services/sheetsService';

interface MapProps {
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  reports: SosReport[];
  onSelectReport?: (report: SosReport) => void;
  onSelectShelter?: (shelter: Shelter) => void;
  selectedReportId?: string | null;
  googleMapsApiKey?: string;
}

export const MapChachoengsao: React.FC<MapProps> = ({
  userLocation,
  reports,
  onSelectReport,
  onSelectShelter,
  selectedReportId,
  googleMapsApiKey
}) => {
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [googleMapError, setGoogleMapError] = useState(false);
  const [showShelters, setShowShelters] = useState(true);
  const [showWaterStations, setShowWaterStations] = useState(true);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showSosReports, setShowSosReports] = useState(true);

  // Active popup in Google Maps
  const [activeMarker, setActiveMarker] = useState<{
    type: 'report' | 'shelter' | 'water' | 'user';
    data: any;
    position: { lat: number; lng: number };
  } | null>(null);

  // Center & zoom control
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(CHACHOENGSAO_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  // Leaflet map container ref
  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstance = useRef<L.Map | null>(null);
  const leafletMarkersGroup = useRef<L.LayerGroup | null>(null);

  // Distance to nearest shelter calculation
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const nearestShelter = userLocation
    ? SHELTERS_DATA.map(s => ({
        ...s,
        dist: parseFloat(getDistanceKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude))
      })).sort((a, b) => a.dist - b.dist)[0]
    : null;

  // Center to user GPS
  const handleRecenterUser = () => {
    if (userLocation) {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
      setMapZoom(15);
      if (leafletMapInstance.current) {
        leafletMapInstance.current.flyTo([userLocation.lat, userLocation.lng], 15);
      }
    }
  };

  // Center to Chachoengsao Overview
  const handleOverviewChachoengsao = () => {
    setMapCenter(CHACHOENGSAO_CENTER);
    setMapZoom(11);
    if (leafletMapInstance.current) {
      leafletMapInstance.current.flyTo([CHACHOENGSAO_CENTER.lat, CHACHOENGSAO_CENTER.lng], 11);
    }
  };

  // Watch for auth or quota error on Google Maps
  useEffect(() => {
    const handleAuthFailure = () => {
      setGoogleMapError(true);
      setMapEngine('leaflet');
    };
    window.addEventListener('gmp-quota-exceeded', handleAuthFailure);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleAuthFailure);
    };
  }, []);

  // Sync selectedReportId
  useEffect(() => {
    if (selectedReportId) {
      const rep = reports.find(r => r.id === selectedReportId);
      if (rep) {
        setMapCenter({ lat: rep.latitude, lng: rep.longitude });
        setMapZoom(14);
        setActiveMarker({
          type: 'report',
          data: rep,
          position: { lat: rep.latitude, lng: rep.longitude }
        });
        if (leafletMapInstance.current) {
          leafletMapInstance.current.flyTo([rep.latitude, rep.longitude], 14);
        }
      }
    }
  }, [selectedReportId, reports]);

  // Leaflet initialization and update logic
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletContainerRef.current) return;

    if (!leafletMapInstance.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      leafletMapInstance.current = map;
      leafletMarkersGroup.current = L.layerGroup().addTo(map);
    }

    const markersGroup = leafletMarkersGroup.current;
    if (!markersGroup) return;
    markersGroup.clearLayers();

    // 1. User Location Pin
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <div class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-lg items-center justify-center text-white">
            <span class="w-2 h-2 bg-white rounded-full"></span>
          </div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-2 text-slate-800">
          <div class="font-bold text-blue-600 flex items-center gap-1">📍 ตำแหน่งปัจจุบันของคุณ</div>
          <div class="text-xs text-slate-600 mt-1">พิกัด: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</div>
          ${userLocation.accuracy ? `<div class="text-xs text-slate-500">ความแม่นยำ: ±${Math.round(userLocation.accuracy)} เมตร</div>` : ''}
        </div>
      `);
      markersGroup.addLayer(userMarker);

      // Accuracy circle
      if (userLocation.accuracy) {
        L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: '#3b82f6',
          fillColor: '#93c5fd',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(markersGroup);
      }
    }

    // 2. Flood Zones
    if (showFloodZones) {
      FLOOD_ZONES.forEach(zone => {
        const color = zone.severity === 'critical' ? '#ef4444' : '#f97316';
        const circle = L.circle([zone.center.lat, zone.center.lng], {
          radius: zone.radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2
        });
        circle.bindPopup(`
          <div class="p-2 text-slate-800">
            <div class="font-bold text-red-600 flex items-center gap-1">⚠️ เขตน้ำท่วม: ${zone.name}</div>
            <div class="text-xs text-slate-700 mt-1">อ.${zone.district} (ระดับน้ำท่วม ~${zone.waterDepthCm} ซม.)</div>
            <div class="text-xs text-slate-600 mt-1">${zone.description}</div>
          </div>
        `);
        markersGroup.addLayer(circle);
      });
    }

    // 3. Shelters
    if (showShelters) {
      SHELTERS_DATA.forEach(shelter => {
        const shelterIcon = L.divIcon({
          className: 'custom-shelter-icon',
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white border-2 border-white shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([shelter.latitude, shelter.longitude], { icon: shelterIcon });
        marker.bindPopup(`
          <div class="p-2 text-slate-800">
            <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">ศูนย์พักพิงปลอดภัย</span>
            <div class="font-bold text-sm mt-1 text-emerald-950">${shelter.name}</div>
            <div class="text-xs text-slate-600 mt-1">${shelter.address}</div>
            <div class="text-xs text-slate-700 mt-1">ความจุ: ${shelter.currentOccupancy}/${shelter.capacity} คน</div>
            <a href="tel:${shelter.phone}" class="inline-flex items-center gap-1 mt-2 text-xs bg-emerald-600 text-white px-2.5 py-1 rounded hover:bg-emerald-700">
              📞 โทร ${shelter.phone}
            </a>
          </div>
        `);
        markersGroup.addLayer(marker);
      });
    }

    // 4. Water Stations
    if (showWaterStations) {
      WATER_STATIONS.forEach(ws => {
        const bg = ws.status === 'critical' ? 'bg-red-500' : ws.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
        const wsIcon = L.divIcon({
          className: 'custom-water-icon',
          html: `<div class="flex items-center justify-center w-7 h-7 rounded-full ${bg} text-white border-2 border-white shadow-md">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([ws.latitude, ws.longitude], { icon: wsIcon });
        marker.bindPopup(`
          <div class="p-2 text-slate-800">
            <span class="text-xs ${ws.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
              ${ws.status === 'critical' ? '🔴 ระดับน้ำวิกฤตล้นตลิ่ง' : '🟠 ระดับน้ำเฝ้าระวัง'}
            </span>
            <div class="font-bold text-sm mt-1">${ws.name} (${ws.code})</div>
            <div class="text-xs text-slate-600 mt-1">${ws.location}</div>
            <div class="mt-2 text-xs border-t pt-1 border-slate-200">
              <div>ระดับน้ำปัจจุบัน: <span class="font-bold text-red-600">${ws.currentLevelMsl} ม.รทก.</span> (ตลิ่ง ${ws.bankLevelMsl} ม.)</div>
              <div>การไหลระบาย: ${ws.dischargeM3s} ลบ.ม./วินาที</div>
            </div>
          </div>
        `);
        markersGroup.addLayer(marker);
      });
    }

    // 5. SOS Reports
    if (showSosReports) {
      reports.forEach(rep => {
        const bg = rep.status === 'resolved' ? 'bg-emerald-500' : rep.status === 'in_progress' ? 'bg-amber-500' : 'bg-red-600';
        const sosIcon = L.divIcon({
          className: 'custom-sos-icon',
          html: `<div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bg} text-white border-2 border-white shadow-lg cursor-pointer">
            ${rep.status === 'pending' ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>' : ''}
            <span class="font-black text-xs relative">SOS</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: sosIcon });
        marker.bindPopup(`
          <div class="p-2 text-slate-800 min-w-[200px]">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold px-1.5 py-0.5 rounded ${
                rep.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : rep.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800 animate-pulse'
              }">
                ${rep.status === 'resolved' ? '✅ ช่วยเหลือแล้ว' : rep.status === 'in_progress' ? '🚤 กำลังช่วยเหลือ' : '⏳ รอการช่วยเหลือ'}
              </span>
              <span class="text-[10px] text-slate-500">${rep.id}</span>
            </div>
            <div class="font-bold text-sm mt-1">${rep.reporterName}</div>
            <div class="text-xs text-slate-600">${rep.district} - ${rep.subdistrict}</div>
            <div class="text-xs font-semibold text-rose-600 mt-1">ผู้ประสบภัย: ${rep.victimCount} คน</div>
            <div class="text-xs text-slate-700 mt-1 bg-slate-50 p-1 rounded border border-slate-200">ต้องการ: ${rep.needs.join(', ') || 'ความช่วยเหลือทั่วไป'}</div>
            ${rep.notes ? `<div class="text-xs text-slate-500 italic mt-1">"${rep.notes}"</div>` : ''}
            <div class="flex gap-2 mt-2 pt-2 border-t border-slate-200">
              <a href="tel:${rep.reporterPhone}" class="flex-1 text-center text-xs bg-blue-600 text-white py-1 rounded font-medium hover:bg-blue-700">
                📞 โทร
              </a>
              <a href="https://maps.google.com/?q=${rep.latitude},${rep.longitude}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-xs bg-slate-100 text-slate-700 py-1 rounded font-medium hover:bg-slate-200">
                🗺️ นำทาง
              </a>
            </div>
          </div>
        `);
        markersGroup.addLayer(marker);
      });
    }
  }, [mapEngine, userLocation, reports, showFloodZones, showShelters, showWaterStations, showSosReports, mapCenter, mapZoom]);

  const activeApiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* Top Map Layer & Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Nearest Shelter Quick Indicator */}
        {nearestShelter && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 hidden sm:inline">ศูนย์พักพิงใกล้คุณ:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[220px]">
              {nearestShelter.name}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-1.5 py-0.5 rounded">
              {nearestShelter.dist} กม.
            </span>
          </div>
        )}

        {/* Layer Toggles & Map Engine Switch */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 ml-auto">
          <button
            onClick={() => setShowSosReports(!showSosReports)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              showSosReports ? 'bg-red-50 text-red-700 border border-red-200' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="สลับหมุดเหตุฉุกเฉิน SOS"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span className="hidden md:inline">หมุด SOS</span>
            <span className="bg-red-600 text-white rounded-full px-1.5 text-[10px] ml-0.5">
              {reports.filter(r => r.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              showShelters ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="สลับศูนย์พักพิง"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ศูนย์พักพิง</span>
          </button>

          <button
            onClick={() => setShowWaterStations(!showWaterStations)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              showWaterStations ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="สลับสถานีวัดน้ำบางปะกง"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ระดับน้ำ</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Engine Selector */}
          <button
            onClick={() => setMapEngine(mapEngine === 'google' ? 'leaflet' : 'google')}
            className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1"
            title="สลับโหมดแผนที่ (Google Maps / OpenStreetMap)"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-semibold">{mapEngine === 'google' ? 'Google' : 'OSM'}</span>
          </button>
        </div>
      </div>

      {/* Floating GPS & Navigation Buttons */}
      <div className="absolute bottom-6 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
        {userLocation && (
          <button
            onClick={handleRecenterUser}
            className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-xl shadow-lg font-medium text-xs transition-transform active:scale-95 border-2 border-white"
            title="ไปยังพิกัดปัจจุบันของคุณ"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>ตำแหน่งฉัน</span>
          </button>
        )}

        <button
          onClick={handleOverviewChachoengsao}
          className="flex items-center gap-1.5 bg-white text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-md font-medium text-xs transition-colors border border-slate-200"
          title="ดูภาพรวมจังหวัดฉะเชิงเทรา"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>ฉะเชิงเทรา</span>
        </button>
      </div>

      {/* Map Content Rendering */}
      <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
        {mapEngine === 'google' && !googleMapError ? (
          <APIProvider apiKey={activeApiKey} language="th" region="TH">
            <GoogleMap
              style={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={mapZoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {/* User Location Marker */}
              {userLocation && (
                <AdvancedMarker
                  position={{ lat: userLocation.lat, lng: userLocation.lng }}
                  onClick={() =>
                    setActiveMarker({
                      type: 'user',
                      data: userLocation,
                      position: { lat: userLocation.lat, lng: userLocation.lng }
                    })
                  }
                >
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <div className="relative inline-flex rounded-full h-6 w-6 bg-blue-600 border-2 border-white shadow-lg items-center justify-center text-white">
                      <Navigation className="w-3.5 h-3.5 fill-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* SOS Reports Markers */}
              {showSosReports &&
                reports.map(rep => {
                  const isPending = rep.status === 'pending';
                  const isResolved = rep.status === 'resolved';
                  const bg = isResolved ? 'bg-emerald-500' : isPending ? 'bg-red-600' : 'bg-amber-500';

                  return (
                    <AdvancedMarker
                      key={rep.id}
                      position={{ lat: rep.latitude, lng: rep.longitude }}
                      onClick={() => {
                        setActiveMarker({
                          type: 'report',
                          data: rep,
                          position: { lat: rep.latitude, lng: rep.longitude }
                        });
                        if (onSelectReport) onSelectReport(rep);
                      }}
                    >
                      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${bg} text-white border-2 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform`}>
                        {isPending && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        )}
                        <span className="font-extrabold text-[10px]">SOS</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

              {/* Shelters Markers */}
              {showShelters &&
                SHELTERS_DATA.map(shelter => (
                  <AdvancedMarker
                    key={shelter.id}
                    position={{ lat: shelter.latitude, lng: shelter.longitude }}
                    onClick={() => {
                      setActiveMarker({
                        type: 'shelter',
                        data: shelter,
                        position: { lat: shelter.latitude, lng: shelter.longitude }
                      });
                      if (onSelectShelter) onSelectShelter(shelter);
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Home className="w-4 h-4" />
                    </div>
                  </AdvancedMarker>
                ))}

              {/* Water Stations Markers */}
              {showWaterStations &&
                WATER_STATIONS.map(ws => {
                  const bg = ws.status === 'critical' ? 'bg-red-500' : 'bg-amber-500';
                  return (
                    <AdvancedMarker
                      key={ws.id}
                      position={{ lat: ws.latitude, lng: ws.longitude }}
                      onClick={() =>
                        setActiveMarker({
                          type: 'water',
                          data: ws,
                          position: { lat: ws.latitude, lng: ws.longitude }
                        })
                      }
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full ${bg} text-white border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform`}>
                        <Waves className="w-3.5 h-3.5" />
                      </div>
                    </AdvancedMarker>
                  );
                })}

              {/* Info Window */}
              {activeMarker && (
                <InfoWindow
                  position={activeMarker.position}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-2 max-w-[240px] text-slate-800">
                    {activeMarker.type === 'report' && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            activeMarker.data.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : activeMarker.data.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {activeMarker.data.status === 'resolved' ? '✅ ช่วยเหลือแล้ว' : activeMarker.data.status === 'in_progress' ? '🚤 กำลังส่งทีม' : '⏳ รอการช่วยเหลือ'}
                          </span>
                          <span className="text-[10px] text-slate-500">{activeMarker.data.id}</span>
                        </div>
                        <div className="font-bold text-sm text-slate-900">{activeMarker.data.reporterName}</div>
                        <div className="text-xs text-slate-600">{activeMarker.data.district} - {activeMarker.data.subdistrict}</div>
                        <div className="text-xs font-semibold text-rose-600 mt-1">ผู้ประสบภัย: {activeMarker.data.victimCount} คน</div>
                        <div className="text-xs bg-slate-50 p-1.5 rounded border border-slate-200 mt-1 text-slate-700">
                          ต้องการ: {activeMarker.data.needs.join(', ')}
                        </div>
                        {activeMarker.data.notes && (
                          <div className="text-xs text-slate-600 italic mt-1">"{activeMarker.data.notes}"</div>
                        )}
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                          <a
                            href={`tel:${activeMarker.data.reporterPhone}`}
                            className="flex-1 text-center text-xs bg-blue-600 text-white py-1 rounded font-medium hover:bg-blue-700"
                          >
                            📞 โทร
                          </a>
                          <a
                            href={`https://maps.google.com/?q=${activeMarker.data.latitude},${activeMarker.data.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-xs bg-slate-100 text-slate-700 py-1 rounded font-medium hover:bg-slate-200 flex items-center justify-center gap-1"
                          >
                            <span>นำทาง</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {activeMarker.type === 'shelter' && (
                      <div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          ศูนย์พักพิงปลอดภัย
                        </span>
                        <div className="font-bold text-sm mt-1 text-emerald-950">{activeMarker.data.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{activeMarker.data.address}</div>
                        <div className="text-xs text-slate-700 mt-1">
                          รองรับได้: {activeMarker.data.currentOccupancy}/{activeMarker.data.capacity} คน
                        </div>
                        <a
                          href={`tel:${activeMarker.data.phone}`}
                          className="inline-flex items-center gap-1 mt-2 text-xs bg-emerald-600 text-white px-3 py-1 rounded-md font-medium hover:bg-emerald-700"
                        >
                          <Phone className="w-3 h-3" />
                          <span>โทร {activeMarker.data.phone}</span>
                        </a>
                      </div>
                    )}

                    {activeMarker.type === 'water' && (
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          activeMarker.data.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {activeMarker.data.status === 'critical' ? '🔴 ระดับน้ำวิกฤตล้นตลิ่ง' : '🟠 ระดับน้ำเฝ้าระวัง'}
                        </span>
                        <div className="font-bold text-sm mt-1">{activeMarker.data.name}</div>
                        <div className="text-xs text-slate-600">{activeMarker.data.location}</div>
                        <div className="text-xs mt-2 border-t pt-1 border-slate-200 text-slate-700">
                          <div>ระดับน้ำ: <strong className="text-red-600">{activeMarker.data.currentLevelMsl} ม.รทก.</strong> (ตลิ่ง {activeMarker.data.bankLevelMsl} ม.)</div>
                          <div>อัตราการไหล: {activeMarker.data.dischargeM3s} ลบ.ม./วินาที</div>
                        </div>
                      </div>
                    )}

                    {activeMarker.type === 'user' && (
                      <div>
                        <div className="font-bold text-blue-600 flex items-center gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>ตำแหน่งปัจจุบันของคุณ</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {activeMarker.data.lat.toFixed(5)}, {activeMarker.data.lng.toFixed(5)}
                        </div>
                        {activeMarker.data.accuracy && (
                          <div className="text-[11px] text-slate-500">
                            ความแม่นยำ: ±{Math.round(activeMarker.data.accuracy)} เมตร
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </APIProvider>
        ) : (
          <div ref={leafletContainerRef} className="w-full h-full z-10" />
        )}
      </div>
    </div>
  );
};
