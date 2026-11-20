import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { Activity } from '@/models/Activity';

export async function GET() {
  try {
    await connectToDatabase();

    const [totalDoctors, totalPatients, criticalPatients, activities] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Patient.countDocuments({ condition: 'Critical' }),
      Activity.find().sort({ timestamp: -1 }).limit(10).lean(),
    ]);

    const avgPatientsPerDoctor =
      totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(1)) : 0;

    // Aggregation: Condition distribution
    const conditionStats = await Patient.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregation: Patients per doctor (top 8)
    const doctorStats = await Doctor.aggregate([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'patients',
        },
      },
      {
        $project: {
          name: { $concat: ['Dr. ', '$name'] },
          fullName: '$name',
          specialization: '$specialization',
          patients: { $size: '$patients' },
        },
      },
      { $sort: { patients: -1 } },
      { $limit: 8 },
    ]);

    // Format activities
    const formattedActivities = activities.map((a) => ({
      id: a._id.toString(),
      type: a.type,
      title: a.title,
      description: a.description,
      iconType: a.iconType,
      timestamp: a.timestamp,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalDoctors,
        totalPatients,
        avgPatientsPerDoctor,
        criticalPatients,
        newRecordsThisMonth: totalDoctors + totalPatients,
      },
      conditionDistribution: conditionStats.map((c) => ({
        name: c._id,
        value: c.count,
      })),
      patientsPerDoctor: doctorStats,
      activities: formattedActivities,
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

