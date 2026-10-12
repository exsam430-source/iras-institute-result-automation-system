import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10).regex(/^[A-Za-z0-9]+$/, 'Only letters and numbers allowed'),
  shortName: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  vision: z.string().max(500).optional().or(z.literal('')),
  mission: z.string().max(500).optional().or(z.literal('')),
  establishedYear: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  building: z.string().max(100).optional().or(z.literal('')),
  floor: z.string().max(50).optional().or(z.literal('')),
  campus: z.string().max(100).optional().or(z.literal('')),
});

const InstituteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', code: '', shortName: '', description: '', vision: '', mission: '',
      establishedYear: '', contactEmail: '', contactPhone: '', website: '',
      building: '', floor: '', campus: 'Main Campus',
    },
  });

  useEffect(() => {
    if (isEdit) {
      const fetchInstitute = async () => {
        try {
          const res = await api.get(`/institutes/${id}`);
          const inst = res.data.data.institute;
          reset({
            name: inst.name || '',
            code: inst.code || '',
            shortName: inst.shortName || '',
            description: inst.description || '',
            vision: inst.vision || '',
            mission: inst.mission || '',
            establishedYear: inst.establishedYear?.toString() || '',
            contactEmail: inst.contactEmail || '',
            contactPhone: inst.contactPhone || '',
            website: inst.website || '',
            building: inst.location?.building || '',
            floor: inst.location?.floor || '',
            campus: inst.location?.campus || 'Main Campus',
          });
        } catch {
          toast.error('Failed to load institute');
          navigate('/admin/institutes');
        } finally {
          setLoading(false);
        }
      };
      fetchInstitute();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code.toUpperCase(),
        shortName: data.shortName || null,
        description: data.description || null,
        vision: data.vision || null,
        mission: data.mission || null,
        establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        website: data.website || null,
        location: {
          building: data.building || null,
          floor: data.floor || null,
          campus: data.campus || 'Main Campus',
        },
      };

      if (isEdit) {
        await api.patch(`/institutes/${id}`, payload);
        toast.success('Institute updated successfully');
      } else {
        await api.post('/institutes', payload);
        toast.success('Institute created successfully');
      }
      navigate('/admin/institutes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save institute');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/institutes')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Institute' : 'Create Institute'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit ? 'Update institute information' : 'Add a new institute to the university'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <Card.Header>
            <Card.Title>Basic Information</Card.Title>
          </Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Institute Name" required error={errors.name?.message} {...register('name')} placeholder="e.g., Institute of Computing" />
            <Input label="Code" required error={errors.code?.message} {...register('code')} placeholder="e.g., IOC" className="uppercase" />
            <Input label="Short Name" error={errors.shortName?.message} {...register('shortName')} placeholder="e.g., Computing" />
            <Input label="Established Year" type="number" error={errors.establishedYear?.message} {...register('establishedYear')} placeholder="e.g., 2005" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Brief description of the institute..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all placeholder:text-gray-400" />
          </div>
        </Card>

        {/* Vision & Mission */}
        <Card>
          <Card.Header>
            <Card.Title>Vision & Mission</Card.Title>
          </Card.Header>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vision</label>
              <textarea {...register('vision')} rows={2} placeholder="Institute vision statement..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mission</label>
              <textarea {...register('mission')} rows={2} placeholder="Institute mission statement..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all placeholder:text-gray-400" />
            </div>
          </div>
        </Card>

        {/* Contact & Location */}
        <Card>
          <Card.Header>
            <Card.Title>Contact & Location</Card.Title>
          </Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} placeholder="e.g., ioc@uswat.edu.pk" />
            <Input label="Contact Phone" error={errors.contactPhone?.message} {...register('contactPhone')} placeholder="e.g., +92-946-710488" />
            <Input label="Website" error={errors.website?.message} {...register('website')} placeholder="e.g., https://ioc.uswat.edu.pk" />
            <Input label="Building" {...register('building')} placeholder="e.g., Block-A" />
            <Input label="Floor" {...register('floor')} placeholder="e.g., 1st-3rd" />
            <Input label="Campus" {...register('campus')} placeholder="e.g., Main Campus" />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/institutes')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {isEdit ? 'Update Institute' : 'Create Institute'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InstituteForm;