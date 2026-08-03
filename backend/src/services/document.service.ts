import { prisma, isDbConnected } from '../config/prisma';
import { DocumentType } from '../types/enums';

export class DocumentService {
  static async uploadDocument(data: {
    title: string;
    documentType: DocumentType;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    candidateId?: string;
  }) {
    // Check if previous document of this type exists for candidate to create version 2+
    let version = 1;
    let previousVersionId: string | undefined = undefined;

    if (data.candidateId) {
      const existingLatest = await prisma.document.findFirst({
        where: {
          candidateId: data.candidateId,
          documentType: data.documentType,
          isLatest: true,
        },
      });

      if (existingLatest) {
        version = existingLatest.version + 1;
        previousVersionId = existingLatest.id;

        // Mark previous document as no longer latest
        await prisma.document.update({
          where: { id: existingLatest.id },
          data: { isLatest: false },
        });
      }
    }

    return prisma.document.create({
      data: {
        title: data.title,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        candidateId: data.candidateId || null,
        version,
        previousVersionId,
        isLatest: true,
      },
    });
  }

  static async getDocuments(documentType?: DocumentType, candidateId?: string) {
    if (isDbConnected) {
      try {
        const where: any = {};
        if (documentType) where.documentType = documentType;
        if (candidateId) where.candidateId = candidateId;

        return await prisma.document.findMany({
          where,
          orderBy: [{ uploadedAt: 'desc' }, { version: 'desc' }],
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      } catch (e) {}
    }

    return [
      {
        id: 'doc-1',
        title: 'RAM_BAHADUR_THAPA_PASSPORT.PDF',
        documentType: 'PASSPORT',
        fileUrl: '/uploads/sample_passport.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 2048500,
        version: 1,
        isLatest: true,
        uploadedAt: new Date(),
        candidate: { firstName: 'RAM BAHADUR', lastName: 'THAPA', email: 'ram.thapa@example.com' },
      },
      {
        id: 'doc-2',
        title: 'MEDICAL_FITNESS_CERTIFICATE.PDF',
        documentType: 'MEDICAL_REPORT',
        fileUrl: '/uploads/sample_medical.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1450000,
        version: 1,
        isLatest: true,
        uploadedAt: new Date(),
        candidate: { firstName: 'SHYAM KUMAR', lastName: 'SHRESTHA', email: 'shyam.shrestha@example.com' },
      },
    ];
  }

  static async getDocumentHistory(documentType: DocumentType, candidateId: string) {
    return prisma.document.findMany({
      where: {
        candidateId,
        documentType,
      },
      orderBy: { version: 'desc' },
    });
  }

  static async replaceDocument(id: string, newFileData: { title?: string; fileUrl: string; fileType: string; fileSize: number }) {
    const target = await prisma.document.findUnique({ where: { id } });
    if (!target) throw new Error('Original document not found');

    // Create new version
    const newVersion = await prisma.document.create({
      data: {
        candidateId: target.candidateId,
        title: newFileData.title || target.title,
        documentType: target.documentType,
        fileUrl: newFileData.fileUrl,
        fileType: newFileData.fileType,
        fileSize: newFileData.fileSize,
        version: target.version + 1,
        previousVersionId: target.id,
        isLatest: true,
      },
    });

    // Mark previous as not latest
    await prisma.document.update({
      where: { id: target.id },
      data: { isLatest: false },
    });

    return newVersion;
  }

  static async deleteDocument(id: string) {
    const target = await prisma.document.findUnique({ where: { id } });
    if (!target) throw new Error('Document not found');

    return prisma.document.delete({ where: { id } });
  }
}
