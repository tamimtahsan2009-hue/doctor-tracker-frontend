import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Patient } from '@/models/Patient';
import { Doctor } from '@/models/Doctor';
import { Activity } from '@/models/Activity';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Patient ID' }, { status: 400 });
    }

    const updateData: any = {
      name: body.name?.trim(),
      age: body.age !== undefined ? Number(body.age) : undefined,
      gender: body.gender,
      condition: body.condition,
      phone: body.phone?.trim(),
      email: body.email?.trim(),
      address: body.address !== undefined ? (body.address ? String(body.address).trim() : '') : undefined,
      avatar: body.avatar !== undefined ? (body.avatar ? String(body.avatar) : '') : undefined,
      notes: body.notes?.trim(),
    };

    if (body.admissionDate) {
      updateData.admissionDate = new Date(body.admissionDate);
    }

    if (body.doctorId) {
      updateData.doctorId = body.doctorId;
    }

    const updated = await Patient.findByIdAndUpdate(id, updateData, { new: true })
      .populate('doctorId', 'name specialization hospital')
      .lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated._id.toString(),
        name: updated.name,
        avatar: (updated as any).avatar || '',
        age: updated.age,
        gender: updated.gender,
        condition: updated.condition,
        phone: updated.phone,
        email: updated.email || '',
        address: updated.address || '',
        doctorId: (updated.doctorId as any)?._id?.toString() || (updated.doctorId as any)?.toString(),
        doctorName: (updated.doctorId as any)?.name || 'Doctor',
        hospital: (updated.doctorId as any)?.hospital || 'Hospital',
        admissionDate: updated.admissionDate,
        notes: updated.notes || '',
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
      return NextResponse.json({ success: false, error: 'Invalid Patient ID' }, { status: 400 });
    }

    const pat = await Patient.findByIdAndDelete(id);
    if (!pat) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    // Log Activity
    await Activity.create({
      type: 'patient_deleted',
      title: 'Patient Record Deleted',
      description: `${pat.name} removed from the registry`,
      iconType: 'patient',
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Patient record removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
