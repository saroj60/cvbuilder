import { prisma, isDbConnected } from '../config/prisma';
import { AIService } from './ai.service';
import { ResumeStatus } from '@prisma/client';

export class ResumeService {
  static async createResume(userId: string, data: {
    candidateName: string;
    email: string;
    phone?: string;
    summary?: string;
    skills: string[];
    experienceYrs: number;
    education?: string;
    jobId?: string;
    fileUrl?: string;
  }) {
    let jobSkills: string[] = [];
    if (data.jobId) {
      const job = await prisma.job.findUnique({ where: { id: data.jobId } });
      if (job) jobSkills = job.skills;
    }

    const aiResult = await AIService.analyzeResume(data.summary || '', jobSkills);

    return prisma.resume.create({
      data: {
        userId,
        candidateName: data.candidateName,
        email: data.email,
        phone: data.phone,
        summary: data.summary,
        skills: aiResult.extractedSkills.length > 0 ? aiResult.extractedSkills : data.skills,
        experienceYrs: data.experienceYrs,
        education: data.education,
        fileUrl: data.fileUrl,
        jobId: data.jobId || null,
        matchScore: aiResult.matchScore,
        aiFeedback: aiResult.aiFeedback,
        status: aiResult.suggestedStatus,
      },
      include: {
        job: true,
      },
    });
  }

  static async getResumes(userId: string, status?: ResumeStatus, search?: string) {
    if (isDbConnected) {
      try {
        const where: any = { userId };

        if (status) {
          where.status = status;
        }

        if (search) {
          where.OR = [
            { candidateName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { skills: { hasSome: [search] } },
          ];
        }

        return await prisma.resume.findMany({
          where,
          include: { job: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {}
    }

    return [];
  }

  static async getResumeById(id: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id, userId },
      include: { job: true, user: { select: { name: true, email: true } } },
    });

    if (!resume) throw new Error('Resume not found');
    return resume;
  }

  static async updateResumeStatus(id: string, userId: string, status: ResumeStatus) {
    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new Error('Resume not found');

    return prisma.resume.update({
      where: { id },
      data: { status },
    });
  }

  static async deleteResume(id: string, userId: string) {
    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new Error('Resume not found');

    return prisma.resume.delete({ where: { id } });
  }

  static async getMetrics(userId: string) {
    const totalResumes = await prisma.resume.count({ where: { userId } });
    const shortlisted = await prisma.resume.count({ where: { userId, status: 'SHORTLISTED' } });
    const interviewed = await prisma.resume.count({ where: { userId, status: 'INTERVIEWED' } });
    const rejected = await prisma.resume.count({ where: { userId, status: 'REJECTED' } });

    const avgScoreAgg = await prisma.resume.aggregate({
      where: { userId },
      _avg: { matchScore: true },
    });

    return {
      totalResumes,
      shortlisted,
      interviewed,
      rejected,
      averageMatchScore: Math.round(avgScoreAgg._avg.matchScore || 0),
    };
  }
}
