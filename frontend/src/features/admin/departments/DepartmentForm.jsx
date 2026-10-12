import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().min(2).max(10).regex(/^[A-Za-z0-9]+$/, 'Only letters and numbers'),
  institute: z.string().min(1, 'Institute is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  vision: z.string().max(500).optional().or(z.literal('')),
  mission: z.string().max(500).optional().or(z.literal('')),
  establishedYear: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
});

const DepartmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', institute: '', description: '', vision: '', mission: '', establishedYear: '', contactEmail: '', contactPhone: '' },
  });

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const res = await api.get('/institutes?limit=100&isActive=true');
        setInstitutes((res.data.data.institutes || []).map((i) => ({ value: i._id, label: `${i.name} (${i.code})` })));
      } catch {}
    };
    fetchInstitutes();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchDept = async () => {
        try {
          const res = await api.get(`/departments/${id}`);
          const dept = res.data.data.department;
          reset({
            name: dept.name || '', code: dept.code || '', institute: dept.institute?._id || '',
            description: dept.description || '', vision: dept.vision || '', mission: dept.mission || '',
            establishedYear: dept.establishedYear?.toString() || '', contactEmail: dept.contactEmail || '', contactPhone: dept.contactPhone || '',
          });
        } catch {
          toast.error('Failed to load department');
          navigate('/admin/departments');
        } finally { setLoading(false); }
      };
      fetchDept();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name, code: data.code.toUpperCase(), institute: data.institute,
        description: data.description || null, vision: data.vision || null, mission: data.mission || null,
        establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
        contactEmail: data.contactEmail || null, contactPhone: data.contactPhone || null,
      };

      if (isEdit) {
        const { institute: _, code: __, ...updatePayload } = payload;
        await api.patch(`/departments/${id}`, updatePayload);
        toast.success('Department updated');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created');
      }
      navigate('/admin/departments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/departments')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Department' : 'Create Department'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? 'Update department details' : 'Add a new department under an institute'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Basic Information</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Department Name" required error={errors.name?.message} {...register('name')} placeholder="e.g., Computer Science" />
            <Input label="Code" required error={errors.code?.message} {...register('code')} placeholder="e.g., CS" className="uppercase" disabled={isEdit} />
            <Select label="Institute" required options={institutes} error={errors.institute?.message} disabled={isEdit} {...register('institute')} placeholder="Select Institute" containerClassName="sm:col-span-2" />
            <Input label="Established Year" type="number" {...register('establishedYear')} placeholder="e.g., 2010" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Department description..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400" />
          </div>
        </Card>

        <Card>
          <Card.Header><Card.Title>Contact Information</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} placeholder="cs@uswat.edu.pk" />
            <Input label="Phone" {...register('contactPhone')} placeholder="+92-946-710488" />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/departments')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{isEdit ? 'Update' : 'Create'} Department</Button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;