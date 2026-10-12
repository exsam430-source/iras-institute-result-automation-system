import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HiOutlineEnvelope,
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { forgotPassword } from './authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
});

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(forgotPassword(data.email)).unwrap();
      setIsSent(true);
    } catch {
      // handled in slice
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
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center">
            <HiOutlineAcademicCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">IRAS</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">University of Swat</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-card p-8 border border-gray-100 dark:border-dark-border">
          {isSent ? (
            <div className="text-center animate-[fade-in_0.3s_ease-out]">
              <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                If an account with <strong>{getValues('email')}</strong> exists,
                we've sent a password reset link.
              </p>
              <Link to="/login">
                <Button variant="outline" fullWidth>
                  <HiOutlineArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  icon={HiOutlineEnvelope}
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  <HiOutlineArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;