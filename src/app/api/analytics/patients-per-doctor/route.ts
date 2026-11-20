import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const sortParam = searchParams.get('sort') || 'desc';

    const sortOrder = sortParam === 'asc' ? 1 : -1;
    const limit = limitParam === 'all' ? 500 : parseInt(limitParam || '10', 10);

    const doctorsAgg = await Doctor.aggregate([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'assignedPatients',
        },
      },
      {
        $project: {
          id: { $toString: '$_id' },
          fullName: '$name',
          displayName: {
            $concat: [
              { $cond: [{ $regexMatch: { input: '$name', regex: /^(Dr\.|Doctor)/i } }, '', 'Dr. '] },
              '$name',
            ],
          },
          specialization: '$specialization',
          hospital: '$hospital',
          avatar: '$avatar',
          patientCount: { $size: '$assignedPatients' },
        },
      },
      { $sort: { patientCount: sortOrder, fullName: 1 } },
      { $limit: limit },
    ]);

    const totalDoctors = await Doctor.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        totalDoctors,
        showingCount: doctorsAgg.length,
        isLimited: limitParam !== 'all' && totalDoctors > limit,
        doctors: doctorsAgg,
      },
    });
  } catch (error: any) {
    console.error('Analytics patients-per-doctor error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

