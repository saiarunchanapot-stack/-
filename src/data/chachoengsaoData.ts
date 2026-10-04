import { SosReport } from '../services/sheetsService';

export interface Shelter {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  phone: string;
  facilities: string[];
  status: 'open' | 'near_full' | 'full';
}

export interface WaterStation {
  id: string;
  code: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  currentLevelMsl: number; // เมตร รทก.
  bankLevelMsl: number;    // ระดับตลิ่ง เมตร รทก.
  dischargeM3s: number;    // อัตราการไหล ลบ.ม./วินาที
  status: 'normal' | 'warning' | 'critical';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
}

export interface FloodZone {
  id: string;
  name: string;
  district: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  severity: 'high' | 'critical' | 'moderate';
  waterDepthCm: number;
  description: string;
}

export const CHACHOENGSAO_DISTRICTS = [
  'เมืองฉะเชิงเทรา',
  'บางคล้า',
  'บ้านโพธิ์',
  'บางน้ำเปรี้ยว',
  'พนมสารคาม',
  'สนามชัยเขต',
  'แปลงยาว',
  'ราชสาส์น',
  'ท่าตะเกียบ',
  'คลองเขื่อน'
];

export const CHACHOENGSAO_CENTER = {
  lat: 13.6904,
  lng: 101.0779
};

// Official Safe Shelters in Chachoengsao
export const SHELTERS_DATA: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'ศูนย์พักพิงโรงเรียนเบญจมราชรังสฤษฎิ์',
    district: 'เมืองฉะเชิงเทรา',
    address: 'ถ.จุลละนันทน์ ต.หน้าเมือง อ.เมือง จ.ฉะเชิงเทรา',
    latitude: 13.6872,
    longitude: 101.0698,
    capacity: 450,
    currentOccupancy: 120,
    phone: '038-511-134',
    facilities: ['อาหาร 3 มื้อ', 'หน่วยแพทย์สนาม', 'ไฟฟ้าสำรอง', 'ห้องน้ำแยก', 'พื้นที่สัตว์เลี้ยง'],
    status: 'open'
  },
  {
    id: 'shelter-2',
    name: 'ศูนย์อพยพวัดโสธรวรารามวรวิหาร (อาคารอเนกประสงค์)',
    district: 'เมืองฉะเชิงเทรา',
    address: 'ต.หน้าเมือง อ.เมือง จ.ฉะเชิงเทรา',
    latitude: 13.6738,
    longitude: 101.0673,
    capacity: 600,
    currentOccupancy: 280,
    phone: '038-511-048',
    facilities: ['โรงครัวพระราชทาน', 'จุดปฐมพยาบาล', 'สัญญาณ WiFi', 'ที่ชาร์จโทรศัพท์'],
    status: 'open'
  },
  {
    id: 'shelter-3',
    name: 'ศูนย์พักพิงชั่วคราวที่ว่าการอำเภอบางคล้า',
    district: 'บางคล้า',
    address: 'ต.บางคล้า อ.บางคล้า จ.ฉะเชิงเทรา',
    latitude: 13.7225,
    longitude: 101.2081,
    capacity: 300,
    currentOccupancy: 195,
    phone: '038-541-118',
    facilities: ['เรือท้องแบนรับส่ง', 'น้ำดื่มสะอาด', 'แพทย์ประจำศูนย์', 'ถุงยังชีพ'],
    status: 'open'
  },
  {
    id: 'shelter-4',
    name: 'ศูนย์ช่วยเหลือเทศบาลตำบลบ้านโพธิ์',
    district: 'บ้านโพธิ์',
    address: 'ต.บ้านโพธิ์ อ.บ้านโพธิ์ จ.ฉะเชิงเทรา',
    latitude: 13.5975,
    longitude: 101.0772,
    capacity: 250,
    currentOccupancy: 210,
    phone: '038-577-199',
    facilities: ['จุดพักชั่วคราว', 'อาหารแห้ง', 'ชุดสุขอนามัย'],
    status: 'near_full'
  },
  {
    id: 'shelter-5',
    name: 'ศูนย์อพยพ อบต.ดอนฉิมพลี (บางน้ำเปรี้ยว)',
    district: 'บางน้ำเปรี้ยว',
    address: 'ต.ดอนฉิมพลี อ.บางน้ำเปรี้ยว จ.ฉะเชิงเทรา',
    latitude: 13.8821,
    longitude: 100.9984,
    capacity: 350,
    currentOccupancy: 85,
    phone: '038-842-123',
    facilities: ['เต็นท์สนาม', 'รถสุขาเคลื่อนที่', 'น้ำประปาดื่มได้'],
    status: 'open'
  },
  {
    id: 'shelter-6',
    name: 'ศูนย์พักพิงเทศบาลตำบลพนมสารคาม',
    district: 'พนมสารคาม',
    address: 'ต.พนมสารคาม อ.พนมสารคาม จ.ฉะเชิงเทรา',
    latitude: 13.7482,
    longitude: 101.3485,
    capacity: 400,
    currentOccupancy: 140,
    phone: '038-551-314',
    facilities: ['ห้องพยาบาล', 'อาหารปรุงสุก', 'ลานจอดรถปลอดภัยสูงน้ำ'],
    status: 'open'
  }
];

// Water Monitoring Stations along Bang Pakong River & Canals
export const WATER_STATIONS: WaterStation[] = [
  {
    id: 'ws-1',
    code: 'KGT.1',
    name: 'สถานีวัดน้ำสะพานฉะเชิงเทรา (แม่น้ำบางปะกง)',
    location: 'สะพานเฉลิมพระเกียรติฯ ต.หน้าเมือง',
    district: 'เมืองฉะเชิงเทรา',
    latitude: 13.6891,
    longitude: 101.0792,
    currentLevelMsl: 2.45,
    bankLevelMsl: 2.20,
    dischargeM3s: 580,
    status: 'critical',
    trend: 'rising',
    lastUpdated: '10 นาทีที่แล้ว'
  },
  {
    id: 'ws-2',
    code: 'KGT.3',
    name: 'สถานีวัดน้ำตลาดน้ำบางคล้า',
    location: 'ต.บางคล้า ริมแม่น้ำบางปะกง',
    district: 'บางคล้า',
    latitude: 13.7258,
    longitude: 101.2054,
    currentLevelMsl: 2.85,
    bankLevelMsl: 2.60,
    dischargeM3s: 640,
    status: 'critical',
    trend: 'rising',
    lastUpdated: '15 นาทีที่แล้ว'
  },
  {
    id: 'ws-3',
    code: 'BPK.DAM',
    name: 'สถานีเขื่อนทดน้ำบางปะกง',
    location: 'ต.บางแก้ว อ.เมืองฉะเชิงเทรา',
    district: 'เมืองฉะเชิงเทรา',
    latitude: 13.7229,
    longitude: 101.1092,
    currentLevelMsl: 1.95,
    bankLevelMsl: 2.30,
    dischargeM3s: 490,
    status: 'warning',
    trend: 'stable',
    lastUpdated: '5 นาทีที่แล้ว'
  },
  {
    id: 'ws-4',
    code: 'CL.THATOA',
    name: 'สถานีประตูระบายน้ำคลองท่าถั่ว',
    location: 'ต.บางกรูด อ.บ้านโพธิ์',
    district: 'บ้านโพธิ์',
    latitude: 13.6215,
    longitude: 101.0428,
    currentLevelMsl: 1.88,
    bankLevelMsl: 2.10,
    dischargeM3s: 310,
    status: 'warning',
    trend: 'falling',
    lastUpdated: '20 นาทีที่แล้ว'
  }
];

// Active Inundated Flood Areas in Chachoengsao
export const FLOOD_ZONES: FloodZone[] = [
  {
    id: 'fz-1',
    name: 'ชุมชนริมน้ำตลาดบ้านใหม่ 100 ปี',
    district: 'เมืองฉะเชิงเทรา',
    center: { lat: 13.7025, lng: 101.0885 },
    radiusMeters: 750,
    severity: 'critical',
    waterDepthCm: 85,
    description: 'น้ำล้นตลิ่งจากแม่น้ำบางปะกงเข้าท่วมบ้านเรือนริมน้ำ รถเล็กไม่สามารถผ่านได้'
  },
  {
    id: 'fz-2',
    name: 'พื้นที่ลุ่มต่ำชุมชนคลองท่าไข่',
    district: 'เมืองฉะเชิงเทรา',
    center: { lat: 13.7118, lng: 101.0665 },
    radiusMeters: 900,
    severity: 'high',
    waterDepthCm: 55,
    description: 'น้ำระบายไม่ทันและน้ำทะเลหนุนสูง ท่วมขังตามซอยย่อย'
  },
  {
    id: 'fz-3',
    name: 'เขตริมฝั่งแม่น้ำบางคล้า หน้าอำเภอ',
    district: 'บางคล้า',
    center: { lat: 13.7242, lng: 101.2061 },
    radiusMeters: 800,
    severity: 'critical',
    waterDepthCm: 90,
    description: 'มวลน้ำเหนือบวกน้ำหนุน เอ่อท่วมถนนสายหลักและบ้านริมน้ำ'
  },
  {
    id: 'fz-4',
    name: 'พื้นที่ทุ่งรับน้ำบางน้ำเปรี้ยวฝั่งใต้',
    district: 'บางน้ำเปรี้ยว',
    center: { lat: 13.8550, lng: 101.0250 },
    radiusMeters: 1400,
    severity: 'moderate',
    waterDepthCm: 40,
    description: 'พื้นที่การเกษตรและคันคลองมีน้ำท่วมขัง เฝ้าระวังน้ำหนุน'
  }
];

// Initial Realistic Seed SOS Reports in Chachoengsao
export const INITIAL_SOS_REPORTS: SosReport[] = [
  {
    id: 'SOS-CCO-001',
    createdAt: '04/10/2026, 09:15:20',
    reporterName: 'สมศักดิ์ วงศ์สวรรค์',
    reporterPhone: '081-423-8890',
    district: 'เมืองฉะเชิงเทรา',
    subdistrict: 'ต.บ้านใหม่ (หลังวัดเทพนิมิตร)',
    severity: 'critical',
    needs: ['เรือท้องแบน', 'อาหาร-น้ำดื่ม', 'มีผู้ป่วยติดเตียง'],
    victimCount: 4,
    latitude: 13.7042,
    longitude: 101.0895,
    notes: 'น้ำขึ้นสูงระดับเอว ผู้ป่วยติดเตียงวัย 82 ปี ต้องการอพยพด่วน ไฟฟ้าตัดแล้ว',
    status: 'in_progress'
  },
  {
    id: 'SOS-CCO-002',
    createdAt: '04/10/2026, 09:42:10',
    reporterName: 'รัตนาพร สถิตพงษ์',
    reporterPhone: '089-775-1234',
    district: 'บางคล้า',
    subdistrict: 'ต.ปากน้ำ ริมแม่น้ำบางปะกง',
    severity: 'critical',
    needs: ['เรืออพยพ', 'นมผงเด็ก', 'น้ำดื่ม'],
    victimCount: 6,
    latitude: 13.7315,
    longitude: 101.2140,
    notes: 'น้ำท่วมชั้น 1 มิดแล้ว มีเด็กเล็ก 2 คน อาหารใกล้หมด',
    status: 'pending'
  },
  {
    id: 'SOS-CCO-003',
    createdAt: '04/10/2026, 10:05:44',
    reporterName: 'วิเชียร นาคประเสริฐ',
    reporterPhone: '062-334-9871',
    district: 'บ้านโพธิ์',
    subdistrict: 'ต.คลองบ้านโพธิ์ หมู่ 3',
    severity: 'high',
    needs: ['อาหาร-น้ำดื่ม', 'กระสอบทราย', 'ยาสามัญ'],
    victimCount: 3,
    latitude: 13.6021,
    longitude: 101.0824,
    notes: 'น้ำเข้าบ้านระดับ 50 ซม. ยังพออยู่ชั้น 2 ได้ แต่ต้องการเสบียงและน้ำสะอาด',
    status: 'pending'
  },
  {
    id: 'SOS-CCO-004',
    createdAt: '04/10/2026, 08:30:15',
    reporterName: 'อนุรักษ์ บุญมี',
    reporterPhone: '085-112-4499',
    district: 'เมืองฉะเชิงเทรา',
    subdistrict: 'ต.หน้าเมือง ซอยโรงน้ำแข็ง',
    severity: 'high',
    needs: ['รถยกสูง/เรือ', 'ยารักษาโรคเบาหวาน'],
    victimCount: 2,
    latitude: 13.6845,
    longitude: 101.0740,
    notes: 'ทีมกู้ภัยเข้าช่วยเหลือเรียบร้อย อพยพไปศูนย์วัดโสธรฯ แล้ว',
    status: 'resolved'
  }
];

// Official Emergency Contacts for Chachoengsao
export const EMERGENCY_CONTACTS = [
  {
    name: 'สนง.ป้องกันและบรรเทาสาธารณภัย (ปภ.) ฉะเชิงเทรา',
    phone: '038-511-404',
    role: 'ศูนย์บัญชาการเหตุการณ์อุทกภัย 24 ชม.'
  },
  {
    name: 'สายด่วนนิรภัย (กรม ปภ.)',
    phone: '1784',
    role: 'แจ้งเหตุด่วนสาธารณภัยทั่วประเทศ'
  },
  {
    name: 'หน่วยกู้ภัยสว่างศรัทธาธรรมสถาน ฉะเชิงเทรา',
    phone: '038-511-411',
    role: 'ทีมเรือกู้ภัยและช่วยอพยพผู้ประสบภัย'
  },
  {
    name: 'สายด่วนการแพทย์ฉุกเฉิน (EMS)',
    phone: '1669',
    role: 'เจ็บป่วยฉุกเฉิน / ผู้ป่วยติดเตียง'
  },
  {
    name: 'ศูนย์ดำรงธรรมจังหวัดฉะเชิงเทรา',
    phone: '1567',
    role: 'รับเรื่องร้องเรียนและประสานงานความช่วยเหลือ'
  },
  {
    name: 'ศูนย์ประมวลวิเคราะห์สถานการณ์น้ำชลประทานที่ 9',
    phone: '038-511-234',
    role: 'สอบถามข้อมูลระดับน้ำและการระบายน้ำแม่น้ำบางปะกง'
  }
];
