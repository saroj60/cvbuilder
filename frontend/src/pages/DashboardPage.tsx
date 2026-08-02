import { useQuery } from '@tanstack/react-query';
import { resumeApi } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import {
  FileBadge,
  Wand2,
  LayoutTemplate,
  FileText,
  Bot,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

export function DashboardPage() {
  const { data: recentResumes = [] } = useQuery({
    queryKey: ['recent-resumes-dashboard'],
    queryFn: () => resumeApi.getResumes(),
  });

  const kpiCards = [
    {
      title: 'Overseas Gulf CVs',
      value: '12-Step Builder',
      description: 'Strict format for Saudi, UAE, Qatar, Kuwait',
      icon: FileBadge,
      actionText: 'Build Gulf CV',
      path: '/overseas-cv',
      gradient: 'from-blue-600/20 to-blue-500/5 text-blue-500 border-blue-500/30',
    },
    {
      title: 'AI Resume Studio',
      value: 'ATS & Nepali AI',
      description: 'Instant Nepali-to-English & ATS scoring',
      icon: Wand2,
      actionText: 'Launch Studio',
      path: '/ai-builder',
      gradient: 'from-purple-600/20 to-purple-500/5 text-purple-500 border-purple-500/30',
    },
    {
      title: 'CV Template Library',
      value: '5 Presets',
      description: 'Gulf, Modern Minimal, ATS Standard, Europass',
      icon: LayoutTemplate,
      actionText: 'Explore Templates',
      path: '/templates',
      gradient: 'from-emerald-600/20 to-emerald-500/5 text-emerald-500 border-emerald-500/30',
    },
    {
      title: 'AI Copilot Assistant',
      value: 'Recruiter AI',
      description: 'Interactive AI Chat & Candidate Evaluator',
      icon: Bot,
      actionText: 'Open Copilot',
      path: '/ai-assistant',
      gradient: 'from-amber-600/20 to-amber-500/5 text-amber-500 border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            AI Resume & CV Operations Hub <Sparkles className="h-7 w-7 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time candidate CV generation, Overseas Gulf templates, ATS match scoring, and AI tools
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/overseas-cv">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              <Plus className="mr-1.5 h-4 w-4" /> Create Overseas Gulf CV
            </Button>
          </Link>
          <Link to="/ai-builder">
            <Button size="sm" variant="outline">
              <Wand2 className="mr-1.5 h-4 w-4 text-primary" /> AI Resume Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {kpi.title}
                  </span>
                  <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${kpi.gradient}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                </div>
                <Link to={kpi.path} className="pt-2 border-t flex items-center justify-between text-xs font-bold text-primary hover:underline">
                  <span>{kpi.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Launch Suite Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border space-y-4 hover:border-primary/50 transition-all bg-card/60">
          <div className="p-3 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 flex items-center justify-center">
            <FileBadge className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">Overseas AI CV Builder</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Guided workflow for Gulf recruitment. Includes Passport MRZ OCR, auto-calculated age & validity, 14 job presets, 5 AI safety duties, and checkmark skills.
            </p>
          </div>
          <Link to="/overseas-cv" className="block pt-2">
            <Button size="sm" className="w-full">
              Open Builder <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border space-y-4 hover:border-primary/50 transition-all bg-card/60">
          <div className="p-3 w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 flex items-center justify-center">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">AI Resume Studio & ATS Scorer</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Translate raw Nepali job notes into professional English, generate full candidate summaries, and score resume relevance against job specifications.
            </p>
          </div>
          <Link to="/ai-builder" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">
              Launch AI Studio <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border space-y-4 hover:border-primary/50 transition-all bg-card/60">
          <div className="p-3 w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 flex items-center justify-center">
            <LayoutTemplate className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">Multi-Format Templates & Dual Export</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Select from Overseas Gulf CV, Modern Minimal, ATS Standard, Europass, and Creative layouts with live font controls and A4 PDF & Word downloads.
            </p>
          </div>
          <Link to="/templates" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">
              Browse Templates <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Candidate Resumes List */}
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Candidate Resumes Repository
          </CardTitle>
          <Link to="/resumes">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Resumes ({recentResumes.length}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentResumes.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <FileBadge className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">No candidate resumes created yet.</p>
              <Link to="/overseas-cv">
                <Button size="sm" className="bg-primary">
                  <Plus className="mr-1.5 h-4 w-4" /> Build Your First Overseas CV
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentResumes.map((resume: any) => (
                <div key={resume.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{resume.candidateName}</p>
                    <p className="text-xs text-muted-foreground">
                      {resume.job?.title || 'GENERAL'} • {resume.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={resume.status === 'ACCEPTED' ? 'success' : 'outline'}>
                      {resume.status}
                    </Badge>
                    <Link to={`/resumes/${resume.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
