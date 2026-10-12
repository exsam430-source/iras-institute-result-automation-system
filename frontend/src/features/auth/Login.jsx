import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';
import { login } from './authSlice';
import { ROLE_DASHBOARD } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await dispatch(login(data)).unwrap();
      const redirectPath =
        location.state?.from?.pathname ||
        ROLE_DASHBOARD[result.user.role] ||
        '/';
      navigate(redirectPath, { replace: true });
    } catch {
      // Error handled in slice
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl" />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <HiOutlineAcademicCap className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">IRAS</h3>
              <p className="text-primary-200 text-xs">University of Swat</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6 font-[Poppins]">
            Institute Result
            <br />
            <span className="text-gold-400">Automation System</span>
          </h1>

          <p className="text-primary-200 text-lg leading-relaxed max-w-md mb-10">
            A comprehensive platform for managing academic results, transcripts,
            and semester promotions at the University of Swat.
          </p>

          {/* Feature cards */}
          <div className="space-y-3 max-w-sm">
            {[
              { icon: '📊', text: 'Progressive Marks Entry & Award Lists' },
              { icon: '📜', text: 'Official Transcript Generation (PDF)' },
              { icon: '🚀', text: 'Automatic Semester Promotion' },
              { icon: '🔔', text: 'Real-time Notifications' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3"
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="text-primary-100 text-sm font-medium">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-16">
            <p className="text-primary-300/60 text-xs">
              © {new Date().getFullYear()} University of Swat. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50 dark:bg-dark-bg relative">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center">
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                IRAS
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                University of Swat
              </p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={HiOutlineEnvelope}
              error={errors.email?.message}
              required
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={HiOutlineLockClosed}
              error={errors.password?.message}
              required
              autoComplete="current-password"
              {...register('password')}
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-dark-border text-primary-600 focus:ring-primary-500 dark:bg-dark-surface"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              className="!mt-6"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-50 dark:bg-dark-bg px-3 text-gray-400">
                Quick Login For Testing
              </span>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admin', email: 'admin@uswat.edu.pk', pass: 'Admin@123456', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300' },
              { label: 'HoD', email: 'hod.cs@uswat.edu.pk', pass: 'HoD@123456', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-300' },
              { label: 'Teacher', email: 'usman.tariq@uswat.edu.pk', pass: 'Teacher@123', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:text-amber-300' },
              { label: 'Student', email: 'ali.khan.2023@uswat.edu.pk', pass: 'Student@123', color: 'bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:hover:bg-sky-900/30 dark:text-sky-300' },
            ].map((role) => (
              <button
                key={role.label}
                type="button"
                onClick={() => {
                  dispatch(login({ email: role.email, password: role.pass }))
                    .unwrap()
                    .then((result) => {
                      navigate(ROLE_DASHBOARD[result.user.role], { replace: true });
                    })
                    .catch(() => {});
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${role.color}`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Bottom text */}
          <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500">
            Powered by <span className="font-semibold text-primary-600 dark:text-primary-400">IRAS</span> •
            University of Swat
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;