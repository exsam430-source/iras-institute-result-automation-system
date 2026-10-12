import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineAcademicCap } from 'react-icons/hi2';
import api from '../../utils/axios';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ThemeToggle from '../../components/ui/ThemeToggle';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed or link expired');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md text-center">
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
          {status === 'loading' && (
            <div>
              <Spinner size="lg" className="mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verifying Email...</h2>
              <p className="text-sm text-gray-500 mt-2">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-[scale-in_0.3s_ease-out]">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <Link to="/login"><Button fullWidth>Go to Login</Button></Link>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-[scale-in_0.3s_ease-out]">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineXCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <Link to="/login"><Button variant="secondary" fullWidth>Back to Login</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;