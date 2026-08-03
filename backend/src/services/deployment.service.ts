import { prisma } from '../config/prisma';
import { DeploymentStatus } from '../types/enums';

export class DeploymentService {
  static async createOrUpdateDeployment(data: {
    candidateId: string;
    flightNumber?: string;
    airline?: string;
    departureDate?: Date | string;
    arrivalDate?: Date | string;
    destinationCountry: string;
    ticketUrl?: string;
    status?: DeploymentStatus;
    remarks?: string;
  }) {
    const existing = await prisma.deployment.findUnique({
      where: { candidateId: data.candidateId },
    });

    const deploymentData = {
      flightNumber: data.flightNumber || null,
      airline: data.airline || null,
      departureDate: data.departureDate ? new Date(data.departureDate) : null,
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      destinationCountry: data.destinationCountry,
      ticketUrl: data.ticketUrl || null,
      status: data.status || 'PENDING',
      remarks: data.remarks || null,
    };

    let result;
    if (existing) {
      result = await prisma.deployment.update({
        where: { candidateId: data.candidateId },
        data: deploymentData,
      });
    } else {
      result = await prisma.deployment.create({
        data: {
          candidateId: data.candidateId,
          ...deploymentData,
        },
      });
    }

    // Update candidate final status when departed or arrived
    if (data.status === 'DEPARTED' || data.status === 'ARRIVED') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { currentStatus: 'DEPLOYED' },
      });
    }

    return result;
  }

  static async getDeployments(status?: DeploymentStatus) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.deployment.findMany({
      where,
      include: {
        candidate: {
          include: {
            passport: true,
            demand: {
              include: { employer: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDeploymentMetrics() {
    const totalDeployments = await prisma.deployment.count();
    const ticketsIssued = await prisma.deployment.count({ where: { status: 'TICKET_ISSUED' } });
    const departed = await prisma.deployment.count({ where: { status: 'DEPARTED' } });
    const arrived = await prisma.deployment.count({ where: { status: 'ARRIVED' } });
    const pending = await prisma.deployment.count({ where: { status: 'PENDING' } });

    return {
      totalDeployments,
      ticketsIssued,
      departed,
      arrived,
      pending,
    };
  }
}
