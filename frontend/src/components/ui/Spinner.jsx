import { cn } from '../../utils/helpers';

const sizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
  xl: 'w-14 h-14 border-[3px]',
};

const Spinner = ({ size = 'md', className, color }) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-200 dark:border-gray-700',
        color || 'border-t-primary-600 dark:border-t-primary-400',
        sizes[size],
        className
      )}
    />
  );
};

export default Spinner;