import { useRef, useState } from 'react';
import { HiOutlineCamera, HiOutlineTrash } from 'react-icons/hi2';
import Avatar from './Avatar';
import Spinner from './Spinner';
import { cn, getFullName } from '../../utils/helpers';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AvatarUpload = ({ user, onUploadSuccess, size = '2xl', className }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images allowed');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.patch('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Avatar updated successfully');
      onUploadSuccess?.(res.data.data.avatar);
    } catch (err) {
      setPreview(null);
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const sizeClasses = {
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar
        src={preview || user?.avatar}
        name={getFullName(user)}
        size={size}
        className="ring-4 ring-white dark:ring-dark-surface shadow-lg"
      />

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
          <Spinner size="sm" color="border-t-white" />
        </div>
      )}

      {!uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          title="Change avatar"
        >
          <HiOutlineCamera className="w-4 h-4" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;