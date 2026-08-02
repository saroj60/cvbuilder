import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visaApi, resumeApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import {
  Plus,
  Stamp,
  Globe,
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  Clock,
  X,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function VisasPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [candidateId, setCandidateId] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [visaType, setVisaType] = useState('WORK_VISA');
  const [country, setCountry] = useState('Saudi Arabia');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [documentUrl, setDocumentUrl] = useState('');
  const [remarks, setRemarks] = useState('');

  // MOFA Form Fields
  const [mofaNumber, setMofaNumber] = useState('');
  const [mofaFee, setMofaFee] = useState(150);
  const [mofaStatus, setMofaStatus] = useState('APPROVED');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: visas, isLoading } = useQuery({
    queryKey: ['visas', selectedStatus],
    queryFn: () => visaApi.getVisas(selectedStatus || undefined),
  });

  const { data: metrics } = useQuery({
    queryKey: ['visaMetrics'],
    queryFn: visaApi.getMetrics,
  });

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => resumeApi.getCandidates(),
  });

  const saveVisaMutation = useMutation({
    mutationFn: visaApi.saveVisa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visas'] });
      queryClient.invalidateQueries({ queryKey: ['visaMetrics'] });
      toast({ type: 'success', title: 'Visa Stamping Saved', message: 'Visa details indexed into system.' });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || 'Could not save visa details.' });
    },
  });

  const saveMofaMutation = useMutation({
    mutationFn: visaApi.saveMOFA,
    onSuccess: () => {
      toast({ type: 'success', title: 'MOFA Record Saved', message: 'Ministry of Foreign Affairs submission logged.' });
    },
  });

  const resetForm = () => {
    setCandidateId('');
    setVisaNumber('');
    setIssueDate('');
    setExpiryDate('');
    setStatus('PENDING');
    setDocumentUrl('');
    setMofaNumber('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !country) {
      toast({ type: 'error', title: 'Validation Error', message: 'Candidate and country are required.' });
      return;
    }

    saveVisaMutation.mutate({
      candidateId,
      visaNumber,
      visaType,
      country,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      status,
      remarks,
      documentUrl,
    });

    if (mofaNumber) {
      saveMofaMutation.mutate({
        candidateId,
        mofaNumber,
        submissionDate: new Date().toISOString().split('T')[0],
        status: mofaStatus,
        fee: Number(mofaFee),
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Visa Stamping & MOFA Processing <Stamp className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Track Embassy visa stamping, MOFA submissions, entry permits, and 30-day visa expiry notifications
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Process Visa / MOFA
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Visas</p>
            <p className="text-xl font-extrabold mt-1">{metrics?.totalVisas || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Stamp className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Stamped Visas</p>
            <p className="text-xl font-extrabold mt-1 text-emerald-500">{metrics?.stampedVisas || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">MOFA Approved</p>
            <p className="text-xl font-extrabold mt-1 text-purple-500">{metrics?.approvedMofa || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pending Stamping</p>
            <p className="text-xl font-extrabold mt-1 text-amber-500">{metrics?.pendingVisas || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between bg-amber-500/5">
          <div>
            <p className="text-[10px] font-semibold text-amber-600 uppercase">Expiring (30d)</p>
            <p className="text-xl font-extrabold mt-1 text-amber-600">{metrics?.expiringVisas || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {['', 'STAMPED', 'APPROVED', 'APPLIED', 'PENDING', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {st || 'All Visa Records'}
          </button>
        ))}
      </div>

      {/* Visa Cards */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : visas && visas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visas.map((v: any) => (
            <Card key={v.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" /> {v.candidate?.firstName} {v.candidate?.lastName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{v.candidate?.email}</p>
                  </div>
                  <Badge variant={v.status === 'STAMPED' ? 'success' : v.status === 'APPROVED' ? 'default' : 'outline'}>
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-primary" /> Country:
                  </span>
                  <span className="font-bold">{v.country}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Stamp className="h-3.5 w-3.5 text-primary" /> Visa Number:
                  </span>
                  <span className="font-mono font-bold text-foreground">{v.visaNumber || 'N/A'}</span>
                </div>

                {v.candidate?.mofa && (
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <span className="text-purple-600 font-bold flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" /> MOFA No:
                    </span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{v.candidate.mofa.mofaNumber}</span>
                  </div>
                )}

                {v.issueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Issued:</span>
                    <span>{formatDate(v.issueDate)}</span>
                  </div>
                )}

                {v.expiryDate && (
                  <div className="p-2 rounded bg-amber-500/10 text-amber-600 flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Visa Expiry:
                    </span>
                    <span>{formatDate(v.expiryDate)}</span>
                  </div>
                )}
              </CardContent>

              {v.documentUrl && (
                <div className="p-4 border-t bg-muted/10">
                  <a href={v.documentUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> View Stamped Visa Document
                    </Button>
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <Stamp className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No visa records found</h3>
          <p className="text-sm text-muted-foreground mt-1">Log embassy visa stamping and MOFA number submissions.</p>
        </Card>
      )}

      {/* Process Visa Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Stamp className="h-5 w-5 text-primary" /> Process Embassy Visa & MOFA
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Select Candidate</label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                >
                  <option value="">Select Candidate...</option>
                  {candidates?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Visa Number" placeholder="V-8492019" value={visaNumber} onChange={(e) => setVisaNumber(e.target.value)} />
                <Input label="Target Country" placeholder="Saudi Arabia / UAE" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase block mb-1">Visa Category / Type</label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={visaType} onChange={(e) => setVisaType(e.target.value)}>
                  <option value="WORK_VISA">Work Visa</option>
                  <option value="BUSINESS_VISA">Business Visa</option>
                  <option value="RESIDENCE_VISA">Residence Visa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase block mb-1">Visa Stamping Status</label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PENDING">PENDING (Embassy Submission)</option>
                  <option value="APPLIED">APPLIED (Processing)</option>
                  <option value="APPROVED">APPROVED (Visa Issued)</option>
                  <option value="STAMPED">STAMPED (Passport Stamped)</option>
                  <option value="REJECTED">REJECTED (Visa Denied)</option>
                </select>
              </div>

              <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
                <h4 className="font-bold text-xs text-primary uppercase">MOFA (Ministry of Foreign Affairs) Record</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="MOFA Reference No." placeholder="MOFA-948201" value={mofaNumber} onChange={(e) => setMofaNumber(e.target.value)} />
                  <Input label="MOFA Fee ($)" type="number" value={mofaFee} onChange={(e) => setMofaFee(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">MOFA Status</label>
                  <select className="w-full h-9 px-3 rounded-md border bg-background text-xs" value={mofaStatus} onChange={(e) => setMofaStatus(e.target.value)}>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <Input label="Stamped Visa Copy URL" placeholder="https://storage.googleapis.com/docs/visa.pdf" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} />
              <Input label="Remarks & Tracking Notes" placeholder="Embassy submission completed..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={saveVisaMutation.isPending}>Save Visa & MOFA</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
