import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { Activity } from '@/models/Activity';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Doctor ID' }, { status: 400 });
    }

    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const patients = await Patient.find({ doctorId: id })
      .sort({ admissionDate: -1 })
      .lean();

    const formattedPatients = patients.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      avatar: p.avatar || '',
      age: p.age,
      gender: p.gender,
      condition: p.condition,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      admissionDate: p.admissionDate,
      notes: p.notes || '',
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor._id.toString(),
        name: doctor.name,
        avatar: doctor.avatar || '',
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        phone: doctor.phone,
        email: doctor.email || '',
        address: doctor.address || '',
        createdAt: doctor.createdAt,
        patientCount: formattedPatients.length,
      },
      patients: formattedPatients,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Doctor ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.specialization) updateData.specialization = body.specialization.trim();
    if (body.hospital) updateData.hospital = body.hospital.trim();

    if (body.phone) {
      let cleanPhone = body.phone.trim().replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
      else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

      if (!/^01\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 11-digit phone number (e.g. 01712345678).' },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone;
    }

    if (body.email !== undefined) {
      const emailTrim = body.email ? body.email.trim() : '';
      if (emailTrim) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailTrim)) {
          return NextResponse.json(
            { success: false, error: 'Please enter a valid official email address.' },
            { status: 400 }
          );
        }
        updateData.email = emailTrim.toLowerCase();
      } else {
        updateData.email = undefined;
      }
    }

    if (body.address !== undefined) {
      updateData.address = body.address ? String(body.address).trim() : '';
    }

    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar ? String(body.avatar) : '';
    }

    const updated = await Doctor.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated._id.toString(),
        name: updated.name,
        avatar: (updated as any).avatar || '',
        specialization: updated.specialization,
        hospital: updated.hospital,
        phone: updated.phone,
        email: updated.email || '',
        address: updated.address || '',
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Doctor ID' }, { status: 400 });
    }

    const doc = await Doctor.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    // Delete or unassign associated patients
    await Patient.deleteMany({ doctorId: id });

    // Log Activity
    await Activity.create({
      type: 'doctor_updated',
      title: 'Doctor Removed',
      description: `${doc.name} and associated patient links were removed`,
      iconType: 'doctor',
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
