import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { resumeApi, jobApi } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resumeSchema, ResumeFormData } from '../lib/validations';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import { Search, Plus, Filter, FileText, Sparkles, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function ResumesPage() {
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes', selectedStatus, searchQuery],
    queryFn: () => resumeApi.getResumes(selectedStatus || undefined, searchQuery || undefined),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobApi.getJobs,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
  });

  const createMutation = useMutation({
    mutationFn: resumeApi.createResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast({
        type: 'success',
        title: 'Resume Processed',
        message: 'AI screening complete and score assigned!',
      });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Could not process candidate resume.',
      });
    },
  });

  const onSubmit = (data: ResumeFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Filter, search, and process candidates using AI scoring algorithms
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Candidate Resume
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-xs font-semibold text-muted-foreground mr-2">Status:</span>
            {['', 'PENDING', 'SHORTLISTED', 'INTERVIEWED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Resumes Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : resumes && resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{resume.candidateName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{resume.email}</p>
                  </div>
                  <Badge
                    variant={
                      resume.status === 'SHORTLISTED'
                        ? 'success'
                        : resume.status === 'REJECTED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {resume.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm flex-1">
                <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Match Rating
                  </span>
                  <span className="font-extrabold text-primary text-base">{resume.matchScore}%</span>
                </div>

                {resume.job && (
                  <div>
                    <span className="text-xs text-muted-foreground">Applied Role:</span>
                    <p className="font-semibold text-foreground">{resume.job.title}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs text-muted-foreground">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resume.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="p-6 pt-0 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(resume.createdAt)}</span>
                <Link to={`/resumes/${resume.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No resumes found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or upload a new resume.</p>
        </Card>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Parse New Candidate Resume
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Candidate Full Name"
                placeholder="John Doe"
                error={errors.candidateName?.message}
                {...register('candidateName')}
              />
              <Input
                label="Candidate Email"
                type="email"
                placeholder="john.doe@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Years of Experience"
                  type="number"
                  placeholder="4"
                  error={errors.experienceYrs?.message}
                  {...register('experienceYrs')}
                />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Target Job</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                    {...register('jobId')}
                  >
                    <option value="">-- General Pool --</option>
                    {jobs?.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Key Skills (comma separated)"
                placeholder="React, TypeScript, Node.js, PostgreSQL"
                error={errors.skills?.message}
                {...register('skills')}
              />

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Resume Executive Summary</label>
                <textarea
                  rows={3}
                  className="w-full p-3 text-sm rounded-md border bg-background text-foreground"
                  placeholder="Paste candidate resume bio or text snippet for AI keyword matching..."
                  {...register('summary')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Run AI Screening
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
