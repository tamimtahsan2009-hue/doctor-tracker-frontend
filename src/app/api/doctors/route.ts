import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { Activity } from '@/models/Activity';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const specialization = searchParams.get('specialization');
    const hospital = searchParams.get('hospital');
    const dateFilter = searchParams.get('dateFilter');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { specialization: { $regex: q, $options: 'i' } },
        { hospital: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    if (specialization && specialization !== 'All Specializations') {
      query.specialization = specialization;
    }

    if (hospital && hospital !== 'All Hospitals') {
      query.hospital = hospital;
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let pastDays = 30;
      if (dateFilter === '90d') pastDays = 90;
      if (dateFilter === 'year') pastDays = 365;
      const cutoff = new Date(now.getTime() - pastDays * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    }

    const sortOptions: any = {};
    if (sortBy === 'name') sortOptions.name = sortOrder;
    else if (sortBy === 'patients') sortOptions.patientCount = sortOrder;
    else sortOptions.createdAt = sortOrder;

    // Aggregation to get doctors + live patient count
    const doctors = await Doctor.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'patients',
        },
      },
      {
        $addFields: {
          id: { $toString: '$_id' },
          patientCount: { $size: '$patients' },
        },
      },
      { $project: { patients: 0 } },
      { $sort: sortOptions },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const total = await Doctor.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: doctors,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database connection error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { name, specialization, hospital, phone, email, address, avatar } = body;

    if (!name || !specialization || !hospital || !phone) {
      return NextResponse.json(
        { success: false, error: 'Doctor name, specialization, hospital, and phone number are required.' },
        { status: 400 }
      );
    }

    // Server-side 11-digit phone validation
    let cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+88')) cleanPhone = cleanPhone.slice(3);
    else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = cleanPhone.slice(2);

    if (!/^01\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 11-digit phone number (e.g. 01712345678).' },
        { status: 400 }
      );
    }

    // Server-side email validation (Optional)
    let cleanEmail: string | undefined = undefined;
    if (email && String(email).trim()) {
      cleanEmail = String(email).toLowerCase().trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid official email address.' },
          { status: 400 }
        );
      }

      // Check unique email
      const existing = await Doctor.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'A doctor with this email is already registered.' },
          { status: 409 }
        );
      }
    }

    const docToCreate: any = {
      name: name.trim(),
      specialization: specialization.trim(),
      hospital: hospital.trim(),
      phone: cleanPhone,
    };
    if (cleanEmail) docToCreate.email = cleanEmail;
    if (address && String(address).trim()) docToCreate.address = String(address).trim();
    if (avatar && String(avatar).trim()) docToCreate.avatar = String(avatar).trim();

    const newDoctor = await Doctor.create(docToCreate);

    // Log Activity
    await Activity.create({
      type: 'doctor_added',
      title: 'Doctor Registered',
      description: `${newDoctor.name} (${newDoctor.specialization}) onboarded to ${newDoctor.hospital}`,
      iconType: 'doctor',
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newDoctor._id.toString(),
          name: newDoctor.name,
          avatar: newDoctor.avatar || '',
          specialization: newDoctor.specialization,
          hospital: newDoctor.hospital,
          phone: newDoctor.phone,
          email: newDoctor.email || '',
          address: newDoctor.address || '',
          createdAt: newDoctor.createdAt,
          patientCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

