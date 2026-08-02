import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import { ArrowLeft, Sparkles, Trash2, Mail, Phone, Briefcase, Award } from 'lucide-react';
import { ResumeStatus } from '../types';
import { formatDate } from '../lib/utils';

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resume, isLoading, isError } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getResumeById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: ResumeStatus) => resumeApi.updateStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', id] });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast({
        type: 'success',
        title: 'Status Updated',
        message: 'Candidate pipeline stage updated.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => resumeApi.deleteResume(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({
        type: 'info',
        title: 'Resume Deleted',
        message: 'Candidate record removed.',
      });
      navigate('/resumes');
    },
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (isError || !resume) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-semibold">Candidate resume not found.</p>
        <Button onClick={() => navigate('/resumes')} className="mt-4">
          Back to Resumes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteMutation.mutate()}
          isLoading={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Resume
        </Button>
      </div>

      {/* Main Candidate Card */}
      <Card className="border shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{resume.candidateName}</CardTitle>
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
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {resume.email}
                </span>
                {resume.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {resume.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> {resume.experienceYrs} Years Exp.
                </span>
              </div>
            </div>

            {/* Quick Status Setter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Stage:</span>
              <select
                value={resume.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value as ResumeStatus)}
                className="h-9 px-3 text-xs font-medium rounded-md border bg-background"
              >
                <option value="PENDING">PENDING</option>
                <option value="SHORTLISTED">SHORTLISTED</option>
                <option value="INTERVIEWED">INTERVIEWED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* AI Insights Banner */}
          <div className="p-5 rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-primary">
                <Sparkles className="h-5 w-5" /> AI Candidate Evaluation Report
              </span>
              <div className="flex items-center gap-2 bg-background/80 px-3 py-1 rounded-full border">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-extrabold">{resume.matchScore}% Match Score</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{resume.aiFeedback}</p>
          </div>

          {/* Applied Job Info */}
          {resume.job && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Applied Role Context
              </h4>
              <div className="p-4 border rounded-lg bg-card">
                <p className="font-bold text-foreground">{resume.job.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {resume.job.department} • {resume.job.location}
                </p>
              </div>
            </div>
          )}

          {/* Skills Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Extracted Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="px-3 py-1 text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          {resume.summary && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Candidate Summary / Resume Text
              </h4>
              <div className="p-4 border rounded-lg bg-muted/20 text-sm whitespace-pre-wrap leading-relaxed">
                {resume.summary}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t">
            Created on {formatDate(resume.createdAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
