import { useRef, useState } from 'react';
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocument,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { cn } from '../../utils/helpers';

const FileUpload = ({
  accept,
  maxSize = 5,
  label,
  helperText,
  onFileSelect,
  onClear,
  selectedFile,
  error,
  className,
  type = 'document',
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      onFileSelect?.(null, `File size exceeds ${maxSize}MB limit`);
      return;
    }

    onFileSelect?.(file, null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      onFileSelect?.(null, `File size exceeds ${maxSize}MB limit`);
      return;
    }

    onFileSelect?.(file, null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      {selectedFile ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary-200 dark:border-primary-800/30 bg-primary-50 dark:bg-primary-900/10">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
            <HiOutlineDocument className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear?.();
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : error
              ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-900/5'
              : 'border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-card/50 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/5'
          )}
        >
          <HiOutlineCloudArrowUp
            className={cn(
              'w-10 h-10 mb-3',
              isDragging
                ? 'text-primary-500'
                : 'text-gray-400 dark:text-gray-500'
            )}
          />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? 'Drop file here' : 'Drop file here or click to browse'}
          </p>
          {helperText && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {helperText}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Max size: {maxSize}MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;