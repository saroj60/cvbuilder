import { prisma, isDbConnected } from '../config/prisma';
import { MedicalStatus } from '../types/enums';

export class MedicalService {
  static async scheduleOrUpdateMedical(data: {
    candidateId: string;
    clinicName: string;
    reportNo: string;
    testDate: Date | string;
    expiryDate?: Date | string;
    status?: MedicalStatus;
    remarks?: string;
    documentUrl?: string;
  }) {
    const existing = await prisma.medical.findUnique({
      where: { candidateId: data.candidateId },
    });

    const medicalData = {
      clinicName: data.clinicName,
      reportNo: data.reportNo,
      testDate: new Date(data.testDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status: data.status || 'PENDING',
      remarks: data.remarks || null,
      documentUrl: data.documentUrl || null,
    };

    let medicalResult;
    if (existing) {
      medicalResult = await prisma.medical.update({
        where: { candidateId: data.candidateId },
        data: medicalData,
      });
    } else {
      medicalResult = await prisma.medical.create({
        data: {
          candidateId: data.candidateId,
          ...medicalData,
        },
      });
    }

    // Update candidate status based on medical outcome
    if (data.status === 'FIT') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { currentStatus: 'VISA_PROCESSING' },
      });
    } else if (data.status === 'UNFIT') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { currentStatus: 'REJECTED' },
      });
    }

    return medicalResult;
  }

  static async getMedicals(status?: MedicalStatus) {
    if (isDbConnected) {
      try {
        const where: any = {};
        if (status) where.status = status;

        return await prisma.medical.findMany({
          where,
          include: {
            candidate: {
              select: {
                id: true,
                candidateNumber: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                passport: true,
              },
            },
          },
          orderBy: { testDate: 'desc' },
        });
      } catch (e) {}
    }

    return [];
  }

  static async getMedicalById(id: string) {
    const record = await prisma.medical.findUnique({
      where: { id },
      include: {
        candidate: true,
      },
    });

    if (!record) throw new Error('Medical examination record not found');
    return record;
  }

  static async getMedicalMetrics() {
    if (isDbConnected) {
      try {
        const total = await prisma.medical.count();
        const fit = await prisma.medical.count({ where: { status: 'FIT' } });
        const unfit = await prisma.medical.count({ where: { status: 'UNFIT' } });
        const pending = await prisma.medical.count({ where: { status: 'PENDING' } });
        const reexamine = await prisma.medical.count({ where: { status: 'REEXAMINE' } });

        // Expiry reminder threshold (Expiring within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringSoon = await prisma.medical.count({
          where: {
            expiryDate: {
              lte: thirtyDaysFromNow,
              gte: new Date(),
            },
          },
        });

        return {
          total,
          fit,
          unfit,
          pending,
          reexamine,
          expiringSoon,
        };
      } catch (e) {}
    }

    return {
      total: 0,
      fit: 0,
      unfit: 0,
      pending: 0,
      reexamine: 0,
      expiringSoon: 0,
    };
  }
}
