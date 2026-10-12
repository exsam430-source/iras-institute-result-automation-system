import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => ({ value: b, label: b }));

const schema = z.object({
  firstName: z.string().min(2, 'Required'), lastName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])/, 'Requires uppercase, lowercase, number, special char'),
  institute: z.string().min(1, 'Required'), department: z.string().min(1, 'Required'),
  program: z.string().min(1, 'Required'), session: z.string().min(1, 'Required'),
  fatherName: z.string().min(2, 'Required'),
  gender: z.string().optional().or(z.literal('')), phone: z.string().optional().or(z.literal('')),
  bloodGroup: z.string().optional().or(z.literal('')), admissionDate: z.string().optional().or(z.literal('')),
});

const StudentForm = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', institute: '', department: '', program: '', session: '', fatherName: '', gender: '', phone: '', bloodGroup: '', admissionDate: '' },
  });

  const selectedInstitute = watch('institute');
  const selectedDepartment = watch('department');
  const selectedProgram = watch('program');

  useEffect(() => { api.get('/institutes?limit=100&isActive=true').then((r) => setInstitutes((r.data.data.institutes || []).map((i) => ({ value: i._id, label: `${i.name} (${i.code})` })))).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedInstitute) { api.get(`/institutes/${selectedInstitute}/departments`).then((r) => setDepartments((r.data.data.departments || []).map((d) => ({ value: d._id, label: `${d.name} (${d.code})` })))).catch(() => {}); }
    else setDepartments([]);
  }, [selectedInstitute]);

  useEffect(() => {
    if (selectedDepartment) { api.get(`/programs?department=${selectedDepartment}&isActive=true&limit=100`).then((r) => setPrograms((r.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })))).catch(() => {}); }
    else setPrograms([]);
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedProgram) { api.get(`/sessions?program=${selectedProgram}&isActive=true&limit=100`).then((r) => setSessions((r.data.data.sessions || []).map((s) => ({ value: s._id, label: s.name })))).catch(() => {}); }
    else setSessions([]);
  }, [selectedProgram]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/students', {
        ...data, password: data.password, admissionDate: data.admissionDate || null,
        bloodGroup: data.bloodGroup || null, phone: data.phone || null, gender: data.gender || null,
      });
      toast.success(res.data.message || 'Student created');
      navigate('/admin/students');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/students')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500"><HiOutlineArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Student</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enroll a new student with auto-generated roll number</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Personal Information</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} placeholder="First name" />
            <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} placeholder="Last name" />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} placeholder="student@email.com" />
            <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} placeholder="Min 8 chars" />
            <Input label="Father's Name" required error={errors.fatherName?.message} {...register('fatherName')} placeholder="Father's full name" />
            <Select label="Gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} {...register('gender')} placeholder="Select" />
            <Input label="Phone" {...register('phone')} placeholder="03XXXXXXXXX" />
            <Select label="Blood Group" options={BLOOD_GROUPS} {...register('bloodGroup')} placeholder="Select" />
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Academic Information</Card.Title>
            <Card.Description>Roll number and registration number will be auto-generated</Card.Description>
          </Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Institute" required options={institutes} error={errors.institute?.message} {...register('institute')} placeholder="Select Institute" />
            <Select label="Department" required options={departments} error={errors.department?.message} {...register('department')} placeholder="Select Department" />
            <Select label="Program" required options={programs} error={errors.program?.message} {...register('program')} placeholder="Select Program" />
            <Select label="Session" required options={sessions} error={errors.session?.message} {...register('session')} placeholder="Select Session" />
            <Input label="Admission Date" type="date" {...register('admissionDate')} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/students')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Create Student</Button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;