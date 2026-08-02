import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi, resumeApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import {
  Stethoscope,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function MedicalsPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [candidateId, setCandidateId] = useState('');
  const [clinicName, setClinicName] = useState('GAMCA Approved Medical Center');
  const [reportNo, setReportNo] = useState('');
  const [testDate, setTestDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [remarks, setRemarks] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medicals, isLoading } = useQuery({
    queryKey: ['medicals', selectedStatus],
    queryFn: () => medicalApi.getMedicals(selectedStatus || undefined),
  });

  const { data: metrics } = useQuery({
    queryKey: ['medicalMetrics'],
    queryFn: medicalApi.getMetrics,
  });

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => resumeApi.getCandidates(),
  });

  const scheduleMutation = useMutation({
    mutationFn: medicalApi.scheduleOrUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicals'] });
      queryClient.invalidateQueries({ queryKey: ['medicalMetrics'] });
      toast({ type: 'success', title: 'Medical Examination Saved', message: 'Candidate medical record indexed.' });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || 'Could not save medical record.' });
    },
  });

  const resetForm = () => {
    setCandidateId('');
    setReportNo('');
    setTestDate('');
    setExpiryDate('');
    setStatus('PENDING');
    setRemarks('');
    setDocumentUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !clinicName || !reportNo || !testDate) {
      toast({ type: 'error', title: 'Validation Error', message: 'Candidate, clinic name, report no, and test date are required.' });
      return;
    }
    scheduleMutation.mutate({
      candidateId,
      clinicName,
      reportNo,
      testDate,
      expiryDate: expiryDate || undefined,
      status,
      remarks,
      documentUrl,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Medical Examination & Clearance <Stethoscope className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Track GAMCA / GCC approved clinic appointments, FIT/UNFIT reports, and 30-day report expiry alerts
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Schedule Medical Test
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Cases</p>
            <p className="text-xl font-extrabold mt-1">{metrics?.total || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Stethoscope className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">FIT Clearances</p>
            <p className="text-xl font-extrabold mt-1 text-emerald-500">{metrics?.fit || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">UNFIT Cases</p>
            <p className="text-xl font-extrabold mt-1 text-rose-500">{metrics?.unfit || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pending Exams</p>
            <p className="text-xl font-extrabold mt-1 text-amber-500">{metrics?.pending || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border p-4 flex items-center justify-between bg-amber-500/5">
          <div>
            <p className="text-[10px] font-semibold text-amber-600 uppercase">Expiring Soon (30d)</p>
            <p className="text-xl font-extrabold mt-1 text-amber-600">{metrics?.expiringSoon || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {['', 'FIT', 'UNFIT', 'PENDING', 'REEXAMINE'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {st || 'All Medical Records'}
          </button>
        ))}
      </div>

      {/* Medical List */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : medicals && medicals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicals.map((m: any) => (
            <Card key={m.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" /> {m.candidate?.firstName} {m.candidate?.lastName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{m.candidate?.email}</p>
                  </div>
                  <Badge variant={m.status === 'FIT' ? 'success' : m.status === 'UNFIT' ? 'destructive' : 'outline'}>
                    {m.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> GAMCA Center:
                  </span>
                  <span className="font-semibold">{m.clinicName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Report No:
                  </span>
                  <span className="font-mono font-bold text-foreground">{m.reportNo}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Exam Date:
                  </span>
                  <span>{formatDate(m.testDate)}</span>
                </div>

                {m.expiryDate && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-amber-600">
                    <span className="flex items-center gap-1 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> Expiry Date:
                    </span>
                    <span className="font-bold">{formatDate(m.expiryDate)}</span>
                  </div>
                )}

                {m.remarks && (
                  <p className="p-2 bg-muted/40 rounded text-muted-foreground italic">"{m.remarks}"</p>
                )}
              </CardContent>

              {m.documentUrl && (
                <div className="p-4 border-t bg-muted/10">
                  <a href={m.documentUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> View Medical Certificate PDF
                    </Button>
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No medical examination records</h3>
          <p className="text-sm text-muted-foreground mt-1">Schedule candidate appointments at GCC / GAMCA authorized medical centers.</p>
        </Card>
      )}

      {/* Schedule / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> Schedule Medical Appointment
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

              <Input label="Medical Center / Clinic Name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
              <Input label="Medical Report / Slip Number" placeholder="REP-849201" value={reportNo} onChange={(e) => setReportNo(e.target.value)} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Test Date" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                <Input label="Report Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase block mb-1">Medical Clearance Status</label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PENDING">PENDING (Test Scheduled)</option>
                  <option value="FIT">FIT (Cleared for Visa)</option>
                  <option value="UNFIT">UNFIT (Medical Disqualification)</option>
                  <option value="REEXAMINE">REEXAMINE (Re-test Required)</option>
                </select>
              </div>

              <Input label="Report Document Storage URL" placeholder="https://storage.googleapis.com/docs/medical.pdf" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} />
              <Input label="Doctor Remarks" placeholder="Fit for duty. All blood & chest X-ray tests normal." value={remarks} onChange={(e) => setRemarks(e.target.value)} />

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={scheduleMutation.isPending}>Save Medical Record</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
