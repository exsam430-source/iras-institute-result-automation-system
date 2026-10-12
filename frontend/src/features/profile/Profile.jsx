import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineIdentification,
} from 'react-icons/hi2';
import useAuth from '../../hooks/useAuth';
import { updateProfile, getMe } from '../auth/authSlice';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import AvatarUpload from '../../components/ui/AvatarUpload';
import Badge from '../../components/ui/Badge';
import { getFullName, formatDate } from '../../utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

const Profile = () => {
  const { user, studentProfile } = useAuth();
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      city: user?.address?.city || '',
      district: user?.address?.district || '',
      province: user?.address?.province || 'Khyber Pakhtunkhwa',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(
        updateProfile({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          gender: data.gender || null,
          address: {
            city: data.city || null,
            district: data.district || null,
            province: data.province || null,
            country: 'Pakistan',
          },
        })
      ).unwrap();
      setEditing(false);
    } catch {
      // Error handled in slice
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LEFT CARD ─── */}
        <Card className="text-center">
          {/* Avatar with upload capability */}
          <AvatarUpload
            user={user}
            onUploadSuccess={() => dispatch(getMe())}
            size="2xl"
            className="mx-auto mb-4"
          />

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {getFullName(user)}
          </h3>
          <Badge className={ROLE_COLORS[user?.role]} size="sm">
            {ROLE_LABELS[user?.role]}
          </Badge>

          {/* Contact Info */}
          <div className="mt-6 space-y-3 text-sm text-left">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <HiOutlineEnvelope className="w-4 h-4 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <HiOutlinePhone className="w-4 h-4 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user?.cnic && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <HiOutlineIdentification className="w-4 h-4 shrink-0" />
                <span>{user.cnic}</span>
              </div>
            )}
          </div>

          {/* Student Academic Info */}
          {studentProfile && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border text-left space-y-2">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Academic Info
              </p>
              <div className="text-sm">
                <span className="text-gray-400">Roll:</span>
                <span className="font-semibold text-gray-900 dark:text-white ml-1">
                  {studentProfile.rollNumber}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Reg No:</span>
                <span className="font-semibold text-gray-900 dark:text-white ml-1">
                  {studentProfile.registrationNumber}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Program:</span>
                <span className="font-medium ml-1">
                  {studentProfile.program?.name}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Semester:</span>
                <span className="font-medium ml-1">
                  {studentProfile.currentSemester}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">CGPA:</span>
                <span className="font-bold text-primary-600 ml-1">
                  {studentProfile.cumulativeGPA?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* ─── RIGHT CARD ─── */}
        <Card className="lg:col-span-2">
          <Card.Header
            action={
              !editing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              )
            }
          >
            <Card.Title>Personal Information</Card.Title>
          </Card.Header>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" {...register('firstName')} />
                <Input label="Last Name" {...register('lastName')} />
                <Input
                  label="Phone"
                  {...register('phone')}
                  placeholder="03XXXXXXXXX"
                />
                <Select
                  label="Gender"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  {...register('gender')}
                  placeholder="Select Gender"
                />
                <Input label="City" {...register('city')} />
                <Input label="District" {...register('district')} />
                <Input label="Province" {...register('province')} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              {[
                ['First Name', user?.firstName],
                ['Last Name', user?.lastName],
                ['Email', user?.email],
                ['Phone', user?.phone || 'N/A'],
                [
                  'Gender',
                  user?.gender
                    ? user.gender.charAt(0).toUpperCase() +
                      user.gender.slice(1)
                    : 'N/A',
                ],
                ['CNIC', user?.cnic || 'N/A'],
                ['City', user?.address?.city || 'N/A'],
                ['District', user?.address?.district || 'N/A'],
                ['Province', user?.address?.province || 'N/A'],
                ['Country', user?.address?.country || 'Pakistan'],
                [
                  'Email Verified',
                  user?.isEmailVerified ? '✅ Yes' : '❌ No',
                ],
                ['Member Since', formatDate(user?.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-0.5">
                    {label}
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;