import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAssistantApi } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Bot,
  Sparkles,
  Send,
  UserCheck,
  HelpCircle,
  FileSearch,
  ScanText,
} from 'lucide-react';

const TABS = [
  { id: 'chat', label: 'AI Chat Copilot', icon: Bot },
  { id: 'eval', label: 'Candidate Evaluator & Job Matcher', icon: UserCheck },
  { id: 'interview', label: 'Interview Question Generator', icon: HelpCircle },
  { id: 'ocr', label: 'Document OCR & Resume Parser', icon: ScanText },
];

export function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState('chat');

  // Chat State
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Recruitment Copilot. Ask me to evaluate candidates, match jobs, generate interview questions, or parse resumes.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Evaluator State
  const [candidateName, setCandidateName] = useState('Alex Morgan');
  const [jobTitle, setJobTitle] = useState('Senior Software Engineer');
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [empRecs, setEmpRecs] = useState<any | null>(null);

  // Interview State
  const [interviewResult, setInterviewResult] = useState<any | null>(null);

  // OCR State
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [rawText, setRawText] = useState('');
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [parsedJSON, setParsedJSON] = useState<any | null>(null);

  const chatMutation = useMutation({
    mutationFn: aiAssistantApi.chat,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
  });

  const evalMutation = useMutation({
    mutationFn: aiAssistantApi.evaluateCandidate,
    onSuccess: (data) => setEvalResult(data),
  });

  const matchMutation = useMutation({
    mutationFn: aiAssistantApi.matchJob,
    onSuccess: (data) => setMatchResult(data),
  });

  const empRecMutation = useMutation({
    mutationFn: aiAssistantApi.recommendEmployers,
    onSuccess: (data) => setEmpRecs(data),
  });

  const interviewMutation = useMutation({
    mutationFn: aiAssistantApi.generateInterviewQuestions,
    onSuccess: (data) => setInterviewResult(data),
  });

  const ocrMutation = useMutation({
    mutationFn: aiAssistantApi.ocrDocument,
    onSuccess: (data) => setOcrResult(data),
  });

  const parseMutation = useMutation({
    mutationFn: aiAssistantApi.parseResume,
    onSuccess: (data) => setParsedJSON(data),
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
    chatMutation.mutate(userMsg);
  };

  const handleRunEvaluation = () => {
    evalMutation.mutate({ candidateName, jobTitle });
    matchMutation.mutate({ candidateSkills: ['React', 'TypeScript', 'Node.js'], jobRequirements: ['React', 'TypeScript', 'PostgreSQL', 'Docker'] });
    empRecMutation.mutate({ jobTitle });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            AI Recruitment Intelligence Assistant <Bot className="h-7 w-7 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated candidate evaluation, ATS job matching, OCR document extraction, and interview rubrics
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI Chat Copilot */}
      {activeTab === 'chat' && (
        <Card className="border shadow-md max-w-4xl mx-auto flex flex-col h-[580px]">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Recruiter AI Assistant Copilot
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted/40 border text-foreground rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </CardContent>

          <form onSubmit={handleSendChat} className="p-3 border-t bg-card flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI about candidate evaluation, MOFA rules, or interview tips..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2 text-xs bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" size="sm" isLoading={chatMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: Candidate Evaluator & Job Matcher */}
      {activeTab === 'eval' && (
        <div className="space-y-6">
          <Card className="border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
              <Input label="Target Position Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <Button onClick={handleRunEvaluation} isLoading={evalMutation.isPending}>
              <Sparkles className="mr-2 h-4 w-4" /> Run AI Candidate Evaluation & Job Match
            </Button>
          </Card>

          {evalResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border p-6 space-y-3 col-span-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Fit Score & Rating</p>
                <div className="text-4xl font-extrabold text-emerald-500">{evalResult.overallFitScore}%</div>
                <Badge variant="success">{evalResult.evaluationGrade}</Badge>
                {matchResult && (
                  <p className="text-xs font-bold text-primary mt-1">Verdict: {matchResult.matchVerdict}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{evalResult.recommendationSummary}</p>
              </Card>

              <Card className="border p-6 space-y-3 col-span-2">
                <h4 className="font-bold text-sm text-primary uppercase border-b pb-1">AI Strengths & Growth Areas</h4>
                <div>
                  <span className="font-bold text-xs block mb-1">Key Technical Strengths:</span>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {evalResult.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </Card>
            </div>
          )}

          {empRecs && (
            <Card className="border p-6 space-y-3">
              <h4 className="font-bold text-sm text-primary uppercase border-b pb-1">Recommended Employers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {empRecs.recommendations?.map((r: any, i: number) => (
                  <div key={i} className="p-4 border rounded-xl bg-muted/20 space-y-1">
                    <p className="font-bold text-sm">{r.company}</p>
                    <p className="text-xs text-muted-foreground">{r.country} • {r.openPositions} Open Requisitions</p>
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{r.matchScore}% Match Score</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: Interview Question Generator */}
      {activeTab === 'interview' && (
        <Card className="border p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input label="Position Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <Button onClick={() => interviewMutation.mutate({ jobTitle, seniority: 'Senior' })} isLoading={interviewMutation.isPending}>
              Generate Interview Rubric
            </Button>
          </div>

          {interviewResult && (
            <div className="space-y-6 text-xs border-t pt-4">
              <div>
                <h4 className="font-bold text-sm text-primary uppercase mb-2">Technical Interview Questions</h4>
                <div className="space-y-3">
                  {interviewResult.technicalQuestions?.map((q: any, i: number) => (
                    <div key={i} className="p-4 border rounded-xl bg-muted/20 space-y-1">
                      <p className="font-bold text-sm">Q{i + 1}: {q.question}</p>
                      <p className="text-muted-foreground italic">Evaluation Criteria: {q.guideline}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: Document OCR & Resume Parser */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ScanText className="h-5 w-5 text-primary" /> Document OCR Extractor
            </h3>
            <p className="text-xs text-muted-foreground">Extract text from Passports, Medical Reports, and Diplomas.</p>
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Document Category</label>
              <select className="w-full h-10 px-3 rounded-md border bg-background text-xs font-semibold" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                <option value="PASSPORT">Passport Document</option>
                <option value="MEDICAL">Medical Examination Report</option>
                <option value="VISA">Embassy Stamped Visa</option>
              </select>
            </div>
            <Button onClick={() => ocrMutation.mutate({ documentType })} isLoading={ocrMutation.isPending}>
              Run OCR Optical Text Extraction
            </Button>

            {ocrResult && (
              <div className="p-4 rounded-xl border bg-muted/30 text-xs font-mono space-y-2">
                <p className="font-bold text-emerald-600">OCR Confidence: {ocrResult.confidenceScore}%</p>
                <pre className="whitespace-pre-wrap">{ocrResult.extractedText}</pre>
              </div>
            )}
          </Card>

          <Card className="border p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> AI Resume JSON Parser
            </h3>
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Raw Candidate Resume Text</label>
              <textarea rows={4} className="w-full p-3 text-xs rounded-md border bg-background" value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste unformatted resume text here..." />
            </div>
            <Button onClick={() => parseMutation.mutate({ rawText })} isLoading={parseMutation.isPending}>
              Parse to Structured Candidate Profile
            </Button>

            {parsedJSON && (
              <pre className="p-4 rounded-xl border bg-muted/40 text-[11px] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(parsedJSON, null, 2)}
              </pre>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
