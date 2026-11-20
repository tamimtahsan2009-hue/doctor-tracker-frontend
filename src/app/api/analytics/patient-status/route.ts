import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Patient } from '@/models/Patient';
import { parseDateRange } from '@/lib/analyticsHelpers';

const STATUS_COLORS: Record<string, string> = {
  Stable: '#176B60',
  Recovering: '#2A9D8F',
  'Routine Checkup': '#718096',
  Serious: '#D97706',
  Critical: '#DC2626',
};

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const { range, startDate, endDate, dateMatch } = parseDateRange(searchParams);

    const matchStage = dateMatch && Object.keys(dateMatch).length > 0 ? [{ $match: dateMatch }] : [];

    const statusAgg = await Patient.aggregate([
      ...matchStage,
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalPatients = statusAgg.reduce((sum, item) => sum + item.count, 0);

    const categories = statusAgg.map((item) => {
      const percentage = totalPatients > 0 ? parseFloat(((item.count / totalPatients) * 100).toFixed(1)) : 0;
      return {
        name: item._id || 'Unspecified',
        count: item.count,
        percentage,
        color: STATUS_COLORS[item._id] || '#718096',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        range,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
        categories,
      },
    });
  } catch (error: any) {
    console.error('Analytics patient-status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

