import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employerSchema, EmployerFormData } from '../lib/validations';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe,
  UserCheck,
  Briefcase,
  BadgeCheck,
  X,
  Trash2,
  Edit2,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

const COUNTRIES = ['All', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Japan', 'United Kingdom', 'USA'];

export function EmployersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<any | null>(null);
  const [detailEmployer, setDetailEmployer] = useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employers, isLoading } = useQuery({
    queryKey: ['employers', searchQuery, selectedCountry],
    queryFn: () => employerApi.getEmployers(searchQuery || undefined, selectedCountry === 'All' ? undefined : selectedCountry),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmployerFormData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      isVerified: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: employerApi.createEmployer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      toast({ type: 'success', title: 'Employer Added', message: 'Corporate hiring partner registered.' });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Action Failed', message: err.response?.data?.message || 'Could not save employer.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employerApi.updateEmployer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      toast({ type: 'success', title: 'Employer Updated', message: 'Company details updated.' });
      setIsModalOpen(false);
      setEditingEmployer(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employerApi.deleteEmployer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      toast({ type: 'info', title: 'Employer Deleted', message: 'Corporate partner record removed.' });
    },
  });

  const onSubmit = (data: EmployerFormData) => {
    if (editingEmployer) {
      updateMutation.mutate({ id: editingEmployer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditClick = (emp: any) => {
    setEditingEmployer(emp);
    setValue('companyName', emp.companyName);
    setValue('companyEmail', emp.companyEmail);
    setValue('companyPhone', emp.companyPhone);
    setValue('country', emp.country);
    setValue('address', emp.address || '');
    setValue('contactPerson', emp.contactPerson);
    setValue('website', emp.website || '');
    setValue('isVerified', emp.isVerified);
    setIsModalOpen(true);
  };

  const totalEmployers = employers?.length || 0;
  const verifiedCount = employers?.filter((e: any) => e.isVerified).length || 0;
  const totalOpenDemands = employers?.reduce((acc: number, curr: any) => acc + (curr._count?.demands || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Employer Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage corporate hiring partners, international client demands, and recruitment history
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployer(null);
            reset();
            setIsModalOpen(true);
          }}
          className="shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Employer
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Employers</p>
            <p className="text-2xl font-extrabold mt-1">{totalEmployers}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Building2 className="h-6 w-6" />
          </div>
        </Card>
        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Verified Partners</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-500">{verifiedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <BadgeCheck className="h-6 w-6" />
          </div>
        </Card>
        <Card className="border p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Active Demands</p>
            <p className="text-2xl font-extrabold mt-1 text-amber-500">{totalOpenDemands}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <FileCheck className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Search & Country Filter */}
      <Card className="p-4 border">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search company or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {COUNTRIES.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCountry === country
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Employers Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : employers && employers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employers.map((emp: any) => (
            <Card key={emp.id} className="border flex flex-col justify-between hover:shadow-lg transition-all">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{emp.companyName}</CardTitle>
                      {emp.isVerified && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {emp.country}
                    </p>
                  </div>
                  <Badge variant={emp.isVerified ? 'success' : 'secondary'}>
                    {emp.isVerified ? 'VERIFIED' : 'PENDING'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs flex-1">
                <div className="flex items-center gap-2 text-foreground">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{emp.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{emp.companyEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{emp.companyPhone}</span>
                </div>
                {emp.website && (
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="h-4 w-4" />
                    <a href={emp.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      {emp.website}
                    </a>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/40 border flex items-center justify-between mt-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> Open Requisitions
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{emp._count?.demands || 0} Demands</span>
                </div>
              </CardContent>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setDetailEmployer(emp)}>
                  Recruitment History
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(emp)} title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(emp.id)}
                    className="text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No employers found</h3>
          <p className="text-sm text-muted-foreground mt-1">Register corporate hiring partners to assign candidate demand orders.</p>
        </Card>
      )}

      {/* Add / Edit Employer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {editingEmployer ? 'Edit Corporate Partner' : 'Register New Employer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Company / Agency Name" placeholder="Al Khaleej Construction Co." error={errors.companyName?.message} {...register('companyName')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Company Email" type="email" placeholder="hr@alkhaleej.com" error={errors.companyEmail?.message} {...register('companyEmail')} />
                <Input label="Company Phone" placeholder="+966 50 123 4567" error={errors.companyPhone?.message} {...register('companyPhone')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Country" placeholder="Saudi Arabia / UAE" error={errors.country?.message} {...register('country')} />
                <Input label="Contact Person" placeholder="Mohammed Al-Farsi" error={errors.contactPerson?.message} {...register('contactPerson')} />
              </div>

              <Input label="Company Address" placeholder="King Fahd Rd, Riyadh" {...register('address')} />
              <Input label="Website URL" placeholder="https://company.com" error={errors.website?.message} {...register('website')} />

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isVerified" className="rounded border-input text-primary" {...register('isVerified')} />
                <label htmlFor="isVerified" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" /> Verified Partner Employer
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingEmployer ? 'Update Partner' : 'Save Employer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruitment History Drawer */}
      {detailEmployer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> {detailEmployer.companyName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{detailEmployer.country} • {detailEmployer.contactPerson}</p>
              </div>
              <button onClick={() => setDetailEmployer(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-sm text-primary uppercase border-b pb-1">Historical Demand Orders</h4>
              {detailEmployer.demands && detailEmployer.demands.length > 0 ? (
                detailEmployer.demands.map((d: any) => (
                  <div key={d.id} className="p-4 border rounded-xl bg-muted/20 space-y-2">
                    <div className="flex justify-between font-bold text-sm">
                      <span>{d.title} ({d.demandNumber})</span>
                      <Badge variant="success">{d.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">{d.description}</p>
                    <p className="text-[11px] font-semibold text-primary">Required: {d.quantityRequired} candidates • Salary: {d.currency} {d.salary}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic">No historical demand requisitions recorded for this employer yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
