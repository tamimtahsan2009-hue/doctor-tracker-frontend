import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Helper to ensure PDF.js worker is properly configured in Next.js server environment
async function initPdfWorker() {
  try {
    const candidateWorkerPaths = [
      path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'pdf.worker.mjs'),
      path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs'),
      path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'esm', 'pdf.worker.mjs'),
      path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'web', 'pdf.worker.mjs'),
    ];

    const sourceWorkerPath = candidateWorkerPaths.find((p) => fs.existsSync(p));

    if (sourceWorkerPath) {
      // 1. Copy worker next to compiled Next.js API bundle so relative import('./pdf.worker.mjs') succeeds
      const serverBundleDir = path.join(process.cwd(), '.next', 'server', 'app', 'api', 'parse-document');
      try {
        if (fs.existsSync(serverBundleDir)) {
          const destFile = path.join(serverBundleDir, 'pdf.worker.mjs');
          if (!fs.existsSync(destFile)) {
            fs.copyFileSync(sourceWorkerPath, destFile);
          }
        }
      } catch (_) {}

      // Also copy to root working dir as an extra safety measure
      try {
        const rootDest = path.join(process.cwd(), 'pdf.worker.mjs');
        if (!fs.existsSync(rootDest)) {
          fs.copyFileSync(sourceWorkerPath, rootDest);
        }
      } catch (_) {}

      // 2. Pre-load worker into globalThis.pdfjsWorker so fake worker loader skips dynamic file resolution
      const workerUrl = pathToFileURL(sourceWorkerPath).href;
      try {
        const workerModule = await import(workerUrl);
        (globalThis as any).pdfjsWorker = workerModule;
      } catch (e) {
        console.warn('Could not pre-import pdfjsWorker module:', e);
      }

      // 3. Set worker source on PDFParse class
      try {
        const { PDFParse } = require('pdf-parse');
        if (typeof PDFParse.setWorker === 'function') {
          PDFParse.setWorker(workerUrl);
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Warning during PDF worker initialization:', err);
  }
}

// Fallback text extractor in case PDF.js encounters any stream/worker anomaly
function fallbackStreamTextExtractor(buffer: Buffer): string {
  try {
    const raw = buffer.toString('latin1');
    const matches: string[] = [];

    // Match (string) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let m;
    while ((m = tjRegex.exec(raw)) !== null) {
      if (m[1] && m[1].trim()) matches.push(m[1].trim());
    }

    // Match TJ array patterns: [(str) 10 (str)] TJ
    const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((m = arrayRegex.exec(raw)) !== null) {
      const inner = m[1];
      const strMatches = inner.match(/\(([^)]+)\)/g);
      if (strMatches) {
        const line = strMatches.map((s) => s.replace(/[()]/g, '')).join('');
        if (line.trim()) matches.push(line.trim());
      }
    }

    return matches.join('\n');
  } catch {
    return '';
  }
}

// High-precision parser for patient records from PDF text lines
function parsePatientRecordFromLine(line: string): any | null {
  const clean = line.trim();
  if (!clean || clean.length < 8) return null;

  const lower = clean.toLowerCase();
  // Filter out headers, titles, notes, and footers
  if (
    lower.startsWith('demo') ||
    lower.startsWith('fictional') ||
    lower.startsWith('note:') ||
    lower.includes('do not use these records') ||
    (lower.includes('patient id') && lower.includes('patient name')) ||
    (lower.includes('contact number') && lower.includes('email address'))
  ) {
    return null;
  }

  // 1. Extract Email
  let email = '';
  const emailMatch = clean.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) {
    email = emailMatch[1].toLowerCase();
  }

  // 2. Extract Phone Number (10 to 14 digits, optional +88)
  let phone = '';
  const phoneMatch = clean.match(/(?:\+?88)?\b(01\d{9})\b|\b(\d{10,13})\b/);
  if (phoneMatch) {
    phone = phoneMatch[1] || phoneMatch[2] || phoneMatch[0];
  }

  // 3. Extract Assigned Doctor (starts with Dr. or Doctor)
  let doctor = '';
  const doctorMatch =
    clean.match(/\b((?:Dr\.?|Doctor)\s+[A-Za-z\s.'-]+)$/i) ||
    clean.match(/\b((?:Dr\.?|Doctor)\s+[A-Za-z\s.'-]+?)(?=[|,\t;]|\s{2,}|$)/i);
  if (doctorMatch) {
    doctor = doctorMatch[1].trim();
  }

  // 4. Extract Blood Group
  let bloodGroup = '';
  const bloodMatch = clean.match(/(?:\s|^)(A|B|AB|O)[+-](?:\s|$|[|,\t;])/i);
  if (bloodMatch) {
    bloodGroup = bloodMatch[0].replace(/[|,\t;\s]/g, '').toUpperCase();
  }

  // 5. Extract Age and Gender
  let age = 30;
  let gender: 'Male' | 'Female' | 'Other' = 'Male';
  const ageGenderMatch =
    clean.match(/\b(\d{1,3})\s+(Male|Female|Other|M|F)\b/i) ||
    clean.match(/\b(Male|Female|Other|M|F)\s+(\d{1,3})\b/i);

  if (ageGenderMatch) {
    if (/^\d+$/.test(ageGenderMatch[1])) {
      age = parseInt(ageGenderMatch[1], 10);
      const g = ageGenderMatch[2].toLowerCase();
      gender = g.startsWith('f') ? 'Female' : g.startsWith('m') ? 'Male' : 'Other';
    } else {
      age = parseInt(ageGenderMatch[2], 10);
      const g = ageGenderMatch[1].toLowerCase();
      gender = g.startsWith('f') ? 'Female' : g.startsWith('m') ? 'Male' : 'Other';
    }
  } else {
    const ageOnly = clean.match(/\b(\d{1,3})\s*(?:yrs|years|yr|y\.?o\.?)?\b/);
    if (ageOnly && parseInt(ageOnly[1], 10) > 0 && parseInt(ageOnly[1], 10) <= 125) {
      age = parseInt(ageOnly[1], 10);
    }
    const genderOnly = clean.match(/\b(Male|Female|Other)\b/i);
    if (genderOnly) {
      gender = genderOnly[1].toLowerCase().startsWith('f') ? 'Female' : 'Male';
    }
  }

  // 6. Extract Condition (if present, otherwise default to Stable)
  let condition = 'Stable';
  const condMatch = clean.match(/\b(Critical|Serious|Stable|Recovering|Routine Checkup|Routine)\b/i);
  if (condMatch) {
    const c = condMatch[1].toLowerCase();
    if (c.includes('crit')) condition = 'Critical';
    else if (c.includes('ser')) condition = 'Serious';
    else if (c.includes('rec')) condition = 'Recovering';
    else if (c.includes('rout')) condition = 'Routine Checkup';
    else condition = 'Stable';
  }

  // 7. Extract Patient Name and optional ID (e.g. PT-1001)
  let name = '';
  let patientId = '';
  const idMatch = clean.match(/^(PT-?\d+|PAT-?\d+|PID-?\d+|P-?\d+|\d{1,5})\b/i);
  if (idMatch) {
    patientId = idMatch[1];
  }

  // Check if line was pipe or tab separated
  const parts = clean.split(/[|\t]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 4) {
    let nameCand = parts[0];
    if (idMatch && parts[0] === idMatch[0] && parts[1]) {
      nameCand = parts[1];
    }
    if (!nameCand.includes('@') && !/^\d+$/.test(nameCand)) {
      name = nameCand;
    }
  }

  if (!name) {
    let prefix = clean;
    if (idMatch) {
      prefix = prefix.slice(idMatch[0].length).trim();
    }
    if (ageGenderMatch) {
      const ageIdx = prefix.indexOf(ageGenderMatch[0]);
      if (ageIdx > 0) {
        name = prefix.slice(0, ageIdx).trim();
      }
    }
  }

  // Fallback name if prefix slicing didn't isolate it
  if (!name) {
    const tokens = clean.split(/[|\t;]|\s{2,}/).map((t) => t.trim()).filter(Boolean);
    name = tokens[0] === patientId ? tokens[1] : tokens[0];
  }

  name = name.replace(/^[-–—:,|.\s]+/, '').replace(/[-–—:,|.\s]+$/, '').trim();

  // 8. Extract Address
  let address = '';
  if (email && doctor) {
    const emailEnd = clean.indexOf(email) + email.length;
    const docStart = clean.indexOf(doctor);
    if (docStart > emailEnd) {
      address = clean.slice(emailEnd, docStart).trim();
    }
  } else if (email) {
    const emailEnd = clean.indexOf(email) + email.length;
    address = clean.slice(emailEnd).trim();
  } else if (phone && doctor) {
    const phoneEnd = clean.indexOf(phone) + phone.length;
    const docStart = clean.indexOf(doctor);
    if (docStart > phoneEnd) {
      address = clean.slice(phoneEnd, docStart).trim();
    }
  }

  if (address && bloodGroup) {
    address = address.replace(new RegExp(`\\b${bloodGroup}\\b`, 'g'), '').trim();
  }
  address = address.replace(/^[|,\t;\s]+/, '').replace(/[|,\t;\s]+$/, '').trim();

  if (!name || (!phone && !email)) {
    return null;
  }

  return {
    patientId,
    name,
    age,
    gender,
    condition,
    bloodGroup,
    phone,
    email,
    address,
    doctor,
    notes: bloodGroup ? `Blood Group: ${bloodGroup}` : '',
  };
}

// High-precision parser for doctor records from PDF text lines
function parseDoctorRecordFromLine(line: string): any | null {
  const clean = line.trim();
  if (!clean || clean.length < 8) return null;

  const lower = clean.toLowerCase();
  if (
    lower.startsWith('demo') ||
    lower.startsWith('fictional') ||
    lower.startsWith('note:') ||
    (lower.includes('doctor name') && lower.includes('specialization'))
  ) {
    return null;
  }

  // 1. Extract Email
  let email = '';
  const emailMatch = clean.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) {
    email = emailMatch[1].toLowerCase();
  }

  // 2. Extract Phone Number
  let phone = '';
  const phoneMatch = clean.match(/(?:\+?88)?\b(01\d{9})\b|\b(\d{10,13})\b/);
  if (phoneMatch) {
    phone = phoneMatch[1] || phoneMatch[2] || phoneMatch[0];
  }

  // 3. Extract Doctor Name
  let name = '';
  const nameMatch = clean.match(/\b((?:Dr\.?|Doctor)\s+[A-Z][a-z.'-]+(?:\s+[A-Z][a-z.'-]+){1,3})\b/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
  } else {
    const parts = clean.split(/[|\t;]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
    name = parts[0] || '';
  }
  if (name && !name.startsWith('Dr.') && !name.startsWith('Doctor')) {
    name = `Dr. ${name}`;
  }

  // 4. Structured pipes or text extraction
  const parts = clean.split(/[|\t]/).map((p) => p.trim()).filter(Boolean);
  let specialization = '';
  let hospital = '';
  let address = '';

  if (parts.length >= 4) {
    specialization = parts[1] || '';
    hospital = parts[2] || '';
    address = parts[5] || parts[4] || '';
    if (address.includes('@') || /^\d+$/.test(address)) address = '';
  } else {
    let remainder = clean;
    if (name) remainder = remainder.replace(name, ' ');
    if (email) remainder = remainder.replace(email, ' ');
    if (phone) remainder = remainder.replace(phone, ' ');
    remainder = remainder.replace(/^[0-9.\s|,\t;]+/, '').trim();

    const segments = remainder.split(/[|,\t;]|\s{2,}/).map((s) => s.trim()).filter(Boolean);
    specialization = segments[0] || 'General Medicine';
    hospital = segments[1] || 'Affiliated Hospital';
    address = segments.slice(2).join(', ').trim();
  }

  if (!name || (!phone && !email)) return null;

  return {
    name,
    specialization,
    hospital,
    phone,
    email,
    address,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'doctors'; // 'doctors' | 'patients'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let rawObjects: any[] = [];

    // 1. Handle Excel (.xlsx, .xls) and CSV (.csv, .tsv)
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv') || fileName.endsWith('.tsv')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawObjects = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }
    // 2. Handle PDF (.pdf)
    else if (fileName.endsWith('.pdf')) {
      let extractedText = '';

      // Initialize worker environment
      await initPdfWorker();

      try {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        await parser.load();
        const textData = await parser.getText();
        extractedText = textData?.text || String(textData || '');

        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      } catch (pdfErr: any) {
        console.warn('PDFParse failed, attempting secondary stream extraction:', pdfErr.message);
        extractedText = fallbackStreamTextExtractor(buffer);
        if (!extractedText.trim()) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Could not extract text from PDF: ' +
                (pdfErr.message || 'Worker setup error') +
                '. Please ensure the PDF has readable text or export as Excel (.xlsx) / CSV.',
            },
            { status: 400 }
          );
        }
      }

      if (!extractedText || !extractedText.trim()) {
        extractedText = fallbackStreamTextExtractor(buffer);
      }

      // Normalize newlines
      let formattedText = extractedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      if (type === 'patients') {
        // Ensure patient IDs start on a fresh row if merged
        formattedText = formattedText.replace(/([^\n])\s+(PT-?\d+\b)/gi, '$1\n$2');
      } else {
        formattedText = formattedText.replace(/([^\n])\s+(Dr\.?\s+[A-Z])/gi, '$1\n$2');
      }

      let lines = formattedText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0 && !/^--\s*\d+\s*of\s*\d+\s*--$/i.test(l));

      // Handle fragmented cell-per-line PDF output
      if (type === 'patients' && lines.some((l) => /^PT-?\d+$/i.test(l.trim()))) {
        const mergedRows: string[] = [];
        let currentRow = '';
        for (const line of lines) {
          if (/^PT-?\d+/i.test(line.trim())) {
            if (currentRow.trim()) mergedRows.push(currentRow.trim());
            currentRow = line.trim();
          } else if (currentRow) {
            currentRow += ' ' + line.trim();
          }
        }
        if (currentRow.trim()) mergedRows.push(currentRow.trim());
        lines = mergedRows;
      }

      // Process each line with precision parser
      for (const line of lines) {
        if (type === 'patients') {
          const parsed = parsePatientRecordFromLine(line);
          if (parsed) {
            rawObjects.push(parsed);
          }
        } else {
          const parsed = parseDoctorRecordFromLine(line);
          if (parsed) {
            rawObjects.push(parsed);
          }
        }
      }

      // Fallback: If regex parser matched nothing, try delimiter split
      if (rawObjects.length === 0) {
        for (const line of lines) {
          const parts = line.split(/[|\t;]|\s{2,}/).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            if (type === 'doctors') {
              const email = parts.find((p: string) => p.includes('@')) || '';
              const phone = parts.find((p: string) => /^\+?(\d{10,13})$/.test(p.replace(/[\s-]/g, ''))) || '';
              const remaining = parts.filter((p: string) => p !== email && p !== phone);
              rawObjects.push({
                name: remaining[0] || parts[0] || '',
                specialization: remaining[1] || parts[1] || 'General Medicine',
                hospital: remaining[2] || parts[2] || 'Affiliated Hospital',
                phone: phone,
                email: email,
                address: remaining[3] || '',
              });
            } else {
              const email = parts.find((p: string) => p.includes('@')) || '';
              const phone = parts.find((p: string) => /^\+?(\d{10,13})$/.test(p.replace(/[\s-]/g, ''))) || '';
              const agePart = parts.find((p: string) => /^\d{1,3}$/.test(p));
              const remaining = parts.filter((p: string) => p !== email && p !== phone && p !== agePart);
              rawObjects.push({
                name: remaining[0] || parts[0] || '',
                age: agePart ? parseInt(agePart, 10) : 30,
                gender: parts.find((p: string) => /^(male|female|other|m|f)$/i.test(p)) || 'Male',
                condition: parts.find((p: string) => /^(critical|serious|stable|recovering|routine)/i.test(p)) || 'Stable',
                phone: phone,
                email: email,
                doctor: remaining[1] || '',
                address: remaining[2] || '',
              });
            }
          }
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload .xlsx, .xls, .csv, or .pdf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      totalRows: rawObjects.length,
      rawRows: rawObjects,
    });
  } catch (error: any) {
    console.error('Parse document error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error while parsing file' }, { status: 500 });
  }
}
