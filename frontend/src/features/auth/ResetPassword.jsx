import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HiOutlineLockClosed,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { resetPassword } from './authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])/,
        'Must include uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        resetPassword({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        })
      ).unwrap();
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center">
            <HiOutlineAcademicCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">IRAS</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">University of Swat</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-card p-8 border border-gray-100 dark:border-dark-border">
          {isSuccess ? (
            <div className="text-center animate-[fade-in_0.3s_ease-out]">
              <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Redirecting to login...
              </p>
              <Link to="/login">
                <Button variant="primary" fullWidth>
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Reset Password
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Create a new strong password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  icon={HiOutlineLockClosed}
                  error={errors.password?.message}
                  required
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  icon={HiOutlineLockClosed}
                  error={errors.confirmPassword?.message}
                  required
                  {...register('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;