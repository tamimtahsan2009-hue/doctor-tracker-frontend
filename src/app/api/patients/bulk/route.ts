import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Patient } from '@/models/Patient';
import { Doctor } from '@/models/Doctor';
import { Activity } from '@/models/Activity';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { patients } = body;

    if (!Array.isArray(patients) || patients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide an array of patient records to import.' },
        { status: 400 }
      );
    }

    // Fetch existing doctors to map name/ID
    let allDoctors = await Doctor.find().select('_id name email').lean();
    if (allDoctors.length === 0) {
      // Auto-create initial default physician if registry is empty
      const defaultDoc = await Doctor.create({
        name: 'Dr. Tariqul Islam',
        specialization: 'General Medicine',
        hospital: 'Central Hospital',
        phone: '01711223344',
      });
      allDoctors = [defaultDoc as any];
    }

    const defaultDoctorId = allDoctors[0]._id;
    const validConditions = ['Critical', 'Serious', 'Stable', 'Recovering', 'Routine Checkup'];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const validPatientsToInsert: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      const rowNum = i + 1;

      const name = String(p.name || '').trim();
      if (!name) {
        errors.push(`Row ${rowNum}: Patient name is required.`);
        continue;
      }

      const age = parseInt(p.age, 10);
      if (isNaN(age) || age < 0 || age > 130) {
        errors.push(`Row ${rowNum} (${name}): Valid age between 0-130 required.`);
        continue;
      }

      let gender: 'Male' | 'Female' | 'Other' = 'Other';
      const g = String(p.gender || '').toLowerCase();
      if (g.startsWith('m')) gender = 'Male';
      else if (g.startsWith('f')) gender = 'Female';

      let condition: any = 'Stable';
      const rawCondition = String(p.condition || '').trim();
      const matchedCond = validConditions.find((vc) => vc.toLowerCase() === rawCondition.toLowerCase());
      if (matchedCond) condition = matchedCond;

      let cleanPhone = String(p.phone || '').trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
      else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

      if (!cleanPhone) {
        errors.push(`Row ${rowNum} (${name}): Contact phone number is required.`);
        continue;
      }

      const email = p.email ? String(p.email).trim().toLowerCase() : undefined;
      if (email && !emailRegex.test(email)) {
        errors.push(`Row ${rowNum} (${name}): Invalid email format '${email}'.`);
        continue;
      }

      // Match doctor or auto-register assigned specialist if not in database
      let assignedDoctorId = defaultDoctorId;
      if (p.doctorId) {
        const found = allDoctors.find((d) => d._id.toString() === String(p.doctorId));
        if (found) assignedDoctorId = found._id;
      } else if (p.doctorName || p.doctor) {
        const target = String(p.doctorName || p.doctor).trim();
        const targetLower = target.toLowerCase();
        let found = allDoctors.find(
          (d) =>
            d.name.toLowerCase().includes(targetLower) ||
            targetLower.includes(d.name.toLowerCase()) ||
            (d.email && d.email.toLowerCase() === targetLower)
        );

        if (!found && target.length >= 3) {
          try {
            const cleanDocName = target.startsWith('Dr.') || target.startsWith('Doctor') ? target : `Dr. ${target}`;
            const newDoc = await Doctor.create({
              name: cleanDocName,
              specialization: 'General Medicine',
              hospital: 'Affiliated Medical Center',
              phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
            });
            allDoctors.push(newDoc as any);
            assignedDoctorId = newDoc._id;
          } catch (docErr) {
            console.warn('Could not auto-register doctor:', docErr);
          }
        } else if (found) {
          assignedDoctorId = found._id;
        }
      }

      const patItem: any = {
        name,
        age,
        gender,
        condition,
        phone: cleanPhone,
        doctorId: assignedDoctorId,
        admissionDate: p.admissionDate ? new Date(p.admissionDate) : new Date(),
        notes: p.notes ? String(p.notes).trim() : '',
        createdAt: new Date(),
      };
      if (p.avatar && String(p.avatar).trim()) patItem.avatar = String(p.avatar).trim();
      if (email) patItem.email = email;
      if (p.address && String(p.address).trim()) patItem.address = String(p.address).trim();
      validPatientsToInsert.push(patItem);
    }

    if (validPatientsToInsert.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid patient records found to import.', details: errors },
        { status: 400 }
      );
    }

    const inserted = await Patient.insertMany(validPatientsToInsert, { ordered: false });

    // Log Activity
    await Activity.create({
      type: 'patient_added',
      title: 'Bulk Patients Admitted',
      description: `Successfully admitted ${inserted.length} patients via batch import`,
      iconType: 'patient',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      insertedCount: inserted.length,
      skippedCount: errors.length,
      errors: errors.slice(0, 50),
      message: `Successfully admitted ${inserted.length} patients. ${errors.length > 0 ? `${errors.length} rows skipped.` : ''}`,
    });
  } catch (error: any) {
    console.error('Bulk patient import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error during bulk patient import' },
      { status: 500 }
    );
  }
}
