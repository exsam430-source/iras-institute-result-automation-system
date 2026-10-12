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

const COURSE_TYPES = [{ value: 'theory', label: 'Theory' }, { value: 'lab', label: 'Lab' }, { value: 'theory+lab', label: 'Theory + Lab' }];
const COURSE_CATEGORIES = [{ value: 'core', label: 'Core' }, { value: 'elective', label: 'Elective' }, { value: 'general', label: 'General' }];
const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const schema = z.object({
  name: z.string().min(2, 'Required').max(100),
  code: z.string().min(1, 'Required').max(20),
  creditHours: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  program: z.string().min(1, 'Program is required'),
  department: z.string().min(1, 'Department is required'),
  institute: z.string().min(1, 'Institute is required'),
  semester: z.string().min(1, 'Semester is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  midTerm: z.string().optional().default('20'),
  internal: z.string().optional().default('20'),
  finalTerm: z.string().optional().default('60'),
});

const CourseForm = () => {
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
    defaultValues: { name: '', code: '', creditHours: '3', type: 'theory', category: 'core', program: '', department: '', institute: '', semester: '', description: '', midTerm: '20', internal: '20', finalTerm: '60' },
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
      api.get(`/courses/${id}`).then((res) => {
        const c = res.data.data.course;
        reset({
          name: c.name || '', code: c.code || '', creditHours: c.creditHours?.toString() || '3',
          type: c.type || 'theory', category: c.category || 'core',
          program: c.program?._id || '', department: c.department?._id || '', institute: c.institute?._id || '',
          semester: c.semester?.toString() || '', description: c.description || '',
          midTerm: c.marksDistribution?.midTerm?.toString() || '20',
          internal: c.marksDistribution?.internal?.toString() || '20',
          finalTerm: c.marksDistribution?.finalTerm?.toString() || '60',
        });
      }).catch(() => { toast.error('Failed to load'); navigate('/admin/courses'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    const mid = parseInt(data.midTerm) || 20;
    const int = parseInt(data.internal) || 20;
    const fin = parseInt(data.finalTerm) || 60;

    if (mid + int + fin !== 100) {
      toast.error(`Marks must total 100. Current total: ${mid + int + fin}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: data.name, code: data.code.toUpperCase(), creditHours: parseInt(data.creditHours),
        type: data.type, category: data.category, program: data.program, department: data.department,
        institute: data.institute, semester: parseInt(data.semester), description: data.description || null,
        marksDistribution: { midTerm: mid, internal: int, finalTerm: fin },
      };

      if (isEdit) {
        const { program: _, department: __, institute: ___, code: ____, ...updateData } = payload;
        await api.patch(`/courses/${id}`, updateData);
        toast.success('Course updated');
      } else {
        await api.post('/courses', payload);
        toast.success('Course created');
      }
      navigate('/admin/courses');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/courses')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500"><HiOutlineArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Course' : 'Create Course'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? 'Update course details' : 'Add a new course'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Course Details</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Course Name" required error={errors.name?.message} {...register('name')} placeholder="e.g., Data Structures" containerClassName="sm:col-span-2" />
            <Input label="Course Code" required error={errors.code?.message} {...register('code')} placeholder="e.g., CS-201" className="uppercase" disabled={isEdit} />
            <Input label="Credit Hours" type="number" required error={errors.creditHours?.message} {...register('creditHours')} placeholder="e.g., 3" />
            <Select label="Type" required options={COURSE_TYPES} error={errors.type?.message} {...register('type')} />
            <Select label="Category" required options={COURSE_CATEGORIES} error={errors.category?.message} {...register('category')} />
            <Select label="Institute" required options={institutes} error={errors.institute?.message} {...register('institute')} placeholder="Select" disabled={isEdit} />
            <Select label="Department" required options={departments} error={errors.department?.message} {...register('department')} placeholder="Select" disabled={isEdit} />
            <Select label="Program" required options={programs} error={errors.program?.message} {...register('program')} placeholder="Select" disabled={isEdit} />
            <Select label="Semester" required options={SEMESTER_OPTIONS} error={errors.semester?.message} {...register('semester')} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} placeholder="Course description..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400" />
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Marks Distribution</Card.Title>
            <Card.Description>Must total 100</Card.Description>
          </Card.Header>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Mid-Term" type="number" {...register('midTerm')} placeholder="20" />
            <Input label="Internal" type="number" {...register('internal')} placeholder="20" />
            <Input label="Final Term" type="number" {...register('finalTerm')} placeholder="60" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Total: {(parseInt(watch('midTerm')) || 0) + (parseInt(watch('internal')) || 0) + (parseInt(watch('finalTerm')) || 0)} / 100
          </p>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{isEdit ? 'Update' : 'Create'} Course</Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;