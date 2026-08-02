import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demandApi, employerApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import {
  FileCheck,
  Plus,
  Building2,
  Users,
  CheckCircle,
  Clock,
  Printer,
  X,
  Briefcase,
} from 'lucide-react';

const BENEFITS_LIST = [
  'Free Accommodation',
  'Food Allowance / Free Meals',
  'Medical Insurance',
  'Transportation Allowance',
  'Round-trip Flight Ticket',
  'Paid Annual Leave',
  'Overtime Pay',
];

export function DemandsPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportDemand, setReportDemand] = useState<any | null>(null);

  // Form State
  const [employerId, setEmployerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantityRequired, setQuantityRequired] = useState(10);
  const [salary, setSalary] = useState(1500);
  const [currency, setCurrency] = useState('USD');
  const [contractPeriod, setContractPeriod] = useState('2 Years');
  const [closingDate, setClosingDate] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([
    'Free Accommodation',
    'Medical Insurance',
    'Round-trip Flight Ticket',
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: demands, isLoading } = useQuery({
    queryKey: ['demands', selectedStatus],
    queryFn: () => demandApi.getDemands(selectedStatus || undefined),
  });

  const { data: metrics } = useQuery({
    queryKey: ['demandMetrics'],
    queryFn: demandApi.getDemandMetrics,
  });

  const { data: employers } = useQuery({
    queryKey: ['employers'],
    queryFn: () => employerApi.getEmployers(),
  });

  const createMutation = useMutation({
    mutationFn: demandApi.createDemand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['demandMetrics'] });
      toast({ type: 'success', title: 'Demand Created', message: 'Employer demand order indexed into active pipeline.' });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Could not save demand.' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => demandApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      toast({ type: 'info', title: 'Status Updated', message: 'Demand pipeline status changed.' });
    },
  });

  const resetForm = () => {
    setEmployerId('');
    setTitle('');
    setDescription('');
    setQuantityRequired(10);
    setSalary(1500);
    setClosingDate('');
  };

  const handleBenefitToggle = (b: string) => {
    if (selectedBenefits.includes(b)) {
      setSelectedBenefits(selectedBenefits.filter((item) => item !== b));
    } else {
      setSelectedBenefits([...selectedBenefits, b]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerId || !title || !description) {
      toast({ type: 'error', title: 'Validation Error', message: 'Employer and position title are required.' });
      return;
    }
    createMutation.mutate({
      employerId,
      title,
      description,
      quantityRequired: Number(quantityRequired),
      salary: Number(salary),
      currency,
      benefits: selectedBenefits,
      contractPeriod,
      closingDate: closingDate || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Employer Demand Requisitions</h1>
          <p className="text-sm text-muted-foreground">
            Manage required positions, quota fulfillment, benefits, and candidate assignments
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Create Demand Order
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Demands</p>
            <p className="text-2xl font-extrabold mt-1">{metrics?.totalDemands || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <FileCheck className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Active Pipeline</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-500">{metrics?.activeDemands || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Quota Required</p>
            <p className="text-2xl font-extrabold mt-1 text-purple-500">{metrics?.totalRequiredQuantity || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Users className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Fulfilled Demands</p>
            <p className="text-2xl font-extrabold mt-1 text-amber-500">{metrics?.fulfilledDemands || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <CheckCircle className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {['', 'ACTIVE', 'DRAFT', 'FULFILLED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {st || 'All Requisitions'}
          </button>
        ))}
      </div>

      {/* Demands List */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : demands && demands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {demands.map((d: any) => (
            <Card key={d.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">{d.demandNumber}</span>
                    <CardTitle className="text-lg">{d.title}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> {d.employer?.companyName} ({d.employer?.country})
                    </p>
                  </div>
                  <Badge variant={d.status === 'ACTIVE' ? 'success' : d.status === 'FULFILLED' ? 'secondary' : 'outline'}>
                    {d.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 text-xs flex-1">
                <p className="text-muted-foreground leading-relaxed line-clamp-2">{d.description}</p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Quota</span>
                    <span className="font-extrabold text-sm text-foreground">{d.quantityRequired} Open</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Salary</span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{d.currency} {Number(d.salary).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Contract</span>
                    <span className="font-extrabold text-sm text-foreground">{d.contractPeriod}</span>
                  </div>
                </div>

                {d.benefits && d.benefits.length > 0 && (
                  <div>
                    <span className="font-bold text-[11px] block mb-1">Provided Benefits:</span>
                    <div className="flex flex-wrap gap-1">
                      {d.benefits.map((b: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setReportDemand(d)}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Demand Report
                </Button>

                <div className="flex items-center gap-2">
                  <select
                    className="h-8 px-2 rounded-md border text-xs bg-background"
                    value={d.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: d.id, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="FULFILLED">FULFILLED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No demand requisitions found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create an employer demand order to assign candidate deployment quotas.</p>
        </Card>
      )}

      {/* Create Demand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" /> Create Employer Demand Requisition
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Select Employer Partner</label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={employerId}
                  onChange={(e) => setEmployerId(e.target.value)}
                >
                  <option value="">Select Corporate Employer...</option>
                  {employers?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.companyName} ({emp.country})</option>
                  ))}
                </select>
              </div>

              <Input label="Required Position Title" placeholder="Senior MEP Engineer / Construction Supervisor" value={title} onChange={(e) => setTitle(e.target.value)} />

              <div>
                <label className="text-xs font-bold uppercase block mb-1">Job Description & Responsibilities</label>
                <textarea rows={3} className="w-full p-3 rounded-md border bg-background text-sm" placeholder="Detailed job specifications and qualifications..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input label="Quantity Needed" type="number" value={quantityRequired} onChange={(e) => setQuantityRequired(Number(e.target.value))} />
                <Input label="Monthly Salary" type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Currency</label>
                  <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="QAR">QAR (Qatar Riyal)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Contract Duration" placeholder="2 Years (Renewable)" value={contractPeriod} onChange={(e) => setContractPeriod(e.target.value)} />
                <Input label="Target Closing Date" type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase block mb-2">Employer Provided Benefits</label>
                <div className="grid grid-cols-2 gap-2">
                  {BENEFITS_LIST.map((b) => (
                    <label key={b} className="flex items-center gap-2 p-2 border rounded-md text-xs cursor-pointer hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={selectedBenefits.includes(b)}
                        onChange={() => handleBenefitToggle(b)}
                        className="rounded border-input text-primary"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending}>Submit Demand Order</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {reportDemand && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-2xl font-extrabold">{reportDemand.demandNumber} — Official Demand Letter</h3>
                <p className="text-xs text-muted-foreground">{reportDemand.employer?.companyName} ({reportDemand.employer?.country})</p>
              </div>
              <button onClick={() => setReportDemand(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                <p className="font-bold text-sm text-primary">{reportDemand.title}</p>
                <p>{reportDemand.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 border p-4 rounded-xl font-semibold">
                <div>Required Quota: <span className="font-extrabold">{reportDemand.quantityRequired}</span></div>
                <div>Salary: <span className="font-extrabold">{reportDemand.currency} {reportDemand.salary}</span></div>
                <div>Contract: <span className="font-extrabold">{reportDemand.contractPeriod}</span></div>
              </div>

              <div>
                <h4 className="font-bold border-b pb-1 mb-2">Benefit Package</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {reportDemand.benefits?.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print Demand Letter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
