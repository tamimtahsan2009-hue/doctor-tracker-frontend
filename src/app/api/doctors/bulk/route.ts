import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Activity } from '@/models/Activity';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { doctors } = body;

    if (!Array.isArray(doctors) || doctors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide an array of doctor records to import.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validDoctorsToInsert: any[] = [];
    const errors: string[] = [];
    const seenEmails = new Set<string>();

    // 1. Fetch all existing emails in one single query for uniqueness check
    const incomingEmails = doctors
      .map((d: any) => String(d.email || '').trim().toLowerCase())
      .filter(Boolean);

    const existingDocs = incomingEmails.length > 0 
      ? await Doctor.find({ email: { $in: incomingEmails } }).select('email').lean()
      : [];
    const existingEmailSet = new Set(existingDocs.map((d) => d.email ? d.email.toLowerCase() : '').filter(Boolean));

    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      const rowNum = i + 1;

      let cleanName = String(doc.name || '').trim();
      if (!cleanName) {
        errors.push(`Row ${rowNum}: Doctor name is required.`);
        continue;
      }
      if (!cleanName.startsWith('Dr.')) {
        cleanName = `Dr. ${cleanName}`;
      }

      const specialization = String(doc.specialization || '').trim();
      if (!specialization) {
        errors.push(`Row ${rowNum} (${cleanName}): Specialization is required.`);
        continue;
      }

      const hospital = String(doc.hospital || '').trim();
      if (!hospital) {
        errors.push(`Row ${rowNum} (${cleanName}): Hospital affiliation is required.`);
        continue;
      }

      let cleanPhone = String(doc.phone || '').trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
      else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

      if (!/^01\d{9}$/.test(cleanPhone)) {
        errors.push(`Row ${rowNum} (${cleanName}): Invalid phone '${cleanPhone}'. Must be 11 digits (01...).`);
        continue;
      }

      let cleanEmail: string | undefined = undefined;
      const rawEmail = String(doc.email || '').trim().toLowerCase();
      if (rawEmail) {
        if (!emailRegex.test(rawEmail)) {
          errors.push(`Row ${rowNum} (${cleanName}): Invalid email format '${rawEmail}'.`);
          continue;
        }

        if (existingEmailSet.has(rawEmail)) {
          errors.push(`Row ${rowNum} (${cleanName}): Email '${rawEmail}' already exists in database.`);
          continue;
        }

        if (seenEmails.has(rawEmail)) {
          errors.push(`Row ${rowNum} (${cleanName}): Duplicate email '${rawEmail}' within uploaded file.`);
          continue;
        }

        seenEmails.add(rawEmail);
        cleanEmail = rawEmail;
      }

      const docItem: any = {
        name: cleanName,
        specialization,
        hospital,
        phone: cleanPhone,
        createdAt: new Date(),
      };
      if (cleanEmail) docItem.email = cleanEmail;
      if (doc.address && String(doc.address).trim()) docItem.address = String(doc.address).trim();
      if (doc.avatar && String(doc.avatar).trim()) docItem.avatar = String(doc.avatar).trim();

      validDoctorsToInsert.push(docItem);
    }

    if (validDoctorsToInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid doctor records found to import.',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Insert all valid records into MongoDB in bulk
    const inserted = await Doctor.insertMany(validDoctorsToInsert, { ordered: false });

    // Log single batch activity
    await Activity.create({
      type: 'doctor_added',
      title: 'Bulk Doctors Imported',
      description: `Successfully imported ${inserted.length} medical specialists into the provider registry`,
      iconType: 'doctor',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      insertedCount: inserted.length,
      skippedCount: errors.length,
      errors: errors.slice(0, 50),
      message: `Successfully imported ${inserted.length} doctors. ${errors.length > 0 ? `${errors.length} rows skipped.` : ''}`,
    });
  } catch (error: any) {
    console.error('Bulk doctor import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error during bulk doctor import' },
      { status: 500 }
    );
  }
}
