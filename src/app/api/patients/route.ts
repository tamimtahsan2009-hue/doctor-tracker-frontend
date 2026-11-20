import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Patient } from '@/models/Patient';
import { Doctor } from '@/models/Doctor';
import { Activity } from '@/models/Activity';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim() || '';
    const condition = searchParams.get('condition')?.trim() || 'all';
    const doctorId = searchParams.get('doctorId')?.trim() || 'all';
    const dateFilter = searchParams.get('date')?.trim() || 'all';
    const sortBy = searchParams.get('sortBy')?.trim() || 'admissionDate';
    const sortOrder = searchParams.get('sortOrder')?.trim() === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { address: searchRegex },
        { notes: searchRegex },
      ];
    }

    if (condition && condition !== 'all') {
      query.condition = condition;
    }

    if (doctorId && doctorId !== 'all') {
      query.doctorId = doctorId;
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let pastDays = 30;
      if (dateFilter === '90d') pastDays = 90;
      if (dateFilter === 'year') pastDays = 365;
      const cutoff = new Date(now.getTime() - pastDays * 24 * 60 * 60 * 1000);
      query.admissionDate = { $gte: cutoff };
    }

    const sortOptions: any = {};
    if (sortBy === 'name') sortOptions.name = sortOrder;
    else if (sortBy === 'age') sortOptions.age = sortOrder;
    else if (sortBy === 'condition') sortOptions.condition = sortOrder;
    else sortOptions.admissionDate = sortOrder;

    const patients = await Patient.find(query)
      .populate('doctorId', 'name specialization hospital')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = patients.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      avatar: p.avatar || '',
      age: p.age,
      gender: p.gender,
      condition: p.condition,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      doctorId: p.doctorId?._id?.toString() || p.doctorId?.toString(),
      doctorName: p.doctorId?.name || 'Unassigned',
      hospital: p.doctorId?.hospital || 'Hospital',
      admissionDate: p.admissionDate,
      notes: p.notes,
      createdAt: p.createdAt,
    }));

    const total = await Patient.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { name, age, gender, condition, phone, email, address, avatar, doctorId, admissionDate, notes } = body;

    if (!name || age === undefined || !gender || !condition || !phone || !doctorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required patient fields.' },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Selected doctor does not exist.' },
        { status: 404 }
      );
    }

    const patientDoc: any = {
      name: name.trim(),
      age: Number(age),
      gender,
      condition,
      phone: phone.trim(),
      doctorId,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
    };
    if (email && String(email).trim()) patientDoc.email = String(email).trim().toLowerCase();
    if (address && String(address).trim()) patientDoc.address = String(address).trim();
    if (avatar && String(avatar).trim()) patientDoc.avatar = String(avatar).trim();
    if (notes && String(notes).trim()) patientDoc.notes = String(notes).trim();

    const newPatient = await Patient.create(patientDoc);

    // Log Activity
    await Activity.create({
      type: 'patient_added',
      title: 'New Patient Admitted',
      description: `${newPatient.name} registered under ${doctor.name} (${newPatient.condition})`,
      iconType: 'patient',
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newPatient._id.toString(),
          name: newPatient.name,
          avatar: newPatient.avatar || '',
          age: newPatient.age,
          gender: newPatient.gender,
          condition: newPatient.condition,
          phone: newPatient.phone,
          email: newPatient.email || '',
          address: newPatient.address || '',
          doctorId: newPatient.doctorId.toString(),
          doctorName: doctor.name,
          hospital: doctor.hospital,
          admissionDate: newPatient.admissionDate,
          notes: newPatient.notes || '',
          createdAt: newPatient.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
