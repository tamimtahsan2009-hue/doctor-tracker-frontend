import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Patient } from '@/models/Patient';
import { parseDateRange, formatDateLabel } from '@/lib/analyticsHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const { range, startDate, endDate, groupBy, dateMatch } = parseDateRange(searchParams);

    let dateFormat = '%Y-%m-%d';
    if (groupBy === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (groupBy === 'weekly') {
      dateFormat = '%Y-W%V';
    }

    const matchStage = dateMatch && Object.keys(dateMatch).length > 0 ? [{ $match: dateMatch }] : [];

    const rawTrends = await Patient.aggregate([
      ...matchStage,
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$admissionDate',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let cumulative = 0;
    const trends = rawTrends.map((t) => {
      cumulative += t.count;
      return {
        date: t._id,
        label: formatDateLabel(t._id, groupBy),
        count: t.count,
        cumulative,
      };
    });

    const totalInRange = trends.reduce((acc, curr) => acc + curr.count, 0);

    return NextResponse.json({
      success: true,
      data: {
        range,
        groupBy,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
        totalInRange,
        trends,
      },
    });
  } catch (error: any) {
    console.error('Analytics patient-trends error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

