import * as XLSX from 'xlsx';

export interface ParsedDoctorRow {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email?: string;
  address?: string;
  isValid: boolean;
  errors: string[];
}

export interface ParsedPatientRow {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering' | 'Routine Checkup';
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  doctorId?: string;
  admissionDate?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

export function cleanPhoneNumber(raw: any): string {
  if (!raw) return '';
  let str = String(raw).trim().replace(/[\s\-\(\)\.]/g, '');
  if (str.startsWith('+88')) str = str.slice(3);
  else if (str.startsWith('88') && str.length === 13) str = str.slice(2);
  return str;
}

export function isValidEmail(email: any): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export function isValidBDPhone(phone: any): boolean {
  const clean = cleanPhoneNumber(phone);
  return /^01\d{9}$/.test(clean);
}

// Map messy column headers to standardized keys
function normalizeKey(key: string): string {
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (k.includes('doctor') || k.includes('physician') || k.includes('assigned')) return 'doctor';
  if (k.includes('patientname') || (k.includes('fullname') && !k.includes('doctor')) || k === 'name') return 'name';
  if (k.includes('doctorname') || (k.includes('fullname') && k.includes('doctor'))) return 'doctor';
  if (k === 'patientid' || k === 'id' || k === 'pid' || k === 'ptid') return 'patientId';
  if (k.includes('spec') || k.includes('department')) return 'specialization';
  if (k.includes('hosp') || k.includes('clinic') || k.includes('affiliation')) return 'hospital';
  if (k.includes('phone') || k.includes('mobile') || k.includes('contact') || k.includes('cell')) return 'phone';
  if (k.includes('email') || k.includes('mail')) return 'email';
  if (k.includes('addr') || k.includes('locat') || k.includes('city') || k.includes('chamber')) return 'address';
  if (k.includes('age') || k.includes('year') || k.includes('dob')) return 'age';
  if (k.includes('gen') || k.includes('sex')) return 'gender';
  if (k.includes('cond') || k.includes('status') || k.includes('severity')) return 'condition';
  if (k.includes('blood') || k.includes('bg') || k.includes('group')) return 'bloodGroup';
  if (k.includes('date') || k.includes('admit') || k.includes('admission')) return 'admissionDate';
  if (k.includes('note') || k.includes('remark') || k.includes('comment')) return 'notes';
  return k;
}

export function parseDoctorRows(rawObjects: any[]): ParsedDoctorRow[] {
  return rawObjects.map((row) => {
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      normalized[normalizeKey(key)] = row[key];
    });

    let rawName = String(normalized.name || normalized.doctor || '').trim();
    if (rawName && !rawName.startsWith('Dr.') && !rawName.startsWith('Doctor')) {
      rawName = `Dr. ${rawName}`;
    }

    const specialization = String(normalized.specialization || 'General Medicine').trim();
    const hospital = String(normalized.hospital || 'Affiliated Hospital').trim();
    const phone = cleanPhoneNumber(normalized.phone);
    const email = normalized.email ? String(normalized.email).trim().toLowerCase() : '';
    const address = normalized.address ? String(normalized.address).trim() : '';

    const errors: string[] = [];
    if (!rawName || rawName === 'Dr.') errors.push('Doctor name is missing');
    if (!specialization) errors.push('Specialization is missing');
    if (!hospital) errors.push('Hospital is missing');
    if (!phone) errors.push('Phone is missing');
    else if (!isValidBDPhone(phone)) errors.push('Phone must be 11 digits (01...)');
    if (email && !isValidEmail(email)) errors.push('Invalid email format');

    return {
      name: rawName,
      specialization,
      hospital,
      phone,
      email,
      address,
      isValid: errors.length === 0,
      errors,
    };
  });
}

export function parsePatientRows(rawObjects: any[], existingDoctors: { id: string; name: string }[] = []): ParsedPatientRow[] {
  const validConditions = ['Critical', 'Serious', 'Stable', 'Recovering', 'Routine Checkup'];

  return rawObjects.map((row) => {
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      normalized[normalizeKey(key)] = row[key];
    });

    const name = String(normalized.name || '').trim();
    const age = parseInt(normalized.age, 10) || 0;
    
    let gender: 'Male' | 'Female' | 'Other' = 'Other';
    const g = String(normalized.gender || '').toLowerCase();
    if (g.startsWith('m')) gender = 'Male';
    else if (g.startsWith('f')) gender = 'Female';

    let condition: any = 'Stable';
    const c = String(normalized.condition || '').trim();
    const matchCond = validConditions.find((vc) => vc.toLowerCase() === c.toLowerCase());
    if (matchCond) condition = matchCond;

    const phone = cleanPhoneNumber(normalized.phone);
    const email = normalized.email ? String(normalized.email).trim().toLowerCase() : undefined;
    const address = normalized.address ? String(normalized.address).trim() : '';
    const rawDoctor = String(normalized.doctor || '').trim();

    // Match doctor ID if doctor name was given
    let doctorId: string | undefined;
    let doctorName: string | undefined;

    if (rawDoctor && existingDoctors.length > 0) {
      const found = existingDoctors.find(
        (d) =>
          d.id === rawDoctor ||
          d.name.toLowerCase().includes(rawDoctor.toLowerCase()) ||
          rawDoctor.toLowerCase().includes(d.name.toLowerCase())
      );
      if (found) {
        doctorId = found.id;
        doctorName = found.name;
      }
    }

    if (!doctorName) {
      doctorName = rawDoctor || (existingDoctors[0]?.name || 'Assigned Specialist');
    }
    if (!doctorId && existingDoctors.length > 0) {
      doctorId = existingDoctors[0].id;
    }

    let notes = String(normalized.notes || '').trim();
    if (normalized.bloodGroup && !notes.toLowerCase().includes('blood')) {
      notes = notes ? `${notes} | Blood Group: ${normalized.bloodGroup}` : `Blood Group: ${normalized.bloodGroup}`;
    }

    const errors: string[] = [];
    if (!name) errors.push('Patient name missing');
    if (!age || age <= 0 || age > 130) errors.push('Valid age required (1-130)');
    if (!phone) errors.push('Phone number missing');
    if (email && !isValidEmail(email)) errors.push('Invalid email format');
    if (!validConditions.includes(condition)) errors.push(`Condition must be: ${validConditions.join(', ')}`);

    return {
      name,
      age,
      gender,
      condition,
      phone,
      email,
      address,
      doctorId,
      doctorName,
      admissionDate: normalized.admissionDate || new Date().toISOString().split('T')[0],
      notes,
      isValid: errors.length === 0,
      errors,
    };
  });
}

// Client-side parser for Excel and CSV
export async function parseExcelOrCsv(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

// Downloadable Sample Templates
export function downloadSampleTemplate(type: 'doctors' | 'patients', format: 'csv' | 'xlsx' = 'csv') {
  let sampleData: any[] = [];
  let fileName = '';

  if (type === 'doctors') {
    fileName = `Doctor_Tracker_Import_Template.${format}`;
    sampleData = [
      {
        'Doctor Name': 'Dr. Tariqul Islam',
        Specialization: 'Cardiology',
        'Hospital Affiliation': 'Dhaka Medical College & Hospital',
        'Phone Number': '01711223344',
        'Official Email': 'tariqul.cardio@dmch.gov.bd',
        Address: 'Secretariat Road, Dhaka 1000',
      },
      {
        'Doctor Name': 'Dr. Nusrat Jahan',
        Specialization: 'Gynecology & Obstetrics',
        'Hospital Affiliation': 'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
        'Phone Number': '01822334455',
        'Official Email': 'nusrat.jahan@bsmmu.edu.bd',
        Address: 'Block C, Level 5, Shahbag, Dhaka',
      },
      {
        'Doctor Name': 'Dr. Mahmudul Hasan',
        Specialization: 'Orthopedic Surgery',
        'Hospital Affiliation': 'National Institute of Traumatology (NITOR)',
        'Phone Number': '01933445566',
        'Official Email': '',
        Address: 'Sher-e-Bangla Nagar, Dhaka',
      },
    ];
  } else {
    fileName = `Patient_Tracker_Import_Template.${format}`;
    sampleData = [
      {
        'Patient ID': 'PT-1001',
        'Patient Name': 'Arafat Hossain',
        Age: 24,
        Gender: 'Male',
        'Blood Group': 'O+',
        'Contact Number': '01000000001',
        Email: 'arafat.hossain@example.com',
        Address: 'Mirpur, Dhaka',
        'Assigned Doctor': 'Dr. Ayesha Rahman',
      },
      {
        'Patient ID': 'PT-1002',
        'Patient Name': 'Nabila Islam',
        Age: 31,
        Gender: 'Female',
        'Blood Group': 'A+',
        'Contact Number': '01000000002',
        Email: 'nabila.islam@example.com',
        Address: 'Agrabad, Chattogram',
        'Assigned Doctor': 'Dr. Farhan Ahmed',
      },
    ];
  }

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  } else {
    XLSX.writeFile(wb, fileName);
  }
}
