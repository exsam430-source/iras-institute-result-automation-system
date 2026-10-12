import { cn, getInitials } from '../../utils/helpers';

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const Avatar = ({
  src,
  name,
  size = 'md',
  className,
  status,
  statusColor,
}) => {
  const initials = getInitials(name);

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover bg-gray-100 dark:bg-dark-card',
            sizes[size]
          )}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold',
          'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
          sizes[size],
          src && 'hidden'
        )}
      >
        {initials}
      </div>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-surface',
            statusColor ||
              (status === 'online'
                ? 'bg-emerald-500'
                : status === 'away'
                ? 'bg-amber-500'
                : 'bg-gray-400')
          )}
        />
      )}
    </div>
  );
};

export default Avatar;