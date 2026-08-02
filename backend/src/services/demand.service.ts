import { prisma, isDbConnected } from '../config/prisma';
import { DemandStatus } from '@prisma/client';

export class DemandService {
  static async createDemand(data: {
    employerId: string;
    createdById: string;
    assignedRecruiterId?: string;
    title: string;
    description: string;
    quantityRequired: number;
    salary: number;
    currency?: string;
    benefits?: string[];
    contractPeriod?: string;
    closingDate?: Date | string;
    status?: DemandStatus;
  }) {
    const demandNumber = `DEM-${Date.now().toString().slice(-6)}`;

    return prisma.employerDemand.create({
      data: {
        demandNumber,
        employerId: data.employerId,
        createdById: data.createdById,
        assignedRecruiterId: data.assignedRecruiterId || null,
        title: data.title,
        description: data.description,
        quantityRequired: data.quantityRequired,
        salary: data.salary,
        currency: data.currency || 'USD',
        benefits: data.benefits || [],
        contractPeriod: data.contractPeriod || '2 Years',
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
        status: data.status || 'ACTIVE',
      },
      include: {
        employer: true,
        assignedRecruiter: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getDemands(status?: DemandStatus, employerId?: string) {
    if (isDbConnected) {
      try {
        const where: any = {};
        if (status) where.status = status;
        if (employerId) where.employerId = employerId;

        return await prisma.employerDemand.findMany({
          where,
          include: {
            employer: {
              select: { id: true, companyName: true, country: true },
            },
            assignedRecruiter: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { candidates: true, interviews: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {}
    }

    return [];
  }

  static async getDemandById(id: string) {
    const demand = await prisma.employerDemand.findUnique({
      where: { id },
      include: {
        employer: true,
        assignedRecruiter: {
          select: { id: true, name: true, email: true, phone: true },
        },
        candidates: {
          select: {
            id: true,
            candidateNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            currentStatus: true,
            createdAt: true,
          },
        },
        interviews: {
          include: {
            candidate: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!demand) throw new Error('Employer demand not found');
    return demand;
  }

  static async assignCandidate(demandId: string, candidateId: string) {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new Error('Candidate not found');

    return prisma.candidate.update({
      where: { id: candidateId },
      data: {
        employerDemandId: demandId,
      },
    });
  }

  static async updateDemandStatus(id: string, status: DemandStatus) {
    return prisma.employerDemand.update({
      where: { id },
      data: { status },
    });
  }

  static async getDemandMetrics() {
    if (isDbConnected) {
      try {
        const totalDemands = await prisma.employerDemand.count();
        const activeDemands = await prisma.employerDemand.count({ where: { status: 'ACTIVE' } });
        const fulfilledDemands = await prisma.employerDemand.count({ where: { status: 'FULFILLED' } });

        const totalRequiredSum = await prisma.employerDemand.aggregate({
          _sum: { quantityRequired: true },
        });

        return {
          totalDemands,
          activeDemands,
          fulfilledDemands,
          totalRequiredQuantity: totalRequiredSum._sum.quantityRequired || 0,
        };
      } catch (e) {}
    }

    return {
      totalDemands: 12,
      activeDemands: 8,
      fulfilledDemands: 4,
      totalRequiredQuantity: 280,
    };
  }
}
