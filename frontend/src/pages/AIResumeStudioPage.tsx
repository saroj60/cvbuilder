import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiBuilderApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Wand2,
  Sparkles,
  CheckCircle2,
  Languages,
  Award,
  BookOpen,
  FileCheck2,
  Send,
  Edit3,
  Copy,
} from 'lucide-react';

const TABS = [
  { id: 'full', label: 'Full Resume Generator', icon: Wand2 },
  { id: 'summary', label: 'Professional Summary', icon: Sparkles },
  { id: 'objective', label: 'Career Objective', icon: Award },
  { id: 'experience', label: 'Improve Experience', icon: BookOpen },
  { id: 'skills', label: 'Skill Booster', icon: Sparkles },
  { id: 'grammar', label: 'Grammar Polish', icon: CheckCircle2 },
  { id: 'nepali', label: 'Nepali ➔ English', icon: Languages },
  { id: 'ats', label: 'ATS Score Checker', icon: FileCheck2 },
  { id: 'cover', label: 'Cover Letter Studio', icon: Send },
];

export function AIResumeStudioPage() {
  const [activeTab, setActiveTab] = useState('full');
  const [editableJSON, setEditableJSON] = useState<string>('');
  const [editableText, setEditableText] = useState<string>('');

  // Form states
  const [jobTitle, setJobTitle] = useState('Full Stack Software Engineer');
  const [experienceYears, setExperienceYears] = useState(5);
  const [rawInputText, setRawInputText] = useState('Worked on React and Node.js web applications, helped team fix bugs');
  const [nepaliText, setNepaliText] = useState('म विगत ५ वर्षदेखि कम्प्युटर सफ्टवेयर विकासमा काम गर्दै आएको छु।');
  const [companyName, setCompanyName] = useState('Acme Global Technologies');
  const [candidateName, setCandidateName] = useState('Alex Morgan');

  const { toast } = useToast();

  const fullResumeMutation = useMutation({
    mutationFn: aiBuilderApi.generateFullResume,
    onSuccess: (data) => {
      setEditableJSON(JSON.stringify(data, null, 2));
      toast({ type: 'success', title: 'Structured Resume Generated', message: 'Ready to review & edit JSON output.' });
    },
  });

  const summaryMutation = useMutation({
    mutationFn: aiBuilderApi.generateSummary,
    onSuccess: (data) => setEditableText(data.summary),
  });

  const objectiveMutation = useMutation({
    mutationFn: aiBuilderApi.generateObjective,
    onSuccess: (data) => setEditableText(data.objective),
  });

  const experienceMutation = useMutation({
    mutationFn: aiBuilderApi.improveExperience,
    onSuccess: (data) => setEditableText(data.improvedBulletPoints.join('\n\n')),
  });

  const skillMutation = useMutation({
    mutationFn: aiBuilderApi.improveSkills,
    onSuccess: (data) => setEditableText(data.suggestedSkills.join(', ')),
  });

  const grammarMutation = useMutation({
    mutationFn: aiBuilderApi.correctGrammar,
    onSuccess: (data) => setEditableText(data.correctedText),
  });

  const nepaliMutation = useMutation({
    mutationFn: aiBuilderApi.translateNepali,
    onSuccess: (data) => setEditableText(data.translatedEnglish),
  });

  const atsMutation = useMutation({
    mutationFn: aiBuilderApi.atsScore,
    onSuccess: (data) => setEditableJSON(JSON.stringify(data, null, 2)),
  });

  const coverMutation = useMutation({
    mutationFn: aiBuilderApi.generateCoverLetter,
    onSuccess: (data) => setEditableText(data.coverLetter),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ type: 'info', title: 'Copied!', message: 'Content copied to clipboard.' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            AI Resume & Cover Letter Studio <Wand2 className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured JSON generator, ATS score analyzer, and multi-lingual translation engine
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Inputs Controls Panel */}
        <Card className="border shadow-md flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> Generator Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === 'full' && (
              <>
                <Input label="Target Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Input label="Years of Experience" type="number" value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} />
                <Button className="w-full" isLoading={fullResumeMutation.isPending} onClick={() => fullResumeMutation.mutate({ jobTitle, experienceYears })}>
                  Generate Structured Resume JSON
                </Button>
              </>
            )}

            {activeTab === 'summary' && (
              <>
                <Input label="Target Role" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Button className="w-full" isLoading={summaryMutation.isPending} onClick={() => summaryMutation.mutate({ jobTitle, skills: ['React', 'TypeScript', 'Node.js'] })}>
                  Generate Summary
                </Button>
              </>
            )}

            {activeTab === 'objective' && (
              <>
                <Input label="Target Role" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Button className="w-full" isLoading={objectiveMutation.isPending} onClick={() => objectiveMutation.mutate({ jobTitle, industry: 'FinTech / Software' })}>
                  Generate Career Objective
                </Button>
              </>
            )}

            {activeTab === 'experience' && (
              <>
                <div>
                  <label className="text-sm font-medium block mb-1">Raw Work Experience Bullet Points</label>
                  <textarea rows={4} className="w-full p-3 text-sm rounded-md border bg-background" value={rawInputText} onChange={(e) => setRawInputText(e.target.value)} />
                </div>
                <Button className="w-full" isLoading={experienceMutation.isPending} onClick={() => experienceMutation.mutate({ bulletPoints: rawInputText.split('\n') })}>
                  Enhance Work Experience
                </Button>
              </>
            )}

            {activeTab === 'skills' && (
              <>
                <Input label="Job Position" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Button className="w-full" isLoading={skillMutation.isPending} onClick={() => skillMutation.mutate({ jobTitle })}>
                  Boost ATS Skills
                </Button>
              </>
            )}

            {activeTab === 'grammar' && (
              <>
                <div>
                  <label className="text-sm font-medium block mb-1">Text for Grammar Correction</label>
                  <textarea rows={4} className="w-full p-3 text-sm rounded-md border bg-background" value={rawInputText} onChange={(e) => setRawInputText(e.target.value)} />
                </div>
                <Button className="w-full" isLoading={grammarMutation.isPending} onClick={() => grammarMutation.mutate(rawInputText)}>
                  Polish Grammar & Tone
                </Button>
              </>
            )}

            {activeTab === 'nepali' && (
              <>
                <div>
                  <label className="text-sm font-medium block mb-1">Nepali Text Input</label>
                  <textarea rows={4} className="w-full p-3 text-sm rounded-md border bg-background font-mono" value={nepaliText} onChange={(e) => setNepaliText(e.target.value)} />
                </div>
                <Button className="w-full" isLoading={nepaliMutation.isPending} onClick={() => nepaliMutation.mutate(nepaliText)}>
                  Translate Nepali to Professional English
                </Button>
              </>
            )}

            {activeTab === 'ats' && (
              <>
                <p className="text-xs text-muted-foreground">Run ATS compatibility algorithm against generated resume structure.</p>
                <Button className="w-full" isLoading={atsMutation.isPending} onClick={() => atsMutation.mutate({ summary: 'Results driven engineer', skills: ['React', 'Node'] })}>
                  Analyze ATS Compatibility Score
                </Button>
              </>
            )}

            {activeTab === 'cover' && (
              <>
                <Input label="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
                <Input label="Target Position" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <Button className="w-full" isLoading={coverMutation.isPending} onClick={() => coverMutation.mutate({ candidateName, jobTitle, companyName })}>
                  Generate Custom Cover Letter
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Output & Live Edit Panel */}
        <Card className="border shadow-md flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Live Editable AI Output
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(editableJSON || editableText)}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            {editableJSON ? (
              <textarea
                rows={16}
                className="w-full font-mono text-xs p-3 rounded-lg border bg-muted/40 text-foreground"
                value={editableJSON}
                onChange={(e) => setEditableJSON(e.target.value)}
              />
            ) : editableText ? (
              <textarea
                rows={16}
                className="w-full text-sm p-4 rounded-lg border bg-muted/20 text-foreground leading-relaxed"
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
              />
            ) : (
              <div className="min-h-[320px] flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <Wand2 className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-sm font-medium">Select a tool and click Generate to view structured output.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
