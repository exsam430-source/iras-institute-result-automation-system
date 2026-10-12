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

const DEGREE_TYPES = [
  { value: 'BS', label: 'BS (Bachelor of Science)' },
  { value: 'MS', label: 'MS (Master of Science)' },
  { value: 'PhD', label: 'PhD (Doctorate)' },
  { value: 'MPhil', label: 'MPhil' },
  { value: 'Associate', label: 'Associate Degree' },
  { value: 'BBA', label: 'BBA' },
  { value: 'MBA', label: 'MBA' },
];

const schema = z.object({
  name: z.string().min(2, 'Required').max(100),
  code: z.string().min(2).max(15),
  department: z.string().min(1, 'Department is required'),
  institute: z.string().min(1, 'Institute is required'),
  degreeType: z.string().min(1, 'Degree type is required'),
  totalSemesters: z.string().min(1, 'Required'),
  totalCreditHours: z.string().min(1, 'Required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  eligibility: z.string().max(500).optional().or(z.literal('')),
  duration: z.string().max(100).optional().or(z.literal('')),
});

const ProgramForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', department: '', institute: '', degreeType: '', totalSemesters: '', totalCreditHours: '', description: '', eligibility: '', duration: '' },
  });

  const selectedInstitute = watch('institute');

  useEffect(() => {
    api.get('/institutes?limit=100&isActive=true').then((res) => {
      setInstitutes((res.data.data.institutes || []).map((i) => ({ value: i._id, label: `${i.name} (${i.code})` })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedInstitute) {
      api.get(`/institutes/${selectedInstitute}/departments`).then((res) => {
        setDepartments((res.data.data.departments || []).map((d) => ({ value: d._id, label: `${d.name} (${d.code})` })));
      }).catch(() => {});
    } else {
      setDepartments([]);
    }
  }, [selectedInstitute]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/programs/${id}`).then((res) => {
        const prog = res.data.data.program;
        reset({
          name: prog.name || '', code: prog.code || '', department: prog.department?._id || '',
          institute: prog.institute?._id || '', degreeType: prog.degreeType || '',
          totalSemesters: prog.totalSemesters?.toString() || '', totalCreditHours: prog.totalCreditHours?.toString() || '',
          description: prog.description || '', eligibility: prog.eligibility || '', duration: prog.duration || '',
        });
      }).catch(() => { toast.error('Failed to load'); navigate('/admin/programs'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name, code: data.code.toUpperCase(), department: data.department, institute: data.institute,
        degreeType: data.degreeType, totalSemesters: parseInt(data.totalSemesters), totalCreditHours: parseInt(data.totalCreditHours),
        description: data.description || null, eligibility: data.eligibility || null, duration: data.duration || null,
      };

      if (isEdit) {
        const { department: _, institute: __, code: ___, ...updateData } = payload;
        await api.patch(`/programs/${id}`, updateData);
        toast.success('Program updated');
      } else {
        await api.post('/programs', payload);
        toast.success('Program created');
      }
      navigate('/admin/programs');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/programs')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500"><HiOutlineArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Program' : 'Create Program'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? 'Update program details' : 'Add a new degree program'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Program Details</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Program Name" required error={errors.name?.message} {...register('name')} placeholder="e.g., BS Computer Science" containerClassName="sm:col-span-2" />
            <Input label="Code" required error={errors.code?.message} {...register('code')} placeholder="e.g., BSCS" className="uppercase" disabled={isEdit} />
            <Select label="Degree Type" required options={DEGREE_TYPES} error={errors.degreeType?.message} {...register('degreeType')} disabled={isEdit} />
            <Select label="Institute" required options={institutes} error={errors.institute?.message} {...register('institute')} placeholder="Select Institute" disabled={isEdit} />
            <Select label="Department" required options={departments} error={errors.department?.message} {...register('department')} placeholder="Select Department" disabled={isEdit} />
            <Input label="Total Semesters" type="number" required error={errors.totalSemesters?.message} {...register('totalSemesters')} placeholder="e.g., 8" />
            <Input label="Total Credit Hours" type="number" required error={errors.totalCreditHours?.message} {...register('totalCreditHours')} placeholder="e.g., 130" />
            <Input label="Duration" {...register('duration')} placeholder="e.g., 4 Years" />
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Program description..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Eligibility</label>
              <textarea {...register('eligibility')} rows={2} placeholder="Eligibility criteria..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/programs')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{isEdit ? 'Update' : 'Create'} Program</Button>
        </div>
      </form>
    </div>
  );
};

export default ProgramForm;