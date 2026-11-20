import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { parseDateRange } from '@/lib/analyticsHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const { range, startDate, endDate, dateMatch, prevDateMatch } = parseDateRange(searchParams);

    const [
      totalDoctors,
      totalPatients,
      criticalCases,
      seriousCases,
      newPatientsPeriod,
      previousNewPatientsPeriod,
      specializationsList,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Patient.countDocuments({ condition: 'Critical' }),
      Patient.countDocuments({ condition: 'Serious' }),
      dateMatch && Object.keys(dateMatch).length > 0
        ? Patient.countDocuments(dateMatch)
        : Patient.countDocuments(),
      prevDateMatch
        ? Patient.countDocuments(prevDateMatch)
        : Promise.resolve(null),
      Doctor.distinct('specialization'),
    ]);

    const avgPatientsPerDoctor =
      totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(1)) : 0;

    let growthRate: number | null = null;
    if (previousNewPatientsPeriod !== null) {
      if (previousNewPatientsPeriod > 0) {
        growthRate = parseFloat(
          (((newPatientsPeriod - previousNewPatientsPeriod) / previousNewPatientsPeriod) * 100).toFixed(1)
        );
      } else if (newPatientsPeriod > 0) {
        growthRate = 100;
      } else {
        growthRate = 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
        avgPatientsPerDoctor,
        newPatientsPeriod,
        previousNewPatientsPeriod,
        growthRate,
        criticalCases,
        seriousCases,
        totalSpecializations: specializationsList.length,
        dateRange: {
          range,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate.toISOString(),
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

