import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobSchema, JobFormData } from '../lib/validations';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import { Plus, Briefcase, MapPin, Building, Users, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function JobsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobApi.getJobs,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const createMutation = useMutation({
    mutationFn: jobApi.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        type: 'success',
        title: 'Job Posting Created',
        message: 'New position open for AI resume screening.',
      });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.message || 'Could not create job posting.',
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Job Openings</h1>
          <p className="text-sm text-muted-foreground">
            Manage target roles and skill criteria for automated candidate scoring
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Job Opening
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="border hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">OPEN</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">
                    Required Competencies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Users className="h-4 w-4 text-primary" /> {job._count?.resumes || 0} Candidates Uploaded
                  </span>
                  <span>Posted {formatDate(job.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No open positions</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a job opening to start scoring candidates against specific requirements.</p>
        </Card>
      )}

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold">New Job Position</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Job Title"
                placeholder="Senior Full Stack Engineer"
                error={errors.title?.message}
                {...register('title')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Department"
                  placeholder="Engineering"
                  error={errors.department?.message}
                  {...register('department')}
                />
                <Input
                  label="Location"
                  placeholder="Remote / San Francisco"
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>

              <Input
                label="Required Skills (comma separated)"
                placeholder="React, TypeScript, Node.js, PostgreSQL"
                error={errors.skills?.message}
                {...register('skills')}
              />

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Job Description</label>
                <textarea
                  rows={4}
                  className="w-full p-3 text-sm rounded-md border bg-background text-foreground"
                  placeholder="Describe key responsibilities and tech stack requirements..."
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Post Job Opening
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
