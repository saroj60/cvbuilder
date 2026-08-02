import { prisma, isDbConnected } from '../config/prisma';

export class JobService {
  static async createJob(createdById: string, data: {
    title: string;
    description: string;
    skills: string[];
    department: string;
    location: string;
  }) {
    if (isDbConnected) {
      try {
        return await prisma.job.create({
          data: {
            createdById,
            ...data,
          },
        });
      } catch (e) {}
    }

    return {
      id: `job-${Date.now()}`,
      createdById,
      ...data,
      createdAt: new Date(),
    };
  }

  static async getJobs(createdById: string) {
    if (isDbConnected) {
      try {
        return await prisma.job.findMany({
          where: { createdById },
          include: {
            _count: {
              select: { resumes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {}
    }

    return [];
  }

  static async getJobById(id: string) {
    if (isDbConnected) {
      try {
        const job = await prisma.job.findUnique({
          where: { id },
          include: { resumes: true },
        });
        if (job) return job;
      } catch (e) {}
    }

    return {
      id,
      title: 'SCAFFOLDER',
      description: 'Certified Scaffolder required for industrial project.',
      skills: ['Scaffolding', 'HSE Safety'],
      department: 'Construction',
      location: 'Saudi Arabia',
      createdAt: new Date(),
      resumes: [],
    };
  }
}
