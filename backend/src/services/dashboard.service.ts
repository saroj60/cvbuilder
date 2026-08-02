import { prisma, isDbConnected } from '../config/prisma';

export class DashboardService {
  static async getHRMetrics() {
    if (isDbConnected) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
          totalCandidates,
          todayCandidates,
          activeEmployers,
          openDemands,
          pendingInterviews,
          medicalPending,
          visaPending,
          todayDeployments,
          recentCandidates,
          latestAuditLogs,
        ] = await Promise.all([
          prisma.candidate.count(),
          prisma.candidate.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.employer.count({ where: { isVerified: true } }),
          prisma.employerDemand.count({ where: { status: 'ACTIVE' } }),
          prisma.interview.count({ where: { result: 'PENDING' } }),
          prisma.medical.count({ where: { status: 'PENDING' } }),
          prisma.visa.count({ where: { status: 'PENDING' } }),
          prisma.deployment.count({
            where: {
              departureDate: { gte: todayStart },
            },
          }),
          prisma.candidate.findMany({
            take: 6,
            orderBy: { createdAt: 'desc' },
            include: { demand: true, passport: true },
          }),
          prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, role: { select: { name: true } } } } },
          }),
        ]);

        return {
          stats: {
            totalCandidates,
            todayCandidates,
            activeEmployers,
            openDemands,
            pendingInterviews,
            medicalPending,
            visaPending,
            todayDeployments,
          },
          charts: {
            monthlyRegistration: [],
            countryWiseCandidates: [],
            topSkills: [],
          },
          recentCandidates,
          latestAuditLogs,
        };
      } catch (err: any) {
        console.warn('Database error in getHRMetrics, serving clean metrics fallback:', err.message);
      }
    }

    return {
      stats: {
        totalCandidates: 0,
        todayCandidates: 0,
        activeEmployers: 0,
        openDemands: 0,
        pendingInterviews: 0,
        medicalPending: 0,
        visaPending: 0,
        todayDeployments: 0,
      },
      charts: {
        monthlyRegistration: [],
        countryWiseCandidates: [],
        topSkills: [],
      },
      recentCandidates: [],
      latestAuditLogs: [],
    };
  }
}
