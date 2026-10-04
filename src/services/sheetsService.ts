/**
 * Google Sheets API v4 Integration Service
 * Complies with Workspace Skill Least-Privilege & In-Memory Token rules
 */

export interface SosReport {
  id: string;
  createdAt: string;
  reporterName: string;
  reporterPhone: string;
  district: string;
  subdistrict: string;
  severity: 'critical' | 'high' | 'medium';
  needs: string[];
  victimCount: number;
  latitude: number;
  longitude: number;
  notes: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

const DEFAULT_HEADERS = [
  'รหัสคำขอ (ID)',
  'วันเวลาแจ้งเหตุ',
  'ชื่อผู้แจ้ง',
  'เบอร์ติดต่อ',
  'อำเภอ',
  'ตำบล/พื้นที่',
  'ระดับความรุนแรง',
  'ความต้องการเร่งด่วน',
  'จำนวนผู้ประสบภัย (คน)',
  'ละติจูด',
  'ลองจิจูด',
  'ลิงก์แผนที่ Google Maps',
  'รายละเอียดเพิ่มเติม',
  'สถานะการช่วยเหลือ'
];

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem('chachoengsao_flood_sheet_id');
};

export const saveSpreadsheetId = (id: string) => {
  localStorage.setItem('chachoengsao_flood_sheet_id', id);
};

export const clearSavedSpreadsheetId = () => {
  localStorage.removeItem('chachoengsao_flood_sheet_id');
};

/**
 * Creates a brand new Google Spreadsheet formatted for Chachoengsao Flood Relief
 */
export const createFloodReportSheet = async (
  accessToken: string,
  title?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const sheetTitle = title || `บันทึกช่วยเหลือน้ำท่วมฉะเชิงเทรา_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle
      },
      sheets: [
        {
          properties: {
            title: 'รายการขอความช่วยเหลือ',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write the formatted header row
  await appendRowToSheet(accessToken, spreadsheetId, DEFAULT_HEADERS, 'รายการขอความช่วยเหลือ!A1');

  saveSpreadsheetId(spreadsheetId);
  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Append row to Google Sheet
 */
export const appendRowToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  rowValues: (string | number)[],
  range = 'รายการขอความช่วยเหลือ!A:N'
): Promise<boolean> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Append failed: ${response.statusText}`);
  }

  return true;
};

/**
 * Format an SOS Report into spreadsheet row array
 */
export const reportToRow = (report: SosReport): (string | number)[] => {
  const severityThai = {
    critical: '🔴 วิกฤตสูงสุด (ติดค้าง/ระดับน้ำสูงมาก)',
    high: '🟠 เร่งด่วน (ต้องการอพยพ/เสบียง)',
    medium: '🟡 ปานกลาง (เฝ้าระวัง/ต้องการความช่วยเหลือ)'
  }[report.severity];

  const statusThai = {
    pending: '⏳ รอการช่วยเหลือ',
    in_progress: '🚤 กำลังส่งทีมกู้ภัย',
    resolved: '✅ ช่วยเหลือสำเร็จแล้ว'
  }[report.status];

  const gmapsLink = `https://maps.google.com/?q=${report.latitude},${report.longitude}`;

  return [
    report.id,
    report.createdAt,
    report.reporterName,
    report.reporterPhone,
    report.district,
    report.subdistrict,
    severityThai,
    report.needs.join(', '),
    report.victimCount,
    report.latitude,
    report.longitude,
    gmapsLink,
    report.notes || '-',
    statusThai
  ];
};

/**
 * Sync / Fetch rows from Google Sheet
 */
export const fetchSheetReports = async (
  accessToken: string,
  spreadsheetId: string
): Promise<SosReport[]> => {
  // First, fetch metadata to check tab name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch sheet info: ${metaRes.statusText}`);
  }

  const meta = await metaRes.json();
  const tabName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A2:N500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!valuesRes.ok) {
    return [];
  }

  const data = await valuesRes.json();
  const rows: (string | number)[][] = data.values || [];

  return rows.map((r, index) => {
    const severityText = String(r[6] || '');
    let severity: 'critical' | 'high' | 'medium' = 'high';
    if (severityText.includes('วิกฤต')) severity = 'critical';
    else if (severityText.includes('ปานกลาง')) severity = 'medium';

    const statusText = String(r[13] || '');
    let status: 'pending' | 'in_progress' | 'resolved' = 'pending';
    if (statusText.includes('สำเร็จ')) status = 'resolved';
    else if (statusText.includes('กำลังส่งทีม')) status = 'in_progress';

    return {
      id: String(r[0] || `SHEET-${index + 1}`),
      createdAt: String(r[1] || new Date().toLocaleString('th-TH')),
      reporterName: String(r[2] || 'ไม่ระบุชื่อ'),
      reporterPhone: String(r[3] || '-'),
      district: String(r[4] || 'เมืองฉะเชิงเทรา'),
      subdistrict: String(r[5] || '-'),
      severity,
      needs: String(r[7] || '').split(',').map(s => s.trim()).filter(Boolean),
      victimCount: Number(r[8]) || 1,
      latitude: Number(r[9]) || 13.6904,
      longitude: Number(r[10]) || 101.0779,
      notes: String(r[12] || ''),
      status
    };
  });
};

/**
 * Update row status in Google Sheet with safety check
 */
export const updateReportStatusInSheet = async (
  accessToken: string,
  spreadsheetId: string,
  reportId: string,
  newStatus: 'pending' | 'in_progress' | 'resolved'
): Promise<boolean> => {
  // First locate which row contains this reportId
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!metaRes.ok) return false;
  const meta = await metaRes.json();
  const tabName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A:A`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!valuesRes.ok) return false;
  const data = await valuesRes.json();
  const idRows: string[][] = data.values || [];
  
  const rowIndex = idRows.findIndex(r => r[0] === reportId);
  if (rowIndex === -1) {
    return false;
  }

  const sheetRowNum = rowIndex + 1; // 1-indexed
  const statusThai = {
    pending: '⏳ รอการช่วยเหลือ',
    in_progress: '🚤 กำลังส่งทีมกู้ภัย',
    resolved: '✅ ช่วยเหลือสำเร็จแล้ว'
  }[newStatus];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!N${sheetRowNum}?valueInputOption=USER_ENTERED`;
  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[statusThai]]
    })
  });

  return updateRes.ok;
};
