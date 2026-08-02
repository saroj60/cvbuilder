import { prisma, isDbConnected } from '../config/prisma';

export class EmployerService {
  static async createEmployer(data: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    country: string;
    address?: string;
    contactPerson: string;
    website?: string;
    isVerified?: boolean;
  }) {
    if (isDbConnected) {
      try {
        const existing = await prisma.employer.findUnique({
          where: { companyEmail: data.companyEmail },
        });

        if (existing) {
          throw new Error('An employer with this company email already exists.');
        }

        return await prisma.employer.create({
          data,
        });
      } catch (e: any) {
        if (e.message.includes('already exists')) throw e;
      }
    }

    return {
      id: `emp-${Date.now()}`,
      ...data,
      isVerified: true,
      createdAt: new Date(),
    };
  }

  static async getEmployers(search?: string, country?: string) {
    if (isDbConnected) {
      try {
        const where: any = {};

        if (country) {
          where.country = country;
        }

        if (search) {
          where.OR = [
            { companyName: { contains: search, mode: 'insensitive' } },
            { contactPerson: { contains: search, mode: 'insensitive' } },
            { companyEmail: { contains: search, mode: 'insensitive' } },
          ];
        }

        return await prisma.employer.findMany({
          where,
          include: {
            _count: {
              select: { demands: true },
            },
            demands: {
              take: 3,
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {}
    }

    return [];
  }

  static async getEmployerById(id: string) {
    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        demands: {
          include: {
            candidates: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                currentStatus: true,
                createdAt: true,
              },
            },
            interviews: true,
          },
        },
      },
    });

    if (!employer) throw new Error('Employer not found');
    return employer;
  }

  static async updateEmployer(id: string, data: Partial<{
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    country: string;
    address?: string;
    contactPerson: string;
    website?: string;
    isVerified?: boolean;
  }>) {
    const existing = await prisma.employer.findUnique({ where: { id } });
    if (!existing) throw new Error('Employer not found');

    return prisma.employer.update({
      where: { id },
      data,
    });
  }

  static async deleteEmployer(id: string) {
    const existing = await prisma.employer.findUnique({ where: { id } });
    if (!existing) throw new Error('Employer not found');

    return prisma.employer.delete({ where: { id } });
  }
}
