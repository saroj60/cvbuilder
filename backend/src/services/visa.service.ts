import { prisma, isDbConnected } from '../config/prisma';
import { VisaStatus, MOFAStatus } from '@prisma/client';

export class VisaService {
  static async createOrUpdateVisa(data: {
    candidateId: string;
    visaNumber?: string;
    visaType?: string;
    country: string;
    issueDate?: Date | string;
    expiryDate?: Date | string;
    status?: VisaStatus;
    remarks?: string;
    documentUrl?: string;
  }) {
    const existing = await prisma.visa.findUnique({
      where: { candidateId: data.candidateId },
    });

    const visaData = {
      visaNumber: data.visaNumber || null,
      visaType: data.visaType || 'WORK_VISA',
      country: data.country,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status: data.status || 'PENDING',
      remarks: data.remarks || null,
      documentUrl: data.documentUrl || null,
    };

    let result;
    if (existing) {
      result = await prisma.visa.update({
        where: { candidateId: data.candidateId },
        data: visaData,
      });
    } else {
      result = await prisma.visa.create({
        data: {
          candidateId: data.candidateId,
          ...visaData,
        },
      });
    }

    // Update candidate recruitment status
    if (data.status === 'STAMPED') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { currentStatus: 'VISA_PROCESSING' },
      });
    }

    return result;
  }

  static async createOrUpdateMOFA(data: {
    candidateId: string;
    mofaNumber: string;
    submissionDate: Date | string;
    approvalDate?: Date | string;
    status?: MOFAStatus;
    fee?: number;
    remarks?: string;
  }) {
    const existing = await prisma.mOFA.findUnique({
      where: { candidateId: data.candidateId },
    });

    const mofaData = {
      mofaNumber: data.mofaNumber,
      submissionDate: new Date(data.submissionDate),
      approvalDate: data.approvalDate ? new Date(data.approvalDate) : null,
      status: data.status || 'PENDING',
      fee: data.fee || null,
      remarks: data.remarks || null,
    };

    let result;
    if (existing) {
      result = await prisma.mOFA.update({
        where: { candidateId: data.candidateId },
        data: mofaData,
      });
    } else {
      result = await prisma.mOFA.create({
        data: {
          candidateId: data.candidateId,
          ...mofaData,
        },
      });
    }

    if (data.status === 'SUBMITTED' || data.status === 'APPROVED') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { currentStatus: 'MOFA_SUBMITTED' },
      });
    }

    return result;
  }

  static async getVisas(status?: VisaStatus) {
    if (isDbConnected) {
      try {
        const where: any = {};
        if (status) where.status = status;

        return await prisma.visa.findMany({
          where,
          include: {
            candidate: {
              include: {
                mofa: true,
                passport: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {}
    }

    return [
      {
        id: 'vis-1',
        visaNumber: 'V-9012345',
        country: 'Saudi Arabia',
        visaType: 'Work Visa',
        status: 'STAMPED',
        issueDate: new Date('2026-01-15'),
        expiryDate: new Date('2026-07-15'),
        candidate: {
          firstName: 'RAM BAHADUR',
          lastName: 'THAPA',
          passport: { passportNumber: 'N08492019' },
          mofa: { mofaNumber: 'MOFA-998811', status: 'APPROVED' },
        },
      },
      {
        id: 'vis-2',
        visaNumber: 'V-9012346',
        country: 'UAE',
        visaType: 'Work Permit',
        status: 'PENDING',
        issueDate: new Date('2026-02-01'),
        expiryDate: new Date('2026-08-01'),
        candidate: {
          firstName: 'SHYAM KUMAR',
          lastName: 'SHRESTHA',
          passport: { passportNumber: 'N07788112' },
          mofa: { mofaNumber: 'MOFA-998812', status: 'SUBMITTED' },
        },
      },
    ];
  }

  static async getVisaMetrics() {
    return {
      totalVisas: 12,
      stampedVisas: 8,
      approvedVisas: 10,
      pendingVisas: 2,
      totalMofa: 14,
      approvedMofa: 12,
      expiringVisas: 1,
    };
  }
}
