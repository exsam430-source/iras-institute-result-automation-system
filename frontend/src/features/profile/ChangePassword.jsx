import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi2';
import { changePassword } from '../auth/authSlice';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])/, 'Requires uppercase, lowercase, number, special character'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const ChangePassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword, confirmPassword: data.confirmPassword })).unwrap();
      navigate('/login');
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h1>

      <Card>
        <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <HiOutlineShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">After changing your password, you will be logged out and need to sign in again.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Current Password" type="password" required icon={HiOutlineLockClosed} error={errors.currentPassword?.message} {...register('currentPassword')} placeholder="Enter current password" />
          <Input label="New Password" type="password" required icon={HiOutlineLockClosed} error={errors.newPassword?.message} {...register('newPassword')} placeholder="Enter new password" helperText="Min 8 chars with uppercase, lowercase, number & special character" />
          <Input label="Confirm New Password" type="password" required icon={HiOutlineLockClosed} error={errors.confirmPassword?.message} {...register('confirmPassword')} placeholder="Re-enter new password" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChangePassword;