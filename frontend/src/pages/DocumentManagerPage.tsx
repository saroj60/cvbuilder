import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import {
  UploadCloud,
  FileText,
  Eye,
  Download,
  RotateCw,
  Trash2,
  X,
  File,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '../lib/utils';

const DOCUMENT_CATEGORIES = [
  { label: 'All Documents', value: '' },
  { label: 'Passport', value: 'PASSPORT' },
  { label: 'Citizenship', value: 'CITIZENSHIP' },
  { label: 'Medical', value: 'MEDICAL' },
  { label: 'Police Clearance', value: 'POLICE_CLEARANCE' },
  { label: 'Certificate', value: 'CERTIFICATE' },
  { label: 'Photo', value: 'PHOTO' },
  { label: 'Resume', value: 'RESUME' },
  { label: 'Visa', value: 'VISA' },
  { label: 'Contract', value: 'CONTRACT' },
];

export function DocumentManagerPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [replaceDoc, setReplaceDoc] = useState<any | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileSize] = useState(2450000); // ~2.4 MB

  // Replace Form State
  const [replaceUrl, setReplaceUrl] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', selectedCategory],
    queryFn: () => documentApi.getDocuments(selectedCategory || undefined),
  });

  const uploadMutation = useMutation({
    mutationFn: documentApi.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        type: 'success',
        title: 'Document Uploaded',
        message: 'New document version indexed into storage repository.',
      });
      setIsUploadOpen(false);
      setTitle('');
      setFileUrl('');
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Could not store document.',
      });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentApi.replaceDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        type: 'success',
        title: 'Version Updated',
        message: 'Document replaced and version history updated.',
      });
      setReplaceDoc(null);
      setReplaceUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        type: 'info',
        title: 'Document Removed',
        message: 'Document version deleted from storage.',
      });
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      toast({ type: 'error', title: 'Validation Error', message: 'Please enter a title and valid file URL.' });
      return;
    }
    uploadMutation.mutate({ title, documentType, fileUrl, fileType, fileSize });
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceUrl || !replaceDoc) return;
    replaceMutation.mutate({
      id: replaceDoc.id,
      data: { fileUrl: replaceUrl, fileType: 'application/pdf', fileSize: 3100000 },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Document Repository & Version Control</h1>
          <p className="text-sm text-muted-foreground">
            Centralized document storage for Passports, Visas, Medical Reports, and Contracts
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="shadow-md">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
        {DOCUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc: any) => {
            const isImage = doc.fileType.includes('image') || doc.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);

            return (
              <Card key={doc.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base truncate max-w-[180px]">{doc.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{doc.fileType}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      v{doc.version}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Document Type:</span>
                    <Badge variant="secondary">{doc.documentType}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="font-semibold">{Math.round(doc.fileSize / (1024 * 1024) * 10) / 10} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>

                  {doc.candidate && (
                    <div className="p-2.5 bg-muted/30 rounded-md border flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="font-bold text-foreground">{doc.candidate.firstName} {doc.candidate.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.candidate.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Actions Toolbar */}
                <div className="p-4 border-t bg-muted/10 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)} title="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="ghost" size="sm" title="Download">
                        <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => setReplaceDoc(doc)} title="Replace New Version">
                      <RotateCw className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <File className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload Passports, Medical clearances, or Visas to start building document profiles.</p>
        </Card>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" /> Upload Document
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <Input label="Document Title" placeholder="Passport Copy / Medical Test" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <label className="text-sm font-medium block mb-1">Document Category</label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  {DOCUMENT_CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">File Format / MIME Type</label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={fileType} onChange={(e) => setFileType(e.target.value)}>
                  <option value="application/pdf">PDF Document (.pdf)</option>
                  <option value="image/png">PNG Image (.png)</option>
                  <option value="image/jpeg">JPEG Image (.jpg, .jpeg)</option>
                </select>
              </div>

              <Input label="File URL / Cloud Storage Path" placeholder="https://storage.googleapis.com/docs/file.pdf" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />

              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                File Validation: Max 10MB file size enforced.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={uploadMutation.isPending}>Save Document</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF / Image Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" /> {previewDoc.title} (v{previewDoc.version})
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 bg-black/20 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center p-4">
              {previewDoc.fileType.includes('image') || previewDoc.fileUrl.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.title} className="max-h-[500px] object-contain rounded-lg shadow-lg" />
              ) : (
                <iframe src={previewDoc.fileUrl} title={previewDoc.title} className="w-full h-[500px] rounded-lg border" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Replace Document Modal */}
      {replaceDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold">Replace Version (v{replaceDoc.version} ➔ v{replaceDoc.version + 1})</h3>
              <button onClick={() => setReplaceDoc(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">Uploading a new version will preserve version history.</p>
              <Input label="New File Storage URL" placeholder="https://storage.googleapis.com/docs/file_v2.pdf" value={replaceUrl} onChange={(e) => setReplaceUrl(e.target.value)} />
              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setReplaceDoc(null)}>Cancel</Button>
                <Button type="submit" isLoading={replaceMutation.isPending}>Upload v{replaceDoc.version + 1}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
