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
  startYear: z.string().min(1, 'Required'),
  endYear: z.string().min(1, 'Required'),
  program: z.string().min(1, 'Program is required'),
  department: z.string().min(1, 'Department is required'),
  institute: z.string().min(1, 'Institute is required'),
  admissionDate: z.string().optional().or(z.literal('')),
  isCurrent: z.boolean().optional(),
});

const SessionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { startYear: '', endYear: '', program: '', department: '', institute: '', admissionDate: '', isCurrent: false },
  });

  const selectedInstitute = watch('institute');
  const selectedDepartment = watch('department');

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
    }
  }, [selectedInstitute]);

  useEffect(() => {
    if (selectedDepartment) {
      api.get(`/programs?department=${selectedDepartment}&isActive=true&limit=100`).then((res) => {
        setPrograms((res.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })));
      }).catch(() => {});
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/sessions/${id}`).then((res) => {
        const ses = res.data.data.session;
        reset({
          startYear: ses.startYear?.toString() || '', endYear: ses.endYear?.toString() || '',
          program: ses.program?._id || '', department: ses.department?._id || '', institute: ses.institute?._id || '',
          admissionDate: ses.admissionDate?.split('T')[0] || '', isCurrent: ses.isCurrent || false,
        });
      }).catch(() => { toast.error('Failed to load'); navigate('/admin/sessions'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/sessions/${id}`, {
          isActive: true, isCurrent: data.isCurrent,
          admissionDate: data.admissionDate || null,
        });
        toast.success('Session updated');
      } else {
        await api.post('/sessions', {
          startYear: parseInt(data.startYear), endYear: parseInt(data.endYear),
          program: data.program, department: data.department, institute: data.institute,
          admissionDate: data.admissionDate || null, isCurrent: data.isCurrent || false,
        });
        toast.success('Session created');
      }
      navigate('/admin/sessions');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/sessions')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500"><HiOutlineArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Session' : 'Create Session'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? 'Update session details' : 'Add a new academic session'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Session Details</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Year" type="number" required error={errors.startYear?.message} {...register('startYear')} placeholder="e.g., 2024" disabled={isEdit} />
            <Input label="End Year" type="number" required error={errors.endYear?.message} {...register('endYear')} placeholder="e.g., 2028" disabled={isEdit} />
            <Select label="Institute" required options={institutes} error={errors.institute?.message} {...register('institute')} placeholder="Select Institute" disabled={isEdit} />
            <Select label="Department" required options={departments} error={errors.department?.message} {...register('department')} placeholder="Select Department" disabled={isEdit} />
            <Select label="Program" required options={programs} error={errors.program?.message} {...register('program')} placeholder="Select Program" disabled={isEdit} />
            <Input label="Admission Date" type="date" {...register('admissionDate')} />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isCurrent')} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-dark-surface dark:border-dark-border" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as current session</span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/sessions')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{isEdit ? 'Update' : 'Create'} Session</Button>
        </div>
      </form>
    </div>
  );
};

export default SessionForm;