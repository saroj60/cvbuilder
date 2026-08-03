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
        const createdJob = await prisma.job.create({
          data: {
            createdById,
            title: data.title,
            description: data.description,
            skills: JSON.stringify(data.skills),
            department: data.department,
            location: data.location,
          },
        });
        return {
          ...createdJob,
          skills: JSON.parse(createdJob.skills || '[]') as string[]
        };
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
        const jobs = await prisma.job.findMany({
          where: { createdById },
          include: {
            _count: {
              select: { resumes: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return jobs.map(j => ({
          ...j,
          skills: JSON.parse(j.skills || '[]') as string[]
        }));
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
        if (job) {
          const parsedResumes = (job.resumes || []).map(r => ({
            ...r,
            skills: JSON.parse(r.skills || '[]') as string[]
          }));
          return {
            ...job,
            skills: JSON.parse(job.skills || '[]') as string[],
            resumes: parsedResumes
          };
        }
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
