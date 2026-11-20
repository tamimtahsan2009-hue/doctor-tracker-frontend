import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';

// Harmonious clinical palette for diverse medical specializations
const CLINICAL_PALETTE = [
  '#176B60', // Primary Clinical Green
  '#2A9D8F', // Soft Teal
  '#102B2A', // Deep Forest
  '#4D7C74', // Slate Green
  '#E76F51', // Terracotta
  '#F4A261', // Sand Warm
  '#3D5A80', // Steel Blue
  '#98C1D9', // Soft Ice Blue
  '#6D597A', // Vintage Violet
  '#355070', // Classic Navy
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const specAgg = await Doctor.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$specialization', 'General Practice'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);

    const totalDoctors = await Doctor.countDocuments();

    const specializations = specAgg.map((item, index) => {
      const percentage = totalDoctors > 0 ? parseFloat(((item.count / totalDoctors) * 100).toFixed(1)) : 0;
      return {
        specialization: item._id,
        count: item.count,
        percentage,
        color: CLINICAL_PALETTE[index % CLINICAL_PALETTE.length],
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalDoctors,
        totalSpecializations: specializations.length,
        specializations,
      },
    });
  } catch (error: any) {
    console.error('Analytics specializations error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

