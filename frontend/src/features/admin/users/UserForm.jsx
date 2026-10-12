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

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'director', label: 'Director' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'teacher', label: 'Teacher' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const createSchema = z.object({
  firstName: z.string().min(2, 'Required').max(50),
  lastName: z.string().min(2, 'Required').max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])/, 'Must include uppercase, lowercase, number, special char'),
  role: z.string().min(1, 'Role is required'),
  institute: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  cnic: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
});

const editSchema = createSchema.omit({ password: true, email: true }).extend({
  email: z.string().email().optional(),
});

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', role: '', institute: '', department: '', phone: '', cnic: '', gender: '' },
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
      api.get(`/users/${id}`).then((res) => {
        const u = res.data.data.user;
        reset({
          firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '',
          role: u.role || '', institute: u.institute?._id || '', department: u.department?._id || '',
          phone: u.phone || '', cnic: u.cnic || '', gender: u.gender || '',
        });
      }).catch(() => { toast.error('Failed to load user'); navigate('/admin/users'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/users/${id}`, {
          firstName: data.firstName, lastName: data.lastName,
          phone: data.phone || null, cnic: data.cnic || null, gender: data.gender || null,
          institute: data.institute || null, department: data.department || null,
        });
        toast.success('User updated');
      } else {
        await api.post('/users', {
          firstName: data.firstName, lastName: data.lastName, email: data.email,
          password: data.password, role: data.role,
          institute: data.institute || null, department: data.department || null,
          phone: data.phone || null, cnic: data.cnic || null, gender: data.gender || null,
        });
        toast.success('User created');
      }
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/users')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit User' : 'Create User'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? 'Update user details' : 'Add a new staff member'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Personal Information</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} placeholder="First name" />
            <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} placeholder="Last name" />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} placeholder="Email address" disabled={isEdit} />
            {!isEdit && <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} placeholder="Min 8 characters" />}
            <Select label="Role" required options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} placeholder="Select Role" disabled={isEdit} />
            <Select label="Gender" options={GENDER_OPTIONS} {...register('gender')} placeholder="Select Gender" />
            <Input label="Phone" {...register('phone')} placeholder="03XXXXXXXXX" />
            <Input label="CNIC" {...register('cnic')} placeholder="XXXXX-XXXXXXX-X" />
          </div>
        </Card>

        <Card>
          <Card.Header><Card.Title>Organization</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Institute" options={institutes} {...register('institute')} placeholder="Select Institute" />
            <Select label="Department" options={departments} {...register('department')} placeholder="Select Department" />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{isEdit ? 'Update' : 'Create'} User</Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;